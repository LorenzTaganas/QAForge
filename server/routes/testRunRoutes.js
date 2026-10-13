const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedStatuses = ['Not Started', 'In Progress', 'Blocked', 'Completed']
const allowedEnvironments = ['Dev', 'Staging', 'Production', 'QA']

const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const testRuns = getSnapshot(store, req.user.id).testRuns || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({
      success: true,
      testRuns: projectKey
        ? testRuns.filter((run) => (run.projectKey || 'QAR') === projectKey)
        : testRuns,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Test run name is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Test run status is invalid.' })
    }
    if (body.environment && !allowedEnvironments.includes(body.environment)) {
      return res.status(400).json({ success: false, message: 'Test run environment is invalid.' })
    }

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testRuns = Array.isArray(snapshot.testRuns) ? snapshot.testRuns : []
    const run = {
      id: `RUN-${Date.now().toString().slice(-5)}`,
      name: body.name.trim(),
      status: body.status || 'Completed',
      startedAt: body.startedAt || new Date().toISOString(),
      completedAt: body.completedAt || new Date().toISOString(),
      passed: Number.isFinite(body.passed) ? body.passed : 0,
      failed: Number.isFinite(body.failed) ? body.failed : 0,
      total: Number.isFinite(body.total) ? body.total : 0,
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      environment: body.environment || 'QA',
      executedBy: req.user.name,
    }
    store[req.user.id] = { ...snapshot, testRuns: [run, ...testRuns], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, testRun: run })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testRunId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testRuns = Array.isArray(snapshot.testRuns) ? snapshot.testRuns : []
    const index = testRuns.findIndex((run) => run.id === req.params.testRunId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Test run not found.' })

    const updates = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim()
    if (allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (allowedEnvironments.includes(req.body.environment)) updates.environment = req.body.environment
    for (const field of ['passed', 'failed', 'total']) {
      if (Number.isFinite(req.body[field])) updates[field] = req.body[field]
    }
    testRuns[index] = { ...testRuns[index], ...updates }
    store[req.user.id] = { ...snapshot, testRuns, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, testRun: testRuns[index] })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
