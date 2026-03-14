import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import './assets/audio-player.css'  // Добавляем стили аудиоплеера
import './assets/audio-preview.css'  // Добавляем стили превью аудио

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')