const fs = require('fs/promises')
const path = require('path')

const storePath = path.join(__dirname, 'qaStore.json')
let writeQueue = Promise.resolve()

const readQaStore = async () => {
  try {
    const contents = await fs.readFile(storePath, 'utf8')
    return JSON.parse(contents)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return {}
  }
}

const writeQaStore = async (store) => {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  const temporaryPath = `${storePath}.tmp`
  await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8')
  await fs.rename(temporaryPath, storePath)
}

const queueQaStoreWrite = (store) => {
  writeQueue = writeQueue.then(() => writeQaStore(store))
  return writeQueue
}

module.exports = {
  readQaStore,
  queueQaStoreWrite,
}
