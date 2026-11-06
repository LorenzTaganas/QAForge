const express = require('express')
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware')
const { listUsers, createUser, updateUser, findUserById } = require('../data/db')

const router = express.Router()

router.use(authMiddleware)

router.get('/', (req, res) => {
  res.json({
    success: true,
    users: listUsers(),
  })
})

router.post('/', authorizeRoles('Admin'), (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    const role = typeof req.body?.role === 'string' ? req.body.role : 'QA Tester'
    const projectKeys = Array.isArray(req.body?.projectKeys) ? req.body.projectKeys : []

    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' })

    const user = createUser({ name, email, password, role, projectKeys })
    return res.status(201).json({ success: true, user })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message })
    return res.status(500).json({ success: false, message: 'Could not create the account.' })
  }
})

router.patch('/:userId', authorizeRoles('Admin'), (req, res) => {
  try {
    const target = findUserById(req.params.userId)
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' })
    if (target.id === req.user.id && req.body?.isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' })
    }

    const updates = {}
    if (typeof req.body?.name === 'string') updates.name = req.body.name
    if (typeof req.body?.role === 'string') updates.role = req.body.role
    if (typeof req.body?.isActive === 'boolean') updates.isActive = req.body.isActive
    if (typeof req.body?.password === 'string' && req.body.password) updates.password = req.body.password
    if (Array.isArray(req.body?.projectKeys)) updates.projectKeys = req.body.projectKeys

    const user = updateUser(target.id, updates)
    return res.json({ success: true, user })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message })
    return res.status(500).json({ success: false, message: 'Could not update the account.' })
  }
})

module.exports = router
