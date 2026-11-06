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
const allowedSeverities = ['Trivial', 'Minor', 'Major', 'Critical', 'Blocker']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']
const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Verified', 'Reopened', 'Closed', "Won't Fix", 'Duplicate']

const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, bugs: readAccessible(req.projectKeys, ['bugs']).bugs })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Bug title is required.' })
    }
    if (body.severity && !allowedSeverities.includes(body.severity)) return res.status(400).json({ success: false, message: 'Bug severity is invalid.' })
    if (body.priority && !allowedPriorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Bug priority is invalid.' })

    const bug = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `BUG-${nextNumber('bug')}`,
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description.trim() : '',
        stepsToReproduce: typeof body.stepsToReproduce === 'string' ? body.stepsToReproduce.trim() : '',
        expectedBehavior: typeof body.expectedBehavior === 'string' ? body.expectedBehavior.trim() : '',
        actualBehavior: typeof body.actualBehavior === 'string' ? body.actualBehavior.trim() : '',
        severity: body.severity || 'Major',
        priority: body.priority || 'High',
        status: 'Open',
        reporter: typeof body.reporter === 'string' && body.reporter.trim() ? body.reporter.trim() : req.user.name,
        assignee: typeof body.assignee === 'string' ? body.assignee.trim() : '',
        environment: typeof body.environment === 'string' ? body.environment.trim() : '',
        projectKey: req.projectKey,
        labels: normalizeLabels(body.labels),
        linkedIssueIds: Array.isArray(body.linkedIssueIds) ? body.linkedIssueIds.filter((id) => typeof id === 'string') : [],
        linkedTestCaseId: typeof body.linkedTestCaseId === 'string' ? body.linkedTestCaseId : null,
        linkedTestRunId: typeof body.linkedTestRunId === 'string' ? body.linkedTestRunId : null,
      }
      data.bugs.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, bug })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:bugId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'bugs', req.params.bugId)
    if (!located) return res.status(404).json({ success: false, message: 'Bug not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior', 'reporter', 'assignee', 'environment', 'linkedTestCaseId', 'linkedTestRunId']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.severity && allowedSeverities.includes(req.body.severity)) updates.severity = req.body.severity
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (req.body.status) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Bug status is invalid.' })
      }
      updates.status = req.body.status
    }
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)
    if (Array.isArray(req.body.linkedIssueIds)) updates.linkedIssueIds = req.body.linkedIssueIds.filter((id) => typeof id === 'string')

    if (typeof req.body.projectKey === 'string' && req.body.projectKey.trim()) {
      const targetKey = req.body.projectKey.trim().toUpperCase()
      if (targetKey !== located.projectKey) {
        if (!isMember(req.user.id, targetKey)) {
          return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
        }
        const bug = moveItem(located.projectKey, 'bugs', located.item.id, targetKey, updates)
        if (!bug) return res.status(404).json({ success: false, message: 'Bug not found.' })
        return res.json({ success: true, bug })
      }
    }

    const bug = mutateWorkspace(located.projectKey, (data) => {
      const index = data.bugs.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      data.bugs[index] = { ...data.bugs[index], ...updates }
      return data.bugs[index]
    })

    if (!bug) return res.status(404).json({ success: false, message: 'Bug not found.' })
    return res.json({ success: true, bug })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:bugId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'bugs', req.params.bugId)
    if (!located) return res.status(404).json({ success: false, message: 'Bug not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.bugs = data.bugs.filter((bug) => bug.id !== located.item.id)
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
