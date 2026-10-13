const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const test = require('node:test')

const app = require('../server')

const storePath = path.join(__dirname, '..', 'data', 'qaStore.json')
const userId = 'usr-qa-001'
const leadId = 'usr-lead-001'
let originalStore
let server
let baseUrl
let qaToken
let leadToken

const request = async (route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await response.json()
  return { response, body }
}

const login = async (email) => {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'password123' }),
  })
  assert.equal(result.response.status, 200)
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
  try {
    originalStore = await fs.readFile(storePath, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    originalStore = '{}'
  }

  await fs.writeFile(storePath, '{}', 'utf8')
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  qaToken = await login('qa@qaforge.local')
  leadToken = await login('lead@qaforge.local')
})

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  await fs.writeFile(storePath, originalStore, 'utf8')
})

test('requires authentication for QA resources', async () => {
  const result = await request('/api/bugs')
  assert.equal(result.response.status, 401)
  assert.equal(result.body.success, false)
})

test('creates and reopens a bug through the authenticated API', async () => {
  const created = await authenticatedRequest(qaToken, '/api/bugs', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Regression after release',
      severity: 'Major',
      projectKey: 'QAR',
    }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.bug.status, 'Open')

  const resolved = await authenticatedRequest(qaToken, `/api/bugs/${created.body.bug.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Resolved' }),
  })
  assert.equal(resolved.response.status, 200)

  const reopened = await authenticatedRequest(qaToken, `/api/bugs/${created.body.bug.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Reopened' }),
  })
  assert.equal(reopened.response.status, 200)
  assert.equal(reopened.body.bug.status, 'Reopened')
})

test('rejects invalid bug statuses and oversized screenshot evidence', async () => {
  const invalidStatus = await authenticatedRequest(qaToken, '/api/bugs/BUG-404', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Not a status' }),
  })
  assert.equal(invalidStatus.response.status, 404)

  const comment = await authenticatedRequest(qaToken, '/api/comments', {
    method: 'POST',
    body: JSON.stringify({
      issueId: 'BUG-1',
      body: 'Evidence',
      attachment: {
        name: 'large.png',
        type: 'image/png',
        data: `data:image/png;base64,${'a'.repeat(700001)}`,
      },
    }),
  })
  assert.equal(comment.response.status, 400)
  assert.match(comment.body.message, /attachments/i)
})

test('persists comments and activity with image evidence', async () => {
  const created = await authenticatedRequest(qaToken, '/api/comments', {
    method: 'POST',
    body: JSON.stringify({
      issueId: 'BUG-1',
      body: 'Verified in Chrome',
      attachment: {
        name: 'proof.png',
        type: 'image/png',
        data: 'data:image/png;base64,abc',
      },
    }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.comment.attachment.name, 'proof.png')
  assert.equal(created.body.activity.action, 'added a comment')

  const comments = await authenticatedRequest(qaToken, '/api/comments?issueId=BUG-1', {
    headers: { Accept: 'application/json' },
  })
  assert.equal(comments.response.status, 200)
  assert.equal(comments.body.comments.length, 1)
  assert.equal(comments.body.comments[0].body, 'Verified in Chrome')
})

test('enforces role permissions for project creation', async () => {
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
})

test('isolates persisted QA data per authenticated user', async () => {
  const qaBugs = await authenticatedRequest(qaToken, '/api/bugs')
  const leadBugs = await authenticatedRequest(leadToken, '/api/bugs')
  assert.equal(qaBugs.response.status, 200)
  assert.equal(leadBugs.response.status, 200)
  assert.equal(qaBugs.body.bugs.length, 1)
  assert.equal(leadBugs.body.bugs.length, 0)
})
