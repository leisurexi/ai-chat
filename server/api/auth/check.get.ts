import { User } from '~/server/models/user'
import { connectDB } from '~/server/utils/db'

interface UserData {
  _id: string
  username: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

interface AuthResponse {
  success: boolean
  data?: UserData
  error?: string
}

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  try {
    // 从 cookie 中获取用户 ID
    const userId = getCookie(event, 'userId')
    if (!userId) {
      return {
        success: false,
        error: '未登录'
      }
    }

    // 连接数据库
    await connectDB()

    // 查找用户
    const user = await User.findById(userId)
    if (!user) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user.toObject()
    return {
      success: true,
      data: {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString()
      }
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return {
      success: false,
      error: '检查登录状态失败，请稍后重试'
    }
  }
}) 