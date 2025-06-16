import { connectDB } from '~/server/utils/db'
import { Chat } from '~/server/models/chat'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const userId = getQuery(event).userId as string

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    const chats = await Chat.find({ userId }).sort({ createdAt: -1 })
    return { success: true, data: chats }
  } catch (error) {
    console.error('Error fetching chats:', error)
    return { success: false, error: 'Failed to fetch chats' }
  }
}) 