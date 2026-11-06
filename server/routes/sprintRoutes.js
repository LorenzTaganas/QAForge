const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject, scopeProjects } = require('../middleware/projectMiddleware')
const { mutateWorkspace, readAccessible, locateItem } = require('../data/workspaceStore')

const router = express.Router()
const allowedStatuses = ['Planned', 'Active', 'Completed']
const elevated = ['Admin', 'QA Lead', 'Project Manager']

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, sprints: readAccessible(req.projectKeys, ['sprints']).sprints })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles(...elevated), resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Sprint name is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Sprint status is invalid.' })
    }

    const sprint = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `SPRINT-${Date.now()}`,
        name: body.name.trim(),
        goal: typeof body.goal === 'string' ? body.goal.trim() : '',
        status: body.status || 'Planned',
        start: typeof body.start === 'string' ? body.start.trim() : '',
        end: typeof body.end === 'string' ? body.end.trim() : '',
        projectKey: req.projectKey,
      }
      if (created.status === 'Active') {
        data.sprints = data.sprints.map((sprint) => (sprint.status === 'Active' ? { ...sprint, status: 'Planned' } : sprint))
      }
      data.sprints.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, sprint })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:sprintId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'sprints', req.params.sprintId)
    if (!located) return res.status(404).json({ success: false, message: 'Sprint not found.' })

    const updates = {}
    for (const field of ['name', 'goal', 'start', 'end']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status) {
      if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Sprint status is invalid.' })
      updates.status = req.body.status
    }

    const sprint = mutateWorkspace(located.projectKey, (data) => {
      const index = data.sprints.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      if (updates.status === 'Active') {
        data.sprints = data.sprints.map((item, itemIndex) => (
          itemIndex !== index && item.status === 'Active' ? { ...item, status: 'Planned' } : item
        ))
      }
      data.sprints[index] = { ...data.sprints[index], ...updates }
      return data.sprints[index]
    })

    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found.' })
    return res.json({ success: true, sprint })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:sprintId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'sprints', req.params.sprintId)
    if (!located) return res.status(404).json({ success: false, message: 'Sprint not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.sprints = data.sprints.filter((sprint) => sprint.id !== located.item.id)
      data.tasks = data.tasks.map((task) => (
        task.sprintId === located.item.id ? { ...task, sprintId: undefined } : task
      ))
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
