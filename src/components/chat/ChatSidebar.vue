<template>
  <div 
    class="chat-sidebar" 
    :style="{ width: sidebarWidth + 'px' }"
    ref="sidebarRef"
  >
    <div class="sidebar-header">
      <h2>Сообщения</h2>
      <StatusIndicator :online="isConnected" :text="isConnected ? 'Online' : 'Offline'" />
    </div>
    
    <UserSearch @select-user="$emit('select-user', $event)" />

    <!-- Блок с индикатором загрузки, ошибкой или списком чатов -->
    <div v-if="isLoading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> Загрузка...
    </div>
    <div v-else-if="error" class="error-indicator">
      <i class="fas fa-exclamation-triangle"></i> {{ error }}
    </div>
    <div v-else class="chat-list">
      <ChatListItem
        v-for="chat in chats"
        :key="chat.id"
        :chat="chat"
        :active="activeChat?.id === chat.id"
        @select="$emit('select-chat', chat)"
      />
    </div>

    <div class="sidebar-footer">
      <CurrentUser :user="authStore" />
      <button @click="$emit('logout')" class="sidebar-logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        <span>Выйти</span>
      </button>
    </div>

    <!-- Полоса для изменения размера -->
    <div 
      class="resize-handle" 
      @mousedown="startResize"
      @dblclick="resetWidth"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import StatusIndicator from '@/components/common/StatusIndicator.vue'
import ChatListItem from './ChatListItem.vue'
import CurrentUser from './CurrentUser.vue'
import { useAuthStore } from '@/stores/auth'
import UserSearch from './UserSearch.vue'

const authStore = useAuthStore()

const props = defineProps({
  chats: Array,
  activeChat: Object,
  isConnected: Boolean,
  isLoading: Boolean,
  error: String
})

const emit = defineEmits(['select-chat', 'logout', 'resize', 'select-user'])

// Состояние для ширины
const sidebarRef = ref(null)
const sidebarWidth = ref(280)
const minWidth = 200
const maxWidth = 500
const isResizing = ref(false)

// Отслеживаем изменение ширины и отправляем событие
watch(sidebarWidth, (newWidth) => {
  emit('resize', newWidth)
})

// Функции для изменения размера
const startResize = (e) => {
  e.preventDefault()
  isResizing.value = true
  
  const startX = e.clientX
  const startWidth = sidebarWidth.value
  
  const onMouseMove = (e) => {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - startX
    let newWidth = startWidth + deltaX
    newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
    sidebarWidth.value = newWidth
  }
  
  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'default'
    
    localStorage.setItem('sidebar-width', sidebarWidth.value.toString())
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
}

// Сброс к начальной ширине
const resetWidth = () => {
  sidebarWidth.value = 280
  localStorage.setItem('sidebar-width', '280')
}

// Загрузка сохраненной ширины
onMounted(() => {
  const savedWidth = localStorage.getItem('sidebar-width')
  if (savedWidth) {
    sidebarWidth.value = parseInt(savedWidth)
  }
})

onUnmounted(() => {
  if (isResizing.value) {
    document.body.style.cursor = 'default'
  }
})

</script>

<style scoped>
.chat-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  transition: width 0.1s ease;
  user-select: none;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ED2553;
  color: white;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-header h2 {
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-indicator,
.error-indicator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
  gap: 8px;
}

.error-indicator {
  color: #f44336;
}

.error-indicator i {
  font-size: 18px;
}

.loading-indicator i {
  font-size: 18px;
  color: #ED2553;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  min-width: 0;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.sidebar-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-logout-btn:hover {
  background: #d32f2f;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 20;
}

.resize-handle:hover,
.resize-handle:active {
  background: rgba(237, 37, 83, 0.3);
}

.resize-handle:active {
  background: rgba(237, 37, 83, 0.5);
}

.chat-sidebar:hover .resize-handle {
  background: rgba(0, 0, 0, 0.1);
}

.chat-sidebar:hover .resize-handle:hover {
  background: rgba(237, 37, 83, 0.3);
}

@media (max-width: 768px) {
  .resize-handle {
    display: none;
  }
  
  .chat-sidebar {
    width: 100% !important;
    max-width: 320px;
  }
}
</style>