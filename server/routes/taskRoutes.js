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
const statuses = ['To Do', 'In Progress', 'In Review', 'Done']
const priorities = ['Low', 'Medium', 'High', 'Critical']

const normalizeLabels = (labels) => Array.isArray(labels)
  ? labels.filter((label) => typeof label === 'string').map((label) => label.trim()).filter(Boolean)
  : []

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, tasks: readAccessible(req.projectKeys, ['tasks']).tasks })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) return res.status(400).json({ success: false, message: 'Task title is required.' })
    if (body.status && !statuses.includes(body.status)) return res.status(400).json({ success: false, message: 'Task status is invalid.' })
    if (body.priority && !priorities.includes(body.priority)) return res.status(400).json({ success: false, message: 'Task priority is invalid.' })

    const task = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `${req.projectKey}-${nextNumber('task')}`,
        title: body.title.trim(),
        status: body.status || 'To Do',
        priority: body.priority || 'Medium',
        owner: typeof body.owner === 'string' ? body.owner.trim() : req.user.name,
        due: typeof body.due === 'string' ? body.due.trim() : '',
        type: typeof body.type === 'string' ? body.type : 'Task',
        projectKey: req.projectKey,
        sprintId: typeof body.sprintId === 'string' ? body.sprintId : undefined,
        epicId: typeof body.epicId === 'string' ? body.epicId : undefined,
        labels: normalizeLabels(body.labels),
        description: typeof body.description === 'string' ? body.description.trim() : '',
        linkedIssueIds: Array.isArray(body.linkedIssueIds) ? body.linkedIssueIds.filter((id) => typeof id === 'string') : [],
      }
      data.tasks.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, task })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:taskId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'tasks', req.params.taskId)
    if (!located) return res.status(404).json({ success: false, message: 'Task not found.' })

    const updates = {}
    for (const field of ['title', 'owner', 'due', 'sprintId', 'epicId', 'description']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (statuses.includes(req.body.status)) updates.status = req.body.status
    if (priorities.includes(req.body.priority)) updates.priority = req.body.priority
    if (Array.isArray(req.body.labels)) updates.labels = normalizeLabels(req.body.labels)
    if (Array.isArray(req.body.linkedIssueIds)) updates.linkedIssueIds = req.body.linkedIssueIds.filter((id) => typeof id === 'string')

    if (typeof req.body.projectKey === 'string' && req.body.projectKey.trim()) {
      const targetKey = req.body.projectKey.trim().toUpperCase()
      if (targetKey !== located.projectKey) {
        if (!isMember(req.user.id, targetKey)) {
          return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
        }
        const task = moveItem(located.projectKey, 'tasks', located.item.id, targetKey, updates)
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })
        return res.json({ success: true, task })
      }
    }

    const task = mutateWorkspace(located.projectKey, (data) => {
      const index = data.tasks.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      data.tasks[index] = { ...data.tasks[index], ...updates }
      return data.tasks[index]
    })

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })
    return res.json({ success: true, task })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:taskId', authorizeRoles('Admin', 'QA Lead', 'Project Manager'), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'tasks', req.params.taskId)
    if (!located) return res.status(404).json({ success: false, message: 'Task not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.tasks = data.tasks.filter((task) => task.id !== located.item.id)
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
