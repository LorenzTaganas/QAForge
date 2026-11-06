const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const users = require('../data/users')

const router = express.Router()

router.use(authMiddleware)

router.get('/', (req, res) => {
  res.json({
    success: true,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projects: user.projects,
    })),
  })
})

module.exports = router
