const express = require('express')
const fs = require('fs/promises')
const path = require('path')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()
const storePath = path.join(__dirname, '..', 'data', 'qaStore.json')
let writeQueue = Promise.resolve()

const readStore = async () => {
  try {
    const contents = await fs.readFile(storePath, 'utf8')
    return JSON.parse(contents)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return {}
  }
}

const writeStore = async (store) => {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  const temporaryPath = `${storePath}.tmp`
  await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8')
  await fs.rename(temporaryPath, storePath)
}

const queueWrite = (store) => {
  writeQueue = writeQueue.then(() => writeStore(store))
  return writeQueue
}

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
    const store = await readStore()
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

    const store = await readStore()
    store[req.user.id] = {
      ...pickSnapshotFields(req.body),
      updatedAt: new Date().toISOString(),
    }
    await queueWrite(store)

    return res.status(200).json({
      success: true,
      updatedAt: store[req.user.id].updatedAt,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
