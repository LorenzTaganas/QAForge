const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()
const getSnapshot = (store, userId) => store[userId] || {}

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const snapshot = getSnapshot(await readQaStore(), req.user.id)
    const storedNotifications = Array.isArray(snapshot.notifications) ? snapshot.notifications : []
    const activity = Array.isArray(snapshot.activity) ? snapshot.activity : []
    const notifications = storedNotifications.length
      ? storedNotifications
      : activity.slice(0, 20).map((event) => ({
        id: `activity-notification-${event.id}`,
        issueId: event.issueId,
        title: event.issueId || 'QAForge activity',
        message: `${event.actor || 'A teammate'} ${event.action || 'updated an issue'}`,
        createdAt: event.createdAt,
        read: true,
      }))
    return res.json({ success: true, notifications })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:notificationId/read', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const notifications = Array.isArray(snapshot.notifications) ? snapshot.notifications : []
    const index = notifications.findIndex((item) => item.id === req.params.notificationId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Notification not found.' })
    notifications[index] = { ...notifications[index], read: true }
    store[req.user.id] = { ...snapshot, notifications, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, notification: notifications[index] })
  } catch (error) {
    return next(error)
  }
})

router.patch('/read-all', async (req, res, next) => {
  try {
    const store = await readQaStore()
    const snapshot = getSnapshot(store, req.user.id)
    const notifications = (Array.isArray(snapshot.notifications) ? snapshot.notifications : [])
      .map((notification) => ({ ...notification, read: true }))
    store[req.user.id] = { ...snapshot, notifications, updatedAt: new Date().toISOString() }
    await queueQaStoreWrite(store)
    return res.json({ success: true, notifications })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
