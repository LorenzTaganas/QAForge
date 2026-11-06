const jwt = require('jsonwebtoken')
const { findUserById, toPublicUser, getUserState } = require('../data/db')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key')
    const row = findUserById(decoded.id)

    if (!row || !row.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User session is invalid.',
      })
    }

    const state = getUserState(row.id)
    req.user = {
      ...toPublicUser(row),
      selectedProjectKey: state.selectedProjectKey,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    })
  }
}

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.',
    })
  }

  next()
}

module.exports = {
  authMiddleware,
  authorizeRoles,
}
