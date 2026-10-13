const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/comments', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const comments = Array.isArray(snapshot.comments) ? snapshot.comments : []
    const issueId = typeof req.query.issueId === 'string' ? req.query.issueId : null
    return res.json({ success: true, comments: issueId ? comments.filter((comment) => comment.issueId === issueId) : comments })
  } catch (error) {
    return next(error)
  }
})

router.post('/comments', async (req, res, next) => {
  try {
    if (typeof req.body.issueId !== 'string' || typeof req.body.body !== 'string' || !req.body.body.trim()) {
      return res.status(400).json({ success: false, message: 'Issue and comment text are required.' })
    }
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const comment = {
      id: `comment-${Date.now()}`,
      issueId: req.body.issueId,
      author: req.user.name,
      body: req.body.body.trim(),
      createdAt: new Date().toISOString(),
    }
    const comments = Array.isArray(snapshot.comments) ? snapshot.comments : []
    const activity = Array.isArray(snapshot.activity) ? snapshot.activity : []
    const event = {
      id: `activity-${Date.now() + 1}`,
      issueId: comment.issueId,
      action: 'added a comment',
      actor: req.user.name,
      createdAt: new Date().toISOString(),
    }
    store[req.user.id] = { ...snapshot, comments: [comment, ...comments], activity: [event, ...activity], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, comment, activity: event })
  } catch (error) {
    return next(error)
  }
})

router.get('/activity', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const activity = Array.isArray(snapshot.activity) ? snapshot.activity : []
    const issueId = typeof req.query.issueId === 'string' ? req.query.issueId : null
    return res.json({ success: true, activity: issueId ? activity.filter((event) => event.issueId === issueId) : activity })
  } catch (error) {
    return next(error)
  }
})

router.post('/activity', async (req, res, next) => {
  try {
    if (typeof req.body.issueId !== 'string' || typeof req.body.action !== 'string' || !req.body.action.trim()) {
      return res.status(400).json({ success: false, message: 'Issue and activity action are required.' })
    }
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const event = {
      id: `activity-${Date.now()}`,
      issueId: req.body.issueId,
      action: req.body.action.trim(),
      actor: req.user.name,
      createdAt: new Date().toISOString(),
    }
    const activity = Array.isArray(snapshot.activity) ? snapshot.activity : []
    store[req.user.id] = { ...snapshot, activity: [event, ...activity], updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, activity: event })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
