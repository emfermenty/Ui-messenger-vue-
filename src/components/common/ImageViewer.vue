<template>
  <div v-if="visible" class="image-viewer-overlay" @click="handleOverlayClick">
    <div class="image-viewer-container">
      <button class="close-btn" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
      <img 
        :src="imageUrl" 
        :alt="fileName"
        class="viewer-image"
        :class="{ 'with-info': fileName }"
        @click.stop
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <div v-if="fileName" class="image-info">
        {{ fileName }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  imageUrl: String,
  fileName: String
})

const emit = defineEmits(['close'])
const imageLoaded = ref(false)
const imageError = ref(false)

const handleOverlayClick = (event) => {
  // Закрываем только при клике на overlay, не на изображение
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

const handleImageError = () => {
  imageError.value = true
  imageLoaded.value = false
}

// Закрытие по Escape
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    emit('close')
  }
}

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    imageLoaded.value = false
    imageError.value = false
  }
})
</script>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.image-viewer-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 60px; /* Резервируем место для названия */
}

.close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
  z-index: 1001;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.viewer-image {
  max-width: 100%;
  max-height: calc(90vh - 120px); /* Фиксированная высота с учетом кнопки и названия */
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.viewer-image.with-info {
  max-height: calc(90vh - 120px);
}

.viewer-image:not(.with-info) {
  max-height: calc(90vh - 60px); /* Если нет названия, больше места для изображения */
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 16px;
  color: white;
  font-size: 14px;
  text-align: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  max-width: 80vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .image-viewer-container {
    max-width: 95vw;
    max-height: 90vh;
    padding-bottom: 80px;
  }
  
  .viewer-image {
    max-height: calc(90vh - 140px);
  }
  
  .viewer-image:not(.with-info) {
    max-height: calc(90vh - 80px);
  }
  
  .close-btn {
    top: -40px;
    width: 35px;
    height: 35px;
    font-size: 16px;
  }
  
  .image-info {
    font-size: 12px;
    padding: 6px 12px;
    max-width: 90vw;
  }
}

@media (max-height: 600px) {
  .image-viewer-container {
    max-height: 85vh;
    padding-bottom: 50px;
  }
  
  .viewer-image {
    max-height: calc(85vh - 100px);
  }
  
  .viewer-image:not(.with-info) {
    max-height: calc(85vh - 60px);
  }
  
  .image-info {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>