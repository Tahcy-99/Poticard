<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/user'
import useAuthStore from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const serverError = ref('')
const submitted = ref(false)

// 로그인 input이 브라우저 자동완성으로 채워지는 걸 최대한 막기 위해 key로 리렌더
const formKey = ref(Date.now())
const loginForm = reactive({
  identifier: '',
  password: '',
})

onMounted(() => {
  loginForm.identifier = ''
  loginForm.password = ''
  submitted.value = false
  serverError.value = ''
  formKey.value = Date.now()
})

const identifierError = computed(() => {
  if (!submitted.value) return ''
  if (!loginForm.identifier.trim()) return '필수 정보입니다.'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!loginForm.password) return '필수 정보입니다.'
  return ''
})

const canSubmit = computed(() => {
  return (
    loginForm.identifier.trim() &&
    loginForm.password &&
    !identifierError.value &&
    !passwordError.value
  )
})

const login = async () => {
  submitted.value = true
  serverError.value = ''

  if (!canSubmit.value) {
    serverError.value = '입력값을 확인해 주세요.'
    return
  }

  const id = loginForm.identifier.trim()

  try {
    const res = await api.login({
      email: id,
      password: loginForm.password,
    })
    if (res == null){
      return
    }
    
    // const userInfo = typeof res === 'object' && res.data ? res : { email: id }
    const user = await api.getMyInfo()
    authStore.login(user)

    // 로그인 상태를 서비스 워커에 전달 (푸시 팝업 알림 표시 허용)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: 'SET_LOGIN_STATE', isLoggedIn: true })
      })
    }
    
    // redirect 쿼리가 있으면 우선 사용, 없으면 타입에 따라 분기
    let redirect = route.query.redirect
    if (!redirect) {
      redirect = route.query.type === 'business' ? '/company' : '/'
    }
    router.push(redirect)

    // login 성공 시 service-worker에 기기 + 유저 정보 등록
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('알림 권한이 거부되었습니다.')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          'BLHgfPga02L2u89uc4xjhbUFTy_U04rQCjGq7o24oxtqfVmAPHTxOmp6xndSHZtGQpmt7gqTFdMXco2gRNP7_p8',
      })

      const userInfo = JSON.parse(localStorage.getItem('USERINFO'))
      const userIdx = userInfo.data.idx

      if (!userIdx) {
        console.warn('Invalid user')
      }

      await api.subscribePush(subscription, userIdx)
    } catch (pushError) {
      // 푸시 구독 실패는 로그인은 성공한 상태이므로 경고만 띄움
    }
  } catch (e) {
    serverError.value = e?.userMessage || '로그인 실패'
  }
}

</script>

<template>
  <div class="flex-1 flex items-center min-h-screen justify-center pt-12 pb-12 px-4">
    <div
      class="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden relative"
    >
      <div class="h-2 bg-point-yellow w-full"></div>

      <div class="p-8 md:p-10">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-black font-poppins dark:text-[#facc15] text-gray-900 mb-2">
            Login
          </h2>
          <p
            v-if="route.query.type === 'personal'"
            class="mt-5 text-gray-500 dark:text-gray-400 text-sm"
          >
            단 하나의 명함으로 수많은 기업의 제안을 받아보세요.
          </p>
          <p
            v-else-if="route.query.type === 'business'"
            class="mt-5 text-gray-500 dark:text-gray-400 text-sm"
          >
            인재를 만나는 가장 스마트한 방법.
          </p>
        </div>

        <div
          v-if="route.query.justSignedUp === '1'"
          class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
        >
          회원가입이 완료되었습니다.
        </div>

        <div
          v-if="route.query.redirect"
          class="mb-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 px-4 py-3 text-sm font-bold text-orange-700 dark:text-orange-400"
        >
          로그인이 필요한 서비스입니다.
        </div>

        <div
          v-if="serverError"
          class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
        >
          {{ serverError }}
        </div>

        <form class="space-y-6" :key="formKey" autocomplete="off" @submit.prevent="login">
          <div class="space-y-2">
            <label
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
            >
              이메일
            </label>

            <input
              v-model.trim="loginForm.identifier"
              type="text"
              placeholder="example@email.com"
              autocomplete="off"
              name="poticard_identifier"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p v-if="identifierError" class="text-xs font-bold text-red-500">
              {{ identifierError }}
            </p>
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
            >
              비밀번호
            </label>

            <input
              v-model="loginForm.password"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              name="poticard_password"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p v-if="passwordError" class="text-xs font-bold text-red-500">{{ passwordError }}</p>
          </div>

          <button
            type="submit"
            :disabled="!canSubmit"
            class="w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            로그인
          </button>
        </form>
                <!-- SNS 로그인 섹션 -->
        <div class="mt-10">
          <div class="relative flex items-center justify-center mb-8">
            <div class="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
            <span class="flex-shrink mx-4 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              SNS Quick Login
            </span>
            <div class="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
          </div>

          <div class="flex justify-center items-center gap-6">
            <!-- 카카오 버튼 -->
            <button 
              type="button" 
              @click="api.social('kakao')"
              class="group flex flex-col items-center gap-2 outline-none"
            >
              <div class="w-14 h-14 bg-[#FEE500] rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 group-active:scale-95 transition-all">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C7.029 3 3 6.129 3 10C3 12.48 4.632 14.671 7.148 15.939L6.11 19.749C6.056 19.949 6.175 20.151 6.372 20.203C6.441 20.221 6.513 20.218 6.58 20.194L11.021 17.21C11.343 17.243 11.668 17.26 12 17.26C16.971 17.26 21 14.131 21 10.26C21 6.389 16.971 3.26 12 3.26V3Z" fill="#3C1E1E"/>
                </svg>
              </div>
              <span class="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">카카오</span>
            </button>

            <!-- 구글 버튼 -->
            <button 
              type="button" 
              @click="api.social('google')"
              class="group flex flex-col items-center gap-2 outline-none"
            >
              <div class="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 group-active:scale-95 transition-all">
                <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.11c-.22-.67-.35-1.38-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                </svg>
              </div>
              <span class="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">구글</span>
            </button>
          </div>
        </div>
        <p class="text-center mt-6 text-sm text-gray-400">
          로그인 정보를 잊어버리셨나요?
          <router-link
            :to="
              route.query.type === 'business' ? '/find-business-account' : '/find-personal-account'
            "
            class="text-point-yellow hover:underline"
          >
            이메일/비밀번호 찾기
          </router-link>
        </p>

        <p class="text-center mt-2 text-sm text-gray-400">
          {{
            route.query.type === 'business' ? '기업 계정이 없으신가요?' : '개인 계정이 없으신가요?'
          }}
          <router-link
            :to="route.query.type === 'business' ? '/signup-business' : '/signup?type=personal'"
            class="text-point-yellow hover:underline"
          >
            회원가입
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(body) {
  font-family: 'Noto Sans KR', sans-serif;
}

.font-poppins {
  font-family: 'Poppins', sans-serif;
}
</style>
