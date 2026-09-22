const express = require('express')
const { loginUser, getCurrentUser, logoutUser } = require('../controllers/authController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/login', loginUser)
router.get('/me', authMiddleware, getCurrentUser)
router.post('/logout', authMiddleware, logoutUser)

module.exports = router
