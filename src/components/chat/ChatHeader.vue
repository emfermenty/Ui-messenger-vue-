<template>
  <div class="chat-header">
    <div class="user-info">
      <StatusIndicator :online="online" />
      <div class="name-status">
        <span class="name">{{ name }}</span>
        <span v-if="typing" class="typing-indicator">печатает...</span>
        <span v-else-if="!online && lastSeenAt" class="last-seen">
          был в сети {{ formatTimeAgo(lastSeenAt) }}
        </span>
        <span v-else-if="online" class="online-status">в сети</span>
      </div>
    </div>
    <div class="header-actions">
      <button @click="$emit('toggle-sound')" class="sound-btn" :class="{ muted: !soundEnabled }">
        <i :class="soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
      </button>
      <button @click="$emit('open-settings')" class="settings-btn">
        <i class="fas fa-cog"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import StatusIndicator from '@/components/common/StatusIndicator.vue'
import { useTimeAgo } from '@/composables/useTimeAgo'

defineProps({
  name: String,
  online: Boolean,
  typing: Boolean,
  lastSeenAt: String,
  soundEnabled: Boolean
})

const { formatTimeAgo } = useTimeAgo()

defineEmits(['open-settings', 'toggle-sound'])
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

.name-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-weight: 600;
  color: #333;
}

.typing-indicator {
  font-size: 12px;
  color: #4CAF50;
  font-style: italic;
}

.last-seen {
  font-size: 12px;
  color: #999;
}

.online-status {
  font-size: 12px;
  color: #4CAF50;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sound-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sound-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.sound-btn.muted {
  color: #ff4444;
}

.sound-btn.muted:hover {
  background: #ffebee;
  color: #d32f2f;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: #f0f0f0;
}
</style>