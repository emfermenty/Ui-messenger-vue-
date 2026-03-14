import { ref } from 'vue'

export function useVoiceRecording() {
  const isRecording = ref(false)
  const recordingTime = ref(0)
  const mediaRecorder = ref(null)
  const audioStream = ref(null)
  const recordedChunks = ref([])
  const recordingTimer = ref(null)

  // Проверка поддержки браузером
  const isSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }

  // Запуск записи
  const startRecording = async () => {
    if (!isSupported()) {
      throw new Error('Ваш браузер не поддерживает запись аудио')
    }

    try {
      // Запрашиваем доступ к микрофону
      audioStream.value = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      // Создаем MediaRecorder
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      }
      
      // Проверяем поддержку формата
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4'
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = '' // Используем формат по умолчанию
          }
        }
      }

      mediaRecorder.value = new MediaRecorder(audioStream.value, options)
      recordedChunks.value = []

      // Обработчики событий
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        // Запись остановлена
      }

      // Начинаем запись
      mediaRecorder.value.start(100) // Собираем данные каждые 100мс
      isRecording.value = true
      recordingTime.value = 0

      // Запускаем таймер
      recordingTimer.value = setInterval(() => {
        recordingTime.value++
      }, 1000)

    } catch (error) {
      console.error('Ошибка при запуске записи:', error)
      throw new Error('Не удалось получить доступ к микрофону')
    }
  }

  // Остановка записи
  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorder.value || !isRecording.value) {
        resolve(null)
        return
      }

      mediaRecorder.value.onstop = () => {
        // Создаем файл из записанных данных
        const blob = new Blob(recordedChunks.value, { 
          type: mediaRecorder.value.mimeType || 'audio/webm' 
        })
        
        // Создаем File объект
        const file = new File([blob], `voice_${Date.now()}.webm`, {
          type: blob.type
        })

        // Очищаем ресурсы
        cleanup()
        
        resolve(file)
      }

      mediaRecorder.value.stop()
    })
  }

  // Отмена записи
  const cancelRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
    }
    cleanup()
    return null
  }

  // Очистка ресурсов
  const cleanup = () => {
    isRecording.value = false
    recordingTime.value = 0
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => track.stop())
      audioStream.value = null
    }

    mediaRecorder.value = null
    recordedChunks.value = []
  }

  // Форматирование времени записи
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    isRecording,
    recordingTime,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    formatRecordingTime
  }
}