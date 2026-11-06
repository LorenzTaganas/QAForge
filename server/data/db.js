const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

const dbPath = process.env.QA_DB_PATH || path.join(__dirname, 'qaforge.db')
const legacyStorePath = process.env.QA_LEGACY_STORE || path.join(__dirname, 'qaStore.json')

const roles = ['QA Tester', 'QA Lead', 'Developer', 'Project Manager', 'Admin']

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memberships (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_key TEXT NOT NULL,
    PRIMARY KEY (user_id, project_key)
  );

  CREATE TABLE IF NOT EXISTS projects (
    key TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    lead TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Software',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    project_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_state (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    selected_project_key TEXT,
    notifications TEXT NOT NULL DEFAULT '[]',
    watchers TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

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

const defaultSettings = (project) => ({
  name: project.name,
  key: project.key,
  defaultEnv: 'Staging',
  autoCloseDefects: true,
  slackWebhook: '',
  notifyOnFailure: true,
})

const emptyWorkspace = (project) => ({
  projectSettings: defaultSettings(project),
  tasks: [],
  requirements: [],
  testCases: [],
  bugs: [],
  epics: [],
  sprints: [],
  comments: [],
  activity: [],
  testRuns: [],
  testSuites: [],
})

const fallbackProject = (key) => ({
  id: `proj-${key.toLowerCase()}-${Date.now()}`,
  key,
  name: key,
  lead: '',
  category: 'Software',
  description: '',
  status: 'Active',
})

const readLegacyStore = () => {
  try {
    const raw = fs.readFileSync(legacyStorePath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const seedIfEmpty = () => {
  const userCount = db.prepare('SELECT COUNT(*) AS total FROM users').get().total
  if (userCount > 0) return

  const createdAt = nowIso()
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (@id, @name, @email, @passwordHash, @role, 1, @createdAt, @createdAt)
  `)
  const insertProject = db.prepare(`
    INSERT INTO projects (key, id, name, lead, category, description, status, created_at, updated_at)
    VALUES (@key, @id, @name, @lead, @category, @description, @status, @createdAt, @createdAt)
  `)
  const insertMembership = db.prepare('INSERT OR IGNORE INTO memberships (user_id, project_key) VALUES (?, ?)')
  const insertWorkspace = db.prepare('INSERT OR REPLACE INTO workspaces (project_key, data, updated_at) VALUES (?, ?, ?)')
  const insertState = db.prepare(`
    INSERT OR IGNORE INTO user_state (user_id, selected_project_key, notifications, watchers)
    VALUES (?, ?, ?, ?)
  `)
  const setMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')
  const setCounter = db.prepare('INSERT OR REPLACE INTO counters (name, value) VALUES (?, ?)')

  const demoUsers = [
    { id: 'usr-admin-001', name: 'Workspace Admin', email: 'admin@qaforge.local', role: 'Admin' },
    { id: 'usr-lead-001', name: 'Maria Santos', email: 'lead@qaforge.local', role: 'QA Lead' },
    { id: 'usr-qa-001', name: 'Lorenz Taganas', email: 'qa@qaforge.local', role: 'QA Tester' },
    { id: 'usr-dev-001', name: 'John Cruz', email: 'developer@qaforge.local', role: 'Developer' },
    { id: 'usr-pm-001', name: 'Mark Reyes', email: 'manager@qaforge.local', role: 'Project Manager' },
  ]

  const projects = new Map()

  const legacy = readLegacyStore()
  const snapshotOrder = ['usr-lead-001', 'usr-pm-001', 'usr-dev-001', 'usr-qa-001']
  const orderedSnapshots = [
    ...snapshotOrder.filter((id) => legacy[id]).map((id) => [id, legacy[id]]),
    ...Object.entries(legacy).filter(([id]) => !snapshotOrder.includes(id)),
  ]

  orderedSnapshots.forEach(([, snapshot]) => {
    (Array.isArray(snapshot.projects) ? snapshot.projects : []).forEach((project) => {
      if (!project || typeof project.key !== 'string') return
      const key = project.key.trim().toUpperCase()
      if (!projects.has(key)) {
        projects.set(key, {
          id: project.id || fallbackProject(key).id,
          key,
          name: project.name || key,
          lead: project.lead || '',
          category: project.category || 'Software',
          description: project.description || '',
          status: project.status || 'Active',
        })
      }
    })
    collections.forEach((field) => {
      (Array.isArray(snapshot[field]) ? snapshot[field] : []).forEach((item) => {
        const key = typeof item?.projectKey === 'string' && item.projectKey.trim()
          ? item.projectKey.trim().toUpperCase()
          : null
        if (key && !projects.has(key)) projects.set(key, fallbackProject(key))
      })
    })
  })

  ;[
    { id: 'proj-pp-001', key: 'QAR', name: 'QAForge Core Platform', lead: 'Maria Santos', category: 'Software', description: 'Quality engineering workspace for the QAForge product.', status: 'Active' },
    { id: 'proj-mobile-002', key: 'MOB', name: 'Mobile Banking App', lead: 'Lorenz Taganas', category: 'Software', description: 'Mobile release quality and regression tracking.', status: 'Active' },
  ].forEach((project) => {
    if (!projects.has(project.key)) projects.set(project.key, project)
  })

  const workspaces = new Map()
  projects.forEach((project, key) => workspaces.set(key, emptyWorkspace(project)))

  const issueProjects = new Map()
  orderedSnapshots.forEach(([, snapshot]) => {
    ;['tasks', 'requirements', 'testCases', 'bugs', 'testRuns', 'epics', 'sprints'].forEach((field) => {
      (Array.isArray(snapshot[field]) ? snapshot[field] : []).forEach((item) => {
        if (!item?.id) return
        const key = typeof item.projectKey === 'string' && item.projectKey.trim()
          ? item.projectKey.trim().toUpperCase()
          : 'QAR'
        issueProjects.set(item.id, key)
      })
    })
  })

  orderedSnapshots.forEach(([, snapshot]) => {
    collections.forEach((field) => {
      ;(Array.isArray(snapshot[field]) ? snapshot[field] : []).forEach((item) => {
        if (!item?.id) return
        const key = field === 'comments' || field === 'activity'
          ? issueProjects.get(item.issueId) || 'QAR'
          : typeof item.projectKey === 'string' && item.projectKey.trim()
            ? item.projectKey.trim().toUpperCase()
            : 'QAR'
        if (!workspaces.has(key)) {
          projects.set(key, fallbackProject(key))
          workspaces.set(key, emptyWorkspace(projects.get(key)))
        }
        const target = workspaces.get(key)
        if (!target[field].some((existing) => existing.id === item.id)) {
          target[field].push({ ...item, projectKey: key })
        }
      })
    })

    if (snapshot.projectSettings && typeof snapshot.projectSettings === 'object') {
      const key = String(snapshot.projectSettings.key || 'QAR').toUpperCase()
      if (workspaces.has(key)) {
        workspaces.set(key, {
          ...workspaces.get(key),
          projectSettings: { ...workspaces.get(key).projectSettings, ...snapshot.projectSettings, key },
        })
      }
    }
  })

  const maxSuffix = (items, pattern) => items.reduce((highest, item) => {
    const match = pattern.exec(String(item.id || ''))
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  const allItems = (field) => Array.from(workspaces.values()).flatMap((workspace) => workspace[field] || [])

  db.transaction(() => {
    demoUsers.forEach((user) => {
      const password = user.role === 'Admin'
        ? process.env.SEED_ADMIN_PASSWORD || 'password123'
        : 'password123'
      insertUser.run({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: bcrypt.hashSync(password, 10),
        role: user.role,
        createdAt,
      })
    })

    projects.forEach((project) => {
      insertProject.run({
        key: project.key,
        id: project.id,
        name: project.name,
        lead: project.lead,
        category: project.category,
        description: project.description,
        status: project.status,
        createdAt,
      })
      insertWorkspace.run(project.key, JSON.stringify(workspaces.get(project.key)), createdAt)
    })

    demoUsers.forEach((user) => {
      projects.forEach((project) => insertMembership.run(user.id, project.key))
      const snapshot = legacy[user.id]
      insertState.run(
        user.id,
        snapshot?.selectedProjectKey && projects.has(String(snapshot.selectedProjectKey).toUpperCase())
          ? String(snapshot.selectedProjectKey).toUpperCase()
          : 'QAR',
        JSON.stringify(Array.isArray(snapshot?.notifications) ? snapshot.notifications : []),
        JSON.stringify(Array.isArray(snapshot?.watchers) ? snapshot.watchers : []),
      )
    })

    setCounter.run('task', Math.max(100, maxSuffix(allItems('tasks'), /-(\d+)$/)))
    setCounter.run('requirement', Math.max(100, maxSuffix(allItems('requirements'), /^REQ-(\d+)$/)))
    setCounter.run('testCase', Math.max(200, maxSuffix(allItems('testCases'), /^TC-(\d+)$/)))
    setCounter.run('bug', Math.max(300, maxSuffix(allItems('bugs'), /^BUG-(\d+)$/)))
    setCounter.run('testRun', Math.max(1000, maxSuffix(allItems('testRuns'), /^RUN-(\d+)$/)))
    setMeta.run('seeded_at', createdAt)
  })()
}

seedIfEmpty()

const toProjectKeys = (userId) => db
  .prepare('SELECT project_key FROM memberships WHERE user_id = ? ORDER BY project_key')
  .all(userId)
  .map((row) => row.project_key)

const toPublicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  isActive: Boolean(row.is_active),
  projects: toProjectKeys(row.id),
})

const findUserByEmail = (email) => db
  .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
  .get(String(email || '').trim())

const findUserById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)

const listUsers = () => db
  .prepare('SELECT * FROM users ORDER BY created_at')
  .all()
  .map(toPublicUser)

const getUserState = (userId) => {
  const row = db.prepare('SELECT * FROM user_state WHERE user_id = ?').get(userId)
  const projectKeys = toProjectKeys(userId)
  if (!row) {
    return {
      selectedProjectKey: projectKeys[0] || null,
      notifications: [],
      watchers: [],
    }
  }
  return {
    selectedProjectKey: projectKeys.includes(row.selected_project_key)
      ? row.selected_project_key
      : projectKeys[0] || null,
    notifications: JSON.parse(row.notifications || '[]'),
    watchers: JSON.parse(row.watchers || '[]'),
  }
}

const setUserState = (userId, updates = {}) => {
  const current = getUserState(userId)
  const next = {
    selectedProjectKey: updates.selectedProjectKey !== undefined ? updates.selectedProjectKey : current.selectedProjectKey,
    notifications: updates.notifications !== undefined ? updates.notifications : current.notifications,
    watchers: updates.watchers !== undefined ? updates.watchers : current.watchers,
  }
  db.prepare(`
    INSERT INTO user_state (user_id, selected_project_key, notifications, watchers)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      selected_project_key = excluded.selected_project_key,
      notifications = excluded.notifications,
      watchers = excluded.watchers
  `).run(userId, next.selectedProjectKey, JSON.stringify(next.notifications), JSON.stringify(next.watchers))
  return next
}

const listProjectsForUser = (userId) => db.prepare(`
  SELECT projects.*
  FROM projects
  JOIN memberships ON memberships.project_key = projects.key
  WHERE memberships.user_id = ?
  ORDER BY projects.created_at, projects.name
`).all(userId)

const findProject = (key) => db.prepare('SELECT * FROM projects WHERE key = ?').get(String(key || '').toUpperCase())

const listAllProjects = () => db
  .prepare('SELECT * FROM projects ORDER BY created_at, name')
  .all()

const isMember = (userId, projectKey) => Boolean(db
  .prepare('SELECT 1 AS ok FROM memberships WHERE user_id = ? AND project_key = ?')
  .get(userId, String(projectKey || '').toUpperCase()))

const setMemberships = (userId, projectKeys) => {
  const unique = [...new Set((projectKeys || []).map((key) => String(key).toUpperCase()))]
    .filter((key) => findProject(key))
  db.transaction(() => {
    db.prepare('DELETE FROM memberships WHERE user_id = ?').run(userId)
    unique.forEach((key) => {
      db.prepare('INSERT INTO memberships (user_id, project_key) VALUES (?, ?)').run(userId, key)
    })
    const state = getUserState(userId)
    if (state.selectedProjectKey && !unique.includes(state.selectedProjectKey)) {
      setUserState(userId, { selectedProjectKey: unique[0] || null })
    }
  })()
  return unique
}

const createUser = ({ name, email, password, role, projectKeys }) => {
  if (!roles.includes(role)) throw Object.assign(new Error('Role is invalid.'), { status: 400 })
  if (String(password || '').length < 8) throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 })
  if (findUserByEmail(email)) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 })

  const id = `usr-${Date.now()}`
  const createdAt = nowIso()
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, String(name).trim(), String(email).trim().toLowerCase(), bcrypt.hashSync(password, 10), role, createdAt, createdAt)
  setMemberships(id, projectKeys || [])
  return toPublicUser(findUserById(id))
}

const countActiveAdmins = () => db
  .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND is_active = 1")
  .get().total

const updateUser = (id, updates = {}) => {
  const current = findUserById(id)
  if (!current) throw Object.assign(new Error('User not found.'), { status: 404 })

  if (updates.role !== undefined && !roles.includes(updates.role)) {
    throw Object.assign(new Error('Role is invalid.'), { status: 400 })
  }
  if (updates.password !== undefined && String(updates.password).length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 })
  }

  const nextRole = updates.role !== undefined ? updates.role : current.role
  const nextActive = updates.isActive !== undefined ? Boolean(updates.isActive) : Boolean(current.is_active)
  const removesAdmin = current.role === 'Admin' && current.is_active
    && (nextRole !== 'Admin' || !nextActive)
  if (removesAdmin && countActiveAdmins() <= 1) {
    throw Object.assign(new Error('At least one active Admin must remain.'), { status: 409 })
  }

  db.prepare(`
    UPDATE users
    SET name = ?, role = ?, is_active = ?, password_hash = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updates.name !== undefined ? String(updates.name).trim() : current.name,
    nextRole,
    nextActive ? 1 : 0,
    updates.password !== undefined ? bcrypt.hashSync(updates.password, 10) : current.password_hash,
    nowIso(),
    id,
  )

  if (Array.isArray(updates.projectKeys)) setMemberships(id, updates.projectKeys)
  return toPublicUser(findUserById(id))
}

const deleteUser = (id) => {
  const current = findUserById(id)
  if (!current) throw Object.assign(new Error('User not found.'), { status: 404 })
  if (current.role === 'Admin' && current.is_active && countActiveAdmins() <= 1) {
    throw Object.assign(new Error('At least one active Admin must remain.'), { status: 409 })
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

const verifyPassword = (row, password) => bcrypt.compare(password, row.password_hash)

module.exports = {
  db,
  roles,
  toPublicUser,
  toProjectKeys,
  findUserByEmail,
  findUserById,
  listUsers,
  getUserState,
  setUserState,
  listProjectsForUser,
  listAllProjects,
  findProject,
  isMember,
  setMemberships,
  createUser,
  updateUser,
  deleteUser,
  verifyPassword,
}
