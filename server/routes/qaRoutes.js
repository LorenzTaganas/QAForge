const express = require('express')
const fs = require('fs/promises')
const path = require('path')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()
const storePath = path.join(__dirname, '..', 'data', 'qaStore.json')

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
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8')
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
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'A valid QA snapshot is required.',
      })
    }

    const store = await readStore()
    store[req.user.id] = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    }
    await writeStore(store)

    return res.status(200).json({
      success: true,
      updatedAt: store[req.user.id].updatedAt,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
