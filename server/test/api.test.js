const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const dbPath = path.join(os.tmpdir(), `qaforge-test-${process.pid}-${Date.now()}.db`)
process.env.QA_DB_PATH = dbPath
process.env.QA_LEGACY_STORE = path.join(os.tmpdir(), `qaforge-no-legacy-${process.pid}.json`)
process.env.JWT_SECRET = 'qaforge-test-secret'
process.env.SEED_ADMIN_PASSWORD = 'admin-password-123'

const app = require('../server')
const { db } = require('../data/db')

let server
let baseUrl
let qaToken
let leadToken
let adminToken
let qaBugId

const request = async (route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body = {}
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }
  return { response, body }
}

const login = async (email, password = 'password123') => {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  assert.equal(result.response.status, 200, `login failed for ${email}: ${result.body.message || result.body.raw}`)
  return result.body.token
}

const authenticatedRequest = (token, route, options = {}) => request(route, {
  ...options,
  headers: {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  },
})

test.before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`

  qaToken = await login('qa@qaforge.local')
  leadToken = await login('lead@qaforge.local')
  adminToken = await login('admin@qaforge.local', 'admin-password-123')
})

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  db.close()
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(`${dbPath}${suffix}`, { force: true })
  }
})

test('requires authentication for QA resources', async () => {
  const result = await request('/api/bugs')
  assert.equal(result.response.status, 401)
  assert.equal(result.body.success, false)
})

test('loads the shared project workspace for a signed-in user', async () => {
  const result = await authenticatedRequest(qaToken, '/api/qa/bootstrap')
  assert.equal(result.response.status, 200)
  assert.equal(result.body.selectedProjectKey, 'QAR')
  assert.deepEqual(result.body.projects.map((project) => project.key).sort(), ['MOB', 'QAR'])
  assert.ok(Array.isArray(result.body.tasks))
  assert.ok(Array.isArray(result.body.bugs))
  assert.equal(result.body.projectSettings.key, 'QAR')
})

test('shares new work items with every project member', async () => {
  const created = await authenticatedRequest(qaToken, '/api/bugs', {
    method: 'POST',
    body: JSON.stringify({ title: 'Shared regression after release', severity: 'Major', projectKey: 'QAR' }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.bug.status, 'Open')
  assert.equal(created.body.bug.projectKey, 'QAR')
  qaBugId = created.body.bug.id

  const leadBugs = await authenticatedRequest(leadToken, '/api/bugs?projectKey=QAR')
  assert.equal(leadBugs.response.status, 200)
  const shared = leadBugs.body.bugs.find((bug) => bug.id === qaBugId)
  assert.ok(shared, 'the QA-created bug is visible to the QA Lead on the same project')
})

test('scopes work items to the requested project', async () => {
  const mob = await authenticatedRequest(qaToken, '/api/bugs', {
    method: 'POST',
    headers: { 'X-Project-Key': 'MOB' },
    body: JSON.stringify({ title: 'Mobile-only login freeze' }),
  })
  assert.equal(mob.response.status, 201)
  assert.equal(mob.body.bug.projectKey, 'MOB')

  const qarBugs = await authenticatedRequest(qaToken, '/api/bugs?projectKey=QAR')
  const mobBugs = await authenticatedRequest(qaToken, '/api/bugs?projectKey=MOB')
  assert.ok(qarBugs.body.bugs.every((bug) => bug.projectKey === 'QAR'))
  assert.ok(mobBugs.body.bugs.some((bug) => bug.id === mob.body.bug.id))
  assert.ok(!qarBugs.body.bugs.some((bug) => bug.id === mob.body.bug.id))
})

test('only Admins can manage accounts, and passwords are real', async () => {
  const forbidden = await authenticatedRequest(qaToken, '/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Nina', email: 'nina@qaforge.local', password: 'nina-pass-123', role: 'QA Tester', projectKeys: ['QAR'] }),
  })
  assert.equal(forbidden.response.status, 403)

  const created = await authenticatedRequest(adminToken, '/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Nina Flores', email: 'nina@qaforge.local', password: 'nina-pass-123', role: 'QA Tester', projectKeys: ['QAR'] }),
  })
  assert.equal(created.response.status, 201)
  assert.deepEqual(created.body.user.projects, ['QAR'])
  const ninaId = created.body.user.id

  const duplicate = await authenticatedRequest(adminToken, '/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Duplicate', email: 'nina@qaforge.local', password: 'another-pass-123', role: 'QA Tester', projectKeys: [] }),
  })
  assert.equal(duplicate.response.status, 409)

  const memberForbidden = await authenticatedRequest(qaToken, `/api/users/${ninaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'Admin' }),
  })
  assert.equal(memberForbidden.response.status, 403)

  const updated = await authenticatedRequest(adminToken, `/api/users/${ninaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'Developer', projectKeys: ['QAR', 'MOB'], password: 'nina-new-pass-123' }),
  })
  assert.equal(updated.response.status, 200)
  assert.deepEqual(updated.body.user.projects.sort(), ['MOB', 'QAR'])

  const newLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nina@qaforge.local', password: 'nina-new-pass-123' }),
  })
  assert.equal(newLogin.response.status, 200)

  const oldLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nina@qaforge.local', password: 'nina-pass-123' }),
  })
  assert.equal(oldLogin.response.status, 401)

  const deactivated = await authenticatedRequest(adminToken, `/api/users/${ninaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: false }),
  })
  assert.equal(deactivated.response.status, 200)

  const blockedLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nina@qaforge.local', password: 'nina-new-pass-123' }),
  })
  assert.equal(blockedLogin.response.status, 401)
})

test('blocks project access for users who are not members', async () => {
  const created = await authenticatedRequest(adminToken, '/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Oscar Reyes', email: 'oscar@qaforge.local', password: 'oscar-pass-123', role: 'QA Tester', projectKeys: ['QAR'] }),
  })
  assert.equal(created.response.status, 201)

  const oscarToken = await login('oscar@qaforge.local', 'oscar-pass-123')
  const bootstrap = await authenticatedRequest(oscarToken, '/api/qa/bootstrap')
  assert.deepEqual(bootstrap.body.projects.map((project) => project.key), ['QAR'])

  const read = await authenticatedRequest(oscarToken, '/api/bugs?projectKey=MOB')
  assert.equal(read.response.status, 403)

  const write = await authenticatedRequest(oscarToken, '/api/bugs', {
    method: 'POST',
    headers: { 'X-Project-Key': 'MOB' },
    body: JSON.stringify({ title: 'Should be blocked' }),
  })
  assert.equal(write.response.status, 403)
})

test('persists comments and activity on the shared issue', async () => {
  const missing = await authenticatedRequest(qaToken, '/api/comments', {
    method: 'POST',
    body: JSON.stringify({ issueId: 'BUG-9999', body: 'Ghost issue' }),
  })
  assert.equal(missing.response.status, 404)

  const oversized = await authenticatedRequest(qaToken, '/api/comments', {
    method: 'POST',
    body: JSON.stringify({
      issueId: qaBugId,
      body: 'Evidence',
      attachment: {
        name: 'large.png',
        type: 'image/png',
        data: `data:image/png;base64,${'a'.repeat(700001)}`,
      },
    }),
  })
  assert.equal(oversized.response.status, 400)
  assert.match(oversized.body.message, /attachments/i)

  const created = await authenticatedRequest(qaToken, '/api/comments', {
    method: 'POST',
    body: JSON.stringify({
      issueId: qaBugId,
      body: 'Verified in Chrome',
      attachment: { name: 'proof.png', type: 'image/png', data: 'data:image/png;base64,abc' },
    }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.comment.attachment.name, 'proof.png')
  assert.equal(created.body.activity.action, 'added a comment')

  const leadComments = await authenticatedRequest(leadToken, `/api/comments?issueId=${qaBugId}`)
  assert.equal(leadComments.response.status, 200)
  assert.ok(leadComments.body.comments.some((comment) => comment.body === 'Verified in Chrome'))

  const activity = await authenticatedRequest(leadToken, `/api/activity?issueId=${qaBugId}`)
  assert.ok(activity.body.activity.some((event) => event.action === 'added a comment'))
})

test('enforces project roles and shares newly created projects with the creator', async () => {
  const forbidden = await authenticatedRequest(qaToken, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'Unauthorized', key: 'NOPE' }),
  })
  assert.equal(forbidden.response.status, 403)

  const allowed = await authenticatedRequest(leadToken, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'Payments', key: 'PAY' }),
  })
  assert.equal(allowed.response.status, 201)
  assert.equal(allowed.body.project.key, 'PAY')

  const leadProjects = await authenticatedRequest(leadToken, '/api/projects')
  assert.ok(leadProjects.body.projects.some((project) => project.key === 'PAY'))

  const qaProjects = await authenticatedRequest(qaToken, '/api/projects')
  assert.ok(!qaProjects.body.projects.some((project) => project.key === 'PAY'))

  const removed = await authenticatedRequest(leadToken, '/api/projects/PAY', { method: 'DELETE' })
  assert.equal(removed.response.status, 200)
})

test('creates and executes a shared test run', async () => {
  const testCase = await authenticatedRequest(qaToken, '/api/test-cases', {
    method: 'POST',
    body: JSON.stringify({ title: 'Verify shared test execution', projectKey: 'QAR' }),
  })
  assert.equal(testCase.response.status, 201)
  const testCaseId = testCase.body.testCase.id

  const run = await authenticatedRequest(qaToken, '/api/test-runs', {
    method: 'POST',
    body: JSON.stringify({ name: 'Shared execution run', projectKey: 'QAR', testCaseIds: [testCaseId] }),
  })
  assert.equal(run.response.status, 201)
  assert.equal(run.body.testRun.cases.length, 1)

  const executed = await authenticatedRequest(leadToken, `/api/test-runs/${run.body.testRun.id}/cases/${testCaseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ result: 'Passed', notes: 'Confirmed by the QA Lead' }),
  })
  assert.equal(executed.response.status, 200)
  assert.equal(executed.body.testRun.passed, 1)
  assert.equal(executed.body.testRun.status, 'Completed')

  const leadRuns = await authenticatedRequest(leadToken, '/api/test-runs?projectKey=QAR')
  assert.ok(leadRuns.body.testRuns.some((item) => item.id === run.body.testRun.id && item.status === 'Completed'))
})

test('keeps concurrent edits from different members', async () => {
  const before = await authenticatedRequest(qaToken, '/api/tasks?projectKey=QAR')
  const initialCount = before.body.tasks.length

  const creations = await Promise.all(
    Array.from({ length: 8 }, (_, index) => authenticatedRequest(
      index % 2 === 0 ? qaToken : leadToken,
      '/api/tasks',
      {
        method: 'POST',
        headers: { 'X-Project-Key': 'QAR' },
        body: JSON.stringify({ title: `Concurrent task ${index + 1}`, projectKey: 'QAR' }),
      },
    )),
  )

  creations.forEach((result) => assert.equal(result.response.status, 201))
  const ids = creations.map((result) => result.body.task.id)
  assert.equal(new Set(ids).size, ids.length, 'every concurrent task receives a unique ID')

  const after = await authenticatedRequest(qaToken, '/api/tasks?projectKey=QAR')
  assert.equal(after.body.tasks.length, initialCount + creations.length)
})

test('keeps watcher state per user', async () => {
  const watched = await authenticatedRequest(qaToken, `/api/watchers/${qaBugId}`, { method: 'POST' })
  assert.equal(watched.response.status, 201)
  assert.equal(watched.body.watching, true)

  const qaState = await authenticatedRequest(qaToken, `/api/watchers/${qaBugId}`)
  assert.equal(qaState.body.watching, true)

  const leadState = await authenticatedRequest(leadToken, `/api/watchers/${qaBugId}`)
  assert.equal(leadState.body.watching, false)

  const unwatched = await authenticatedRequest(qaToken, `/api/watchers/${qaBugId}`, { method: 'DELETE' })
  assert.equal(unwatched.response.status, 200)
  assert.equal(unwatched.body.watching, false)
})

test('remembers the selected project for the signed-in user', async () => {
  const selected = await authenticatedRequest(qaToken, '/api/qa/state', {
    method: 'PUT',
    body: JSON.stringify({ selectedProjectKey: 'MOB' }),
  })
  assert.equal(selected.response.status, 200)
  assert.equal(selected.body.selectedProjectKey, 'MOB')

  const bootstrap = await authenticatedRequest(qaToken, '/api/qa/bootstrap')
  assert.equal(bootstrap.body.selectedProjectKey, 'MOB')

  const leadSelected = await authenticatedRequest(leadToken, '/api/qa/state', {
    method: 'PUT',
    body: JSON.stringify({ selectedProjectKey: 'QAR' }),
  })
  assert.equal(leadSelected.response.status, 200)

  const leadBootstrap = await authenticatedRequest(leadToken, '/api/qa/bootstrap')
  assert.equal(leadBootstrap.body.selectedProjectKey, 'QAR', 'each user keeps their own selected project')

  const restored = await authenticatedRequest(qaToken, '/api/qa/state', {
    method: 'PUT',
    body: JSON.stringify({ selectedProjectKey: 'QAR' }),
  })
  assert.equal(restored.response.status, 200)
})

test('protects the last active Admin account', async () => {
  const selfDeactivate = await authenticatedRequest(adminToken, '/api/users/usr-admin-001', {
    method: 'PATCH',
    body: JSON.stringify({ isActive: false }),
  })
  assert.equal(selfDeactivate.response.status, 400)

  const demote = await authenticatedRequest(adminToken, '/api/users/usr-admin-001', {
    method: 'PATCH',
    body: JSON.stringify({ role: 'QA Tester' }),
  })
  assert.equal(demote.response.status, 409)
  assert.match(demote.body.message, /Admin/i)
})
