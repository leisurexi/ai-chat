import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: false,
    trim: true,
    minlength: [2, '用户名长度不能少于2位']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [8, '密码长度不能少于8位']
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// 创建索引
userSchema.index({ username: 1 })

export const User = model('User', userSchema) 