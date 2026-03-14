import { ref, onMounted, onUnmounted } from 'vue'

export function useTimeAgo() {
  const now = ref(new Date())
  let interval = null

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const diffMs = now.value - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) return 'только что'
    if (diffMinutes < 60) return `${diffMinutes} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`
    
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.value.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatTimeAgoShort = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const diffMs = now.value - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) return 'только что'
    if (diffMinutes < 60) return `${diffMinutes}м`
    if (diffHours < 24) return `${diffHours}ч`
    if (diffDays < 7) return `${diffDays}д`
    
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit'
    })
  }

  const startTimer = () => {
    if (interval) return
    
    // Обновляем каждые 30 секунд
    interval = setInterval(() => {
      now.value = new Date()
    }, 30000)
  }

  const stopTimer = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    formatTimeAgo,
    formatTimeAgoShort,
    startTimer,
    stopTimer
  }
}