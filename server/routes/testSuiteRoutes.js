const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject, scopeProjects } = require('../middleware/projectMiddleware')
const { mutateWorkspace, readAccessible, locateItem } = require('../data/workspaceStore')

const router = express.Router()
const elevated = ['Admin', 'QA Lead', 'Project Manager']

const normalizeIds = (ids) => Array.isArray(ids)
  ? [...new Set(ids.filter((id) => typeof id === 'string' && id.trim()))]
  : []

router.use(authMiddleware)

router.get('/', scopeProjects, (req, res, next) => {
  try {
    return res.json({ success: true, testSuites: readAccessible(req.projectKeys, ['testSuites']).testSuites })
  } catch (error) {
    return next(error)
  }
})

router.post('/', resolveProject, (req, res, next) => {
  try {
    const body = req.body || {}
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Suite name is required.' })
    }

    const testSuite = mutateWorkspace(req.projectKey, (data) => {
      const created = {
        id: `SUITE-${Date.now()}`,
        name: body.name.trim().slice(0, 120),
        description: typeof body.description === 'string' ? body.description.trim() : '',
        projectKey: req.projectKey,
        testCaseIds: normalizeIds(body.testCaseIds),
        createdBy: req.user.name,
        createdAt: new Date().toISOString(),
      }
      data.testSuites.unshift(created)
      return created
    })

    return res.status(201).json({ success: true, testSuite })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:suiteId', (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testSuites', req.params.suiteId)
    if (!located) return res.status(404).json({ success: false, message: 'Test suite not found.' })

    const updates = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim().slice(0, 120)
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim()
    if (Array.isArray(req.body.testCaseIds)) updates.testCaseIds = normalizeIds(req.body.testCaseIds)

    const testSuite = mutateWorkspace(located.projectKey, (data) => {
      const index = data.testSuites.findIndex((suite) => suite.id === located.item.id)
      if (index === -1) return null
      data.testSuites[index] = { ...data.testSuites[index], ...updates }
      return data.testSuites[index]
    })

    if (!testSuite) return res.status(404).json({ success: false, message: 'Test suite not found.' })
    return res.json({ success: true, testSuite })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:suiteId', authorizeRoles(...elevated), (req, res, next) => {
  try {
    const located = locateItem(req.user.projects, 'testSuites', req.params.suiteId)
    if (!located) return res.status(404).json({ success: false, message: 'Test suite not found.' })

    mutateWorkspace(located.projectKey, (data) => {
      data.testSuites = data.testSuites.filter((suite) => suite.id !== located.item.id)
    })

    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
