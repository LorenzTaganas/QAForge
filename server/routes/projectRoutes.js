const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const {
  listProjectsForUser,
  listAllProjects,
  findProject,
  isMember,
  getUserState,
  setUserState,
} = require('../data/db')
const {
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
} = require('../data/workspaceStore')

const router = express.Router()
const projectManagers = ['Admin', 'QA Lead', 'Project Manager']

const validProject = (project) => (
  project &&
  typeof project === 'object' &&
  typeof project.name === 'string' &&
  typeof project.key === 'string' &&
  project.name.trim().length > 0 &&
  /^[A-Z0-9]{2,10}$/.test(project.key.trim().toUpperCase())
)

const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message })
  return res.status(500).json({ success: false, message: 'Could not update projects.' })
}

router.use(authMiddleware)

router.get('/', (req, res, next) => {
  try {
    return res.json({ success: true, projects: listProjectsForUser(req.user.id) })
  } catch (error) {
    return next(error)
  }
})

router.get('/all', authorizeRoles('Admin'), (req, res, next) => {
  try {
    return res.json({ success: true, projects: listAllProjects() })
  } catch (error) {
    return next(error)
  }
})

router.post('/', authorizeRoles(...projectManagers), (req, res, next) => {
  try {
    if (!validProject(req.body)) {
      return res.status(400).json({ success: false, message: 'A project name and 2-10 character key are required.' })
    }

    const project = createProjectRecord({
      key: req.body.key,
      name: req.body.name,
      lead: req.body.lead || req.user.name,
      category: req.body.category,
      description: req.body.description,
      status: 'Active',
      userId: req.user.id,
    })

    setUserState(req.user.id, { selectedProjectKey: project.key })
    return res.status(201).json({ success: true, project })
  } catch (error) {
    return sendError(res, error)
  }
})

router.patch('/:projectKey', authorizeRoles(...projectManagers), (req, res, next) => {
  try {
    const key = String(req.params.projectKey || '').toUpperCase()
    if (!findProject(key)) return res.status(404).json({ success: false, message: 'Project not found.' })
    if (!isMember(req.user.id, key)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
    }

    const project = updateProjectRecord(key, req.body)
    return res.json({ success: true, project })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:projectKey', authorizeRoles(...projectManagers), (req, res, next) => {
  try {
    const key = String(req.params.projectKey || '').toUpperCase()
    if (!findProject(key)) return res.status(404).json({ success: false, message: 'Project not found.' })
    if (!isMember(req.user.id, key)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
    }

    deleteProjectRecord(key)

    const state = getUserState(req.user.id)
    if (!state.selectedProjectKey) {
      const next = listProjectsForUser(req.user.id)[0]
      if (next) setUserState(req.user.id, { selectedProjectKey: next.key })
    }

    return res.json({ success: true })
  } catch (error) {
    return sendError(res, error)
  }
})

module.exports = router
