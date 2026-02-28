<template>
  <div class="status-indicator" :class="{ online }">
    <span class="dot"></span>
    <span v-if="text" class="text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  online: Boolean,
  text: String
})
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
}

.online .dot {
  background: #4CAF50;
  box-shadow: 0 0 0 2px #fff;
}

.text {
  font-size: 12px;
  color: inherit;
}
</style>