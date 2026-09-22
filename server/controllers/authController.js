const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const users = require('../data/users')

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '8h' },
  )
}

const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    })
  }

  const user = users.find((item) => item.email.toLowerCase() === String(email).toLowerCase())

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    })
  }

  const token = generateToken(user)

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projects: user.projects,
    },
  })
}

const getCurrentUser = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  })
}

const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}

module.exports = {
  loginUser,
  getCurrentUser,
  logoutUser,
}
