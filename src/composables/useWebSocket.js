import { ref } from 'vue'
import { useAuthStore } from '@/stores/Auth'

export function useWebSocket() {
  const authStore = useAuthStore()
  const ws = ref(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = (onMessage) => {
    if (!authStore.userId) {
      console.error('Нет userId для подключения к WebSocket')
      return
    }

    if (ws.value) {
      ws.value.close()
    }

    const wsUrl = `ws://wet-olives-judge.loca.lt/ws?userId=${encodeURIComponent(authStore.userId)}`
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      console.log('WebSocket подключен')
      isConnected.value = true
      reconnectAttempts.value = 0
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error)
      }
    }

    ws.value.onclose = () => {
      isConnected.value = false
      if (reconnectAttempts.value < maxReconnectAttempts) {
        reconnectAttempts.value++
        setTimeout(() => connect(onMessage), 3000)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket ошибка:', error)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
    }
  }

  const send = (data) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
      return true
    }
    return false
  }

  return {
    ws,
    isConnected,
    connect,
    disconnect,
    send
  }
}