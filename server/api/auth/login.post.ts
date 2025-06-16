import { compare } from 'bcrypt'
import { User } from '~/server/models/user'
import { connectDB } from '~/server/utils/db'

interface LoginRequest {
  email: string
  password: string
}

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
    const body = await readBody<LoginRequest>(event)
    const { email, password } = body

    // 验证请求数据
    if (!email || !password) {
      return {
        success: false,
        error: '邮箱和密码不能为空'
      }
    }

    // 连接数据库
    await connectDB()

    // 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    // 验证密码
    const isValid = await compare(password, user.password)
    if (!isValid) {
      return {
        success: false,
        error: '密码错误'
      }
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    // 设置 cookie
    setCookie(event, 'userId', user._id.toString(), {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: '/'
    })

    return {
      success: true,
      data: {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString()
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: '登录失败，请稍后重试'
    }
  }
}) 