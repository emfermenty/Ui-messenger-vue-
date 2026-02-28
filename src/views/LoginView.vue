<template>
  <div class="materialContainer">
    <!-- Форма входа -->
    <div class="box" :class="{ back: showRegister }">
      <div class="title">Авторизация</div>

      <div class="input">
        <label for="name">Логин</label>
        <input 
          type="text" 
          id="name" 
          v-model="loginForm.login"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
        >
        <span class="spin"></span>
      </div>

      <div class="input">
        <label for="pass">Пароль</label>
        <input 
          type="password" 
          id="pass" 
          v-model="loginForm.password"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
        >
        <span class="spin"></span>
      </div>

      <div class="button login">
        <button @click="handleLogin" :class="{ active: isLoggingIn }">
          <span>Войти</span>
          <i class="fa fa-check"></i>
        </button>
      </div>

      <div v-if="loginError" class="error-message">{{ loginError }}</div>
    </div>

    <!-- Форма регистрации (с кнопкой-плюсиком внутри, как в оригинале) -->
    <div class="overbox" ref="overbox">
      <div class="material-button alt-2" @click="toggleRegister" ref="materialButton">
        <span class="shape"></span>
      </div>

      <div class="title">Регистрация</div>

      <div class="input">
        <label for="regname">Логин</label>
        <input 
          type="text" 
          id="regname" 
          v-model="registerForm.login"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
        >
        <span class="spin"></span>
      </div>

      <div class="input">
        <label for="regpass">Пароль</label>
        <input 
          type="password" 
          id="regpass" 
          v-model="registerForm.password"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
        >
        <span class="spin"></span>
      </div>

      <div class="input">
        <label for="reregpass">Повторите пароль</label>
        <input 
          type="password" 
          id="reregpass" 
          v-model="registerForm.confirmPassword"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
        >
        <span class="spin"></span>
      </div>

      <div class="button register">
        <button @click="handleRegister">Регистрация</button>
      </div>
    </div>
    
    <div class="version">Версия: 1.0.0</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Состояние
const showRegister = ref(false)
const isLoggingIn = ref(false)
const loginError = ref('')
const overbox = ref(null)
const materialButton = ref(null)

const loginForm = reactive({
  login: '',
  password: ''
})

const registerForm = reactive({
  login: '',
  password: '',
  confirmPassword: ''
})

// Обработка фокуса для анимации лейблов (как в jQuery)
const handleFocus = (event) => {
  const input = event.target
  const parent = input.closest('.input')
  if (parent) {
    const label = parent.querySelector('label')
    const spin = parent.querySelector('.spin')
    
    if (label) {
      label.style.lineHeight = '18px'
      label.style.fontSize = '18px'
      label.style.fontWeight = '100'
      label.style.top = '0px'
    }
    
    if (spin) {
      spin.style.width = '100%'
    }
  }
}

const handleBlur = (event) => {
  const input = event.target
  const parent = input.closest('.input')
  
  if (parent) {
    const spin = parent.querySelector('.spin')
    if (spin) {
      spin.style.width = '0px'
    }
    
    if (!input.value) {
      const label = parent.querySelector('label')
      if (label) {
        label.style.lineHeight = '60px'
        label.style.fontSize = '24px'
        label.style.fontWeight = '300'
        label.style.top = '10px'
      }
    }
  }
}

// Переключение между формами (полная копия jQuery логики)
const toggleRegister = (event) => {
  const btn = materialButton.value
  
  if (!btn.classList.contains('material-button')) {
    // Закрываем регистрацию
    document.querySelector('.shape').style.width = '100%'
    document.querySelector('.shape').style.height = '100%'
    document.querySelector('.shape').style.transform = 'rotate(0deg)'

    setTimeout(() => {
      if (overbox.value) {
        overbox.value.style.overflow = 'initial'
      }
    }, 600)

    // Анимация кнопки
    btn.style.width = '140px'
    btn.style.height = '140px'
    
    setTimeout(() => {
      document.querySelector('.box').classList.remove('back')
      btn.classList.remove('active')
    }, 500)

    // Скрываем элементы регистрации
    const titles = overbox.value.querySelectorAll('.title')
    const inputs = overbox.value.querySelectorAll('.input')
    const buttons = overbox.value.querySelectorAll('.button')
    
    titles.forEach(el => el.style.display = 'none')
    inputs.forEach(el => el.style.display = 'none')
    buttons.forEach(el => el.style.display = 'none')

    btn.classList.add('material-buton')
    showRegister.value = false
  } else {
    // Открываем регистрацию
    setTimeout(() => {
      if (overbox.value) {
        overbox.value.style.overflow = 'hidden'
      }
      document.querySelector('.box').classList.add('back')
    }, 200)

    btn.classList.add('active')
    btn.style.width = '700px'
    btn.style.height = '700px'

    setTimeout(() => {
      document.querySelector('.shape').style.width = '50%'
      document.querySelector('.shape').style.height = '50%'
      document.querySelector('.shape').style.transform = 'rotate(45deg)'

      // Показываем элементы регистрации
      const titles = overbox.value.querySelectorAll('.title')
      const inputs = overbox.value.querySelectorAll('.input')
      const buttons = overbox.value.querySelectorAll('.button')
      
      titles.forEach(el => el.style.display = 'block')
      inputs.forEach(el => el.style.display = 'block')
      buttons.forEach(el => el.style.display = 'block')
    }, 700)

    btn.classList.remove('material-button')
    showRegister.value = true
  }

  if (document.querySelector('.alt-2').classList.contains('material-buton')) {
    document.querySelector('.alt-2').classList.remove('material-buton')
    document.querySelector('.alt-2').classList.add('material-button')
  }
}

// Обработка входа
const handleLogin = async (event) => {
  event.preventDefault()
  
  if (!loginForm.login || !loginForm.password) {
    loginError.value = 'Введите логин и пароль'
    return
  }

  isLoggingIn.value = true
  loginError.value = ''

  // Ripple эффект
  const btn = event.currentTarget
  const rect = btn.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const ripple = document.createElement('span')
  ripple.className = 'click-efect'
  ripple.style.marginLeft = x + 'px'
  ripple.style.marginTop = y + 'px'
  ripple.style.position = 'absolute'
  ripple.style.width = '0'
  ripple.style.height = '0'
  ripple.style.backgroundColor = '#ED2553'
  ripple.style.borderRadius = '50%'
  ripple.style.transition = 'all 0.6s ease-out'
  ripple.style.pointerEvents = 'none'
  ripple.style.zIndex = '999'
  
  btn.style.position = 'relative'
  btn.style.overflow = 'hidden'
  btn.appendChild(ripple)
  
  setTimeout(() => {
    ripple.style.width = '500px'
    ripple.style.height = '500px'
    ripple.style.top = '-250px'
    ripple.style.left = '-250px'
  }, 10)
  
  setTimeout(() => {
    ripple.remove()
  }, 600)

  try {
    console.log('Отправка запроса на вход:', {
      Login: loginForm.login,
      Password: loginForm.password
    })
    
    const response = await fetch('https://wet-olives-judge.loca.lt/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Login: loginForm.login,
        Password: loginForm.password
      })
    })

    const data = await response.json()
    console.log('Ответ сервера:', data)

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка авторизации')
    }

    // Подготавливаем данные для сохранения
    const authData = {
      ...data,
      login: loginForm.login // Обязательно добавляем login из формы
    }
    
    // Если в ответе нет userId, но есть другие поля, пробуем их использовать
    if (!authData.userId && data.user) {
      authData.userId = data.user.id || data.user.userId
    }
    
    console.log('Данные для сохранения:', authData)
    authStore.setAuthData(authData)
    
    setTimeout(() => {
      router.push('/chat')
    }, 650)
  } catch (error) {
    console.error('Ошибка входа:', error)
    loginError.value = error.message
    isLoggingIn.value = false
  }
}

// Обработка регистрации
const handleRegister = async (event) => {
  event.preventDefault()

  if (!registerForm.login || !registerForm.password || !registerForm.confirmPassword) {
    alert('Все поля обязательны')
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    alert('Пароли не совпадают')
    return
  }

  try {
    const response = await fetch('https://wet-olives-judge.loca.lt/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Login: registerForm.login,
        Password: registerForm.password
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка регистрации')
    }

    alert('Регистрация успешна! Теперь войдите.')
    
    // Имитируем нажатие на кнопку закрытия регистрации
    const btn = materialButton.value
    btn.click()
    
    // Очищаем форму
    registerForm.login = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  } catch (error) {
    alert(error.message)
  }
}

// Инициализация при монтировании
onMounted(() => {
  // Устанавливаем начальные стили для лейблов, если есть значения
  const inputs = document.querySelectorAll('.input input')
  inputs.forEach(input => {
    if (input.value) {
      const parent = input.closest('.input')
      const label = parent.querySelector('label')
      if (label) {
        label.style.lineHeight = '18px'
        label.style.fontSize = '18px'
        label.style.fontWeight = '100'
        label.style.top = '0px'
      }
    }
  })
})
</script>

<style>
@import '@/assets/login.css';

.error-message {
  color: #ED2553;
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  width: 100%;
  float: left;
}

.click-efect {
  position: absolute;
  top: 0;
  left: 0;
  background: #ED2553;
  border-radius: 50%;
  width: 0;
  height: 0;
  transition: all 0.6s ease-out;
  pointer-events: none;
  z-index: 999;
}

.button {
  position: relative;
  overflow: hidden;
}
</style>