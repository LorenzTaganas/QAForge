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
const allowedStatuses = ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']

const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, requirements: readAccessible(req.projectKeys, ['requirements']).requirements })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Requirement title is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Requirement status is invalid.' })
    }
    if (body.priority && !allowedPriorities.includes(body.priority)) {
      return res.status(400).json({ success: false, message: 'Requirement priority is invalid.' })
    }

    const requirement = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `REQ-${nextNumber('requirement')}`,
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description.trim() : '',
        acceptanceCriteria: typeof body.acceptanceCriteria === 'string' ? body.acceptanceCriteria.trim() : '',
        owner: typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : req.user.name,
        priority: body.priority || 'Medium',
        status: body.status || 'Draft',
        projectKey: req.projectKey,
        labels: normalizeLabels(body.labels),
        linkedIssueIds: Array.isArray(body.linkedIssueIds) ? body.linkedIssueIds.filter((id) => typeof id === 'string') : [],
      }
      data.requirements.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, requirement })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:requirementId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'requirements', req.params.requirementId)
    if (!located) return res.status(404).json({ success: false, message: 'Requirement not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'acceptanceCriteria', 'owner']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status && allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)
    if (Array.isArray(req.body.linkedIssueIds)) updates.linkedIssueIds = req.body.linkedIssueIds.filter((id) => typeof id === 'string')

    if (typeof req.body.projectKey === 'string' && req.body.projectKey.trim()) {
      const targetKey = req.body.projectKey.trim().toUpperCase()
      if (targetKey !== located.projectKey) {
        if (!isMember(req.user.id, targetKey)) {
          return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
        }
        const requirement = moveItem(located.projectKey, 'requirements', located.item.id, targetKey, updates)
        if (!requirement) return res.status(404).json({ success: false, message: 'Requirement not found.' })
        return res.json({ success: true, requirement })
      }
    }

    const requirement = mutateWorkspace(located.projectKey, (data) => {
      const index = data.requirements.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      data.requirements[index] = { ...data.requirements[index], ...updates }
      return data.requirements[index]
    })

    if (!requirement) return res.status(404).json({ success: false, message: 'Requirement not found.' })
    return res.json({ success: true, requirement })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:requirementId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'requirements', req.params.requirementId)
    if (!located) return res.status(404).json({ success: false, message: 'Requirement not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.requirements = data.requirements.filter((item) => item.id !== located.item.id)
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
