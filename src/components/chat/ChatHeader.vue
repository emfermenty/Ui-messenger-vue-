<template>
  <div class="chat-header">
    <div class="user-info">
      <StatusIndicator :online="online" />
      <span>{{ name }}</span>
      <span v-if="typing" class="typing-indicator">печатает...</span>
    </div>
    <button @click="$emit('open-settings')" class="settings-btn">
      <i class="fas fa-cog"></i>
    </button>
  </div>
</template>

<script setup>
import StatusIndicator from '@/components/common/StatusIndicator.vue'

defineProps({
  name: String,
  online: Boolean,
  typing: Boolean
})

defineEmits(['open-settings'])
</script>

<style scoped>
.chat-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.typing-indicator {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
  font-style: italic;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: #f0f0f0;
}
</style>