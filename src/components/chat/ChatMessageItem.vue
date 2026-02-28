<template>
  <div class="message" :class="classes">
    <div v-if="!isMine && message.type !== 'system'" class="message-sender">
      {{ message.senderName }}
    </div>
    <div class="message-text">{{ message.text }}</div>
    <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: Object,
  isMine: Boolean
})

const classes = computed(() => ({
  mine: props.isMine && props.message.type !== 'system',
  theirs: !props.isMine && props.message.type !== 'system',
  system: props.message.type === 'system'
}))

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.message {
  max-width: 80%;
  width: fit-content;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  word-wrap: break-word;
  animation: fadeIn 0.3s ease-out;
}

.message.mine {
  background: #ED2553;
  color: white;
  margin-left: auto;
  text-align: left;
}

.message.theirs {
  background: #f0f0f0;
  color: #333;
}

.message.system {
  background: #e0e0e0;
  color: #666;
  text-align: center;
  margin: 10px auto;
  font-style: italic;
  max-width: 60%;
}

.message-sender {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #555;
}

.timestamp {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>