<template>
  <div class="flex h-screen">
    <!-- 左侧边栏 -->
    <div class="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <UButton
        block
        color="primary"
        variant="solid"
        class="mb-4"
        @click="startNewChat"
      >
        <template #leading>
          <UIcon name="i-heroicons-plus" />
        </template>
        新对话
      </UButton>

      <!-- 对话历史列表 -->
      <div class="space-y-2">
        <div
          v-for="chat in chatHistory"
          :key="chat.id"
          class="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 cursor-pointer"
          :class="{ 'bg-gray-100': currentChatId === chat.id }"
          @click="selectChat(chat.id)"
        >
          <UIcon name="i-heroicons-chat-bubble-left-right" class="text-gray-500" />
          <span class="truncate text-sm">{{ chat.title }}</span>
        </div>
      </div>
    </div>

    <!-- 主对话区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 对话内容 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <template v-if="currentChat">
          <div
            v-for="message in currentChat.messages"
            :key="message.id"
            class="flex gap-4"
            :class="{ 'justify-end': message.role === 'user' }"
          >
            <div
              class="max-w-[80%] rounded-lg p-4"
              :class="{
                'bg-primary-50': message.role === 'assistant',
                'bg-gray-100': message.role === 'user'
              }"
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  :name="message.role === 'assistant' ? 'i-heroicons-sparkles' : 'i-heroicons-user'"
                  class="text-gray-500"
                />
                <span class="text-sm font-medium">
                  {{ message.role === 'assistant' ? 'AI 助手' : '我' }}
                </span>
              </div>
              <div class="prose prose-sm">
                {{ message.content }}
              </div>
            </div>
          </div>
        </template>
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          选择一个对话或开始新对话
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t border-gray-200 p-4">
        <form class="flex gap-2" @submit.prevent="sendMessage">
          <UInput
            v-model="newMessage"
            placeholder="输入消息..."
            class="flex-1"
            :disabled="isLoading"
          />
          <UButton
            type="submit"
            color="primary"
            :loading="isLoading"
            :disabled="!newMessage.trim()"
          >
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
}

function selectChat(chatId: string) {
  currentChatId.value = chatId
}

async function sendMessage() {
  if (!newMessage.value.trim() || !currentChatId.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: newMessage.value
  }

  const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value)
  if (currentChat) {
    currentChat.messages.push(userMessage)
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
  }
}
</script> 