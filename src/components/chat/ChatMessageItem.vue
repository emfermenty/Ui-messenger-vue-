<template>
  <div class="message" :class="classes">
    <div v-if="!isMine && message.type !== 'system'" class="message-sender">
      {{ message.senderName }}
    </div>
    
    <!-- Медиа контент -->
    <div v-if="message.media && message.media.length > 0" class="message-media">
      <div v-for="media in message.media" :key="media.id" class="media-item">
        <!-- Изображения -->
        <div v-if="media.type === 'image'" class="image-container">
          <img 
            :src="getMediaUrl(media.url)" 
            :alt="media.fileName"
            class="media-image"
            @click="openMediaViewer(media)"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div v-if="imageError" class="image-error" @click="downloadFile(media)">
            <i class="fas fa-image"></i>
            <span>{{ media.fileName }}</span>
            <small>Нажмите для скачивания</small>
          </div>
        </div>
        
        <!-- Видео -->
        <video 
          v-else-if="media.type === 'video'" 
          :src="getMediaUrl(media.url)" 
          controls
          class="media-video"
        />
        
        <!-- Аудио и голосовые сообщения -->
        <AudioPlayer
          v-else-if="media.type === 'audio' || isVoiceMessage(media)"
          :audioUrl="getMediaUrl(media.url)"
          :fileName="media.fileName"
          :isVoice="isVoiceMessage(media)"
        />
        
        <!-- Файлы -->
        <div v-else class="media-file" @click="downloadFile(media)">
          <div class="file-icon">
            <i :class="['fas', getFileIcon(media.contentType)]"></i>
          </div>
          <div class="file-info">
            <div class="file-name">{{ media.fileName }}</div>
            <div class="file-size">{{ formatFileSize(media.sizeBytes) }}</div>
          </div>
          <div class="download-icon">
            <i class="fas fa-download"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Текст сообщения -->
    <div v-if="message.text" class="message-text">{{ message.text }}</div>
    
    <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import AudioPlayer from '@/components/common/AudioPlayer.vue'

const props = defineProps({
  message: Object,
  isMine: Boolean
})

const emit = defineEmits(['open-image'])

const { getFileIcon, formatFileSize } = useMediaUpload()
const imageError = ref(false)

const classes = computed(() => ({
  mine: props.isMine && props.message.type !== 'system',
  theirs: !props.isMine && props.message.type !== 'system',
  system: props.message.type === 'system'
}))

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const getMediaUrl = (url) => {
  // Если URL уже полный, возвращаем как есть
  if (url.startsWith('http')) return url
  // Иначе добавляем базовый URL
  return `https://46.149.66.175${url}`
}

const openMediaViewer = (media) => {
  // Эмитим событие для открытия модального окна
  emit('open-image', {
    url: getMediaUrl(media.url),
    fileName: media.fileName
  })
}

const downloadFile = (media) => {
  // Скачиваем файл
  const link = document.createElement('a')
  link.href = getMediaUrl(media.url)
  link.download = media.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleImageError = (event) => {
  console.error('Ошибка загрузки изображения:', event.target.src)
  console.log('Медиа объект:', props.message.media)
  imageError.value = true
}

const handleImageLoad = () => {
  console.log('Изображение загружено успешно:', getMediaUrl(props.message.media?.[0]?.url))
  imageError.value = false
}

// Проверка, является ли файл голосовым сообщением
const isVoiceMessage = (media) => {
  return media.contentType?.includes('webm') || 
         media.fileName?.startsWith('voice_') ||
         (media.contentType?.includes('audio') && media.fileName?.includes('voice'))
}
</script>

<style scoped>
.message {
  max-width: 80%;
  width: fit-content;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  word-wrap: break-word;
  animation: fadeIn 0.3s ease-out;
}

.message.mine {
  background: #ED2553;
  color: white;
  margin-left: auto;
  text-align: left;
}

.message.theirs {
  background: #f0f0f0;
  color: #333;
}

.message.system {
  background: #e0e0e0;
  color: #666;
  text-align: center;
  margin: 10px auto;
  font-style: italic;
  max-width: 60%;
}

.message-sender {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #555;
}

.message-media {
  margin-bottom: 8px;
}

.media-item {
  margin-bottom: 8px;
}

.media-item:last-child {
  margin-bottom: 0;
}

.media-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.media-image:hover {
  opacity: 0.9;
}

.image-container {
  position: relative;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 150px;
}

.message.mine .image-error {
  background: rgba(255, 255, 255, 0.2);
}

.message.theirs .image-error {
  background: rgba(0, 0, 0, 0.05);
}

.image-error:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message.theirs .image-error:hover {
  background: rgba(0, 0, 0, 0.1);
}

.image-error i {
  font-size: 32px;
  opacity: 0.7;
}

.image-error span {
  font-weight: 600;
  text-align: center;
}

.image-error small {
  font-size: 11px;
  opacity: 0.8;
}

.media-video {
  max-width: 300px;
  border-radius: 8px;
}

.media-audio {
  width: 250px;
}

.voice-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  min-width: 200px;
}

.message.mine .voice-message {
  background: rgba(255, 255, 255, 0.2);
}

.message.theirs .voice-message {
  background: rgba(0, 0, 0, 0.05);
}

.voice-audio {
  width: 100%;
  height: 32px;
}

.voice-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.8;
}

.voice-info i {
  color: #4CAF50;
}

.media-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 200px;
}

.message.mine .media-file {
  background: rgba(255, 255, 255, 0.2);
}

.message.theirs .media-file {
  background: rgba(0, 0, 0, 0.05);
}

.media-file:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message.theirs .media-file:hover {
  background: rgba(0, 0, 0, 0.1);
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  flex-shrink: 0;
}

.message.theirs .file-icon {
  background: rgba(0, 0, 0, 0.1);
}

.file-icon i {
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 600;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  opacity: 0.8;
}

.download-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.message-text {
  margin-bottom: 4px;
}

.timestamp {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>