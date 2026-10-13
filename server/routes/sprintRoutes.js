const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const allowedStatuses = ['Planned', 'Active', 'Completed']
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const sprints = Array.isArray(snapshot.sprints) ? snapshot.sprints : []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({ success: true, sprints: projectKey ? sprints.filter((sprint) => (sprint.projectKey || 'QAR') === projectKey) : sprints })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Sprint name is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Sprint status is invalid.' })
    }

    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const sprints = Array.isArray(snapshot.sprints) ? snapshot.sprints : []
    const sprint = {
      id: `SPRINT-${Date.now()}`,
      name: body.name.trim(),
      goal: typeof body.goal === 'string' ? body.goal.trim() : '',
      status: body.status || 'Planned',
      start: typeof body.start === 'string' ? body.start.trim() : '',
      end: typeof body.end === 'string' ? body.end.trim() : '',
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
    }
    store[req.user.id] = { ...snapshot, sprints: [sprint, ...sprints], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, sprint })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:sprintId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const sprints = Array.isArray(snapshot.sprints) ? snapshot.sprints : []
    const index = sprints.findIndex((sprint) => sprint.id === req.params.sprintId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Sprint not found.' })

    const updates = {}
    for (const field of ['name', 'goal', 'start', 'end', 'projectKey']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status) {
      if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Sprint status is invalid.' })
      updates.status = req.body.status
    }
    sprints[index] = { ...sprints[index], ...updates }
    if (updates.status === 'Active') {
      for (let item = 0; item < sprints.length; item += 1) {
        if (item !== index && sprints[item].projectKey === sprints[index].projectKey && sprints[item].status === 'Active') sprints[item] = { ...sprints[item], status: 'Planned' }
      }
    }
    store[req.user.id] = { ...snapshot, sprints, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, sprint: sprints[index] })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
