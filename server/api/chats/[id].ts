import { connectDB } from '~/server/utils/db'
import { Chat } from '~/server/models/chat'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatDocument {
  _id: string
  title: string
  messages: Message[]
  userId: string
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async (event) => {
  const method = event.method
  const id = event.context.params?.id
  let userId: string
  let chat: ChatDocument | null
  let updatedChat: ChatDocument | null
  let deletedChat: ChatDocument | null

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Chat ID is required'
    })
  }

  await connectDB()

  try {
    switch (method) {
      case 'GET':
        userId = getQuery(event).userId as string
        if (!userId) {
          throw createError({
            statusCode: 400,
            message: 'User ID is required'
          })
        }
        chat = await Chat.findOne({ _id: id, userId })
        if (!chat) {
          throw createError({
            statusCode: 404,
            message: 'Chat not found'
          })
        }
        return { success: true, data: chat }

      case 'PUT':
        { const body = await readBody(event)
        if (!body.userId) {
          throw createError({
            statusCode: 400,
            message: 'User ID is required'
          })
        }
        userId = body.userId
        updatedChat = await Chat.findOneAndUpdate(
          { _id: id, userId },
          { 
            $set: { 
              title: body.title,
              messages: body.messages,
              updatedAt: new Date()
            }
          },
          { new: true }
        )
        if (!updatedChat) {
          throw createError({
            statusCode: 404,
            message: 'Chat not found'
          })
        }
        return { success: true, data: updatedChat } }

      case 'DELETE':
        { const body = await readBody(event)
        if (!body.userId) {
          throw createError({
            statusCode: 400,
            message: 'User ID is required'
          })
        }
        userId = body.userId
        deletedChat = await Chat.findOneAndDelete({ _id: id, userId })
        if (!deletedChat) {
          throw createError({
            statusCode: 404,
            message: 'Chat not found'
          })
        }
        return { success: true, data: deletedChat } }

      default:
        throw createError({
          statusCode: 405,
          message: 'Method not allowed'
        })
    }
  } catch (error: unknown) {
    console.error(`Error in ${method} chat:`, error)
    const err = error as { statusCode?: number; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error'
    })
  }
}) 