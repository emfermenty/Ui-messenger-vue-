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
          autocomplete="username"
          :disabled="isLoggingIn"
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
          @keyup.enter="handleLogin"
          autocomplete="current-password"
          :disabled="isLoggingIn"
        >
        <span class="spin"></span>
      </div>

      <div class="button login">
        <button @click="handleLogin" :class="{ active: isLoggingIn }" :disabled="isLoggingIn">
          <span>{{ isLoggingIn ? 'Вход...' : 'Войти' }}</span>
          <i class="fa fa-check"></i>
        </button>
      </div>

      <div v-if="loginError" class="error-message">{{ loginError }}</div>
    </div>

    <!-- Форма регистрации -->
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
          autocomplete="username"
          :disabled="isRegistering"
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
          autocomplete="new-password"
          :disabled="isRegistering"
        >
        <span class="spin"></span>
      </div>

      <div class="input">
        <label for="regusername">Имя пользователя</label>
        <input 
          type="text" 
          id="regusername" 
          v-model="registerForm.userName"
          @focus="handleFocus($event)"
          @blur="handleBlur($event)"
          @keyup.enter="handleRegister"
          autocomplete="name"
          :disabled="isRegistering"
        >
        <span class="spin"></span>
      </div>

      <div class="button register">
        <button @click="handleRegister" :disabled="isRegistering">
          {{ isRegistering ? 'Регистрация...' : 'Регистрация' }}
        </button>
      </div>

      <div v-if="registerError" class="error-message">{{ registerError }}</div>
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
const isLoggingIn = ref(false)
const isRegistering = ref(false)
const loginError = ref('')
const registerError = ref('')
const showRegister = ref(false)

const loginForm = reactive({
  login: '',
  password: ''
})

const registerForm = reactive({
  login: '',
  password: '',
  userName: ''
})

// Refs для элементов
const overbox = ref(null)
const materialButton = ref(null)

// Обработка фокуса для анимации лейблов
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

// Переключение между формами
const toggleRegister = () => {
  showRegister.value = !showRegister.value
  
  if (showRegister.value) {
    // Показываем форму регистрации
    if (overbox.value) {
      overbox.value.style.transform = 'rotateY(0deg)'
      overbox.value.style.zIndex = '5'
      
      // Показываем поля регистрации
      const elements = overbox.value.querySelectorAll('.title, .button, .input')
      elements.forEach(el => {
        el.style.display = 'block'
      })
    }
    
    if (materialButton.value) {
      materialButton.value.classList.add('active')
    }
  } else {
    // Скрываем форму регистрации
    if (overbox.value) {
      overbox.value.style.transform = 'rotateY(180deg)'
      overbox.value.style.zIndex = '1'
      
      // Скрываем поля регистрации
      const elements = overbox.value.querySelectorAll('.title, .button, .input')
      elements.forEach(el => {
        el.style.display = 'none'
      })
    }
    
    if (materialButton.value) {
      materialButton.value.classList.remove('active')
    }
  }
}

// Обработка регистрации
const handleRegister = async (event) => {
  event.preventDefault()
  
  if (!registerForm.login || !registerForm.password || !registerForm.userName) {
    registerError.value = 'Заполните все поля'
    return
  }

  isRegistering.value = true
  registerError.value = ''

  try {
    console.log('Отправка запроса на регистрацию:', {
      Login: registerForm.login,
      Password: registerForm.password,
      UserName: registerForm.userName
    })
    
    const response = await fetch('https://46.149.66.175/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Login: registerForm.login,
        Password: registerForm.password,
        UserName: registerForm.userName
      })
    })

    const data = await response.json()
    console.log('Ответ сервера на регистрацию:', data)

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка регистрации')
    }

    // После успешной регистрации переключаемся на форму входа
    registerForm.login = ''
    registerForm.password = ''
    registerForm.userName = ''
    
    // Копируем данные в форму входа для удобства
    loginForm.login = registerForm.login
    
    toggleRegister()
    
    // Показываем сообщение об успехе
    loginError.value = 'Регистрация успешна! Теперь войдите в систему.'
    
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    registerError.value = error.message
  } finally {
    isRegistering.value = false
  }
}
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
    
    const response = await fetch('https://46.149.66.175/api/users/login', {
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
      login: loginForm.login
    }
    
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

// Инициализация при монтировании
onMounted(() => {
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
  padding: 8px;
  background: rgba(237, 37, 83, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(237, 37, 83, 0.2);
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

/* Стили для отключенных кнопок */
.button button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.input input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>