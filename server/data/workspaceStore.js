const { db, findProject, setUserState } = require('./db')

const collections = [
  'tasks',
  'requirements',
  'testCases',
  'bugs',
  'epics',
  'sprints',
  'comments',
  'activity',
  'testRuns',
  'testSuites',
]

const nowIso = () => new Date().toISOString()

const emptyCollections = () => Object.fromEntries(collections.map((field) => [field, []]))

const defaultSettings = (project) => ({
  name: project?.name || '',
  key: project?.key || '',
  defaultEnv: 'Staging',
  autoCloseDefects: true,
  slackWebhook: '',
  notifyOnFailure: true,
})

const parseWorkspace = (row, project) => {
  const base = { projectSettings: defaultSettings(project), ...emptyCollections() }
  if (!row) return base
  try {
    const data = JSON.parse(row.data)
    return {
      ...base,
      ...data,
      projectSettings: { ...base.projectSettings, ...(data.projectSettings || {}) },
    }
  } catch {
    return base
  }
}

const readWorkspace = (projectKey) => {
  const key = String(projectKey || '').toUpperCase()
  const row = db.prepare('SELECT data FROM workspaces WHERE project_key = ?').get(key)
  return parseWorkspace(row, findProject(key) || { key, name: key })
}

const writeWorkspace = (projectKey, data) => {
  db.prepare(`
    INSERT INTO workspaces (project_key, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(project_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(String(projectKey).toUpperCase(), JSON.stringify(data), nowIso())
}

const mutateWorkspace = (projectKey, mutator) => {
  const key = String(projectKey || '').toUpperCase()
  return db.transaction(() => {
    const data = readWorkspace(key)
    const result = mutator(data)
    writeWorkspace(key, data)
    return result
  })()
}

const nextNumber = (name) => {
  const row = db.prepare('SELECT value FROM counters WHERE name = ?').get(name)
  const next = (row?.value || 0) + 1
  db.prepare(`
    INSERT INTO counters (name, value) VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET value = excluded.value
  `).run(name, next)
  return next
}

const readAccessible = (projectKeys, fields = collections) => {
  const merged = Object.fromEntries(fields.map((field) => [field, []]))
  const keys = [...new Set((projectKeys || []).map((key) => String(key).toUpperCase()))]
  keys.forEach((key) => {
    const data = readWorkspace(key)
    fields.forEach((field) => {
      ;(data[field] || []).forEach((item) => {
        merged[field].push({ ...item, projectKey: key })
      })
    })
  })
  return merged
}

const locateItem = (projectKeys, field, id) => {
  const keys = [...new Set((projectKeys || []).map((key) => String(key).toUpperCase()))]
  for (const key of keys) {
    const data = readWorkspace(key)
    const index = (data[field] || []).findIndex((item) => item.id === id)
    if (index !== -1) return { projectKey: key, index, item: data[field][index] }
  }
  return null
}

const issueFields = ['tasks', 'requirements', 'testCases', 'bugs', 'testRuns']

const findIssueProject = (projectKeys, issueId) => {
  const located = issueFields
    .map((field) => locateItem(projectKeys, field, issueId))
    .find(Boolean)
  return located ? located.projectKey : null
}

const moveItem = (sourceKey, field, id, targetKey, updates = {}) => db.transaction(() => {
  const source = readWorkspace(sourceKey)
  const index = (source[field] || []).findIndex((item) => item.id === id)
  if (index === -1) return null
  const [item] = source[field].splice(index, 1)
  const target = readWorkspace(targetKey)
  const moved = { ...item, ...updates, projectKey: targetKey }
  target[field] = [moved, ...(target[field] || [])]
  writeWorkspace(sourceKey, source)
  writeWorkspace(targetKey, target)
  return moved
})()

const updateWorkspaceSettings = (projectKey, updates = {}) => mutateWorkspace(projectKey, (data) => {
  const allowed = {}
  for (const field of ['defaultEnv']) {
    if (typeof updates[field] === 'string') allowed[field] = updates[field].trim()
  }
  data.projectSettings = { ...data.projectSettings, ...allowed }
  return data.projectSettings
})

const createProjectRecord = ({ key, name, lead, category, description, status, userId }) => {
  const normalized = String(key || '').trim().toUpperCase()
  if (findProject(normalized)) {
    throw Object.assign(new Error('A project with this key already exists.'), { status: 409 })
  }
  const project = {
    key: normalized,
    id: `proj-${Date.now()}`,
    name: String(name).trim(),
    lead: String(lead || '').trim(),
    category: String(category || 'Software').trim(),
    description: String(description || '').trim(),
    status: String(status || 'Active'),
  }
  return db.transaction(() => {
    const createdAt = nowIso()
    db.prepare(`
      INSERT INTO projects (key, id, name, lead, category, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project.key, project.id, project.name, project.lead, project.category, project.description, project.status, createdAt, createdAt)
    writeWorkspace(project.key, { projectSettings: defaultSettings(project), ...emptyCollections() })
    db.prepare('INSERT OR IGNORE INTO memberships (user_id, project_key) VALUES (?, ?)').run(userId, project.key)
    return project
  })()
}

const updateProjectRecord = (projectKey, updates = {}) => {
  const key = String(projectKey || '').toUpperCase()
  const current = findProject(key)
  if (!current) throw Object.assign(new Error('Project not found.'), { status: 404 })
  const next = { ...current }
  for (const field of ['name', 'description', 'status', 'lead', 'category']) {
    if (typeof updates[field] === 'string') next[field] = updates[field].trim()
  }
  db.prepare(`
    UPDATE projects SET name = ?, description = ?, status = ?, lead = ?, category = ?, updated_at = ? WHERE key = ?
  `).run(next.name, next.description, next.status, next.lead, next.category, nowIso(), key)
  mutateWorkspace(key, (data) => {
    data.projectSettings = { ...data.projectSettings, name: next.name, key }
  })
  return findProject(key)
}

const countProjectWork = (projectKey) => {
  const data = readWorkspace(projectKey)
  return ['tasks', 'requirements', 'testCases', 'bugs', 'epics', 'sprints', 'testRuns', 'testSuites']
    .reduce((total, field) => total + (data[field] || []).length, 0)
}

const deleteProjectRecord = (projectKey) => {
  const key = String(projectKey || '').toUpperCase()
  if (!findProject(key)) throw Object.assign(new Error('Project not found.'), { status: 404 })

  const totalProjects = db.prepare('SELECT COUNT(*) AS total FROM projects').get().total
  if (totalProjects <= 1) {
    throw Object.assign(new Error('At least one project must remain in the workspace.'), { status: 409 })
  }

  const linked = countProjectWork(key)
  if (linked > 0) {
    throw Object.assign(new Error(`This project still contains ${linked} work item${linked === 1 ? '' : 's'}. Reassign or delete them before removing the project.`), { status: 409 })
  }

  db.transaction(() => {
    db.prepare('DELETE FROM memberships WHERE project_key = ?').run(key)
    db.prepare('DELETE FROM workspaces WHERE project_key = ?').run(key)
    db.prepare('DELETE FROM projects WHERE key = ?').run(key)
    const affected = db.prepare('SELECT user_id FROM user_state WHERE selected_project_key = ?').all(key)
    affected.forEach(({ user_id: userId }) => {
      const nextKey = db.prepare('SELECT project_key FROM memberships WHERE user_id = ? LIMIT 1').get(userId)?.project_key || null
      setUserState(userId, { selectedProjectKey: nextKey })
    })
  })()
}

module.exports = {
  collections,
  readWorkspace,
  mutateWorkspace,
  nextNumber,
  readAccessible,
  locateItem,
  findIssueProject,
  moveItem,
  updateWorkspaceSettings,
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
  countProjectWork,
}
