<template>
  <div class="chat-messages" ref="container" @scroll="handleScroll">
    <!-- Индикатор загрузки старых сообщений -->
    <div v-if="isLoadingMore" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Загрузка сообщений...</span>
    </div>
    
    <template v-for="(group, groupIndex) in groupedMessages" :key="groupIndex">
      <!-- Разделитель с датой -->
      <div class="date-separator">
        <span class="date-text">{{ group.date }}</span>
      </div>
      
      <!-- Сообщения этой даты -->
      <ChatMessageItem
        v-for="(message, messageIndex) in group.messages"
        :key="`${groupIndex}-${messageIndex}`"
        :message="message"
        :isMine="message.senderId === currentUserId"
        @open-image="$emit('open-image', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps({
  messages: Array,
  currentUserId: String,
  hasMoreBefore: Boolean,
  isLoadingMore: Boolean
})

const emit = defineEmits(['open-image', 'load-more'])

const container = ref(null)
const isScrollingToBottom = ref(false)

// Обработка прокрутки для подгрузки старых сообщений
const handleScroll = () => {
  if (!container.value || props.isLoadingMore || !props.hasMoreBefore) return
  
  const { scrollTop } = container.value
  
  // Если прокрутили почти к верху (в пределах 100px), загружаем старые сообщения
  if (scrollTop <= 100) {
    emit('load-more')
  }
}

// Функция для форматирования даты
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Сравниваем только даты, без времени
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  
  if (messageDate.getTime() === todayDate.getTime()) {
    return 'Сегодня'
  } else if (messageDate.getTime() === yesterdayDate.getTime()) {
    return 'Вчера'
  } else {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Группировка сообщений по датам
const groupedMessages = computed(() => {
  if (!props.messages || props.messages.length === 0) {
    return []
  }

  const groups = []
  let currentGroup = null

  props.messages.forEach(message => {
    const messageDate = new Date(message.timestamp)
    const dateKey = messageDate.toDateString() // Используем строку даты как ключ
    
    if (!currentGroup || currentGroup.dateKey !== dateKey) {
      // Создаем новую группу
      currentGroup = {
        dateKey,
        date: formatDate(message.timestamp),
        messages: []
      }
      groups.push(currentGroup)
    }
    
    currentGroup.messages.push(message)
  })

  return groups
})

const scrollToBottom = () => {
  if (isScrollingToBottom.value) return
  
  nextTick(() => {
    if (container.value) {
      isScrollingToBottom.value = true
      container.value.scrollTop = container.value.scrollHeight
      setTimeout(() => {
        isScrollingToBottom.value = false
      }, 100)
    }
  })
}

watch(() => props.messages.length, (newLength, oldLength) => {
  // Прокручиваем вниз только при добавлении новых сообщений (не при подгрузке старых)
  if (newLength > oldLength && !props.isLoadingMore) {
    scrollToBottom()
  }
}, { deep: true })
</script>

<style scoped>
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  position: relative;
}

.date-separator::before {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin-right: 15px;
}

.date-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin-left: 15px;
}

.date-text {
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
}

.loading-indicator i {
  font-size: 16px;
}
</style>