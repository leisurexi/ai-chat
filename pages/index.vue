<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧边栏 -->
    <div class="w-72 border-r border-gray-200 bg-white p-4 shadow-sm">
      <UButton
        block
        color="primary"
        variant="solid"
        class="mb-6 transition-all hover:shadow-md"
        @click="startNewChat"
      >
        <template #leading>
          <UIcon name="i-heroicons-plus" class="text-lg" />
        </template>
        新对话
      </UButton>

      <!-- 对话历史列表 -->
      <div class="space-y-2">
        <div
          v-for="chat in chatHistory"
          :key="chat._id"
          class="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-gray-50 cursor-pointer chat-item"
          :class="{ 'bg-primary-50': currentChatId === chat._id }"
          @click="selectChat(chat._id)"
        >
          <UIcon 
            name="i-heroicons-chat-bubble-left-right" 
            class="text-gray-400 group-hover:text-primary-500 transition-colors" 
          />
          <template v-if="editingChatId === chat._id">
            <UInput
              v-model="editingTitle"
              size="xs"
              class="flex-1"
              @keyup.enter="saveTitle(chat._id)"
              @keyup.esc="cancelEdit"
              @blur="saveTitle(chat._id)"
              ref="titleInput"
            />
          </template>
          <template v-else>
            <span class="truncate text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1">
              {{ chat.title }}
            </span>
          </template>
          <div class="flex items-center gap-1">
            <template v-if="editingChatId !== chat._id">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-gray-400 hover:text-primary-500"
                @click.stop="startEdit(chat._id, chat.title)"
              >
                <UIcon name="i-heroicons-pencil-square" />
              </UButton>
            </template>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-gray-400 hover:text-red-500 delete-btn"
              @click.stop="deleteChat(chat._id)"
            >
              <UIcon name="i-heroicons-trash" />
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 主对话区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 对话内容 -->
      <div 
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <template v-if="currentChat">
          <div
            v-for="message in currentChat.messages"
            :key="message.id"
            class="flex gap-4 animate-fade-in"
            :class="{ 'justify-end': message.role === 'user' }"
          >
            <div
              class="max-w-[80%] rounded-2xl p-4 shadow-sm transition-all"
              :class="{
                'bg-primary-50 hover:shadow-md': message.role === 'assistant',
                'bg-gray-100 hover:shadow-md': message.role === 'user'
              }"
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  :name="message.role === 'assistant' ? 'i-heroicons-sparkles' : 'i-heroicons-user'"
                  class="text-primary-500"
                />
                <span class="text-sm font-medium text-gray-700">
                  {{ message.role === 'assistant' ? 'AI 助手' : '我' }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ new Date(message.timestamp).toLocaleTimeString() }}
                </span>
              </div>
              <div class="prose prose-sm text-gray-600">
                <template v-if="message.role === 'assistant' && message.isTyping">
                  <div class="typing-text">
                    {{ message.displayContent }}
                    <span class="typing-cursor">|</span>
                  </div>
                </template>
                <template v-else-if="message.role === 'assistant' && message.isWaiting">
                  <div class="flex items-center gap-1">
                    <span>思考中</span>
                    <span class="loading-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                </template>
                <template v-else>
                  {{ message.content }}
                </template>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="text-6xl" />
          <p class="text-lg">选择一个对话或开始新对话</p>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t border-gray-200 bg-white p-4 shadow-lg">
        <form class="flex gap-3" @submit.prevent>
          <UTextarea
            v-model="newMessage"
            placeholder="输入消息... (Enter 发送，Shift + Enter 换行)"
            class="flex-1 resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
            :disabled="isLoading"
            :rows="1"
            :auto-rows="true"
            :ui="{
              base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-inset dark:focus:ring-inset dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800 sm:text-sm sm:leading-6'
            }"
            @keydown.enter.prevent="handleEnterKey"
            @input="adjustTextareaHeight"
          />
          <UButton
            type="button"
            color="primary"
            :loading="isLoading"
            :disabled="!newMessage.trim()"
            size="lg"
            class="transition-all hover:shadow-md"
            @click="sendMessage"
          >
            <template #leading>
              <UIcon name="i-heroicons-paper-airplane" class="text-lg" />
            </template>
            发送
          </UButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  isWaiting?: boolean
  displayContent?: string
}

interface Chat {
  _id: string
  title: string
  messages: Message[]
  userId: string
  createdAt: string
  updatedAt: string
}

interface ChatResponse {
  success: boolean
  data?: Chat
  error?: string
}

interface ChatsResponse {
  success: boolean
  data?: Chat[]
  error?: string
}

const chatHistory = ref<Chat[]>([])
const currentChatId = ref<string | null>(null)
const newMessage = ref('')
const isLoading = ref(false)
const messageInput = ref<HTMLInputElement | null>(null)
const chatContainer = ref<HTMLElement | null>(null)

// 从 localStorage 获取或生成新的 userId
const userId = ref('')

// 确保 userId 被保存到 localStorage
onMounted(async () => {
  if (import.meta.client) {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      userId.value = storedUserId
    } else {
      const newUserId = uuidv4().replace(/-/g, '')
      userId.value = newUserId
      localStorage.setItem('userId', newUserId)
    }
    // 等待 userId 设置完成
    await nextTick()
    // 获取对话列表
    await fetchChats()
    // 聚焦到输入框
    messageInput.value?.focus()
  }
})

const currentChat = computed(() => {
  return chatHistory.value.find(chat => chat._id === currentChatId.value)
})

// 获取对话列表
async function fetchChats() {
  if (!userId.value) {
    console.log('No userId available, skipping fetchChats') // 添加日志
    return
  }
  try {
    const { data } = await useFetch<ChatsResponse>('/api/chats', {
      query: { userId: userId.value }
    })
    if (data.value?.success && data.value.data) {
      chatHistory.value = data.value.data
      // 如果没有选中的对话，自动选中第一个
      if (!currentChatId.value && chatHistory.value.length > 0) {
        currentChatId.value = chatHistory.value[0]._id
      }
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
  }
}

// 创建新对话
async function startNewChat() {
  if (!userId.value) return
  try {
    const { data } = await useFetch<ChatResponse>('/api/chats/create', {
      method: 'POST',
      body: { userId: userId.value }
    })
    
    if (data.value?.success && data.value.data) {
      const newChat = data.value.data
      chatHistory.value.unshift(newChat)
      currentChatId.value = newChat._id
      // 聚焦到输入框
      nextTick(() => {
        messageInput.value?.focus()
      })
    }
  } catch (error) {
    console.error('创建对话失败:', error)
  }
}

// 选择对话
function selectChat(chatId: string) {
  currentChatId.value = chatId
  // 聚焦到输入框
  nextTick(() => {
    messageInput.value?.focus()
  })
}

// 更新对话
async function updateChat(chatId: string, messages: Message[]) {
  if (!userId.value) return false
  try {
    const { data } = await useFetch(`/api/chats/${chatId}`, {
      method: 'PUT',
      body: {
        userId: userId.value,
        messages
      }
    })
    return data.value?.success
  } catch (error) {
    console.error('更新对话失败:', error)
    return false
  }
}

function handleEnterKey(event: KeyboardEvent) {
  if (event.shiftKey) {
    // Shift + Enter 换行
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    newMessage.value = value.substring(0, start) + '\n' + value.substring(end)
    // 将光标位置移动到换行符后
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1
    })
    return
  }
  // Enter 发送消息
  if (newMessage.value.trim() && !isLoading.value) {
    sendMessage()
  }
}

// 监听消息列表变化
watch(() => currentChat.value?.messages, () => {
  scrollToBottom()
}, { deep: true })

// 监听 AI 回复内容变化
watch(() => currentChat.value?.messages.find(m => m.isTyping)?.displayContent, () => {
  scrollToBottom()
})

async function sendMessage() {
  if (!newMessage.value?.trim() || !currentChatId.value || isLoading.value || !userId.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: newMessage.value,
    timestamp: new Date()
  }

  const currentChat = chatHistory.value.find(chat => chat._id === currentChatId.value)
  if (currentChat) {
    currentChat.messages.push(userMessage)
    // 更新对话到后端
    await updateChat(currentChat._id, currentChat.messages)
    // 滚动到底部
    scrollToBottom()
  }

  const userInput = newMessage.value
  newMessage.value = ''
  isLoading.value = true

  try {
    // 创建 AI 消息对象
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isWaiting: true,
      displayContent: ''
    }

    // 添加到消息列表
    if (currentChat) {
      currentChat.messages.push(aiMessage)
      // 滚动到底部
      scrollToBottom()
    }

    // 创建 SSE 连接
    const eventSource = new EventSource(`/api/chat.stream?message=${encodeURIComponent(userInput)}`)
    let aiResponse = ''

    // 监听消息
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.error) {
        console.error('Stream error:', data.error)
        eventSource.close()
        return
      }

      if (data.done) {
        eventSource.close()
        isLoading.value = false
        // 如果是第一条消息，更新对话标题
        if (currentChat && currentChat.messages.length === 2) {
          currentChat.title = userMessage.content.slice(0, 20) + (userMessage.content.length > 20 ? '...' : '')
        }
        // 完成打字效果
        if (aiMessage) {
          aiMessage.isTyping = false
          aiMessage.isWaiting = false
          aiMessage.displayContent = aiMessage.content
        }
        // 更新对话到后端
        if (currentChat) {
          updateChat(currentChat._id, currentChat.messages)
        }
        // 滚动到底部
        scrollToBottom()
        // 聚焦到输入框
        nextTick(() => {
          messageInput.value?.focus()
        })
        return
      }

      // 更新 AI 回复内容
      if (data.content) {
        aiResponse += data.content
        aiMessage.content = aiResponse
        // 开始打字效果
        aiMessage.isWaiting = false
        aiMessage.isTyping = true
        // 更新显示内容
        if (aiMessage.displayContent !== undefined) {
          aiMessage.displayContent = aiResponse
        }
        // 滚动到底部
        scrollToBottom()
      }
    }

    // 监听错误
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      eventSource.close()
      isLoading.value = false
      
      // 显示错误消息
      if (currentChat) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，发送消息时出现错误，请稍后重试。',
          timestamp: new Date()
        }
        currentChat.messages.push(errorMessage)
        updateChat(currentChat._id, currentChat.messages)
      }
      
      // 聚焦到输入框
      nextTick(() => {
        messageInput.value?.focus()
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    isLoading.value = false
    
    // 显示错误消息
    if (currentChat) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发送消息时出现错误，请稍后重试。',
        timestamp: new Date()
      }
      currentChat.messages.push(errorMessage)
      await updateChat(currentChat._id, currentChat.messages)
    }
    
    // 聚焦到输入框
    nextTick(() => {
      messageInput.value?.focus()
    })
  }
}

function adjustTextareaHeight(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  // 重置高度
  textarea.style.height = 'auto'
  // 设置新高度
  textarea.style.height = `${textarea.scrollHeight}px`
}

// 删除对话
async function deleteChat(chatId: string) {
  if (!userId.value) return
  try {
    const { data } = await useFetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
      body: { userId: userId.value }
    })
    
    if (data.value?.success) {
      // 从列表中移除对话
      chatHistory.value = chatHistory.value.filter(chat => chat._id !== chatId)
      // 如果删除的是当前选中的对话，则选中第一个对话
      if (currentChatId.value === chatId) {
        currentChatId.value = chatHistory.value.length > 0 ? chatHistory.value[0]._id : null
      }
    }
  } catch (error) {
    console.error('删除对话失败:', error)
  }
}

// 滚动到底部
function scrollToBottom() {
  if (chatContainer.value) {
    nextTick(() => {
      chatContainer.value!.scrollTop = chatContainer.value!.scrollHeight
    })
  }
}

// 编辑标题相关
const editingChatId = ref<string | null>(null)
const editingTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

// 开始编辑标题
function startEdit(chatId: string, title: string) {
  editingChatId.value = chatId
  editingTitle.value = title
  // 等待 DOM 更新后聚焦输入框
  nextTick(() => {
    titleInput.value?.focus()
    // 添加点击事件监听器
    document.addEventListener('click', handleClickOutside)
  })
}

// 处理点击外部事件
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  // 如果点击的不是输入框和编辑按钮，则取消编辑
  if (!target.closest('.chat-item') || target.closest('.delete-btn')) {
    cancelEdit()
  }
}

// 保存标题
async function saveTitle(chatId: string) {
  if (!editingTitle.value.trim() || !userId.value) return
  
  const chat = chatHistory.value.find(c => c._id === chatId)
  if (chat && chat.title !== editingTitle.value) {
    try {
      const { data } = await useFetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        body: {
          userId: userId.value,
          title: editingTitle.value
        }
      })
      
      if (data.value?.success) {
        chat.title = editingTitle.value
      }
    } catch (error) {
      console.error('更新标题失败:', error)
    }
  }
  
  cancelEdit()
}

// 取消编辑
function cancelEdit() {
  editingChatId.value = null
  editingTitle.value = ''
  // 移除点击事件监听器
  document.removeEventListener('click', handleClickOutside)
}

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加消息发送动画 */
@keyframes sendMessage {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-send {
  animation: sendMessage 0.3s ease-in-out;
}

/* 自定义滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #EDF2F7;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #EDF2F7;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #CBD5E0;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #A0AEC0;
}

/* 打字机效果 */
.typing-text {
  display: inline-block;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 加载动画 */
.loading-dots {
  display: inline-flex;
  align-items: center;
}

.loading-dots span {
  animation: loading 1.4s infinite;
  opacity: 0;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style> 