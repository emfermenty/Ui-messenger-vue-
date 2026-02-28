import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ChatView from '../views/ChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    }
  ]
})

// Защита маршрутов
router.beforeEach((to, from) => {
  const token = sessionStorage.getItem('token')
  const login = sessionStorage.getItem('login')
  const isAuthenticated = token && login

  console.log('Навигация:', { to: to.path, from: from.path, isAuthenticated })

  if (to.path === '/chat' && !isAuthenticated) {
    return '/login'
  }

  if (to.path === '/login' && isAuthenticated) {
    return '/chat'
  }
})

export default router