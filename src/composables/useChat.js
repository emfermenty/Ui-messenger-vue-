import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useChat() {
  const authStore = useAuthStore()
  const activeChat = ref(null)
  const messages = ref([])
  const typingTimeout = ref(null)
  const currentChatTyping = ref(false)
  
  // Состояние пагинации
  const hasMoreBefore = ref(false)
  const isLoadingMore = ref(false)

  const currentChatName = computed(() => {
    return activeChat.value?.name || 'Выберите чат'
  })

  const currentChatOnline = computed(() => {
    return activeChat.value?.online || false
  })

  const currentChatLastSeen = computed(() => {
    if (!activeChat.value) return null
    const otherUser = activeChat.value.users?.find(u => u.id !== authStore.userId)
    return otherUser?.lastSeenAt || activeChat.value.lastSeenAt
  })

  const addMessage = (message) => {
    messages.value.push(message)
  }

  const setMessages = (newMessages) => {
    messages.value = newMessages
  }

  const prependMessages = (oldMessages) => {
    messages.value = [...oldMessages, ...messages.value]
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
    // Сбрасываем состояние пагинации при выборе нового чата
    hasMoreBefore.value = false
    isLoadingMore.value = false
  }

  const clearChat = () => {
    activeChat.value = null
    messages.value = []
    hasMoreBefore.value = false
    isLoadingMore.value = false
  }

  const setHasMoreBefore = (value) => {
    hasMoreBefore.value = value
  }

  const setIsLoadingMore = (value) => {
    isLoadingMore.value = value
  }

  return {
    activeChat,
    messages,
    currentChatTyping,
    currentChatName,
    currentChatOnline,
    currentChatLastSeen,
    hasMoreBefore,
    isLoadingMore,
    addMessage,
    setMessages,
    prependMessages,
    setTyping,
    selectChat,
    clearChat,
    setHasMoreBefore,
    setIsLoadingMore
  }
}