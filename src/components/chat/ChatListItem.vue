<template>
  <div class="chat-item" :class="{ active }" @click="$emit('select')">
    <div class="avatar">
      <span>{{ chat.name.charAt(0) }}</span>
    </div>
    <div class="info">
      <div class="name">{{ chat.name }}</div>
      <div class="last-msg">{{ chat.lastMsg }}</div>
    </div>
    <div class="meta">
      <div class="time">{{ chat.time }}</div>
      <div v-if="!chat.online && chat.lastSeenAt" class="last-seen">
        {{ formatTimeAgoShort(chat.lastSeenAt) }}
      </div>
      <div v-else-if="chat.online" class="online-text">в сети</div>
    </div>
    <div class="status" :class="{ online: chat.online }"></div>
  </div>
</template>

<script setup>
import { useTimeAgo } from '@/composables/useTimeAgo'

defineProps({
  chat: Object,
  active: Boolean
})

defineEmits(['select'])

const { formatTimeAgoShort } = useTimeAgo()
</script>

<style scoped>
.chat-item {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.chat-item:hover {
  background: #f9f9f9;
}

.chat-item.active {
  background: #f0f7ff;
  border-left: 4px solid #ED2553;
}

.avatar {
  width: 40px;
  height: 40px;
  min-width: 40px; /* Фиксированная минимальная ширина */
  max-width: 40px; /* Фиксированная максимальная ширина */
  border-radius: 50%;
  background: #ED2553;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0; /* Запрещаем сжиматься */
  overflow: hidden; /* Скрываем выходящее за пределы */
  text-transform: uppercase; /* Заглавная буква */
}

.avatar span {
  display: block;
  line-height: 1;
  transform: translateY(-1px); /* Небольшая корректировка по вертикали */
}

.info {
  flex: 1;
  min-width: 0; /* Позволяет тексту ужиматься */
}

.name {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-msg {
  font-size: 14px;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.last-seen {
  font-size: 10px;
  color: #bbb;
  white-space: nowrap;
}

.online-text {
  font-size: 10px;
  color: #4CAF50;
  white-space: nowrap;
}

.status {
  width: 12px;
  height: 12px;
  min-width: 12px; /* Фиксированная ширина */
  border-radius: 50%;
  background: #aaa;
  flex-shrink: 0;
}

.status.online {
  background: #4CAF50;
  box-shadow: 0 0 0 2px #fff;
}
</style>