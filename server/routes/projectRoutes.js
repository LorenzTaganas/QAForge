const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const projectManagers = ['Admin', 'QA Lead', 'Project Manager']

const getUserSnapshot = (store, userId) => store[userId] || {}

const validProject = (project) => (
  project &&
  typeof project === 'object' &&
  typeof project.name === 'string' &&
  typeof project.key === 'string' &&
  project.name.trim().length > 0 &&
  /^[A-Z0-9]{2,10}$/.test(project.key.trim().toUpperCase())
)

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const store = await readQaStore()
    return res.json({ success: true, projects: getUserSnapshot(store, req.user.id).projects || [] })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles(...projectManagers), async (req, res, next) => {
  try {
    if (!validProject(req.body)) {
      return res.status(400).json({ success: false, message: 'A project name and 2-10 character key are required.' })
    }

    const store = await readQaStore()
    const snapshot = getUserSnapshot(store, req.user.id)
    const projects = Array.isArray(snapshot.projects) ? snapshot.projects : []
    const key = req.body.key.trim().toUpperCase()

    if (projects.some((project) => project.key === key)) {
      return res.status(409).json({ success: false, message: 'A project with this key already exists.' })
    }

    const project = {
      id: `proj-${Date.now()}`,
      name: req.body.name.trim(),
      key,
      lead: req.body.lead || req.user.name,
      category: req.body.category || 'Software',
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      status: 'Active',
    }
    store[req.user.id] = { ...snapshot, projects: [project, ...projects], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, project })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:projectKey', authorizeRoles(...projectManagers), async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getUserSnapshot(store, req.user.id)
    const projects = Array.isArray(snapshot.projects) ? snapshot.projects : []
    const index = projects.findIndex((project) => project.key === req.params.projectKey.toUpperCase())
    if (index === -1) return res.status(404).json({ success: false, message: 'Project not found.' })

    const updates = {}
    for (const field of ['name', 'description', 'status', 'lead', 'category']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim()
    }
    const project = { ...projects[index], ...updates }
    projects[index] = project
    store[req.user.id] = { ...snapshot, projects, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, project })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
