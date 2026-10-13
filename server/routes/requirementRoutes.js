const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()

const getUserSnapshot = (store, userId) => store[userId] || {}
const allowedStatuses = ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const requirements = getUserSnapshot(store, req.user.id).requirements || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({
      success: true,
      requirements: projectKey
        ? requirements.filter((requirement) => (requirement.projectKey || 'QAR') === projectKey)
        : requirements,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
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

    const store = await readQaStore()
    const snapshot = getUserSnapshot(store, req.user.id)
    const requirements = Array.isArray(snapshot.requirements) ? snapshot.requirements : []
    const nextNumber = requirements.reduce((highest, requirement) => {
      const match = /^REQ-(\d+)$/.exec(requirement.id || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 100) + 1
    const requirement = {
      id: `REQ-${nextNumber}`,
      title: body.title.trim(),
      description: typeof body.description === 'string' ? body.description.trim() : '',
      acceptanceCriteria: typeof body.acceptanceCriteria === 'string' ? body.acceptanceCriteria.trim() : '',
      owner: typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : req.user.name,
      priority: body.priority || 'Medium',
      status: body.status || 'Draft',
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      labels: Array.isArray(body.labels) ? body.labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean) : [],
    }
    store[req.user.id] = { ...snapshot, requirements: [requirement, ...requirements], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, requirement })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:requirementId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getUserSnapshot(store, req.user.id)
    const requirements = Array.isArray(snapshot.requirements) ? snapshot.requirements : []
    const index = requirements.findIndex((requirement) => requirement.id === req.params.requirementId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Requirement not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'acceptanceCriteria', 'owner', 'projectKey']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status && allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (Array.isArray(req.body.labels)) updates.labels = req.body.labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
    requirements[index] = { ...requirements[index], ...updates }
    store[req.user.id] = { ...snapshot, requirements, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, requirement: requirements[index] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:requirementId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getUserSnapshot(store, req.user.id)
    const requirements = Array.isArray(snapshot.requirements) ? snapshot.requirements : []
    const remaining = requirements.filter((requirement) => requirement.id !== req.params.requirementId)
    if (remaining.length === requirements.length) return res.status(404).json({ success: false, message: 'Requirement not found.' })
    store[req.user.id] = { ...snapshot, requirements: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
