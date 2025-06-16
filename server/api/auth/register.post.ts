import { hash } from 'bcrypt'
import { User } from '../../models/user'
import { connectDB } from '~/server/utils/db'

interface RegisterRequest {
  username: string
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
    const body = await readBody<RegisterRequest>(event)
    const { username, email, password } = body

    // 验证请求数据
    if (!username || !email || !password) {
      return {
        success: false,
        error: '用户名、邮箱和密码不能为空'
      }
    }

    // 连接数据库
    await connectDB()

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return {
        success: false,
        error: '该邮箱已被注册'
      }
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return {
        success: false,
        error: '该用户名已被使用'
      }
    }

    // 加密密码
    const hashedPassword = await hash(password, 10)

    // 创建新用户
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    })

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser.toObject()
    
    // 设置 cookie
    setCookie(event, 'userId', newUser._id.toString(), {
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
    console.error('注册失败:', error)
    return {
      success: false,
      error: '注册失败，请稍后重试'
    }
  }
}) 