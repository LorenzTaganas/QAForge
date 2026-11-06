const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { resolveProject } = require('../middleware/projectMiddleware')
const { getUserState, setUserState, listProjectsForUser, isMember } = require('../data/db')
const { readWorkspace, readAccessible, updateWorkspaceSettings } = require('../data/workspaceStore')

const router = express.Router()
const allowedEnvironments = ['Dev', 'Staging', 'Production', 'QA']
const elevated = ['Admin', 'QA Lead', 'Project Manager']

const deriveNotifications = (state, activity) => {
  if (state.notifications.length) return state.notifications
  return activity.slice(0, 20).map((event) => ({
    id: `activity-notification-${event.id}`,
    issueId: event.issueId,
    title: event.issueId || 'QAForge activity',
    message: `${event.actor || 'A teammate'} ${event.action || 'updated an issue'}`,
    createdAt: event.createdAt,
    read: true,
  }))
}

router.get('/bootstrap', authMiddleware, (req, res, next) => {
  try {
    const requested = typeof req.query.projectKey === 'string' ? req.query.projectKey.trim().toUpperCase() : ''
    if (requested && !req.user.projects.includes(requested)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
    }

    const state = getUserState(req.user.id)
    const selectedProjectKey = requested || state.selectedProjectKey || req.user.projects[0] || null

    if (!selectedProjectKey) {
      return res.json({
        success: true,
        projects: [],
        selectedProjectKey: null,
        projectSettings: null,
        notifications: state.notifications,
        watchers: state.watchers,
        tasks: [],
        requirements: [],
        testCases: [],
        bugs: [],
        epics: [],
        sprints: [],
        comments: [],
        activity: [],
        testRuns: [],
        testSuites: [],
      })
    }

    if (requested && requested !== state.selectedProjectKey) {
      setUserState(req.user.id, { selectedProjectKey: requested })
    }

    const collections = readAccessible(req.user.projects)
    const workspace = readWorkspace(selectedProjectKey)

    return res.json({
      success: true,
      projects: listProjectsForUser(req.user.id),
      selectedProjectKey,
      projectSettings: workspace.projectSettings,
      notifications: deriveNotifications(state, collections.activity),
      watchers: state.watchers,
      ...collections,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/state', authMiddleware, (req, res, next) => {
  try {
    const projectKey = typeof req.body?.selectedProjectKey === 'string'
      ? req.body.selectedProjectKey.trim().toUpperCase()
      : ''

    if (!projectKey || !isMember(req.user.id, projectKey)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' })
    }

    const state = setUserState(req.user.id, { selectedProjectKey: projectKey })
    return res.json({
      success: true,
      selectedProjectKey: state.selectedProjectKey,
      projectSettings: readWorkspace(projectKey).projectSettings,
    })
  } catch (error) {
    return next(error)
  }
})

router.patch('/settings', authMiddleware, authorizeRoles(...elevated), resolveProject, (req, res, next) => {
  try {
    if (typeof req.body?.defaultEnv !== 'string' || !allowedEnvironments.includes(req.body.defaultEnv)) {
      return res.status(400).json({ success: false, message: 'Choose a valid default environment.' })
    }

    const projectSettings = updateWorkspaceSettings(req.projectKey, req.body)
    return res.json({ success: true, projectSettings })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
