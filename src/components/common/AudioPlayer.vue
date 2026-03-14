<template>
  <div class="audio-player" :class="{ 'voice-message': isVoice }">
    <button @click="togglePlay" class="play-btn" :disabled="!canPlay">
      <i v-if="!canPlay" class="fas fa-spinner fa-spin"></i>
      <i v-else :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
    </button>
    
    <div class="audio-info">
      <div class="audio-controls">
        <div class="progress-container" @click="seek">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercent + '%' }"
            ></div>
            <div 
              class="progress-handle" 
              :style="{ left: progressPercent + '%' }"
            ></div>
          </div>
        </div>
        
        <div class="time-info">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span class="duration">
            <span v-if="duration > 0 && isFinite(duration)">{{ formatTime(duration) }}</span>
            <span v-else-if="canPlay" class="loading-duration">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>0:00</span>
          </span>
        </div>
      </div>
      
      <div v-if="fileName && !isVoice" class="file-name">
        {{ fileName }}
      </div>
      
      <div v-if="isVoice" class="voice-label">
        <i class="fas fa-microphone"></i>
        <span>Голосовое сообщение</span>
      </div>
    </div>
    
    <div class="audio-actions">
      <button @click="downloadAudio" class="download-btn" title="Скачать">
        <i class="fas fa-download"></i>
      </button>
      
      <button 
        @click="toggleSpeed" 
        class="speed-btn" 
        title="Скорость воспроизведения"
      >
        {{ playbackRate }}x
      </button>
      
      <button 
        @click="toggleVolume" 
        class="volume-btn" 
        title="Громкость"
      >
        <i :class="volumeIcon"></i>
      </button>
    </div>

    <!-- Скрытый audio элемент -->
    <audio
      ref="audioElement"
      :src="audioUrl"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @canplay="onCanPlay"
      @error="onError"
      @durationchange="onLoadedMetadata"
      @loadeddata="onLoadedMetadata"
      @loadstart="onLoadStart"
      @progress="onProgress"
      @canplaythrough="onCanPlayThrough"
      preload="metadata"
      crossorigin="anonymous"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  audioUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: ''
  },
  isVoice: {
    type: Boolean,
    default: false
  }
})

const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const canPlay = ref(false)
const playbackRate = ref(1)
const volume = ref(1)
const isMuted = ref(false)

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'fas fa-volume-mute'
  if (volume.value < 0.5) return 'fas fa-volume-down'
  return 'fas fa-volume-up'
})

// Управление воспроизведением
const togglePlay = async () => {
  if (!audioElement.value || !canPlay.value) return

  // Дополнительная проверка длительности перед воспроизведением
  if (!duration.value && audioElement.value.duration && !isNaN(audioElement.value.duration)) {
    duration.value = audioElement.value.duration
    console.log('Duration получена при клике:', duration.value)
  }

  try {
    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      await audioElement.value.play()
    }
  } catch (error) {
    console.error('Ошибка воспроизведения:', error)
  }
}

// Перемотка
const seek = (event) => {
  if (!audioElement.value || !canPlay.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  const newTime = percent * duration.value

  audioElement.value.currentTime = newTime
  currentTime.value = newTime
}

// Изменение скорости воспроизведения
const toggleSpeed = () => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  const currentIndex = speeds.indexOf(playbackRate.value)
  const nextIndex = (currentIndex + 1) % speeds.length
  
  playbackRate.value = speeds[nextIndex]
  if (audioElement.value) {
    audioElement.value.playbackRate = playbackRate.value
  }
}

// Управление громкостью
const toggleVolume = () => {
  if (isMuted.value) {
    // Включаем звук
    isMuted.value = false
    if (audioElement.value) {
      audioElement.value.volume = volume.value
    }
  } else {
    // Выключаем звук
    isMuted.value = true
    if (audioElement.value) {
      audioElement.value.volume = 0
    }
  }
}

// Скачивание файла
const downloadAudio = () => {
  const link = document.createElement('a')
  link.href = props.audioUrl
  link.download = props.fileName || 'audio.webm'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Форматирование времени
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds === 0) {
    return '0:00'
  }
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Обработчики событий аудио
const onLoadedMetadata = () => {
  if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration)) {
    duration.value = audioElement.value.duration
    audioElement.value.volume = volume.value
    console.log('Аудио загружено, длительность:', duration.value)
  } else {
    console.log('Метаданные загружены, но длительность недоступна:', audioElement.value?.duration)
  }
}

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
    
    // Дополнительная проверка длительности при обновлении времени
    if ((!duration.value || !isFinite(duration.value)) && audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration)) {
      duration.value = audioElement.value.duration
      console.log('Duration получена при timeupdate:', duration.value)
    }
  }
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  if (audioElement.value) {
    audioElement.value.currentTime = 0
  }
}

const onCanPlay = () => {
  canPlay.value = true
  // Дополнительная проверка длительности
  if (audioElement.value && (!duration.value || !isFinite(duration.value))) {
    if (audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration)) {
      duration.value = audioElement.value.duration
      console.log('Duration получена при canplay:', duration.value)
    }
  }
}

const onError = (error) => {
  console.error('Ошибка загрузки аудио:', error)
  canPlay.value = false
}

const onLoadStart = () => {
  console.log('Начало загрузки аудио')
}

const onProgress = () => {
  if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration) && !duration.value) {
    duration.value = audioElement.value.duration
    console.log('Progress event, duration:', duration.value)
  }
}

const onCanPlayThrough = () => {
  console.log('Аудио полностью загружено')
  if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration) && !duration.value) {
    duration.value = audioElement.value.duration
    console.log('CanPlayThrough event, duration:', duration.value)
  }
}

// Слушаем события play/pause
onMounted(async () => {
  if (audioElement.value) {
    // Принудительно загружаем метаданные
    audioElement.value.load()
    
    audioElement.value.addEventListener('play', () => {
      isPlaying.value = true
    })
    
    audioElement.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
    
    // Дополнительные события для получения длительности
    audioElement.value.addEventListener('durationchange', () => {
      if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration)) {
        duration.value = audioElement.value.duration
        console.log('Duration changed:', duration.value)
      }
    })
    
    audioElement.value.addEventListener('loadeddata', () => {
      if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration)) {
        duration.value = audioElement.value.duration
        console.log('Loaded data, duration:', duration.value)
      }
    })
    
    audioElement.value.addEventListener('loadstart', () => {
      console.log('Начало загрузки аудио')
    })
    
    audioElement.value.addEventListener('progress', () => {
      if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration) && !duration.value) {
        duration.value = audioElement.value.duration
        console.log('Progress event, duration:', duration.value)
      }
    })
    
    // Более агрессивная проверка длительности для webm файлов
    const checkDuration = () => {
      if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration) && isFinite(audioElement.value.duration) && !duration.value) {
        duration.value = audioElement.value.duration
        console.log('Delayed duration check:', duration.value)
        return true
      }
      return false
    }
    
    // Проверяем чаще и дольше для голосовых сообщений
    const intervals = props.isVoice ? 
      [100, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000] : 
      [500, 1000, 2000]
    
    intervals.forEach(delay => {
      setTimeout(() => {
        if (!duration.value) {
          checkDuration()
        }
      }, delay)
    })
    
    // Принудительная загрузка метаданных для webm
    const forceLoadMetadata = async () => {
      try {
        // Метод 1: Попытка воспроизведения на очень низкой громкости
        const originalVolume = audioElement.value.volume
        audioElement.value.volume = 0.01
        audioElement.value.muted = true
        
        await audioElement.value.play()
        await new Promise(resolve => setTimeout(resolve, 100))
        audioElement.value.pause()
        audioElement.value.currentTime = 0
        
        audioElement.value.volume = originalVolume
        audioElement.value.muted = false
        
        if (audioElement.value.duration && !isNaN(audioElement.value.duration)) {
          duration.value = audioElement.value.duration
          console.log('Forced metadata load successful:', duration.value)
        }
      } catch (e) {
        console.log('Forced metadata load failed:', e)
      }
    }
    
    // Принудительная загрузка через 1 секунду если длительность не получена
    setTimeout(() => {
      if (!duration.value && props.isVoice) {
        forceLoadMetadata()
      }
    }, 1000)
    
    // Дополнительная попытка через seek
    setTimeout(() => {
      if (!duration.value) {
        try {
          audioElement.value.currentTime = 0.1
          setTimeout(() => {
            if (audioElement.value.duration && !isNaN(audioElement.value.duration)) {
              duration.value = audioElement.value.duration
              console.log('Seek method duration:', duration.value)
            }
            audioElement.value.currentTime = 0
          }, 200)
        } catch (e) {
          console.log('Seek method failed:', e)
        }
      }
    }, 2000)
  }
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
  }
})
</script>

<style scoped>
/* Стили перенесены в /src/assets/audio-player.css для лучшей специфичности */
</style>