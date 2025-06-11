import { Schema, model } from 'mongoose'

// 消息模型
const messageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
})

// 聊天会话模型
const chatSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true // 添加索引以提高查询性能
  },
  title: {
    type: String,
    required: true,
    default: '新对话'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 更新时间中间件
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// 创建复合索引
chatSchema.index({ userId: 1, updatedAt: -1 })

export const Chat = model('Chat', chatSchema) 