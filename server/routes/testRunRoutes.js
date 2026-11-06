const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject, scopeProjects } = require('../middleware/projectMiddleware')
const {
  mutateWorkspace,
  nextNumber,
  readAccessible,
  readWorkspace,
  locateItem,
} = require('../data/workspaceStore')

const router = express.Router()
const allowedEnvironments = ['Dev', 'Staging', 'Production', 'QA']
const executedResults = ['Passed', 'Failed', 'Blocked', 'Skipped']
const allResults = [...executedResults, 'Not Run', 'Pending']
const elevated = ['Admin', 'QA Lead', 'Project Manager']

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

router.get('/', scopeProjects, (req, res, next) => {
  try {
    const testRuns = readAccessible(req.projectKeys, ['testRuns']).testRuns
    return res.json({ success: true, testRuns: testRuns.map(computeStats) })
  } catch (error) {
    return next(error)
  }
})

router.get('/:testRunId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testRuns', req.params.testRunId)
    if (!located) return res.status(404).json({ success: false, message: 'Test run not found.' })
    return res.json({ success: true, testRun: computeStats(located.item) })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    const name = typeof body.name === 'string' ? body.name.trim() : typeof body.title === 'string' ? body.title.trim() : ''
    if (!name) {
      return res.status(400).json({ success: false, message: 'Test run name is required.' })
    }
    if (body.environment && !allowedEnvironments.includes(body.environment)) {
      return res.status(400).json({ success: false, message: 'Test run environment is invalid.' })
    }

    const workspace = readWorkspace(req.projectKey)
    const suite = typeof body.suiteId === 'string'
      ? workspace.testSuites.find((item) => item.id === body.suiteId)
      : null

    let requestedIds = Array.isArray(body.testCaseIds)
      ? body.testCaseIds.filter((id) => typeof id === 'string')
      : Array.isArray(suite?.testCaseIds)
        ? suite.testCaseIds
        : null

    if (!requestedIds) {
      requestedIds = workspace.testCases.map((testCase) => testCase.id)
    }

    const cases = [...new Set(requestedIds)]
      .map((id) => workspace.testCases.find((testCase) => testCase.id === id))
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

    const run = mutateWorkspace(req.projectKey, (data) => {
      const created = computeStats({
        id: `RUN-${nextNumber('testRun')}`,
        name,
        description: typeof body.description === 'string' ? body.description.trim() : '',
        status: 'Not Started',
        environment: body.environment || 'QA',
        projectKey: req.projectKey,
        suiteId: suite?.id || null,
        createdBy: req.user.name,
        executedBy: '',
        startedAt: null,
        completedAt: null,
        cases,
      })
      data.testRuns.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, testRun: run })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testRunId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testRuns', req.params.testRunId)
    if (!located) return res.status(404).json({ success: false, message: 'Test run not found.' })
    if (req.body.environment && !allowedEnvironments.includes(req.body.environment)) {
      return res.status(400).json({ success: false, message: 'Test run environment is invalid.' })
    }

    const updates = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim()
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim()
    if (allowedEnvironments.includes(req.body.environment)) updates.environment = req.body.environment

    const testRun = mutateWorkspace(located.projectKey, (data) => {
      const index = data.testRuns.findIndex((run) => run.id === located.item.id)
      if (index === -1) return null
      data.testRuns[index] = computeStats({ ...data.testRuns[index], ...updates })
      return data.testRuns[index]
    })

    if (!testRun) return res.status(404).json({ success: false, message: 'Test run not found.' })
    return res.json({ success: true, testRun })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testRunId/cases/:testCaseId', (req, res, next) => {
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

    const located = locateItem(req.user.projects, 'testRuns', req.params.testRunId)
    if (!located) return res.status(404).json({ success: false, message: 'Test run not found.' })

    const outcome = mutateWorkspace(located.projectKey, (data) => {
      const runIndex = data.testRuns.findIndex((run) => run.id === located.item.id)
      if (runIndex === -1) return { missing: true }
      const run = data.testRuns[runIndex]
      if (!Array.isArray(run.cases) || !run.cases.length) return { legacy: true }
      const caseIndex = run.cases.findIndex((item) => item.testCaseId === req.params.testCaseId)
      if (caseIndex === -1) return { missingCase: true }

      const isReset = result === 'Not Run'
      const updatedCase = {
        ...run.cases[caseIndex],
        result: isReset ? 'Not Run' : result,
        notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : run.cases[caseIndex].notes || '',
        executedAt: isReset ? null : new Date().toISOString(),
      }
      const cases = run.cases.map((item, index) => (index === caseIndex ? updatedCase : item))
      const updatedRun = computeStats({ ...run, cases, executedBy: req.user.name })

      const testCaseIndex = data.testCases.findIndex((testCase) => testCase.id === req.params.testCaseId)
      if (testCaseIndex !== -1) {
        data.testCases[testCaseIndex] = { ...data.testCases[testCaseIndex], lastResult: updatedCase.result }
      }

      if (updatedRun.status === 'Completed' && run.status !== 'Completed') {
        data.activity = [{
          id: `activity-${Date.now()}`,
          issueId: updatedRun.id,
          action: `completed test run · ${updatedRun.passed} passed, ${updatedRun.failed} failed, ${updatedRun.blocked} blocked`,
          actor: req.user.name,
          createdAt: new Date().toISOString(),
        }, ...data.activity]
      }

      data.testRuns[runIndex] = updatedRun
      return {
        testRun: updatedRun,
        testCase: testCaseIndex !== -1 ? data.testCases[testCaseIndex] : null,
      }
    })

    if (outcome.missing) return res.status(404).json({ success: false, message: 'Test run not found.' })
    if (outcome.legacy) {
      return res.status(409).json({ success: false, message: 'This legacy run does not contain per-test execution records. Create a new run to execute tests.' })
    }
    if (outcome.missingCase) return res.status(404).json({ success: false, message: 'Test case is not part of this run.' })

    return res.json({ success: true, testRun: outcome.testRun, testCase: outcome.testCase })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:testRunId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testRuns', req.params.testRunId)
    if (!located) return res.status(404).json({ success: false, message: 'Test run not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.testRuns = data.testRuns.filter((run) => run.id !== located.item.id)
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
