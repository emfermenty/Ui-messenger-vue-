<template>
  <div 
    class="message-input-container" 
    :class="{ 'drag-over': isDragging }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Drag & Drop overlay -->
    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>Отпустите файлы для загрузки</span>
      </div>
    </div>

    <!-- Превью загруженных файлов -->
    <div v-if="selectedFiles.length > 0" class="media-preview">
      <div v-for="(file, index) in selectedFiles" :key="index" class="media-item">
        <div class="media-content">
          <img v-if="isImageFile(file.file)" :src="file.preview" alt="Preview" class="image-preview" />
          <AudioPreview 
            v-else-if="isAudioFile(file.file)" 
            :file="file.file" 
            :isVoice="file.file.name?.startsWith('voice_')"
          />
          <div v-else class="file-preview">
            <i :class="['fas', getVoiceIcon(file.file)]"></i>
            <span class="file-name">{{ getFileName(file.file) }}</span>
            <span class="file-size">{{ formatFileSize(file.file.size) }}</span>
          </div>
        </div>
        <button @click="removeFile(index)" class="remove-file">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <span>Загрузка файлов...</span>
    </div>

    <div class="message-input">
      <button @click="openFileDialog" class="attach-btn" :disabled="disabled || uploading || isRecording">
        <i class="fas fa-paperclip"></i>
      </button>
      
      <input 
        type="text" 
        v-model="message" 
        @keyup.enter="send"
        @input="$emit('typing')"
        @paste="handlePaste"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :disabled="disabled || uploading || isRecording"
      >
      
      <!-- Кнопка записи голосового сообщения -->
      <button 
        v-if="!isRecording && canRecord" 
        @click="handleStartRecording" 
        class="voice-btn"
        :disabled="!canRecord"
        title="Записать голосовое сообщение"
      >
        <i class="fas fa-microphone"></i>
      </button>
      
      <!-- Кнопки во время записи -->
      <template v-if="isRecording">
        <button @click="handleCancelRecording" class="cancel-btn">
          <i class="fas fa-times"></i>
        </button>
        <div class="recording-info">
          <i class="fas fa-microphone recording-icon"></i>
          <span>{{ formatRecordingTime(recordingTime) }}</span>
        </div>
        <button @click="handleStopRecording" class="stop-btn">
          <i class="fas fa-stop"></i>
        </button>
      </template>
      
      <!-- Кнопка отправки -->
      <button 
        v-if="!isRecording" 
        @click="send" 
        :disabled="!canSend" 
        class="send-btn"
      >
        <i class="fa fa-paper-plane"></i>
      </button>
    </div>

    <!-- Скрытый input для файлов -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      @change="handleFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useVoiceRecording } from '@/composables/useVoiceRecording'
import AudioPreview from '@/components/common/AudioPreview.vue'

const props = defineProps({
  disabled: Boolean,
  placeholder: {
    type: String,
    default: 'Напишите сообщение или нажмите Ctrl+V для вставки файла...'
  },
  maxLength: {
    type: Number,
    default: 500
  }
})

const message = ref('')
const selectedFiles = ref([])
const fileInput = ref(null)
const emit = defineEmits(['send', 'typing'])

const { 
  uploading, 
  uploadProgress, 
  uploadFiles, 
  isImageFile, 
  isAudioFile,
  getFileIcon, 
  formatFileSize 
} = useMediaUpload()

const {
  isRecording,
  recordingTime,
  isSupported: isVoiceSupported,
  startRecording,
  stopRecording,
  cancelRecording,
  formatRecordingTime
} = useVoiceRecording()

const canSend = computed(() => 
  !props.disabled && !uploading.value && (message.value.trim() || selectedFiles.value.length > 0)
)

const canRecord = computed(() => {
  const conditions = {
    notDisabled: !props.disabled,
    notUploading: !uploading.value,
    voiceSupported: isVoiceSupported(),
    noFiles: !selectedFiles.value.length,
    noText: !message.value.trim()
  }
  
  console.log('canRecord conditions:', conditions)
  console.log('isVoiceSupported result:', isVoiceSupported())
  console.log('MediaRecorder available:', !!window.MediaRecorder)
  console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
  console.log('HTTPS:', location.protocol === 'https:')
  
  return conditions.notDisabled && conditions.notUploading && conditions.voiceSupported && conditions.noFiles && conditions.noText
})

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFilesToQueue(files)
  
  // Очищаем input
  event.target.value = ''
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const send = async () => {
  if (!canSend.value) return

  try {
    let uploadedFiles = []
    
    // Загружаем файлы, если есть
    if (selectedFiles.value.length > 0) {
      const files = selectedFiles.value.map(f => f.file)
      uploadedFiles = await uploadFiles(files)
    }

    // Отправляем сообщение
    emit('send', {
      text: message.value.trim() || null,
      mediaIds: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.id) : null,
      uploadedFiles: uploadedFiles // Передаем загруженные файлы для немедленного отображения
    })

    // Очищаем форму
    message.value = ''
    selectedFiles.value = []
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error)
    alert('Ошибка отправки сообщения')
  }
}

// Drag & Drop
const isDragging = ref(false)

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  if (files.length === 0) return
  
  addFilesToQueue(files)
}

// Ctrl+V для вставки из буфера обмена
const handlePaste = (event) => {
  const items = event.clipboardData?.items
  if (!items) return

  const files = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // Проверяем, является ли элемент файлом
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }
  
  if (files.length > 0) {
    event.preventDefault()
    addFilesToQueue(files)
  }
}

// Общая функция для добавления файлов в очередь
const addFilesToQueue = (files) => {
  files.forEach(file => {
    const fileData = { file, preview: null }
    
    // Создаем превью для изображений
    if (isImageFile(file)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileData.preview = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    selectedFiles.value.push(fileData)
  })
}

// Голосовые сообщения
const handleStartRecording = async () => {
  try {
    await startRecording()
  } catch (error) {
    alert(error.message)
  }
}

const handleStopRecording = async () => {
  try {
    const voiceFile = await stopRecording()
    if (voiceFile) {
      // Добавляем голосовое сообщение как файл
      addFilesToQueue([voiceFile])
    }
  } catch (error) {
    console.error('Ошибка при остановке записи:', error)
    alert('Ошибка при сохранении записи')
  }
}

const handleCancelRecording = () => {
  cancelRecording()
}

// Показ ошибки для неподдерживаемых браузеров
const showVoiceError = () => {
  let errorMessage = 'Голосовые сообщения недоступны.\n\n'
  
  if (!window.MediaRecorder) {
    errorMessage += 'Ваш браузер не поддерживает запись аудио.'
  } else if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    errorMessage += 'Нет доступа к микрофону.'
  } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    errorMessage += 'Для записи голосовых сообщений требуется HTTPS соединение.'
  } else {
    errorMessage += 'Проверьте разрешения браузера на доступ к микрофону.'
  }
  
  alert(errorMessage)
}

// Получение иконки для файла (включая голосовые сообщения)
const getVoiceIcon = (file) => {
  if (file.name?.startsWith('voice_')) {
    return 'fa-microphone'
  }
  return getFileIcon(file.type)
}

// Получение имени файла (с переводом для голосовых)
const getFileName = (file) => {
  if (file.name?.startsWith('voice_')) {
    return 'Голосовое сообщение'
  }
  return file.name
}
</script>

<style scoped>
.message-input-container {
  background: white;
  border-top: 1px solid #eee;
  position: relative;
}

.message-input-container.drag-over {
  background: #f0f7ff;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(237, 37, 83, 0.1);
  border: 2px dashed #ED2553;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #ED2553;
  font-weight: 600;
}

.drag-content i {
  font-size: 48px;
}

.media-preview {
  padding: 12px 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.media-item {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  min-width: 200px;
}

.media-content {
  padding: 8px;
}

.image-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.file-preview {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.file-preview i {
  font-size: 24px;
  color: #666;
}

.file-name {
  font-size: 10px;
  text-align: center;
  word-break: break-all;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 9px;
  color: #999;
}

.remove-file {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.upload-progress {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ED2553;
  transition: width 0.3s ease;
}

.message-input {
  display: flex;
  padding: 16px;
  gap: 12px;
}

.attach-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #f8f9fa;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.attach-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.attach-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #ED2553;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #d01e48;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.voice-btn:hover:not(:disabled) {
  background: #45a049;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn.disabled {
  background: #999;
  cursor: pointer;
}

.voice-btn.disabled:hover {
  background: #777;
}

.cancel-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.cancel-btn:hover {
  background: #cc0000;
}

.stop-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #ED2553;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.stop-btn:hover {
  background: #d01e48;
}

.recording-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: #f8f9fa;
  border-radius: 24px;
  font-size: 14px;
  color: #333;
  flex-shrink: 0;
}

.recording-icon {
  color: #ff4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>