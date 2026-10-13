const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedTypes = ['Functional', 'Regression', 'Smoke', 'Security', 'Performance', 'Integration']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']
const allowedStatuses = ['Draft', 'Ready', 'In Progress', 'Deprecated']
const allowedResults = ['Passed', 'Failed', 'Pending']

const getSnapshot = (store, userId) => store[userId] || {}
const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const testCases = getSnapshot(store, req.user.id).testCases || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({
      success: true,
      testCases: projectKey
        ? testCases.filter((testCase) => (testCase.projectKey || 'QAR') === projectKey)
        : testCases,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Test case title is required.' })
    }
    if (body.type && !allowedTypes.includes(body.type)) return res.status(400).json({ success: false, message: 'Test case type is invalid.' })
    if (body.priority && !allowedPriorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Test case priority is invalid.' })
    if (body.status && !allowedStatuses.includes(body.status)) return res.status(400).json({ success: false, message: 'Test case status is invalid.' })

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testCases = Array.isArray(snapshot.testCases) ? snapshot.testCases : []
    const nextNumber = testCases.reduce((highest, testCase) => {
      const match = /^TC-(\d+)$/.exec(testCase.id || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 200) + 1
    const testCase = {
      id: `TC-${nextNumber}`,
      title: body.title.trim(),
      description: typeof body.description === 'string' ? body.description.trim() : '',
      type: body.type || 'Functional',
      priority: body.priority || 'Medium',
      status: body.status || 'Ready',
      lastResult: 'Pending',
      steps: Array.isArray(body.steps) ? body.steps : ['Verify acceptance criteria', 'Check system behavior'],
      preconditions: typeof body.preconditions === 'string' ? body.preconditions.trim() : '',
      postconditions: typeof body.postconditions === 'string' ? body.postconditions.trim() : '',
      owner: typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : req.user.name,
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      requirementIds: Array.isArray(body.requirementIds) ? body.requirementIds.filter((id) => typeof id === 'string') : [],
      labels: normalizeLabels(body.labels),
    }
    store[req.user.id] = { ...snapshot, testCases: [testCase, ...testCases], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, testCase })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testCaseId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testCases = Array.isArray(snapshot.testCases) ? snapshot.testCases : []
    const index = testCases.findIndex((testCase) => testCase.id === req.params.testCaseId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Test case not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'owner', 'projectKey', 'preconditions', 'postconditions']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.type && allowedTypes.includes(req.body.type)) updates.type = req.body.type
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (req.body.status && allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (req.body.lastResult && allowedResults.includes(req.body.lastResult)) updates.lastResult = req.body.lastResult
    if (Array.isArray(req.body.requirementIds)) updates.requirementIds = req.body.requirementIds.filter((id) => typeof id === 'string')
    if (Array.isArray(req.body.steps)) updates.steps = req.body.steps
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)
    testCases[index] = { ...testCases[index], ...updates }
    store[req.user.id] = { ...snapshot, testCases, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, testCase: testCases[index] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:testCaseId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testCases = Array.isArray(snapshot.testCases) ? snapshot.testCases : []
    const remaining = testCases.filter((testCase) => testCase.id !== req.params.testCaseId)
    if (remaining.length === testCases.length) return res.status(404).json({ success: false, message: 'Test case not found.' })
    store[req.user.id] = { ...snapshot, testCases: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
