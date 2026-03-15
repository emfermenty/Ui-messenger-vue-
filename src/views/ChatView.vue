<template>
  <div class="chat-container" :class="{ 'mobile': isMobile, 'chat-open': isMobile && activeChat }">
    <!-- Мобильная навигация -->
    <div v-if="isMobile && activeChat" class="mobile-header">
      <button @click="closeMobileChat" class="back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="mobile-chat-info">
        <h3>{{ currentChatName }}</h3>
        <span v-if="currentChatOnline" class="online-status">в сети</span>
        <span v-else-if="currentChatLastSeen" class="last-seen">{{ formatLastSeen(currentChatLastSeen) }}</span>
      </div>
      <button @click="showUserPanel = true" class="settings-btn">
        <i class="fas fa-cog"></i>
      </button>
    </div>

    <ChatSidebar
      v-show="!isMobile || !activeChat"
      :chats="chats"
      :activeChat="activeChat"
      :isConnected="isConnected"
      :isLoading="isLoading"
      :error="error"
      @select-chat="handleSelectChat"
      @logout="logout"
      @resize="handleSidebarResize"
      @select-user="handleUserSelect"
      :class="{ 'mobile-sidebar': isMobile }"
    />

    <div 
      v-show="!isMobile || activeChat"
      class="chat-main" 
      :style="!isMobile ? { 
        marginLeft: sidebarWidth + 'px',
        width: `calc(100% - ${sidebarWidth}px)`
      } : {}"
    >
      <ChatHeader
        v-if="!isMobile"
        :name="currentChatName"
        :online="currentChatOnline"
        :typing="currentChatTyping"
        :lastSeenAt="currentChatLastSeen"
        :soundEnabled="soundEnabled"
        @open-settings="showUserPanel = true"
        @toggle-sound="handleToggleSound"
      />

      <div v-if="!activeChat && !isMobile" class="no-chat-selected">
        <i class="fas fa-comments"></i>
        <h3>Выберите чат</h3>
        <p>Выберите чат из списка слева или найдите пользователя для начала общения</p>
      </div>

      <template v-else-if="activeChat">
        <ChatMessages
          :messages="messages"
          :currentUserId="authStore.userId"
          :hasMoreBefore="hasMoreBefore"
          :isLoadingMore="isLoadingMore"
          @open-image="handleOpenImage"
          @load-more="loadMoreMessages"
        />

        <ChatInput
          :disabled="!activeChat || !isConnected"
          @send="sendMessage"
          @typing="handleTyping"
        />
      </template>
    </div>

    <UserPanel
      :visible="showUserPanel"
      :user="authStore"
      :connected="isConnected"
      @close="showUserPanel = false"
      @logout="logout"
    />

    <!-- Модальное окно для просмотра изображений -->
    <ImageViewer
      :visible="imageViewer.visible"
      :imageUrl="imageViewer.url"
      :fileName="imageViewer.fileName"
      @close="handleCloseImage"
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
import { useNotifications } from '@/composables/useNotifications'

import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatMessages from '@/components/chat/ChatMessages.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import UserPanel from '@/components/chat/UserPanel.vue'
import ImageViewer from '@/components/common/ImageViewer.vue'

const router = useRouter()
const authStore = useAuthStore()

// Composables
const chatManager = useChat()
const { isConnected, connect, disconnect, send } = useWebSocket()
const { 
  initSound, 
  sendNotification, 
  requestNotificationPermission,
  soundEnabled,
  toggleSound,
  playNotificationSound
} = useNotifications()

// Из chatManager
const activeChat = chatManager.activeChat
const messages = chatManager.messages
const currentChatTyping = chatManager.currentChatTyping
const currentChatName = chatManager.currentChatName
const currentChatOnline = chatManager.currentChatOnline
const currentChatLastSeen = chatManager.currentChatLastSeen
const hasMoreBefore = chatManager.hasMoreBefore
const isLoadingMore = chatManager.isLoadingMore
const addMessage = chatManager.addMessage
const setMessages = chatManager.setMessages
const prependMessages = chatManager.prependMessages
const setTyping = chatManager.setTyping
const selectChatMethod = chatManager.selectChat
const setHasMoreBefore = chatManager.setHasMoreBefore
const setIsLoadingMore = chatManager.setIsLoadingMore

// Локальное состояние
const showUserPanel = ref(false)
const sidebarWidth = ref(280)
const chats = ref([])
const isLoading = ref(true)
const error = ref(null)

// Мобильная адаптация
const isMobile = ref(false)

// Проверка размера экрана
const checkMobile = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768
  console.log('checkMobile:', { 
    windowWidth: window.innerWidth, 
    isMobile: isMobile.value, 
    wasMobile,
    activeChat: !!activeChat.value 
  })
}

// Закрытие чата на мобильном
const closeMobileChat = () => {
  selectChatMethod(null)
}

// Форматирование времени последнего посещения
const formatLastSeen = (lastSeenAt) => {
  if (!lastSeenAt) return ''
  const date = new Date(lastSeenAt)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} ч назад`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} д назад`
  
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

// Модальное окно для просмотра изображений
const imageViewer = ref({
  visible: false,
  url: '',
  fileName: ''
})

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
    
    const response = await fetch('https://46.149.66.175/api/chat/chats', {
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
      const otherUser = chat.users.find(u => u.id !== authStore.userId)
      
      if (chat.type === 0 && !chatName) {
        chatName = otherUser?.user_name || otherUser?.login || 'Пользователь'
      }

      // ID собеседника для отправки сообщений
      const otherUserId = otherUser?.id || chat.users[0]?.id

      return {
        id: chat.id,
        name: chatName,
        lastMsg: 'Нет сообщений',
        time: '',
        online: otherUser?.isOnline || false,
        lastSeenAt: otherUser?.lastSeenAt,
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

    const response = await fetch(`https://46.149.66.175/api/messages/${chatId}`, {
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
      
      // Отладка медиа
      if (msg.mediaAttachments && msg.mediaAttachments.length > 0) {
        console.log('Сообщение с медиа:', msg);
        console.log('MediaAttachments:', msg.mediaAttachments);
      }
      
      return {
        id: msg.id,
        text: msg.text,
        senderId: msg.userId,
        senderName: senderName,
        timestamp: msg.sentAt,
        type: 'message',
        media: msg.mediaAttachments || []
      };
    });

    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setMessages(formattedMessages);
    
    // Сохраняем информацию о пагинации
    setHasMoreBefore(data.hasMoreBefore || false);
    setIsLoadingMore(false);
  } catch (err) {
    console.error('Ошибка загрузки истории сообщений:', err);
    setIsLoadingMore(false);
  }
};

// --- Загрузка старых сообщений (пагинация) ---
const loadMoreMessages = async () => {
  if (!activeChat.value?.id || chatManager.isLoadingMore.value || !chatManager.hasMoreBefore.value) {
    return;
  }

  const currentMessages = messages.value;
  if (currentMessages.length === 0) return;

  // ID самого старого сообщения для пагинации
  const oldestMessageId = currentMessages[0]?.id;
  if (!oldestMessageId) return;

  try {
    chatManager.setIsLoadingMore(true);

    const response = await fetch(`https://46.149.66.175/api/messages/${activeChat.value.id}/before/${oldestMessageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки старых сообщений: ${response.status}`);
    }

    const data = await response.json();
    console.log('Старые сообщения:', data);

    const chatUsers = activeChat.value?.users || [];
    const userMap = new Map();
    chatUsers.forEach(u => {
      const name = u.user_name || u.login || 'Пользователь';
      userMap.set(u.id, name);
    });

    const currentUserId = authStore.userId;
    const currentUserName = authStore.login || 'Вы';

    const formattedOldMessages = data.messages.map(msg => {
      let senderName = userMap.get(msg.userId);
      if (!senderName) {
        senderName = msg.userId === currentUserId ? currentUserName : 'Собеседник';
      } else if (msg.userId === currentUserId) {
        senderName = currentUserName;
      }
      
      return {
        id: msg.id,
        text: msg.text,
        senderId: msg.userId,
        senderName: senderName,
        timestamp: msg.sentAt,
        type: 'message',
        media: msg.mediaAttachments || []
      };
    });

    // Сортируем старые сообщения по времени
    formattedOldMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Добавляем старые сообщения в начало списка
    chatManager.prependMessages(formattedOldMessages);
    
    // Обновляем информацию о пагинации
    chatManager.setHasMoreBefore(data.hasMoreBefore || false);
  } catch (err) {
    console.error('Ошибка загрузки старых сообщений:', err);
  } finally {
    setIsLoadingMore(false);
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
    online: user.isOnline || false,
    lastSeenAt: user.lastSeenAt,
    users: [
      { id: authStore.userId, login: authStore.login, user_name: authStore.user_name },
      { id: user.id, login: user.login, user_name: user.user_name, isOnline: user.isOnline, lastSeenAt: user.lastSeenAt }
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
  
  // На мобильном автоматически скрываем сайдбар при выборе чата
  if (isMobile.value) {
    // Чат откроется автоматически благодаря v-show="!isMobile || activeChat"
  }
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

  // Обработка статуса онлайн
  if (data.type === 'user_online') {
    updateUserOnlineStatus(data.userId, true);
    return;
  }

  // Обработка статуса оффлайн
  if (data.type === 'user_offline') {
    updateUserOnlineStatus(data.userId, false, data.lastSeenAt);
    return;
  }

  // Обработка обычных сообщений (только от других пользователей)
  if (data.chatId && data.senderId && data.senderId !== authStore.userId && (data.text || data.mediaAttachments)) {
    const isForActiveChat = activeChat.value?.id === data.chatId;
    const senderName = data.senderName || 'Собеседник'
    const messageText = data.text || 'Отправил медиа-контент'

    if (isForActiveChat) {
      console.log('Получено сообщение от другого пользователя:', data);
      
      const newMessage = {
        id: data.id,
        text: data.text,
        senderId: data.senderId,
        senderName: senderName,
        timestamp: data.sentAt,
        type: 'message',
        media: data.mediaAttachments || []
      }
      
      addMessage(newMessage);
      
      // Отправляем уведомление для активного чата (только звук, без браузерного уведомления)
      sendNotification(senderName, messageText, false);
    } else {
      // Для неактивных чатов отправляем полное уведомление (звук + браузерное)
      sendNotification(senderName, messageText, true);
    }

    // Определяем текст для отображения в списке чатов
    let displayText = data.text
    if (!displayText && data.mediaAttachments?.length > 0) {
      const hasVoice = data.mediaAttachments.some(media => 
        media.contentType?.includes('webm') || 
        media.fileName?.startsWith('voice_')
      )
      displayText = hasVoice ? '🎤 Голосовое сообщение' : '📎 Медиа'
    }

    updateChatLastMessage(data.chatId, displayText, data.sentAt);
  }
};

// --- Обновление онлайн статуса пользователя ---
const updateUserOnlineStatus = (userId, isOnline, lastSeenAt = null) => {
  console.log(`Обновление статуса пользователя ${userId}: ${isOnline ? 'онлайн' : 'оффлайн'}`);
  
  // Обновляем статус во всех чатах, где есть этот пользователь
  chats.value.forEach(chat => {
    const user = chat.users?.find(u => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      if (lastSeenAt) {
        user.lastSeenAt = lastSeenAt;
      }
      
      // Если это личный чат с этим пользователем, обновляем статус чата
      if (chat.type === 0 && chat.userId === userId) {
        chat.online = isOnline;
        chat.lastSeenAt = lastSeenAt;
      }
    }
  });

  // Обновляем активный чат, если это нужный пользователь
  if (activeChat.value?.userId === userId) {
    const updatedChat = chats.value.find(c => c.id === activeChat.value.id);
    if (updatedChat) {
      selectChatMethod(updatedChat);
    }
  }
};

// --- Инициализация ---
onMounted(async () => {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  // Проверяем мобильное устройство
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Инициализируем звук и запрашиваем разрешения
  initSound()
  await requestNotificationPermission()
  
  await fetchChats()
  connect(handleWebSocketMessage)
})

onUnmounted(() => {
  disconnect()
  window.removeEventListener('resize', checkMobile)
})

// --- Таймер неактивности ---
useInactivityTimer(30 * 60 * 1000, async () => {
  alert('Вы были автоматически выйти из-за неактивности')
  await authStore.logout()
})

// --- Отправка сообщения ---
const sendMessage = (messageData) => {
  if (!activeChat.value || !isConnected.value) return

  const wsMessage = {
    Type: 'send_private_message',
    Data: {
      RecipientId: activeChat.value.userId,
      Text: messageData.text,
      MediaIds: messageData.mediaIds
    }
  }

  console.log('Отправка сообщения:', wsMessage)

  if (send(wsMessage)) {
    // Добавляем сообщение в локальный чат с реальными медиа-данными
    const localMessage = {
      id: `local-${Date.now()}-${Math.random()}`,
      text: messageData.text,
      senderId: authStore.userId,
      senderName: authStore.login,
      timestamp: new Date().toISOString(),
      type: 'message',
      media: messageData.uploadedFiles || []
    }

    console.log('Добавляем локальное сообщение с медиа:', localMessage)
    addMessage(localMessage)

    // Обновляем последнее сообщение в списке чатов
    let displayText = messageData.text
    if (!displayText && messageData.mediaIds?.length > 0) {
      // Проверяем, есть ли голосовые сообщения среди загруженных файлов
      const hasVoice = messageData.uploadedFiles?.some(file => 
        file.contentType?.includes('webm') || 
        file.fileName?.startsWith('voice_')
      )
      displayText = hasVoice ? '🎤 Голосовое сообщение' : '📎 Медиа'
    }
    updateChatLastMessage(activeChat.value.id, displayText, new Date().toISOString())

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

// --- Модальное окно для изображений ---
const handleOpenImage = (imageData) => {
  imageViewer.value = {
    visible: true,
    url: imageData.url,
    fileName: imageData.fileName
  }
}

const handleCloseImage = () => {
  imageViewer.value.visible = false
}

// --- Управление звуком ---
const handleToggleSound = () => {
  const newState = toggleSound()
  
  // Если звук включили, проигрываем тестовый звук
  if (newState) {
    setTimeout(() => {
      playNotificationSound()
    }, 100)
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

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  text-align: center;
  gap: 16px;
}

.no-chat-selected i {
  font-size: 64px;
  color: #ddd;
}

.no-chat-selected h3 {
  font-size: 24px;
  margin: 0;
  color: #666;
}

.no-chat-selected p {
  font-size: 16px;
  line-height: 1.5;
  max-width: 400px;
  margin: 0;
}

/* Мобильные стили */
@media (max-width: 768px) {
  .chat-container.mobile {
    flex-direction: column;
  }
  
  .mobile-sidebar {
    position: fixed !important;
    width: 100% !important;
    max-width: none !important;
    z-index: 1000;
  }
  
  .chat-container.mobile.chat-open .mobile-sidebar {
    display: none;
  }
  
  .chat-container.mobile .chat-main {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin-left: 0 !important;
    width: 100% !important;
    height: 100vh !important;
    display: flex;
    flex-direction: column;
  }
  
/* Мобильный хедер - базовые стили */
.mobile-header {
  display: none;
  align-items: center;
  padding: 12px 16px;
  background: #ED2553;
  color: white;
  gap: 12px;
  min-height: 60px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mobile-chat-info {
  flex: 1;
  min-width: 0;
}

.mobile-chat-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.online-status {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 500;
}

.last-seen {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.settings-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
  
  /* Показываем мобильный хедер */
  .chat-container.mobile .mobile-header {
    display: flex !important;
  }
  
  /* Скрываем десктопный хедер на мобильном */
  .chat-container.mobile .chat-main > .chat-header {
    display: none;
  }
  
  /* Обеспечиваем правильную структуру чата на мобильном */
  .chat-container.mobile .chat-main .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 80px; /* Добавляем отступ снизу для поля ввода */
  }
  
  .chat-container.mobile .chat-main .message-input-container {
    flex-shrink: 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
  }
}

/* Десктопные стили */
@media (min-width: 769px) {
  .mobile-header {
    display: none;
  }
  
  .no-chat-selected {
    display: flex;
  }
  
  .chat-main {
    position: absolute !important;
    right: 0;
    top: 0;
    bottom: 0;
  }
}
</style>