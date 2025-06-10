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
          :key="chat.id"
          class="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-gray-50 cursor-pointer"
          :class="{ 'bg-primary-50': currentChatId === chat.id }"
          @click="selectChat(chat.id)"
        >
          <UIcon 
            name="i-heroicons-chat-bubble-left-right" 
            class="text-gray-400 group-hover:text-primary-500 transition-colors" 
          />
          <span class="truncate text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            {{ chat.title }}
          </span>
        </div>
      </div>
    </div>

    <!-- 主对话区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 对话内容 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
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
              </div>
              <div class="prose prose-sm text-gray-600">
                {{ message.content }}
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
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface ChatResponse {
  response: string
}

const chatHistory = ref<Chat[]>([])
const currentChatId = ref<string | null>(null)
const newMessage = ref('')
const isLoading = ref(false)
const messageInput = ref<HTMLInputElement | null>(null)

const currentChat = computed(() => {
  return chatHistory.value.find(chat => chat.id === currentChatId.value)
})

function startNewChat() {
  const newChat: Chat = {
    id: Date.now().toString(),
    title: '新对话',
    messages: []
  }
  chatHistory.value.unshift(newChat)
  currentChatId.value = newChat.id
  // 聚焦到输入框
  nextTick(() => {
    messageInput.value?.focus()
  })
}

function selectChat(chatId: string) {
  currentChatId.value = chatId
  // 聚焦到输入框
  nextTick(() => {
    messageInput.value?.focus()
  })
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

async function sendMessage() {
  if (!newMessage.value.trim() || !currentChatId.value || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: newMessage.value
  }

  const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value)
  if (currentChat) {
    currentChat.messages.push(userMessage)
    // 更新对话标题为第一条消息
    if (currentChat.messages.length === 1) {
      currentChat.title = userMessage.content.slice(0, 20) + (userMessage.content.length > 20 ? '...' : '')
    }
  }

  const userInput = newMessage.value
  newMessage.value = ''
  isLoading.value = true

  try {
    const { data } = await useFetch<ChatResponse>('/api/chat', {
      method: 'POST',
      body: {
        message: userInput
      }
    })

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.value?.response || '抱歉，我无法生成回复。'
    }

    if (currentChat) {
      currentChat.messages.push(aiMessage)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    // 显示错误提示
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '抱歉，发送消息时出现错误，请稍后重试。'
    }
    if (currentChat) {
      currentChat.messages.push(errorMessage)
    }
  } finally {
    isLoading.value = false
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

// 组件挂载后聚焦到输入框
onMounted(() => {
  messageInput.value?.focus()
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
</style> 