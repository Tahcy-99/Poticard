import { defineStore } from 'pinia'
import { ref } from 'vue'

const useAuthStore = defineStore('auth', () => {
  const userInfo = ref(null)
  const isLogin = ref(false)

  const login = (info) => {
    userInfo.value = info
    isLogin.value = true
    localStorage.setItem('USERINFO', JSON.stringify(info))
  }

  const init = () => {
    const raw = localStorage.getItem('USERINFO')
    if (raw) {
      userInfo.value = JSON.parse(raw)
      isLogin.value = true
    }
  }

  const logout = () => {
    userInfo.value = null
    isLogin.value = false
    localStorage.removeItem('USERINFO')
  }

  const checkLogin = () => !!localStorage.getItem('USERINFO')

  return { userInfo, isLogin, login, init, logout, checkLogin }
})

export default useAuthStore
