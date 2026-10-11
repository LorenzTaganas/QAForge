const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/qaforge'
    await mongoose.connect(uri)
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB