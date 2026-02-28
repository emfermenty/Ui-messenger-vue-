<template>
  <div class="message-input">
    <input 
      type="text" 
      v-model="message" 
      @keyup.enter="send"
      @input="$emit('typing')"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :disabled="disabled"
    >
    <button @click="send" :disabled="!canSend">
      <i class="fa fa-paper-plane"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  disabled: Boolean,
  placeholder: {
    type: String,
    default: 'Напишите сообщение...'
  },
  maxLength: {
    type: Number,
    default: 500
  }
})

const message = ref('')
const emit = defineEmits(['send', 'typing'])

const canSend = computed(() => 
  !props.disabled && message.value.trim()
)

const send = () => {
  if (canSend.value) {
    emit('send', message.value.trim())
    message.value = ''
  }
}
</script>

<style scoped>
.message-input {
  display: flex;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
}

.message-input input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border: none;
  background: #f8f9fa;
  border-radius: 24px;
  font-size: 16px;
  outline: none;
}

.message-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-input button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #ED2553;
  color: white;
  margin-left: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.message-input button:hover:not(:disabled) {
  background: #d01e48;
}

.message-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>