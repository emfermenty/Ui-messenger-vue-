<template>
  <div class="user-panel" :class="{ visible }">
    <div class="user-panel-header">
      <h3>Информация</h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="info-section">
      <h4>Пользователь</h4>
      <div class="info-item">
        <label>Логин:</label>
        <span>{{ user.login }}</span>
      </div>
      <div class="info-item">
        <label>User ID:</label>
        <span class="user-id">{{ user.userId }}</span>
      </div>
    </div>

    <div class="info-section">
      <h4>WebSocket</h4>
      <div class="info-item">
        <label>Статус:</label>
        <span :class="['connection-status', { connected }]">
          {{ connected ? 'Подключено' : 'Отключено' }}
        </span>
      </div>
    </div>
    
    <button @click="$emit('logout')" class="logout-btn">
      <i class="fas fa-sign-out-alt"></i> Выйти
    </button>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  user: Object,
  connected: Boolean
})

defineEmits(['close', 'logout'])
</script>

<style scoped>
.user-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 380px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.user-panel.visible {
  right: 0;
}

.user-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.info-section {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.info-section h4 {
  margin-bottom: 15px;
  color: #ED2553;
}

.info-item {
  margin-bottom: 12px;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 16px;
  color: #333;
}

.user-id {
  font-family: monospace;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.connection-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f44336;
  color: white;
  font-size: 14px;
}

.connection-status.connected {
  background: #4CAF50;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: #ED2553;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #d01e48;
}
</style>