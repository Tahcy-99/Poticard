<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { initHeader } from '@/assets/js/Header.js'
import useAuthStore from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import '@/assets/css/Header.css'
import brandLogo from '@/image/poticard-logo.png'

// 1. 검색어 상태 추가
const searchQuery = ref('')

// 2. 검색 실행 함수 추가
const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  // 검색 결과 페이지로 이동하며 쿼리 파라미터 전달
  router.push({
    path: '/searchresults',
    query: { q: searchQuery.value }
  })
  // value 값 초기화  
  searchQuery.value = ''
}
const authStore = useAuthStore()
const chatStore = useChatStore()
const router = useRouter()

const showAuthModal = ref(false)
const showNotiPopup = ref(false)
const hasUnread = ref(false)

// 알림 목록 (푸시 수신 시 추가)
const notifications = ref([])

const userMenuOpen = ref(false)
const showLogoutConfirm = ref(false)

const overlayOn = computed(() => showAuthModal.value)

const openAuthModal = () => {
  showAuthModal.value = true
  document.body.style.overflow = 'hidden'
}
const closeAuthModal = () => {
  showAuthModal.value = false
  document.body.style.overflow = 'auto'
}
const selectAuthType = (type) => {
  closeAuthModal()
  router.push(`/login?type=${type}`)
}

const canGoCompany = computed(() => {
  const u = authStore.userInfo || {}
  const byField =
    u.accountType === 'business' ||
    u.userType === 'business' ||
    u.type === 'business' ||
    u.role === 'company' ||
    u.isCompany === true ||
    u.isBusiness === true ||
    !!u.company ||
    !!u.companyName ||
    !!u.organization
  const byLocal = !!localStorage.getItem('USERINFO')
  return authStore.isLogin && (byField || byLocal)
})

const closeUserMenu = () => {
  userMenuOpen.value = false
  showLogoutConfirm.value = false
}
const toggleUserMenu = (e) => {
  e?.stopPropagation?.()
  userMenuOpen.value = !userMenuOpen.value
  if (!userMenuOpen.value) showLogoutConfirm.value = false
}

watch(userMenuOpen, (open) => {
  document.documentElement.classList.toggle('user-open', open)
})

// SSE 연결 (실시간 알림 - 푸시 권한 없어도 동작)
let sseEventSource = null

const getUserId = () => {
  let id = authStore.userInfo?.idx ?? authStore.userInfo?.id ?? authStore.userInfo?.data?.idx
  if (id == null) {
    try {
      const u = JSON.parse(localStorage.getItem('USERINFO') || '{}')
      id = u?.idx ?? u?.id ?? u?.data?.idx
    } catch {}
  }
  return id
}

const startSse = () => {
  if (sseEventSource) return
  const userId = getUserId()
  if (!userId) return
  const url = `/api/sse/subscribe/${userId}`
  sseEventSource = new EventSource(url)
  sseEventSource.addEventListener('notification', (e) => {
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      addNotificationFromPush(data)
      window.dispatchEvent(new CustomEvent('sse-notification', { detail: data }))
    } catch (err) {}
  })
  sseEventSource.onerror = () => {
    sseEventSource?.close()
    sseEventSource = null
  }
}

const closeSse = () => {
  if (sseEventSource) {
    sseEventSource.close()
    sseEventSource = null
  }
}

watch(
  () => authStore.isLogin,
  (isLogin) => {
    if (!isLogin) {
      showNotiPopup.value = false
      closeUserMenu()
      closeSse()
    } else {
      startSse()
    }
  },
  { immediate: true },
)

const onDocClick = (e) => {
  if (userMenuOpen.value) {
    const userRoot = document.getElementById('flyout-user')
    if (!userRoot || !userRoot.contains(e.target)) closeUserMenu()
  }

  if (showNotiPopup.value) {
    const notiRoot = document.getElementById('notiWrap')
    if (!notiRoot || !notiRoot.contains(e.target)) showNotiPopup.value = false
  }
}

const onKeyDown = (e) => {
  if (e.key !== 'Escape') return
  closeUserMenu()
  showNotiPopup.value = false
}

const markAllReadAndClose = (e) => {
  e?.stopPropagation?.()
  hasUnread.value = false
  notifications.value = []
  showNotiPopup.value = false
}

const addNotificationFromPush = (payload) => {
  const p = payload || {}
  const senderIdx = p.senderIdx ?? p.senderId
  const senderName = p.senderName ?? p.senderUsername
  const contents = p.contents ?? p.content
  const roomIdx = p.roomIdx != null ? Number(p.roomIdx) : null
  if (senderIdx == null || !authStore.isLogin) return

  // 현재 보고 있는 채팅방에서 온 메시지는 헤더 알림 스킵 (STOMP로 이미 수신)
  if (roomIdx != null && chatStore.activeRoomId === roomIdx) return

  // 발신자 본인에게는 알림 표시 안 함 (받는 사람에게만 표시)
  let myIdx = authStore.userInfo?.idx ?? authStore.userInfo?.id
  if (myIdx == null) {
    try {
      const u = JSON.parse(localStorage.getItem('USERINFO') || '{}')
      myIdx = u?.idx ?? u?.id ?? u?.data?.idx
    } catch {}
  }
  if (myIdx != null && Number(senderIdx) === Number(myIdx)) return

  notifications.value.unshift({
    id: Date.now() + Math.random(),
    senderIdx: Number(senderIdx),
    senderUsername: senderName || '알 수 없음',
    content: contents || '',
  })
  hasUnread.value = true
}

const handlePushNotification = (event) => {
  if (event.data?.type === 'PUSH_RECEIVED') {
    addNotificationFromPush(event.data.payload ?? event.data)
  }
}

const goToChatRoom = (senderIdx) => {
  showNotiPopup.value = false
  router.push({ path: '/chat', query: { senderId: senderIdx } })
}

// 채팅방 입장 시 해당 sender의 알림 제거
const clearNotificationsBySender = (senderId) => {
  const sid = Number(senderId)
  if (isNaN(sid)) return
  notifications.value = notifications.value.filter((n) => n.senderIdx !== sid)
  if (notifications.value.length === 0) hasUnread.value = false
}

const handleChatRoomEntered = (e) => {
  const senderId = e?.detail?.senderId
  if (senderId) clearNotificationsBySender(senderId)
}

const onNotiClick = (e) => {
  e?.stopPropagation?.()

  if (!authStore.isLogin) {
    showNotiPopup.value = false
    router.push({ path: '/login', query: { redirect: '/chat' } })
    return
  }

  showNotiPopup.value = !showNotiPopup.value
}

const openLogoutConfirm = (e) => {
  e?.stopPropagation?.()
  showLogoutConfirm.value = true
}
const cancelLogout = () => (showLogoutConfirm.value = false)

const confirmLogout = () => {
  try {
    authStore.logout()
  } catch { }

  showNotiPopup.value = false
  closeUserMenu()

  localStorage.removeItem('USERINFO')
  localStorage.removeItem('ATOKEN')
  sessionStorage.removeItem('ATOKEN')
  document.cookie = 'ATOKEN=; Max-Age=0; path=/'
  document.cookie = 'RTOKEN=; Max-Age=0; path=/'

  closeSse()

  // 로그아웃 상태를 서비스 워커에 전달 (푸시 팝업 알림 미표시)
  if ('serviceWorker' in navigator) {
    const isLoggedIn = authStore.checkLogin()
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'SET_LOGIN_STATE', isLoggedIn })
    })
  }

  window.dispatchEvent(new Event('auth-changed'))

  router.push('/')
}

const goCompanyHome = () => {
  closeUserMenu()
  router.push('/company')
}

const goMyInfoEdit = () => {
  closeUserMenu()
  router.push('/namecard-modify')
}
const goSubscribe = () => {
  closeUserMenu()
  router.push('/subscribe')
}

const cardName = computed(() => authStore.userInfo?.name ?? '밥')
const cardRole = computed(() => authStore.userInfo?.job || authStore.userInfo?.position || 'Portfolio Creator')
const cardCompany = computed(() => authStore.userInfo?.company || authStore.userInfo?.organization || 'PotiCard')
const cardEmail = computed(() => authStore.userInfo?.userEmail || authStore.userInfo?.email || 'w@naver.com')

onMounted(() => {
  initHeader()
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('chat-room-entered', handleChatRoomEntered)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handlePushNotification)
  }
  if (authStore.isLogin) startSse()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('chat-room-entered', handleChatRoomEntered)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handlePushNotification)
  }
  closeSse()
  document.documentElement.classList.remove('user-open')
})
</script>

<template>
  <header
    class="sticky top-0 z-[1000] w-full border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
      <div class="flex items-center gap-10">
        <router-link to="/" class="group flex items-center gap-3">
          <span class="pc-brand-box">
            <img :src="brandLogo" alt="PotiCard" class="pc-brand-logo" />
          </span>
          <h1 class="text-2xl font-black tracking-tighter text-point-yellow">Poticard</h1>
        </router-link>

        <nav class="hidden lg:flex items-center gap-1">
          <div class="relative group/nav py-2 px-4">
            <button
              class="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover/nav:text-point-yellow transition-colors">
              명함
            </button>
            <div
              class="absolute top-full left-0 pt-4 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 translate-y-2 group-hover/nav:translate-y-0">
              <div
                class="w-48 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl p-2">
                <router-link to="/namecard-search"
                  class="block px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition">
                  명함 검색
                </router-link>
                <router-link to="/namecard-modify"
                  class="block px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition">
                  명함 관리
                </router-link>
              </div>
            </div>
          </div>

          <div class="relative group/nav py-2 px-4">
            <button
              class="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover/nav:text-point-yellow transition-colors">
              포트폴리오
            </button>
            <div
              class="absolute top-full left-0 pt-4 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 translate-y-2 group-hover/nav:translate-y-0">
              <div
                class="w-48 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl p-2">
                <router-link to="/portfolio-project"
                  class="block px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition">
                  포트폴리오 작성
                </router-link>
                <router-link to="/portfolio-view"
                  class="block px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition">
                  포트폴리오 목록
                </router-link>
              </div>
            </div>
          </div>

          <router-link to="/matching"
            class="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-point-yellow transition-colors">
            채용
          </router-link>
          <router-link to="/community"
            class="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-point-yellow transition-colors">
            커뮤니티
          </router-link>
        </nav>
      </div>

      <div class="hidden md:flex flex-1 max-w-md group">
        <div class="relative w-full">
          <input v-model="searchQuery" type="text" placeholder="기술 스택, 이름, 회사 검색..." @keyup.enter="handleSearch"
            class="w-full h-11 pl-12 pr-4 bg-gray-100 dark:bg-zinc-800/50 border-transparent focus:border-point-yellow/50 focus:bg-white dark:focus:bg-zinc-900 border-2 rounded-2xl text-sm transition-all outline-none" />
          <span
            class="absolute left-4 top-1/2 -translate-y-1/2 text-lg group-focus-within:scale-110 transition-transform cursor-pointer"
            @click="handleSearch">
            🔍
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="!authStore.isLogin" class="flex items-center">
          <button @click="openAuthModal"
            class="h-11 px-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-900/10 dark:shadow-white/5">
            로그인/회원가입
          </button>
        </div>

        <div v-else class="flex items-center gap-3">
          <div class="hidden sm:flex flex-col items-end mr-2">
            <span class="text-xs font-bold text-gray-400">Welcome!</span>

            <button id="flyout-user" type="button"
              class="relative text-sm font-black text-gray-900 dark:text-white hover:text-point-yellow transition-colors"
              @click="toggleUserMenu">
              {{ authStore.userInfo?.name }}님

              <div class="pc-user-panel nav-panel" :class="{ 'pc-open': userMenuOpen }">
                <div class="pc-user-panel-card">
                  <div class="flex justify-end gap-2 mb-3">
                    <button v-if="canGoCompany" type="button" class="pc-company-chip" @click="goCompanyHome">
                      법인
                    </button>
                    <button type="button" class="pc-logout-chip" @click="openLogoutConfirm">로그아웃</button>
                  </div>

                  <div class="pc-mini-card">
                    <div class="pc-mini-head">
                      <div class="pc-mini-avatar">
                        <img :src="`${authStore.userInfo.profileImage}`" alt="avatar" />
                      </div>

                      <div class="pc-mini-main">
                        <p class="pc-mini-name">{{ cardName }}</p>
                        <p class="pc-mini-role">{{ cardRole }}</p>
                        <p class="pc-mini-company">{{ cardCompany }}</p>
                      </div>

                      <div class="pc-mini-icon">🪪</div>
                    </div>

                    <div class="pc-mini-divider"></div>

                    <div class="pc-mini-row">
                      <span class="pc-mini-label">Email</span>
                      <span class="pc-mini-value">{{ cardEmail }}</span>
                    </div>

                    <div class="pc-mini-actions">
                      <button type="button" class="pc-mini-btn" @click="goMyInfoEdit">내정보수정</button>
                      <button type="button" class="pc-mini-btn ghost" @click="goSubscribe">구독관리</button>
                    </div>
                  </div>

                  <div v-if="showLogoutConfirm" class="pc-confirm-backdrop" @click.self="cancelLogout">
                    <div class="pc-confirm">
                      <p class="pc-confirm-title">로그아웃하시겠습니까?</p>
                      <div class="pc-confirm-actions">
                        <button type="button" class="pc-confirm-btn ghost" @click="cancelLogout">아니요</button>
                        <button type="button" class="pc-confirm-btn" @click="confirmLogout">확인</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="h-6 w-[1px] bg-gray-200 dark:border-zinc-800 mx-1"></div>

        <div class="flex items-center gap-1">
          <router-link to="/chat"
            class="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-400"
            title="채팅">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </router-link>

          <div class="relative" id="notiWrap">
            <button @click.stop="onNotiClick"
              class="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative" title="알림">
              <span v-if="hasUnread && authStore.isLogin"
                class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>

              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <Transition enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0">
              <div v-if="showNotiPopup"
                class="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[110]">
                <div class="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <span class="font-bold">알림</span>
                  <button class="text-xs text-point-yellow font-bold" @click="markAllReadAndClose">
                    모두 읽음
                  </button>
                </div>
                <div class="max-h-80 overflow-y-auto">
                  <div v-if="notifications.length === 0" class="p-8 text-center text-sm text-gray-400">
                    알림이 없습니다
                  </div>
                  <div
                    v-for="noti in notifications"
                    :key="noti.id"
                    class="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition border-b border-gray-50 dark:border-zinc-800/50 cursor-pointer"
                    @click="goToChatRoom(noti.senderIdx)"
                  >
                    <p class="text-sm font-bold">새 메시지 * {{ noti.senderUsername }}</p>
                    <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ noti.content }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="fixed inset-0 z-[200] pointer-events-none">
    <div
      class="absolute inset-0 backdrop-blur-sm opacity-0 transition-none will-change-[opacity,filter] [transform:translateZ(0)]"
      :class="overlayOn ? 'opacity-100' : 'opacity-0'" aria-hidden="true"></div>

    <Transition enter-active-class="transition duration-75 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-75 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="showAuthModal" class="absolute inset-0 bg-zinc-950/40 pointer-events-auto" @click="closeAuthModal">
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      <div v-if="showAuthModal" class="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto">
        <div
          class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-zinc-800">
          <button @click="closeAuthModal"
            class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-xl">
            ✕
          </button>

          <div class="text-center mb-8">
            <h2 class="text-2xl font-black text-gray-900 dark:text-white">회원 선택</h2>
            <p class="text-sm text-gray-500 mt-2">Poticard의 서비스를 이용할 유형을 선택하세요.</p>
          </div>

          <div class="space-y-3">
            <button @click="selectAuthType('personal')"
              class="w-full group p-5 rounded-3xl border-2 border-gray-100 dark:border-zinc-800 hover:border-point-yellow transition-all text-left flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <div>
                <span class="block text-lg font-bold text-gray-900 dark:text-white">개인 회원</span>
                <span class="text-xs text-gray-500">포트폴리오 및 명함 관리</span>
              </div>
            </button>

            <button @click="selectAuthType('business')"
              class="w-full group p-5 rounded-3xl border-2 border-gray-100 dark:border-zinc-800 hover:border-point-yellow transition-all text-left flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏢
              </div>
              <div>
                <span class="block text-lg font-bold text-gray-900 dark:text-white">기업 계정</span>
                <span class="text-xs text-gray-500">채용 및 인재 검색</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
