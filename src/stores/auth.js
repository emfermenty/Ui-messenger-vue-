import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // Используем sessionStorage
  const token = ref(sessionStorage.getItem('token') || '')
  const login = ref(sessionStorage.getItem('login') || '')
  const userId = ref(sessionStorage.getItem('userId') || '')
  const loginTime = ref(sessionStorage.getItem('loginTime') || '')
  const userData = ref(JSON.parse(sessionStorage.getItem('userData') || '{}'))

  // Декодирование JWT токена
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const decoded = JSON.parse(jsonPayload)
      console.log('Декодированный токен:', decoded)
      return decoded
    } catch (e) {
      console.error('Ошибка декодирования токена:', e)
      return null
    }
  }

  // Установка данных после авторизации
  function setAuthData(data) {
    console.log('Данные для установки:', data)
    
    token.value = data.token || data.accessToken || data.access_token
    
    // Сначала пробуем получить userId из ответа сервера
    userId.value = data.userId || data.id || data.user_id || data.userID || ''
    
    // Если в ответе нет userId, декодируем токен и ищем там
    if (!userId.value && token.value) {
      try {
        const decoded = decodeToken(token.value)
        console.log('Декодированный токен для поиска userId:', decoded)
        
        // Ищем userId в поле nameid (как в вашем случае)
        userId.value = decoded?.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || ''
        
        // Если все еще нет, пробуем другие возможные поля
        if (!userId.value) {
          userId.value = decoded?.sub || decoded?.userId || decoded?.id || decoded?.user_id || ''
        }
        
        console.log('Извлеченный userId из токена:', userId.value)
      } catch (e) {
        console.error('Ошибка декодирования токена:', e)
      }
    }
    
    login.value = data.login || data.username || data.userName || ''
    loginTime.value = new Date().toISOString()
    userData.value = { ...data, decoded: decodeToken(token.value) }

    // Сохраняем в sessionStorage
    sessionStorage.setItem('token', token.value)
    sessionStorage.setItem('login', login.value)
    sessionStorage.setItem('userId', userId.value)
    sessionStorage.setItem('loginTime', loginTime.value)
    sessionStorage.setItem('userData', JSON.stringify(userData.value))
    
    console.log('Установлен userId:', userId.value)
    console.log('Установлен login:', login.value)
  }

  // Функция logout с вызовом API
  async function logout() {
    console.log('Начинаем процесс выхода...')
    
    try {
      // Вызываем endpoint logout если есть токен
      if (token.value) {
        console.log('Вызов logout API для пользователя:', login.value)
        
        try {
          const response = await fetch('http://46.149.66.175/api/users/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.value}`
            },
            body: JSON.stringify({
              userId: userId.value,
              login: login.value
            })
          })

          if (response.ok) {
            console.log('Успешный выход через API')
          } else {
            console.warn('Ошибка при вызове logout API:', await response.text())
          }
        } catch (apiError) {
          console.warn('Ошибка соединения с API logout:', apiError)
        }
      }
    } catch (error) {
      console.warn('Ошибка при выходе:', error)
    } finally {
      // Всегда очищаем локальные данные, даже если API вернул ошибку
      performLocalLogout()
    }
  }

  // Локальная очистка данных
  function performLocalLogout() {
    console.log('Очистка локальных данных')
    
    // Очищаем все ref значения
    token.value = ''
    login.value = ''
    userId.value = ''
    loginTime.value = ''
    userData.value = {}

    // Очищаем sessionStorage
    sessionStorage.clear()
    
    console.log('Данные очищены, перенаправление через router')
    
    // Перенаправляем на страницу входа
    router.push('/login')
  }

  // Проверка авторизации
  function isAuthenticated() {
    return !!token.value && !!login.value
  }

  return {
    token,
    login,
    userId,
    loginTime,
    userData,
    setAuthData,
    logout,
    isAuthenticated
  }
})