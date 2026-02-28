<template>
  <div class="chat-messages" ref="container">
    <ChatMessageItem
      v-for="(message, index) in messages"
      :key="index"
      :message="message"
      :isMine="message.senderId === currentUserId"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps({
  messages: Array,
  currentUserId: String
})

const container = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (container.value) {
      container.value.scrollTop = container.value.scrollHeight
    }
  })
}

watch(() => props.messages.length, scrollToBottom, { deep: true })
</script>

<style scoped>
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}
</style>