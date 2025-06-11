import { connectDB } from '~/server/utils/db'
import { Chat } from '~/server/models/chat'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { userId } = body

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    await connectDB()
    const chat = new Chat({
      userId,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await chat.save()
    return { success: true, data: chat }
  } catch (error) {
    console.error('Error creating chat:', error)
    return { success: false, error: 'Failed to create chat' }
  }
}) 