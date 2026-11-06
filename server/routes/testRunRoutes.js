const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedEnvironments = ['Dev', 'Staging', 'Production', 'QA']
const executedResults = ['Passed', 'Failed', 'Blocked', 'Skipped']
const allResults = [...executedResults, 'Not Run', 'Pending']

const getSnapshot = (store, userId) => store[userId] || {}

const computeStats = (run) => {
  if (!Array.isArray(run.cases) || run.cases.length === 0) return run
  const count = (result) => run.cases.filter((item) => item.result === result).length
  const passed = count('Passed')
  const failed = count('Failed')
  const blocked = count('Blocked')
  const skipped = count('Skipped')
  const notRun = run.cases.filter((item) => !executedResults.includes(item.result)).length
  const executed = run.cases.length - notRun
  const status = executed === 0 ? 'Not Started' : notRun > 0 ? 'In Progress' : 'Completed'
  return {
    ...run,
    passed,
    failed,
    blocked,
    skipped,
    notRun,
    executed,
    total: run.cases.length,
    status,
    startedAt: run.startedAt || run.cases.find((item) => item.executedAt)?.executedAt || null,
    completedAt: status === 'Completed' ? run.completedAt || new Date().toISOString() : null,
  }
}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const testRuns = getSnapshot(store, req.user.id).testRuns || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    const scoped = projectKey
      ? testRuns.filter((run) => (run.projectKey || 'QAR') === projectKey)
      : testRuns
    return res.json({ success: true, testRuns: scoped.map(computeStats) })
  } catch (error) {
    return next(error)
  }
})

router.get('/:testRunId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const testRuns = getSnapshot(store, req.user.id).testRuns || []
    const run = testRuns.find((item) => item.id === req.params.testRunId)
    if (!run) return res.status(404).json({ success: false, message: 'Test run not found.' })
    return res.json({ success: true, testRun: computeStats(run) })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    const name = typeof body.name === 'string' ? body.name.trim() : typeof body.title === 'string' ? body.title.trim() : ''
    if (!name) {
      return res.status(400).json({ success: false, message: 'Test run name is required.' })
    }
    if (body.environment && !allowedEnvironments.includes(body.environment)) {
      return res.status(400).json({ success: false, message: 'Test run environment is invalid.' })
    }

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testRuns = Array.isArray(snapshot.testRuns) ? snapshot.testRuns : []
    const testCases = Array.isArray(snapshot.testCases) ? snapshot.testCases : []
    const testSuites = Array.isArray(snapshot.testSuites) ? snapshot.testSuites : []
    const projectKey = typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR'
    const suite = typeof body.suiteId === 'string' ? testSuites.find((item) => item.id === body.suiteId) : null

    let requestedIds = Array.isArray(body.testCaseIds)
      ? body.testCaseIds.filter((id) => typeof id === 'string')
      : Array.isArray(suite?.testCaseIds)
        ? suite.testCaseIds
        : null

    if (!requestedIds) {
      requestedIds = testCases
        .filter((testCase) => (testCase.projectKey || 'QAR') === projectKey)
        .map((testCase) => testCase.id)
    }

    const uniqueIds = [...new Set(requestedIds)]
    const cases = uniqueIds
      .map((id) => testCases.find((testCase) => testCase.id === id))
      .filter(Boolean)
      .map((testCase) => ({
        testCaseId: testCase.id,
        title: testCase.title,
        result: 'Not Run',
        notes: '',
        executedAt: null,
      }))

    if (!cases.length) {
      return res.status(400).json({ success: false, message: 'Select at least one existing test case for this run.' })
    }

    const nextNumber = testRuns.reduce((highest, run) => {
      const match = /^RUN-(\d+)$/.exec(run.id || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 1000) + 1

    const run = computeStats({
      id: `RUN-${nextNumber}`,
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      status: 'Not Started',
      environment: body.environment || 'QA',
      projectKey,
      suiteId: suite?.id || null,
      createdBy: req.user.name,
      executedBy: '',
      startedAt: null,
      completedAt: null,
      cases,
    })

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
    if (req.body.environment && !allowedEnvironments.includes(req.body.environment)) {
      return res.status(400).json({ success: false, message: 'Test run environment is invalid.' })
    }

    const updates = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim()
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim()
    if (allowedEnvironments.includes(req.body.environment)) updates.environment = req.body.environment
    testRuns[index] = computeStats({ ...testRuns[index], ...updates })
    store[req.user.id] = { ...snapshot, testRuns, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, testRun: testRuns[index] })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testRunId/cases/:testCaseId', async (req, res, next) => {
  try {
    const { result } = req.body || {}
    if (!allResults.includes(result)) {
      return res.status(400).json({ success: false, message: 'Test result must be Passed, Failed, Blocked, Skipped, or Not Run.' })
    }
    if (req.body.notes !== undefined && typeof req.body.notes !== 'string') {
      return res.status(400).json({ success: false, message: 'Execution notes must be text.' })
    }
    if (typeof req.body.notes === 'string' && req.body.notes.length > 5000) {
      return res.status(400).json({ success: false, message: 'Execution notes must be 5000 characters or fewer.' })
    }

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testRuns = Array.isArray(snapshot.testRuns) ? snapshot.testRuns : []
    const runIndex = testRuns.findIndex((run) => run.id === req.params.testRunId)
    if (runIndex === -1) return res.status(404).json({ success: false, message: 'Test run not found.' })
    const run = testRuns[runIndex]
    if (!Array.isArray(run.cases) || !run.cases.length) {
      return res.status(409).json({ success: false, message: 'This legacy run does not contain per-test execution records. Create a new run to execute tests.' })
    }
    const caseIndex = run.cases.findIndex((item) => item.testCaseId === req.params.testCaseId)
    if (caseIndex === -1) return res.status(404).json({ success: false, message: 'Test case is not part of this run.' })

    const isReset = result === 'Not Run'
    const updatedCase = {
      ...run.cases[caseIndex],
      result: isReset ? 'Not Run' : result,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : run.cases[caseIndex].notes || '',
      executedAt: isReset ? null : new Date().toISOString(),
    }
    const cases = run.cases.map((item, index) => (index === caseIndex ? updatedCase : item))
    const updatedRun = computeStats({ ...run, cases, executedBy: req.user.name })

    const testCases = Array.isArray(snapshot.testCases) ? snapshot.testCases : []
    const testCaseIndex = testCases.findIndex((testCase) => testCase.id === req.params.testCaseId)
    if (testCaseIndex !== -1) {
      testCases[testCaseIndex] = { ...testCases[testCaseIndex], lastResult: updatedCase.result }
    }

    let activity = Array.isArray(snapshot.activity) ? snapshot.activity : []
    if (updatedRun.status === 'Completed' && run.status !== 'Completed') {
      activity = [{
        id: `activity-${Date.now()}`,
        issueId: updatedRun.id,
        action: `completed test run · ${updatedRun.passed} passed, ${updatedRun.failed} failed, ${updatedRun.blocked} blocked`,
        actor: req.user.name,
        createdAt: new Date().toISOString(),
      }, ...activity]
    }

    testRuns[runIndex] = updatedRun
    store[req.user.id] = {
      ...snapshot,
      testRuns,
      ...(testCaseIndex !== -1 ? { testCases } : {}),
      activity,
      updatedAt: new Date().toISOString(),
    }
    await queueQaStoreWrite(store)
    return res.json({ success: true, testRun: updatedRun, testCase: testCaseIndex !== -1 ? testCases[testCaseIndex] : null })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:testRunId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const testRuns = Array.isArray(snapshot.testRuns) ? snapshot.testRuns : []
    const remaining = testRuns.filter((run) => run.id !== req.params.testRunId)
    if (remaining.length === testRuns.length) return res.status(404).json({ success: false, message: 'Test run not found.' })
    store[req.user.id] = { ...snapshot, testRuns: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
