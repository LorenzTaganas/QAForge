const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject, scopeProjects } = require('../middleware/projectMiddleware')
const { mutateWorkspace, readAccessible, locateItem } = require('../data/workspaceStore')

const router = express.Router()
const allowedStatuses = ['To Do', 'In Progress', 'Done']
const elevated = ['Admin', 'QA Lead', 'Project Manager']

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, epics: readAccessible(req.projectKeys, ['epics']).epics })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles(...elevated), resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Epic title is required.' })
    }
    if (body.status && !allowedStatuses.includes(body.status)) {
      return res.status(400).json({ success: false, message: 'Epic status is invalid.' })
    }

    const epic = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `EPIC-${Date.now()}`,
        title: body.title.trim(),
        status: body.status || 'To Do',
        owner: typeof body.owner === 'string' ? body.owner.trim() : req.user.name,
        projectKey: req.projectKey,
        color: typeof body.color === 'string' && body.color.trim() ? body.color.trim() : '#4B8DFF',
      }
      data.epics.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, epic })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:epicId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'epics', req.params.epicId)
    if (!located) return res.status(404).json({ success: false, message: 'Epic not found.' })

    const updates = {}
    for (const field of ['title', 'owner', 'color']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    if (req.body.status) {
      if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Epic status is invalid.' })
      updates.status = req.body.status
    }

    const epic = mutateWorkspace(located.projectKey, (data) => {
      const index = data.epics.findIndex((item) => item.id === located.item.id)
      if (index === -1) return null
      data.epics[index] = { ...data.epics[index], ...updates }
      return data.epics[index]
    })

    if (!epic) return res.status(404).json({ success: false, message: 'Epic not found.' })
    return res.json({ success: true, epic })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:epicId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'epics', req.params.epicId)
    if (!located) return res.status(404).json({ success: false, message: 'Epic not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.epics = data.epics.filter((epic) => epic.id !== located.item.id)
      data.tasks = data.tasks.map((task) => (
        task.epicId === located.item.id ? { ...task, epicId: undefined } : task
      ))
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
