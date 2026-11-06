const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { getUserState, setUserState } = require('../data/db')

const router = express.Router()

router.use(authMiddleware)

router.get('/:issueId', (req, res, next) => {
  try {
    const { watchers } = getUserState(req.user.id)
    return res.json({ success: true, watching: watchers.includes(req.params.issueId) })
  } catch (error) {
    return next(error)
  }
})

router.post('/:issueId', (req, res, next) => {
  try {
    const { watchers } = getUserState(req.user.id)
    const next = watchers.includes(req.params.issueId) ? watchers : [...watchers, req.params.issueId]
    setUserState(req.user.id, { watchers: next })
    return res.status(201).json({ success: true, watching: true })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:issueId', (req, res, next) => {
  try {
    const { watchers } = getUserState(req.user.id)
    setUserState(req.user.id, { watchers: watchers.filter((issueId) => issueId !== req.params.issueId) })
    return res.json({ success: true, watching: false })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
