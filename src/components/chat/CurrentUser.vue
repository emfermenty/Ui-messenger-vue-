<template>
  <div class="current-user">
    <i class="fas fa-user-circle"></i>
    <div class="user-info-compact">
      <span class="user-login">{{ user.login }}</span>
      <span class="user-id-badge">ID: {{ user.userId || 'не указан' }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: Object
})
</script>

<style scoped>
.current-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.current-user i {
  font-size: 32px;
  color: #ED2553;
}

.user-info-compact {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-login {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id-badge {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  background: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 2px;
}
</style>