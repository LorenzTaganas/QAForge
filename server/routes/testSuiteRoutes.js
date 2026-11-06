const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const elevated = ['Admin', 'QA Lead', 'Project Manager']
const getSnapshot = (store, userId) => store[userId] || {}

const normalizeIds = (ids) => Array.isArray(ids)
  ? [...new Set(ids.filter((id) => typeof id === 'string' && id.trim()))]
  : []

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const testSuites = Array.isArray(snapshot.testSuites) ? snapshot.testSuites : []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({
      success: true,
      testSuites: projectKey
        ? testSuites.filter((suite) => (suite.projectKey || 'QAR') === projectKey)
        : testSuites,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Suite name is required.' })
    }
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testSuites = Array.isArray(snapshot.testSuites) ? snapshot.testSuites : []
    const suite = {
      id: `SUITE-${Date.now()}`,
      name: body.name.trim().slice(0, 120),
      description: typeof body.description === 'string' ? body.description.trim() : '',
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      testCaseIds: normalizeIds(body.testCaseIds),
      createdBy: req.user.name,
      createdAt: new Date().toISOString(),
    }
    store[req.user.id] = { ...snapshot, testSuites: [suite, ...testSuites], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, testSuite: suite })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:suiteId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testSuites = Array.isArray(snapshot.testSuites) ? snapshot.testSuites : []
    const index = testSuites.findIndex((suite) => suite.id === req.params.suiteId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Test suite not found.' })

    const updates = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim().slice(0, 120)
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim()
    if (typeof req.body.projectKey === 'string' && req.body.projectKey.trim()) updates.projectKey = req.body.projectKey.trim().toUpperCase()
    if (Array.isArray(req.body.testCaseIds)) updates.testCaseIds = normalizeIds(req.body.testCaseIds)
    testSuites[index] = { ...testSuites[index], ...updates }
    store[req.user.id] = { ...snapshot, testSuites, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, testSuite: testSuites[index] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:suiteId', authorizeRoles(...elevated), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testSuites = Array.isArray(snapshot.testSuites) ? snapshot.testSuites : []
    const remaining = testSuites.filter((suite) => suite.id !== req.params.suiteId)
    if (remaining.length === testSuites.length) return res.status(404).json({ success: false, message: 'Test suite not found.' })
    store[req.user.id] = { ...snapshot, testSuites: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
