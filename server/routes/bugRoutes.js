const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedSeverities = ['Trivial', 'Minor', 'Major', 'Critical', 'Blocker']
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical']
const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Verified', 'Closed', "Won't Fix", 'Duplicate']

const getSnapshot = (store, userId) => store[userId] || {}
const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const bugs = getSnapshot(store, req.user.id).bugs || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({
      success: true,
      bugs: projectKey ? bugs.filter((bug) => (bug.projectKey || 'QAR') === projectKey) : bugs,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Bug title is required.' })
    }
    if (body.severity && !allowedSeverities.includes(body.severity)) return res.status(400).json({ success: false, message: 'Bug severity is invalid.' })
    if (body.priority && !allowedPriorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Bug priority is invalid.' })

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const bugs = Array.isArray(snapshot.bugs) ? snapshot.bugs : []
    const nextNumber = bugs.reduce((highest, bug) => {
      const match = /^BUG-(\d+)$/.exec(bug.id || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 300) + 1
    const bug = {
      id: `BUG-${nextNumber}`,
      title: body.title.trim(),
      description: typeof body.description === 'string' ? body.description.trim() : '',
      severity: body.severity || 'Major',
      priority: body.priority || 'High',
      status: 'Open',
      reporter: typeof body.reporter === 'string' && body.reporter.trim() ? body.reporter.trim() : req.user.name,
      assignee: typeof body.assignee === 'string' ? body.assignee.trim() : '',
      environment: typeof body.environment === 'string' ? body.environment.trim() : '',
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      labels: normalizeLabels(body.labels),
    }
    store[req.user.id] = { ...snapshot, bugs: [bug, ...bugs], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, bug })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:bugId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const bugs = Array.isArray(snapshot.bugs) ? snapshot.bugs : []
    const index = bugs.findIndex((bug) => bug.id === req.params.bugId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Bug not found.' })

    const updates = {}
    for (const field of ['title', 'description', 'reporter', 'assignee', 'environment', 'projectKey']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.severity && allowedSeverities.includes(req.body.severity)) updates.severity = req.body.severity
    if (req.body.priority && allowedPriorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (req.body.status && allowedStatuses.includes(req.body.status)) updates.status = req.body.status
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)
    bugs[index] = { ...bugs[index], ...updates }
    store[req.user.id] = { ...snapshot, bugs, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, bug: bugs[index] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:bugId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const bugs = Array.isArray(snapshot.bugs) ? snapshot.bugs : []
    const remaining = bugs.filter((bug) => bug.id !== req.params.bugId)
    if (remaining.length === bugs.length) return res.status(404).json({ success: false, message: 'Bug not found.' })
    store[req.user.id] = { ...snapshot, bugs: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
