import { CozeService } from '../services/coze.service'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { message, sessionId } = body

    if (!message) {
      throw createError({
        statusCode: 400,
        message: 'Message is required',
      })
    }

    const cozeService = new CozeService()
    const response = await cozeService.sendMessage(message, sessionId)

    if (!response.success) {
      throw createError({
        statusCode: 500,
        message: "Call coze error",
      })
    }

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Chat API Error:', error)
    throw createError({
      statusCode: (error as any).statusCode || 500,
      message: (error as any).message || 'Internal server error',
    })
  }
}) 