import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useChat() {
  const authStore = useAuthStore()
  const activeChat = ref(null)
  const messages = ref([])
  const typingTimeout = ref(null)
  const currentChatTyping = ref(false)

  const currentChatName = computed(() => {
    return activeChat.value?.name || 'Выберите чат'
  })

  const currentChatOnline = computed(() => {
    return activeChat.value?.online || false
  })

  const addMessage = (message) => {
    messages.value.push(message)
  }

  const setMessages = (newMessages) => {
    messages.value = newMessages
  }

  const setTyping = (isTyping) => {
    currentChatTyping.value = isTyping
    if (isTyping) {
      clearTimeout(typingTimeout.value)
      typingTimeout.value = setTimeout(() => {
        currentChatTyping.value = false
      }, 3000)
    }
  }

  const selectChat = (chat) => {
    activeChat.value = chat
  }

  const clearChat = () => {
    activeChat.value = null
    messages.value = []
  }

  return {
    activeChat,
    messages,
    currentChatTyping,
    currentChatName,
    currentChatOnline,
    addMessage,
    setMessages,
    setTyping,
    selectChat,
    clearChat
  }
}