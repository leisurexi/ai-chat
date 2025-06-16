interface AuthResponse {
  success: boolean
  error?: string
}

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  try {
    // 清除 cookie
    deleteCookie(event, 'userId', {
      path: '/'
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('退出登录失败:', error)
    return {
      success: false,
      error: '退出登录失败，请稍后重试'
    }
  }
}) 