const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { readQaStore, queueQaStoreWrite } = require('../data/qaStore')

const router = express.Router()

const isSnapshot = (snapshot) => (
  snapshot &&
  typeof snapshot === 'object' &&
  !Array.isArray(snapshot) &&
  ['tasks', 'requirements', 'testCases', 'bugs', 'projects', 'epics', 'sprints', 'comments', 'activity', 'testRuns']
    .every((key) => snapshot[key] === undefined || Array.isArray(snapshot[key]))
)

const snapshotFields = ['tasks', 'requirements', 'testCases', 'bugs', 'projectSettings', 'projects', 'selectedProjectKey', 'epics', 'sprints', 'comments', 'activity', 'testRuns']

const pickSnapshotFields = (snapshot) => {
  const picked = {}
  snapshotFields.forEach((field) => {
    if (snapshot[field] !== undefined) picked[field] = snapshot[field]
  })
  return picked
}

router.get('/snapshot', authMiddleware, async (req, res, next) => {
  try {
    const store = await readQaStore()
    return res.status(200).json({
      success: true,
      snapshot: store[req.user.id] || null,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/snapshot', authMiddleware, async (req, res, next) => {
  try {
    if (!isSnapshot(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'A valid QA snapshot is required.',
      })
    }

    const store = await readQaStore()
    store[req.user.id] = {
      ...pickSnapshotFields(req.body),
      updatedAt: new Date().toISOString(),
    }
    await queueQaStoreWrite(store)

    return res.status(200).json({
      success: true,
      updatedAt: store[req.user.id].updatedAt,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
