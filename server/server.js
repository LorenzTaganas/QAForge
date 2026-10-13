const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const morgan = require('morgan')
const authRoutes = require('./routes/authRoutes')
const qaRoutes = require('./routes/qaRoutes')
const projectRoutes = require('./routes/projectRoutes')
const requirementRoutes = require('./routes/requirementRoutes')
const testCaseRoutes = require('./routes/testCaseRoutes')
const bugRoutes = require('./routes/bugRoutes')
const testRunRoutes = require('./routes/testRunRoutes')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QAForge API is running',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/qa', qaRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/requirements', requirementRoutes)
app.use('/api/test-cases', testCaseRoutes)
app.use('/api/bugs', bugRoutes)
app.use('/api/test-runs', testRunRoutes)

app.get('/', (req, res) => {
  res.send('QAForge backend is running')
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
  })
})

app.listen(PORT, () => {
  console.log(`QAForge server running on http://localhost:${PORT}`)
})
