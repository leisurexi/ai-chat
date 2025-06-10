export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message } = body

  if (!message) {
    throw createError({
      statusCode: 400,
      message: '消息不能为空'
    })
  }

  try {
    // TODO: 这里需要替换为实际的 AI API 调用
    // 目前返回模拟响应
    return {
      response: `这是对 "${message}" 的模拟回复。实际开发时需要替换为真实的 AI API 调用。`
    }
  } catch (error) {
    console.error('AI API 调用失败:', error)
    throw createError({
      statusCode: 500,
      message: 'AI 服务暂时不可用'
    })
  }
}) 