import { ref, onMounted, onUnmounted } from 'vue'

export function useInactivityTimer(limit = 30 * 60 * 1000, onInactive) {
  const timer = ref(null)

  const reset = () => {
    if (timer.value) clearTimeout(timer.value)
    timer.value = setTimeout(onInactive, limit)
  }

  const clear = () => {
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }
  }

  onMounted(() => {
    const events = ['mousemove', 'keypress', 'click', 'scroll']
    events.forEach(event => window.addEventListener(event, reset))
    reset()
  })

  onUnmounted(() => {
    const events = ['mousemove', 'keypress', 'click', 'scroll']
    events.forEach(event => window.removeEventListener(event, reset))
    clear()
  })

  return { reset, clear }
}