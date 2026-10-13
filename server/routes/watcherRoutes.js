const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/:issueId', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const watchers = Array.isArray(snapshot.watchers) ? snapshot.watchers : []
    return res.json({ success: true, watching: watchers.includes(req.params.issueId) })
  } catch (error) {
    return next(error)
  }
})

router.post('/:issueId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const watchers = Array.isArray(snapshot.watchers) ? snapshot.watchers : []
    if (!watchers.includes(req.params.issueId)) watchers.push(req.params.issueId)
    store[req.user.id] = { ...snapshot, watchers, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.status(201).json({ success: true, watching: true })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:issueId', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const watchers = (Array.isArray(snapshot.watchers) ? snapshot.watchers : [])
      .filter((issueId) => issueId !== req.params.issueId)
    store[req.user.id] = { ...snapshot, watchers, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, watching: false })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
