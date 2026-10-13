const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedStatuses = ['To Do', 'In Progress', 'Done']
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const epics = Array.isArray(snapshot.epics) ? snapshot.epics : []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({ success: true, epics: projectKey ? epics.filter((epic) => (epic.projectKey || 'QAR') === projectKey) : epics })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Epic title is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Epic status is invalid.' })
    }

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const epics = Array.isArray(snapshot.epics) ? snapshot.epics : []
    const epic = {
      id: `EPIC-${Date.now()}`,
      title: body.title.trim(),
      status: body.status || 'To Do',
      owner: typeof body.owner === 'string' ? body.owner.trim() : req.user.name,
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      color: typeof body.color === 'string' && body.color.trim() ? body.color.trim() : '#4B8DFF',
    }
    store[req.user.id] = { ...snapshot, epics: [epic, ...epics], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, epic })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:epicId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const epics = Array.isArray(snapshot.epics) ? snapshot.epics : []
    const index = epics.findIndex((epic) => epic.id === req.params.epicId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Epic not found.' })

    const updates = {}
    for (const field of ['title', 'owner', 'projectKey', 'color']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status) {
      if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Epic status is invalid.' })
      updates.status = req.body.status
    }
    epics[index] = { ...epics[index], ...updates }
    store[req.user.id] = { ...snapshot, epics, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, epic: epics[index] })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
