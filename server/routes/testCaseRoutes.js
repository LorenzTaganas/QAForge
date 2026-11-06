const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject, scopeProjects } = require('../middleware/projectMiddleware')
const { isMember } = require('../data/db')
const {
  mutateWorkspace,
  nextNumber,
  readAccessible,
  locateItem,
  moveItem,
} = require('../data/workspaceStore')

const router = express.Router()
const allowedTypes = ['Functional', 'Regression', 'Smoke', 'Security', 'Performance', 'Integration']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']
const allowedStatuses = ['Draft', 'Ready', 'In Progress', 'Deprecated']
const allowedResults = ['Passed', 'Failed', 'Blocked', 'Skipped', 'Not Run', 'Pending']

const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, testCases: readAccessible(req.projectKeys, ['testCases']).testCases })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Test case title is required.' })
    }
    if (body.type && !allowedTypes.includes(body.type)) return res.status(400).json({ success: false, message: 'Test case type is invalid.' })
    if (body.priority && !allowedPriorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Test case priority is invalid.' })
    if (body.status && !allowedStatuses.includes(body.status)) return res.status(400).json({ success: false, message: 'Test case status is invalid.' })

    const testCase = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `TC-${nextNumber('testCase')}`,
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
        projectKey: req.projectKey,
        suiteId: typeof body.suiteId === 'string' ? body.suiteId : null,
        requirementIds: Array.isArray(body.requirementIds) ? body.requirementIds.filter((id) => typeof id === 'string') : [],
        linkedIssueIds: Array.isArray(body.linkedIssueIds) ? body.linkedIssueIds.filter((id) => typeof id === 'string') : [],
        labels: normalizeLabels(body.labels),
      }
      data.testCases.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, testCase })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:testCaseId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testCases', req.params.testCaseId)
    if (!located) return res.status(404).json({ success: false, message: 'Test case not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'owner', 'preconditions', 'postconditions', 'suiteId']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.type && allowedTypes.includes(req.body.type)) updates.type = req.body.type
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (req.body.status && allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (req.body.lastResult && allowedResults.includes(req.body.lastResult)) updates.lastResult = req.body.lastResult
    if (Array.isArray(req.body.requirementIds)) updates.requirementIds = req.body.requirementIds.filter((id) => typeof id === 'string')
    if (Array.isArray(req.body.linkedIssueIds)) updates.linkedIssueIds = req.body.linkedIssueIds.filter((id) => typeof id === 'string')
    if (Array.isArray(req.body.steps)) updates.steps = req.body.steps
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)

    if (typeof req.body.projectKey === 'string' && req.body.projectKey.trim()) {
      const targetKey = req.body.projectKey.trim().toUpperCase()
      if (targetKey !== located.projectKey) {
        if (!isMember(req.user.id, targetKey)) {
          return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
        }
        const testCase = moveItem(located.projectKey, 'testCases', located.item.id, targetKey, updates)
        if (!testCase) return res.status(404).json({ success: false, message: 'Test case not found.' })
        return res.json({ success: true, testCase })
      }
    }

    const testCase = mutateWorkspace(located.projectKey, (data) => {
      const index = data.testCases.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      data.testCases[index] = { ...data.testCases[index], ...updates }
      return data.testCases[index]
    })

    if (!testCase) return res.status(404).json({ success: false, message: 'Test case not found.' })
    return res.json({ success: true, testCase })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:testCaseId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testCases', req.params.testCaseId)
    if (!located) return res.status(404).json({ success: false, message: 'Test case not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.testCases = data.testCases.filter((testCase) => testCase.id !== located.item.id)
      data.testSuites = data.testSuites.map((suite) => ({
        ...suite,
        testCaseIds: (suite.testCaseIds || []).filter((id) => id !== located.item.id),
      }))
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
