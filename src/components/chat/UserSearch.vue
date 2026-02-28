<template>
  <div class="user-search">
    <div class="search-input">
      <i class="fas fa-search"></i>
      <input
        type="text"
        v-model="query"
        placeholder="Поиск пользователей..."
        @input="onInput"
        @focus="showResults = true"
        @blur="handleBlur"
      />
      <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    </div>
    <div v-if="showResults && results.length" class="search-results">
      <div
        v-for="user in results"
        :key="user.id"
        class="search-result-item"
        @mousedown.prevent="selectUser(user)"
      >
        <div class="result-avatar">
          {{ (user.user_name || user.login).charAt(0).toUpperCase() }}
        </div>
        <div class="result-info">
          <div class="result-name">{{ user.user_name || user.login }}</div>
          <div class="result-login">@{{ user.login }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import debounce from 'lodash/debounce'

const props = defineProps({
  onSelectUser: Function
})

const authStore = useAuthStore()
const query = ref('')
const results = ref([])
const loading = ref(false)
const showResults = ref(false)

const fetchUsers = async (search) => {
  if (!search.trim()) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const response = await fetch(`http://46.149.66.175/api/users/${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      results.value = data
    } else {
      results.value = []
    }
  } catch (error) {
    console.error('Ошибка поиска:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(fetchUsers, 300)

const onInput = () => {
  debouncedFetch(query.value)
}

const selectUser = (user) => {
  props.onSelectUser(user)
  showResults.value = false
  query.value = ''
}

const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}
</script>

<style scoped>
.user-search {
  position: relative;
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
}

.search-input {
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 24px;
  padding: 8px 12px;
}

.search-input i {
  color: #999;
  margin-right: 8px;
}

.search-input input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.result-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ED2553;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-login {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>