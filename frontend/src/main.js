import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import useAuthStore from '@/stores/useAuthStore'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore()
authStore.init()

app.use(router)

// 서비스 워커 등록 + 로그인 상태 동기화
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('ServiceWorker registration success : ', reg.scope)
        return navigator.serviceWorker.ready
      })
      .then(() => {
        const isLoggedIn = authStore.checkLogin()
        navigator.serviceWorker.controller?.postMessage({
          type: 'SET_LOGIN_STATE',
          isLoggedIn,
        })
      })
      .catch((error) => console.log('ServiceWorker registration failed: ', error))
  })
}

app.mount('#app')
