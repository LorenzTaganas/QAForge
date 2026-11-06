const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { scopeProjects } = require('../middleware/projectMiddleware')
const { mutateWorkspace, readAccessible, findIssueProject } = require('../data/workspaceStore')

const router = express.Router()

router.use(authMiddleware)

router.get('/comments', scopeProjects, (req, res, next) => {
  try {
    const comments = readAccessible(req.projectKeys, ['comments']).comments
    const issueId = typeof req.query.issueId === 'string' ? req.query.issueId : null
    return res.json({ success: true, comments: issueId ? comments.filter((comment) => comment.issueId === issueId) : comments })
  } catch (error) {
    return next(error)
  }
})

router.post('/comments', (req, res, next) => {
  try {
    if (typeof req.body.issueId !== 'string' || typeof req.body.body !== 'string' || !req.body.body.trim()) {
      return res.status(400).json({ success: false, message: 'Issue and comment text are required.' })
    }

    let attachment = null
    if (req.body.attachment) {
      const candidate = req.body.attachment
      if (
        typeof candidate.name !== 'string' ||
        typeof candidate.type !== 'string' ||
        typeof candidate.data !== 'string' ||
        !candidate.type.startsWith('image/') ||
        candidate.data.length > 700000
      ) {
        return res.status(400).json({ success: false, message: 'Only image attachments up to 500 KB are supported.' })
      }
      attachment = {
        name: candidate.name.slice(0, 160),
        type: candidate.type,
        data: candidate.data,
      }
    }

    const projectKey = findIssueProject(req.user.projects, req.body.issueId)
    if (!projectKey) return res.status(404).json({ success: false, message: 'Issue not found.' })

    const outcome = mutateWorkspace(projectKey, (data) => {
      const comment = {
        id: `comment-${Date.now()}`,
        issueId: req.body.issueId,
        author: req.user.name,
        body: req.body.body.trim(),
        createdAt: new Date().toISOString(),
        projectKey,
      }
      if (attachment) comment.attachment = attachment

      const activity = {
        id: `activity-${Date.now() + 1}`,
        issueId: comment.issueId,
        action: 'added a comment',
        actor: req.user.name,
        createdAt: new Date().toISOString(),
        projectKey,
      }

      data.comments.unshift(comment)
      data.activity.unshift(activity)
      return { comment, activity }
    })

    return res.status(201).json({ success: true, ...outcome })
  } catch (error) {
    return next(error)
  }
})

router.get('/activity', scopeProjects, (req, res, next) => {
  try {
    const activity = readAccessible(req.projectKeys, ['activity']).activity
    const issueId = typeof req.query.issueId === 'string' ? req.query.issueId : null
    return res.json({ success: true, activity: issueId ? activity.filter((event) => event.issueId === issueId) : activity })
  } catch (error) {
    return next(error)
  }
})

router.post('/activity', (req, res, next) => {
  try {
    if (typeof req.body.issueId !== 'string' || typeof req.body.action !== 'string' || !req.body.action.trim()) {
      return res.status(400).json({ success: false, message: 'Issue and activity action are required.' })
    }

    const projectKey = findIssueProject(req.user.projects, req.body.issueId)
    if (!projectKey) return res.status(404).json({ success: false, message: 'Issue not found.' })

    const event = mutateWorkspace(projectKey, (data) => {
      const activity = {
        id: `activity-${Date.now()}`,
        issueId: req.body.issueId,
        action: req.body.action.trim(),
        actor: req.user.name,
        createdAt: new Date().toISOString(),
        projectKey,
      }
      data.activity.unshift(activity)
      return activity
    })

    return res.status(201).json({ success: true, activity: event })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
