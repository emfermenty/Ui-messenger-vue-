import { ref } from 'vue'

export function useNotifications() {
  const soundEnabled = ref(true)
  const notificationSound = ref(null)

  // Инициализация звука
  const initSound = () => {
    try {
      notificationSound.value = new Audio('/notify/notify.mp3')
      notificationSound.value.preload = 'auto'
      notificationSound.value.volume = 0.5 // Умеренная громкость
    } catch (error) {
      console.error('Ошибка загрузки звука уведомления:', error)
    }
  }

  // Воспроизведение звука
  const playNotificationSound = async () => {
    if (!soundEnabled.value || !notificationSound.value) return

    try {
      // Сбрасываем время воспроизведения на начало
      notificationSound.value.currentTime = 0
      await notificationSound.value.play()
    } catch (error) {
      console.error('Ошибка воспроизведения звука:', error)
      // Если автовоспроизведение заблокировано, пытаемся позже
      if (error.name === 'NotAllowedError') {
        console.log('Автовоспроизведение заблокировано браузером')
      }
    }
  }

  // Показ браузерного уведомления
  const showBrowserNotification = (title, body, icon = null) => {
    if (!('Notification' in window)) {
      console.log('Браузер не поддерживает уведомления')
      return
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: icon || '/favicon.ico',
        tag: 'chat-message', // Заменяет предыдущие уведомления
        requireInteraction: false,
        silent: false
      })
    } else if (Notification.permission !== 'denied') {
      // Запрашиваем разрешение
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: icon || '/favicon.ico',
            tag: 'chat-message',
            requireInteraction: false,
            silent: false
          })
        }
      })
    }
  }

  // Запрос разрешений на уведомления
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Браузер не поддерживает уведомления')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Проверка, находится ли страница в фокусе
  const isPageVisible = () => {
    return !document.hidden
  }

  // Основная функция для отправки уведомления
  const sendNotification = (senderName, messageText, showBrowser = true) => {
    // Воспроизводим звук всегда (если включен)
    playNotificationSound()

    // Показываем браузерное уведомление только если страница не в фокусе
    if (showBrowser && !isPageVisible()) {
      const title = `Новое сообщение от ${senderName}`
      const body = messageText || 'Медиа-контент'
      showBrowserNotification(title, body)
    }
  }

  // Переключение звука
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    return soundEnabled.value
  }

  // Установка громкости
  const setVolume = (volume) => {
    if (notificationSound.value) {
      notificationSound.value.volume = Math.max(0, Math.min(1, volume))
    }
  }

  return {
    soundEnabled,
    initSound,
    playNotificationSound,
    showBrowserNotification,
    requestNotificationPermission,
    sendNotification,
    toggleSound,
    setVolume,
    isPageVisible
  }
}