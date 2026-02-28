<template>
  <div class="chat-container">
    <ChatSidebar
      :chats="chats"
      :activeChat="activeChat"
      :isConnected="isConnected"
      :isLoading="isLoading"
      :error="error"
      @select-chat="handleSelectChat"
      @logout="logout"
      @resize="handleSidebarResize"
      @select-user="handleUserSelect"
    />

    <div 
      class="chat-main" 
      :style="{ 
        marginLeft: sidebarWidth + 'px',
        width: `calc(100% - ${sidebarWidth}px)`
      }"
    >
      <ChatHeader
        :name="currentChatName"
        :online="currentChatOnline"
        :typing="currentChatTyping"
        @open-settings="showUserPanel = true"
      />

      <ChatMessages
        :messages="messages"
        :currentUserId="authStore.userId"
      />

      <ChatInput
        :disabled="!activeChat || !isConnected"
        @send="sendMessage"
        @typing="handleTyping"
      />
    </div>

    <UserPanel
      :visible="showUserPanel"
      :user="authStore"
      :connected="isConnected"
      @close="showUserPanel = false"
      @logout="logout"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'
import { useChat } from '@/composables/useChat'
import { useInactivityTimer } from '@/composables/useInactivityTimer'

import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatMessages from '@/components/chat/ChatMessages.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import UserPanel from '@/components/chat/UserPanel.vue'

const router = useRouter()
const authStore = useAuthStore()

// Composables
const chatManager = useChat()
const { isConnected, connect, disconnect, send } = useWebSocket()

// Из chatManager
const activeChat = chatManager.activeChat
const messages = chatManager.messages
const currentChatTyping = chatManager.currentChatTyping
const currentChatName = chatManager.currentChatName
const currentChatOnline = chatManager.currentChatOnline
const addMessage = chatManager.addMessage
const setMessages = chatManager.setMessages
const setTyping = chatManager.setTyping
const selectChatMethod = chatManager.selectChat

// Локальное состояние
const showUserPanel = ref(false)
const sidebarWidth = ref(280)
const chats = ref([])
const isLoading = ref(true)
const error = ref(null)

// --- Загрузка списка чатов (POST /api/chat/chats с телом { userId }) ---
const fetchChats = async () => {
  if (!authStore.userId) {
    console.error('Нет userId для загрузки чатов')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    console.log('Загрузка чатов для userId:', authStore.userId)
    
    const response = await fetch('http://46.149.66.175/api/chat/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        userId: authStore.userId
      })
    })

    // Обработка статуса 204 - нет чатов
    if (response.status === 204) {
      console.log('Нет чатов (статус 204)')
      chats.value = [] // Пустой массив чатов
      return // Просто выходим, чатов нет
    }

    if (!response.ok) {
      throw new Error(`Ошибка загрузки чатов: ${response.status}`)
    }

    const data = await response.json()
    console.log('Получены чаты:', data)

    chats.value = data.map(chat => {
      // Определяем имя чата
      let chatName = chat.chat_name
      if (chat.type === 0 && !chatName) {
        const otherUser = chat.users.find(u => u.id !== authStore.userId)
        chatName = otherUser?.user_name || otherUser?.login || 'Пользователь'
      }

      // ID собеседника для отправки сообщений
      const otherUserId = chat.users.find(u => u.id !== authStore.userId)?.id || chat.users[0]?.id

      return {
        id: chat.id,
        name: chatName,
        lastMsg: 'Нет сообщений',
        time: '',
        online: false,
        userId: otherUserId,      // ID получателя (для отправки)
        type: chat.type,
        users: chat.users
      }
    })

    console.log('Преобразованные чаты:', chats.value)

    // Синхронизируем активный чат, если он временный
    if (activeChat.value && activeChat.value.id?.startsWith('temp-')) {
      const realChat = chats.value.find(c => c.userId === activeChat.value.userId)
      if (realChat) {
        selectChatMethod(realChat) // обновляем активный чат на реальный
      }
    }

  } catch (err) {
    console.error('Ошибка загрузки чатов:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// --- Загрузка истории сообщений ---
const fetchChatHistory = async (chatId) => {
  if (!chatId) return;

  try {
    setMessages([]);

    const response = await fetch(`http://46.149.66.175/api/messages/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки истории: ${response.status}`);
    }

    const data = await response.json();
    console.log('История сообщений:', data);

    const chatUsers = activeChat.value?.users || [];
    const userMap = new Map();
    chatUsers.forEach(u => {
      const name = u.user_name || u.login || 'Пользователь';
      userMap.set(u.id, name);
    });

    const currentUserId = authStore.userId;
    const currentUserName = authStore.login || 'Вы';

    const formattedMessages = data.messages.map(msg => {
      let senderName = userMap.get(msg.userId);
      if (!senderName) {
        senderName = msg.userId === currentUserId ? currentUserName : 'Собеседник';
      } else if (msg.userId === currentUserId) {
        senderName = currentUserName;
      }
      return {
        text: msg.text,
        senderId: msg.userId,
        senderName: senderName,
        timestamp: msg.sentAt,
        type: 'message'
      };
    });

    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setMessages(formattedMessages);
  } catch (err) {
    console.error('Ошибка загрузки истории сообщений:', err);
  }
};

// --- Обработка выбора пользователя из поиска ---
const handleUserSelect = (user) => {
  // Ищем существующий чат с этим пользователем
  const existingChat = chats.value.find(c => c.userId === user.id)
  if (existingChat) {
    handleSelectChat(existingChat)
    return
  }

  // Создаём временный чат
  const tempChat = {
    id: `temp-${user.id}`, // временный идентификатор
    name: user.user_name || user.login,
    userId: user.id,
    type: 0,
    lastMsg: '',
    time: '',
    online: false,
    users: [
      { id: authStore.userId, login: authStore.login, user_name: authStore.user_name },
      { id: user.id, login: user.login, user_name: user.user_name }
    ]
  }

  // Добавляем в начало списка
  chats.value = [tempChat, ...chats.value]
  // Выбираем его
  handleSelectChat(tempChat)
}

// --- Обработка выбора чата ---
const handleSelectChat = (chat) => {
  selectChatMethod(chat)
  fetchChatHistory(chat.id)
}

// --- Обработка изменения ширины сайдбара ---
const handleSidebarResize = (newWidth) => {
  sidebarWidth.value = newWidth
}

// --- Загрузка сохранённой ширины ---
onMounted(() => {
  const savedWidth = localStorage.getItem('sidebar-width')
  if (savedWidth) sidebarWidth.value = parseInt(savedWidth)
})

// --- Обработка входящих WebSocket сообщений ---
const handleWebSocketMessage = (data) => {
  console.log('Получено WebSocket сообщение:', data);

  if (data.chatId && data.senderId && data.text) {
    const isForActiveChat = activeChat.value?.id === data.chatId;

    if (isForActiveChat) {
      addMessage({
        text: data.text,
        senderId: data.senderId,
        senderName: data.senderName || 'Собеседник',
        timestamp: data.sentAt,
        type: 'message'
      });
    }

    updateChatLastMessage(data.chatId, data.text, data.sentAt);
  }
};

// --- Инициализация ---
onMounted(async () => {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  await fetchChats()
  connect(handleWebSocketMessage)
})

onUnmounted(() => {
  disconnect()
})

// --- Таймер неактивности ---
useInactivityTimer(30 * 60 * 1000, async () => {
  alert('Вы были автоматически выйти из-за неактивности')
  await authStore.logout()
})

// --- Отправка сообщения ---
const sendMessage = (text) => {
  if (!activeChat.value || !isConnected.value) return

  const messageData = {
    Type: 'send_private_message',
    Data: {
      RecipientId: activeChat.value.userId,
      Text: text
    }
  }

  console.log('Отправка сообщения:', messageData)

  if (send(messageData)) {
    addMessage({
      text: text,
      senderId: authStore.userId,
      senderName: authStore.login,
      timestamp: new Date().toISOString(),
      type: 'message'
    })

    updateChatLastMessage(activeChat.value.id, text, new Date().toISOString())

    // Если это временный чат, через 1.5 секунды обновляем список, чтобы получить настоящий ID
    if (activeChat.value.id?.startsWith('temp-')) {
      setTimeout(() => {
        fetchChats()
      }, 1500)
    }
  }
}

// --- Статус печатания ---
const handleTyping = () => {
  // Можно отправить событие typing, если нужно
}

// --- Вспомогательные функции ---
const updateChatLastMessage = (chatId, text, timestamp) => {
  const chat = chats.value.find(c => c.id === chatId)
  if (chat) {
    chat.lastMsg = text
    chat.time = formatTimeShort(timestamp)
  }
}

const formatTimeShort = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

// --- Выход ---
const logout = async () => {
  if (confirm('Вы уверены, что хотите выйти?')) {
    disconnect()
    await authStore.logout()
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.chat-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.94);
  transition: margin-left 0.1s ease, width 0.1s ease;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>