import { CozeService } from '../services/coze.service'
import { ChatEventType } from '@coze/api'

export default defineEventHandler(async (event) => {
  // 设置 SSE 响应头
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // 从查询参数获取消息
  const query = getQuery(event)
  const message = query.message as string

  if (!message) {
    throw createError({
      statusCode: 400,
      message: 'Message is required',
    })
  }

  const cozeService = new CozeService()
  
  // 创建 SSE 响应流
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = await cozeService.streamMessage(message)

        for await (const part of stream) {
          if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
            // 发送数据到客户端
            controller.enqueue(`data: ${JSON.stringify({ content: part.data.content })}\n\n`)
          }
        }
        // 发送结束标记
        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`)
        controller.close()
      } catch (error) {
        console.error('Stream Error:', error)
        controller.enqueue(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`)
        controller.close()
      }
    }
  })

  return stream
}) 