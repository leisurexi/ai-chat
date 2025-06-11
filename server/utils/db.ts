import mongoose from 'mongoose'

const MONGODB_USER = process.env.MONGODB_USER
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost:27017'
const MONGODB_DB = process.env.MONGODB_DB || 'ai-chat'

const MONGODB_URI = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DB}`

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return
    }
    
    await mongoose.connect(MONGODB_URI, {
      authSource: 'admin',
      authMechanism: 'SCRAM-SHA-1',
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
} 