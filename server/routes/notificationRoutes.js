const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { getUserState, setUserState } = require('../data/db')
const { readAccessible } = require('../data/workspaceStore')

const router = express.Router()

const deriveFromActivity = (activity) => activity.slice(0, 20).map((event) => ({
  id: `activity-notification-${event.id}`,
  issueId: event.issueId,
  title: event.issueId || 'QAForge activity',
  message: `${event.actor || 'A teammate'} ${event.action || 'updated an issue'}`,
  createdAt: event.createdAt,
  read: true,
}))

router.use(authMiddleware)

router.get('/', (req, res, next) => {
  try {
    const state = getUserState(req.user.id)
    const activity = readAccessible(req.user.projects, ['activity']).activity
    const notifications = state.notifications.length ? state.notifications : deriveFromActivity(activity)
    return res.json({ success: true, notifications })
  } catch (error) {
    return next(error)
  }
})

router.patch('/read-all', (req, res, next) => {
  try {
    const state = getUserState(req.user.id)
    const notifications = state.notifications.map((notification) => ({ ...notification, read: true }))
    setUserState(req.user.id, { notifications })
    return res.json({ success: true, notifications })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:notificationId/read', (req, res, next) => {
  try {
    const state = getUserState(req.user.id)
    const index = state.notifications.findIndex((item) => item.id === req.params.notificationId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Notification not found.' })

    const notifications = state.notifications.map((notification, itemIndex) => (
      itemIndex === index ? { ...notification, read: true } : notification
    ))
    setUserState(req.user.id, { notifications })
    return res.json({ success: true, notification: notifications[index] })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
