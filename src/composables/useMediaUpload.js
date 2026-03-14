import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useMediaUpload() {
  const authStore = useAuthStore()
  const uploading = ref(false)
  const uploadProgress = ref(0)

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return []

    uploading.value = true
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      
      // Добавляем все файлы в FormData
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('https://46.149.66.175/api/Media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }

      const result = await response.json()
      console.log('Файлы загружены:', result)

      return result.files || []
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error)
      throw error
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  const isImageFile = (file) => {
    return file.type.startsWith('image/')
  }

  const isVideoFile = (file) => {
    return file.type.startsWith('video/')
  }

  const isAudioFile = (file) => {
    return file.type.startsWith('audio/') || 
           file.name?.endsWith('.webm') || 
           file.name?.startsWith('voice_')
  }

  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) return 'fa-image'
    if (contentType.startsWith('video/')) return 'fa-video'
    if (contentType.startsWith('audio/')) return 'fa-music'
    if (contentType.includes('pdf')) return 'fa-file-pdf'
    if (contentType.includes('word')) return 'fa-file-word'
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'fa-file-excel'
    return 'fa-file'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Б'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    uploading,
    uploadProgress,
    uploadFiles,
    isImageFile,
    isVideoFile,
    isAudioFile,
    getFileIcon,
    formatFileSize
  }
}