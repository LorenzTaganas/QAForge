const jwt = require('jsonwebtoken')
const users = require('../data/users')

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
    const loggedInUser = users.find((user) => user.id === decoded.id)

    if (!loggedInUser) {
      return res.status(401).json({
        success: false,
        message: 'User session is invalid.',
      })
    }

    req.user = {
      id: loggedInUser.id,
      name: loggedInUser.name,
      email: loggedInUser.email,
      role: loggedInUser.role,
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
