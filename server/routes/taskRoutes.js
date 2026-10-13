const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const statuses = ['To Do', 'In Progress', 'In Review', 'Done']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const tasks = getSnapshot(await readQaStore(), req.user.id).tasks || []
    const projectKey = typeof req.query.projectKey === 'string' ? req.query.projectKey.toUpperCase() : null
    return res.json({ success: true, tasks: projectKey ? tasks.filter((task) => (task.projectKey || 'QAR') === projectKey) : tasks })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) return res.status(400).json({ success: false, message: 'Task title is required.' })
    if (body.status && !statuses.includes(body.status)) return res.status(400).json({ success: false, message: 'Task status is invalid.' })
    if (body.priority && !priorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Task priority is invalid.' })
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : []
    const nextNumber = tasks.reduce((highest, task) => {
      const match = /^QAR-(\d+)$/.exec(task.id || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 100) + 1
    const task = {
      id: `QAR-${nextNumber}`,
      title: body.title.trim(),
      status: body.status || 'To Do',
      priority: body.priority || 'Medium',
      owner: typeof body.owner === 'string' ? body.owner.trim() : req.user.name,
      due: typeof body.due === 'string' ? body.due.trim() : '',
      type: typeof body.type === 'string' ? body.type : 'Task',
      projectKey: typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim().toUpperCase() : 'QAR',
      sprintId: typeof body.sprintId === 'string' ? body.sprintId : undefined,
      epicId: typeof body.epicId === 'string' ? body.epicId : undefined,
      labels: Array.isArray(body.labels) ? body.labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean) : [],
    }
    store[req.user.id] = { ...snapshot, tasks: [task, ...tasks], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, task })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:taskId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : []
    const index = tasks.findIndex((task) => task.id === req.params.taskId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Task not found.' })
    const updates = {}
    for (const field of ['title', 'owner', 'due', 'projectKey', 'sprintId', 'epicId']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (statuses.includes(req.body.status)) updates.status = req.body.status
    if (priorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (Array.isArray(req.body.labels)) updates.labels = req.body.labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
    tasks[index] = { ...tasks[index], ...updates }
    store[req.user.id] = { ...snapshot, tasks, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, task: tasks[index] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:taskId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : []
    const remaining = tasks.filter((task) => task.id !== req.params.taskId)
    if (remaining.length === tasks.length) return res.status(404).json({ success: false, message: 'Task not found.' })
    store[req.user.id] = { ...snapshot, tasks: remaining, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
