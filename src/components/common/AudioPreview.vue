<template>
  <div class="audio-preview" :class="{ 'voice-preview': isVoice }">
    <div class="preview-icon">
      <i :class="isVoice ? 'fas fa-microphone' : 'fas fa-music'"></i>
    </div>
    
    <div class="preview-info">
      <div class="file-name">{{ displayName }}</div>
      <div class="file-details">
        <span class="file-size">{{ formatFileSize(fileSize) }}</span>
        <span v-if="duration > 0" class="duration">• {{ formatDuration(duration) }}</span>
        <span v-else class="duration">• загрузка...</span>
      </div>
    </div>
    
    <button @click="togglePreview" class="preview-play-btn" v-if="audioUrl">
      <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
    </button>

    <!-- Скрытый audio для превью -->
    <audio
      ref="audioElement"
      :src="audioUrl"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @durationchange="onLoadedMetadata"
      @loadeddata="onLoadedMetadata"
      preload="auto"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  file: {
    type: File,
    required: true
  },
  isVoice: {
    type: Boolean,
    default: false
  }
})

const audioElement = ref(null)
const isPlaying = ref(false)
const duration = ref(0)
const audioUrl = ref('')

const displayName = computed(() => {
  if (props.isVoice) {
    return 'Голосовое сообщение'
  }
  return props.file.name
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePreview = async () => {
  if (!audioElement.value) return

  try {
    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      await audioElement.value.play()
    }
  } catch (error) {
    console.error('Ошибка воспроизведения превью:', error)
  }
}

const onLoadedMetadata = () => {
  if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration)) {
    duration.value = audioElement.value.duration
    console.log('Превью аудио загружено, длительность:', duration.value)
  }
}

const onEnded = () => {
  isPlaying.value = false
}

onMounted(() => {
  // Создаем URL для превью
  audioUrl.value = URL.createObjectURL(props.file)
  
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
        console.log('Превью: Duration changed:', duration.value)
      }
    })
    
    audioElement.value.addEventListener('loadeddata', () => {
      if (audioElement.value && audioElement.value.duration && !isNaN(audioElement.value.duration)) {
        duration.value = audioElement.value.duration
        console.log('Превью: Loaded data, duration:', duration.value)
      }
    })
    
    // Попытка получить длительность через небольшую задержку
    setTimeout(() => {
      if (audioElement.value && audioElement.value.duration && !duration.value && !isNaN(audioElement.value.duration)) {
        duration.value = audioElement.value.duration
        console.log('Превью: Delayed duration check:', duration.value)
      }
    }, 1000)
  }
})
</script>

<style scoped>
/* Стили перенесены в /src/assets/audio-preview.css для лучшей специфичности */
</style>