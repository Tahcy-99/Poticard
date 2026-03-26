<script setup>
import { ref, reactive, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import chatApi from '@/api/chat/index.js'
import namecardApi from '@/api/namecard/index.js'
import { useChatStore } from '@/stores/useChatStore'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

const chatStore = useChatStore()

const route = useRoute()
const router = useRouter()

/* 상태 관리 */
const rooms = reactive([])
const messagesByRoom = ref({})
const activeRoomId = ref(null)
const searchQuery = ref('')
const messageInput = ref('')
const messageArea = ref(null)
const textareaRef = ref(null)

// 방별 메시지 페이지네이션 (page, hasNext)
const messagePageByRoom = ref({})
const isLoadingMore = ref(false)

/* 명함 및 메뉴 관련 상태 */
const isCardOpen = ref(false)
const isFlipped = ref(false)
const isMenuOpen = ref(false)
const opponentCardInfo = ref(null)

function buildCardInfoForNamecards(room, apiPayload = null) {
  const d =
    apiPayload != null && typeof (apiPayload?.data ?? apiPayload) === 'object'
      ? apiPayload?.data ?? apiPayload
      : {}
  const profileRaw = d.profileImage ?? d.avatar ?? room?.avatar ?? ''
  const profileImage =
    profileRaw && !String(profileRaw).startsWith('http')
      ? `/api${String(profileRaw).startsWith('/') ? '' : '/'}${profileRaw}`
      : profileRaw || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  const rawKw = d.keywords ?? d.tags ?? room?.tags ?? []
  const keywords = Array.isArray(rawKw) ? rawKw.map((t) => String(t).replace(/^#/, '')) : []
  const opponentUserId = room?.opponentIdx ?? d.userIdx ?? d.userId ?? d.user_id ?? d.idx
  return {
    userIdx: opponentUserId,
    userId: opponentUserId,
    affiliation: d.affiliation ?? d.company ?? room?.company ?? '',
    title: d.title ?? d.career ?? d.role ?? room?.role ?? '',
    name: d.userName ?? d.name ?? room?.name ?? '상대방',
    description: d.description ?? d.intro ?? room?.intro ?? '',
    profileImage,
    keywords,
    url: d.url ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    address: d.address ?? '',
    color: d.color ?? 'YELLOW',
  }
}

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

const selectedFiles = ref([])
const currentUploadType = ref(null) // 'IMAGE' 또는 'DOC'
const imageInput = ref(null)
const docInput = ref(null)

const isNewChatModalOpen = ref(false)
const newChatTargetEmail = ref('')
const errorMessage = ref('')

let stompClient = null

const getChatRoomList = async () => {
  try {
    const res = await chatApi.chatRoomList()
    const list = res?.data?.content ?? (Array.isArray(res?.data) ? res.data : res)
    if (Array.isArray(list)) {
      rooms.splice(0, rooms.length, ...list)
    }
  } catch (error) {
    console.error('채팅방 목록 로드 실패:', error)
  }
}

// userId 변수에 저장
const userInfoString = localStorage.getItem('USERINFO')
const myUserId = userInfoString ? JSON.parse(userInfoString).idx : null
const myUserEmail = userInfoString ? JSON.parse(userInfoString).email : null

/* 계산된 속성 */
const filteredRooms = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rooms
  return rooms.filter((r) =>
    (r.name + ' ' + r.company + ' ' + r.role + ' ' + (r.tags?.join(' ') || ''))
      .toLowerCase()
      .includes(q),
  )
})

const activeRoom = computed(() => rooms.find((r) => r.id === activeRoomId.value))
const currentMessages = computed(() => messagesByRoom.value[activeRoomId.value] || [])
const isOpponentLeft = computed(() => !!activeRoom.value?.opponentLeft)

/*  로직 */
const scrollBottom = async () => {
  await nextTick()
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight
  }
}

const wsConnect = (roomId, onConnected) => {
  const socket = new SockJS('/ws')
  stompClient = Stomp.over(socket)
  stompClient.debug = null

  stompClient.connect({}, () => {
    // 채팅방 구독: /sub/chat/room/{roomId}
    stompClient.subscribe(`/sub/chat/room/${roomId}`, (tick) => {
      const recv = JSON.parse(tick.body)

      // 읽음 처리 이벤트: 상대가 채팅방 입장 시 백엔드가 전송. 해당 방의 내 메시지를 모두 읽음으로 갱신
      if (recv.type === 'READ_RECEIPT') {
        const roomIdx = Number(recv.roomIdx)
        const list = messagesByRoom.value[roomIdx]
        if (list && list.length) {
          messagesByRoom.value[roomIdx] = list.map((m) =>
            m.who === 'me' ? { ...m, isRead: true } : m,
          )
        }
        return
      }

      // 입장/퇴장 시스템 메시지: contentsType으로 전달 (백엔드 getTypeMsg 결과가 contents에 담김)
      const contentsType = recv.contentsType ?? recv.type
      if (contentsType === 'USER_ENTER' || contentsType === 'USER_LEFT') {
        const roomIdx = Number(recv.roomIdx)
        const text = recv.contents ?? (contentsType === 'USER_LEFT' ? '상대방이 나갔습니다.' : '상대방이 입장하셨습니다.')
        if (!messagesByRoom.value[roomIdx]) messagesByRoom.value[roomIdx] = []
        messagesByRoom.value[roomIdx].push({
          who: 'system',
          text,
          messageId: recv.idx ? `sys-${recv.idx}` : `sys-${roomIdx}-${Date.now()}`,
        })
        if (contentsType === 'USER_LEFT') {
          const r = rooms.find((x) => x.id === roomIdx)
          if (r) r.opponentLeft = true
        }
        if (roomIdx === activeRoomId.value) scrollBottom()
        return
      }

      // 일반 메시지: 백엔드 응답 형식 { idx, roomIdx, senderIdx, senderName, contents, contentsType, isRead, createdAt, updatedAt }
      const receivedRoomId = Number(recv.roomIdx)
      const isMe = Number(recv.senderIdx) === Number(myUserId)

      if (!messagesByRoom.value[receivedRoomId]) {
        messagesByRoom.value[receivedRoomId] = []
      }

      // STOMP 응답도 동일하게 read 필드로 올 수 있음
      const isRead = recv.isRead ?? recv.read ?? false

      messagesByRoom.value[receivedRoomId].push({
        who: isMe ? 'me' : 'them',
        text: recv.contents,
        attachments: recv.attachments || [],
        time: formatMessageTime(recv.createdAt),
        messageId: recv.idx,
        isRead: !!isRead,
      })

      const r = rooms.find((x) => x.id === receivedRoomId)
      if (r) {
        r.content = recv.contents.length > 30 ? recv.contents.slice(0, 30) + '...' : recv.contents
      }

      if (receivedRoomId === activeRoomId.value) {
        scrollBottom()
      }
    })
    onConnected?.()
  })
}

// ActiveRoom 설정
const setActiveRoom = async (roomId) => {
  // 같은 방이면 무시
  if (activeRoomId.value === roomId) return

  // 기존 WebSocket 연결 끊기
  if (stompClient && stompClient.connected) {
    stompClient.disconnect()
    stompClient = null
  }

  // 방 이동
  activeRoomId.value = roomId
  chatStore.setActiveRoom(roomId)
  const room = rooms.find((r) => r.id === roomId)
  if (room) room.unread = 0
  isMenuOpen.value = false

  // 새로운 방으로 웹소켓 새로 연결
  wsConnect(roomId)

  // 채팅방 메시지 불러오기
  await loadChatMessages(roomId)
  scrollBottom()

  // URL을 현재 방과 동기화 (알림 클릭 시 라우트 반영)
  if (room) {
    router.replace({ path: '/chat', query: { senderId: room.opponentIdx } })
    // 해당 방(sender)의 헤더 알림 제거
    window.dispatchEvent(
      new CustomEvent('chat-room-entered', { detail: { senderId: room.opponentIdx } }),
    )
  }
}

// 날짜 포맷팅 함수
const formatMessageTime = (dateString) => {
  if (dateString == null || dateString === '') return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`

  // 오늘 날짜와 비교하여 오전/오후 표시
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? '오후' : '오전'
  const displayHours = hours % 12 || 12
  return `${ampm} ${displayHours}:${String(minutes).padStart(2, '0')}`
}

// 메시지 DTO → 포맷 변환 (contentsType: TEXT, IMAGE, DOC, USER_ENTER, USER_LEFT)
const formatMessage = (msg) => {
  const contentsType = msg.contentsType ?? msg.type
  if (contentsType === 'USER_ENTER' || contentsType === 'USER_LEFT') {
    return {
      who: 'system',
      text: msg.contents ?? (contentsType === 'USER_LEFT' ? '상대방이 나갔습니다.' : '상대방이 입장하셨습니다.'),
      messageId: msg.idx ? `sys-${msg.idx}` : undefined,
    }
  }
  const isMe = Number(msg.senderIdx) === Number(myUserId)
  const isRead = msg.isRead ?? msg.read ?? false
  return {
    who: isMe ? 'me' : 'them',
    text: msg.contents,
    attachments: msg.attachments,
    time: formatMessageTime(msg.createdAt),
    messageId: msg.idx,
    isRead: !!isRead,
  }
}

// 채팅방 메시지 불러오기 - BaseResponse.success(Slice) → data.content
const loadChatMessages = async (roomId, page = 0) => {
  try {
    const res = await chatApi.getChatMessages(roomId, page, 20)

    // 백엔드: createdAt DESC (최신순) → 채팅 UI는 과거→최신 순 필요
    const rawMessages = Array.isArray(res?.data?.content) ? [...res.data.content].reverse() : []
    const formattedMessages = rawMessages.map(formatMessage)

    // 메시지 히스토리에 USER_LEFT가 있으면 opponentLeft 상태 반영
    const hasUserLeft = rawMessages.some(
      (m) => (m.contentsType ?? m.type) === 'USER_LEFT',
    )
    if (hasUserLeft) {
      const r = rooms.find((x) => x.id === roomId)
      if (r) r.opponentLeft = true
    }

    const hasNext = res?.data?.hasNext ?? true

    if (page === 0) {
      messagesByRoom.value[roomId] = formattedMessages
      messagePageByRoom.value[roomId] = { page: 0, hasNext }
      scrollBottom()
    } else {
      // 이전 메시지 prepend + 스크롤 위치 유지
      const el = messageArea.value
      const oldScrollHeight = el?.scrollHeight ?? 0
      const oldScrollTop = el?.scrollTop ?? 0

      const existing = messagesByRoom.value[roomId] || []
      messagesByRoom.value[roomId] = [...formattedMessages, ...existing]
      messagePageByRoom.value[roomId] = { page, hasNext }

      await nextTick()
      if (el) {
        const heightAdded = el.scrollHeight - oldScrollHeight
        el.scrollTop = oldScrollTop + heightAdded
      }
    }
  } catch (error) {
    console.error(`방 ${roomId}의 메시지 로드 실패:`, error)
    if (page === 0) messagesByRoom.value[roomId] = []
  } finally {
    isLoadingMore.value = false
  }
}

// 스크롤 상단 도달 시 이전 메시지 로드 (무한 스크롤)
const onMessageAreaScroll = async () => {
  const el = messageArea.value
  const roomId = activeRoomId.value
  if (!el || !roomId || isLoadingMore.value) return

  const meta = messagePageByRoom.value[roomId]
  if (meta && !meta.hasNext) return

  if (el.scrollTop < 80) {
    isLoadingMore.value = true
    const nextPage = meta ? meta.page + 1 : 1
    await loadChatMessages(roomId, nextPage)
  }
}

const toggleCard = async () => {
  if (!activeRoom.value) {
    alert('채팅방을 선택해주세요.')
    return
  }
  isFlipped.value = false
  const opening = !isCardOpen.value
  isCardOpen.value = opening
  isMenuOpen.value = false
  if (!opening) return
  const room = activeRoom.value
  opponentCardInfo.value = buildCardInfoForNamecards(room, null)
  try {
    if (room.opponentIdx != null) {
      const res = await namecardApi.getSingleNamecard(room.opponentIdx)
      opponentCardInfo.value = buildCardInfoForNamecards(room, res)
    }
  } catch {
    opponentCardInfo.value = buildCardInfoForNamecards(room, null)
  }
}

/* 부가 기능 로직 */
const reportUser = () => {
  if (!activeRoom.value) return
  alert(`${activeRoom.value.name}님을 신고하시겠습니까? 운영팀에서 신속히 검토하겠습니다.`)
  isMenuOpen.value = false
}

const leaveChat = async () => {
  if (!activeRoom.value) return
  if (
    !confirm(
      `'${activeRoom.value.name}'님과의 채팅방을 나가시겠습니까?\n나가면 대화 내용이 모두 삭제됩니다.`,
    )
  ) {
    return
  }

  const roomIdx = activeRoomId.value
  try {
    // 퇴장 메시지 전송 (백엔드가 브로드캐스트 후 leave API 호출)
    sendChatMessage('USER_LEFT', roomIdx, '')
    await chatApi.leaveChatRoom(roomIdx)
    // WebSocket 연결 종료
    if (stompClient && stompClient.connected) {
      stompClient.disconnect()
      stompClient = null
    }
    // 방 목록에서 제거
    const index = rooms.findIndex((r) => r.id === roomIdx)
    if (index > -1) rooms.splice(index, 1)
    // 메시지 캐시 정리
    delete messagesByRoom.value[roomIdx]
    delete messagePageByRoom.value[roomIdx]
    // 활성 방 해제
    activeRoomId.value = null
    chatStore.clearActiveRoom()
    isMenuOpen.value = false
  } catch (error) {
    console.error('채팅방 나가기 실패:', error)
    alert(error?.message || '채팅방 나가기에 실패했습니다.')
  }
}

// ContentsType: TEXT, IMAGE, DOC, USER_LEFT, USER_ENTER
const sendChatMessage = (type, roomIdx, contents = '') => {
  if (!stompClient?.connected) return
  const message = { type, roomIdx, contents }
  stompClient.send('/pub/chat/message', {}, JSON.stringify(message))
}

const sendMessage = () => {
  const text = messageInput.value.trim()
  if (!activeRoomId.value) return alert('채팅방을 먼저 선택해주세요!')
  if (isOpponentLeft.value) return
  if (!text) return

  try {
    sendChatMessage('TEXT', activeRoomId.value, text)
    messageInput.value = ''
    nextTick(() => autosize())
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    alert('메시지 전송에 실패했습니다.')
  }
}

const autosize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}
const adjustTextareaHeight = autosize

const quickReply = (text) => {
  messageInput.value = text
  nextTick(() => {
    autosize()
    textareaRef.value?.focus()
  })
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/* 파일 선택 핸들러 */
const handleFileChange = (event, type) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  const oversized = files.filter((f) => f.size > MAX_FILE_SIZE)
  if (oversized.length) {
    alert(
      `파일 크기는 최대 10MB까지 가능합니다.\n초과된 파일: ${oversized.map((f) => f.name).join(', ')}`,
    )
    event.target.value = ''
    return
  }

  // 타입이 바뀌면 기존 선택 초기화 (섞어서 보내기 방지용)
  if (currentUploadType.value !== type) {
    selectedFiles.value = []
  }

  currentUploadType.value = type
  selectedFiles.value.push(...files)

  // input 초기화 (같은 파일 다시 올릴 수 있도록)
  event.target.value = ''
}

/* 파일 제거 */
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
  if (selectedFiles.value.length === 0) currentUploadType.value = null
}

/* 파일 아이콘 결정 */
const getFileIcon = (file) => {
  if (file.type.startsWith('image/')) return 'fa-solid fa-image'
  if (file.name.endsWith('.pdf')) return 'fa-solid fa-file-pdf'
  return 'fa-solid fa-file-lines'
}

/* 통합 전송 핸들러 */
const handleSend = async () => {
  if (isOpponentLeft.value) return
  // 1. 파일이 있는 경우 파일 업로드 먼저 수행
  if (selectedFiles.value.length > 0) {
    try {
      const formData = new FormData()
      selectedFiles.value.forEach((file) => formData.append('files', file))

      const res = await chatApi.uploadChatFiles(
        activeRoomId.value,
        formData,
        currentUploadType.value,
      )

      // 전송 후 초기화
      selectedFiles.value = []
      currentUploadType.value = null
      if (imageInput.value) imageInput.value.value = ''
      if (docInput.value) docInput.value.value = ''
    } catch (error) {
      alert('파일 전송에 실패했습니다.')
      return
    }
  }

  // 2. 텍스트 메시지가 있는 경우 기존 로직 수행
  if (messageInput.value.trim()) {
    sendMessage() // 기존에 구현된 WebSocket 전송 함수
  }
}

const startVideoCall = () => {
  if (!activeRoomId.value) return alert('대상을 선택해주세요.')
  const opponentIdx = activeRoom.value?.opponentIdx
  const qs = new URLSearchParams({ id: activeRoom.value.id, name: activeRoom.value.name })
  if (opponentIdx != null) qs.set('opponentIdx', opponentIdx)
  window.location.href = `/video-chat?${qs}`
}

// 생성 API 응답으로 room 객체 생성 (목록에 없을 때 추가용)
const buildRoomFromCreateRes = (res) => {
  const d = res?.data ?? res
  const idx = d?.idx ?? res?.idx
  if (!idx) return null
  const opponent = d?.opponentUser ?? d?.guestUser ?? d?.guest ?? {}
  const opponentIdx = opponent?.idx ?? d?.opponentUserIdx ?? d?.guestUserIdx
  const name = opponent?.userName ?? opponent?.name ?? d?.opponentUserName ?? d?.guestUserName ?? '-'
  return {
    id: idx,
    opponentIdx: opponentIdx ?? null,
    name,
    avatar: opponent?.profileImage ?? d?.opponentUserProfileImage ?? null,
    company: opponent?.company ?? d?.opponentUserCompany ?? '',
    role: opponent?.career ?? d?.opponentUserCareer ?? '',
    content: '',
    time: null,
    unread: 0,
    tags: [],
    intro: opponent?.intro ?? '',
    opponentLeft: false,
  }
}

const confirmCreateChat = async () => {
  errorMessage.value = ''
  const guestEmail = newChatTargetEmail.value

  if (!newChatTargetEmail.value) {
    errorMessage.value = '올바른 사용자 Email을 입력해주세요.'
    return
  }

  if (guestEmail === myUserEmail) {
    errorMessage.value = '자기 자신과는 채팅할 수 없습니다.'
    return
  }

  try {
    const res = await chatApi.createChatRoom(guestEmail)
    isNewChatModalOpen.value = false

    const roomIdx = res?.data?.idx ?? res?.idx
    const newRoom = buildRoomFromCreateRes(res)

    await getChatRoomList()

    // 목록에 새 방이 없으면 생성 응답으로 즉시 추가 (실시간 반영)
    if (roomIdx && newRoom && !rooms.some((r) => r.id === roomIdx)) {
      rooms.unshift(newRoom)
    }

    if (roomIdx) {
      await setActiveRoom(roomIdx)
    }
  } catch (error) {
    console.error('채팅방 생성 실패:', error)
    errorMessage.value = '존재하지 않는 사용자이거나 생성에 실패했습니다.'
  }
}

const openNewChatModal = () => {
  newChatTargetEmail.value = ''
  errorMessage.value = ''
  isNewChatModalOpen.value = true
}

const totalUnreadCount = computed(() => {
  const count = rooms.reduce((acc, room) => acc + (room.unread || 0), 0)
  return count > 300 ? '300+' : count
})

// URL의 senderId로 해당 유저와의 채팅방 열기
const openRoomFromSenderId = async () => {
  const sid = Number(route.query.senderId)
  if (!sid || isNaN(sid)) return

  const room = rooms.find((r) => r.opponentIdx === sid)
  if (room) await setActiveRoom(room.id)
}

watch(
  () => route.query.senderId,
  (senderId) => {
    if (senderId && rooms.length) openRoomFromSenderId()
  },
)

// 푸시 페이로드로 room 객체 생성 (목록에 없을 때 추가용)
const buildRoomFromPush = (payload) => {
  const { roomIdx, senderIdx, senderName, senderProfileImage, contents, contentsTime } =
    payload ?? {}
  const rid = Number(roomIdx)
  const sid = Number(senderIdx)
  if (!rid || isNaN(sid)) return null
  return {
    id: rid,
    opponentIdx: sid,
    name: senderName || '알 수 없음',
    avatar: senderProfileImage || null,
    company: '',
    role: '',
    content: contents?.length > 30 ? contents.slice(0, 30) + '...' : contents || '',
    time: contentsTime ?? null,
    unread: 1,
    tags: [],
    intro: '',
    opponentLeft: false,
  }
}

// 푸시/SSE 수신 시 채팅방 목록 실시간 갱신 (공통 핸들러)
const handleNotificationPayload = (payload) => {
  const { roomIdx, senderIdx, senderProfileImage, contents, contentsTime } = payload ?? {}

  const room = rooms.find(
    (r) => r.id === Number(roomIdx) || r.opponentIdx === Number(senderIdx),
  )
  if (room) {
    if (activeRoomId.value !== room.id) {
      room.unread = (room.unread || 0) + 1
      room.content =
        contents?.length > 30 ? contents.slice(0, 30) + '...' : contents || room.content
      room.time = contentsTime ?? room.time ?? room.lastContentsTime
    }
    if (senderProfileImage) room.avatar = senderProfileImage
  } else {
    const newRoom = buildRoomFromPush(payload)
    if (newRoom) {
      rooms.unshift(newRoom)
      const sid = Number(route.query.senderId)
      if (!isNaN(sid) && newRoom.opponentIdx === sid) {
        setActiveRoom(newRoom.id)
      }
    } else {
      getChatRoomList()
    }
  }
}

const onSseNotification = (e) => handleNotificationPayload(e?.detail)
const onPushMessage = (event) => {
  if (event.data?.type === 'PUSH_RECEIVED') handleNotificationPayload(event.data.payload ?? event.data)
}

onMounted(async () => {
  window.addEventListener('sse-notification', onSseNotification)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', onPushMessage)
  }
  await getChatRoomList()
  await openRoomFromSenderId()
})
onUnmounted(() => {
  window.removeEventListener('sse-notification', onSseNotification)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', onPushMessage)
  }
  chatStore.clearActiveRoom()
  if (stompClient) {
    stompClient.disconnect()
  }
})
</script>

<template>
  <div
    class="chat-app bg-pattern max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-40px)] flex flex-col relative overflow-hidden font-sans transition-colors"
  >
    <transition name="fade">
      <div
        v-if="isCardOpen && opponentCardInfo"
        @click.self="toggleCard"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <transition name="card-pop" appear>
          <div class="scene w-full max-w-md aspect-[1.58/1] cursor-pointer group relative">
            <div
              class="card-object w-full h-full relative shadow-2xl rounded-2xl transition-all duration-500"
              :class="{ 'is-flipped': isFlipped }"
              @click="toggleFlip"
            >
              <div class="card-face card-front rounded-2xl overflow-hidden">
                <NamecardsFront :cardInfo="opponentCardInfo" />
                <div
                  class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 dark:text-zinc-500 animate-pulse pointer-events-none"
                >
                  Click to flip <i class="fa-solid fa-rotate ml-1"></i>
                </div>
              </div>
              <div class="card-face card-back rounded-2xl overflow-hidden">
                <NamecardsBack :cardInfo="opponentCardInfo" :hidePortfolioBtn="false" />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <header class="flex items-center justify-between mb-6 shrink-0">
      <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">채팅</h1>
      <div class="flex gap-2">
        <button
          @click="openNewChatModal"
          class="btn-icon bg-amber-400 hover:scale-105 transition-transform"
        >
          <i class="fa-solid fa-plus text-amber-950"></i>
        </button>
        <transition name="fade">
          <div
            v-if="isNewChatModalOpen"
            @click.self="isNewChatModalOpen = false"
            class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <transition name="card-pop" appear>
              <div
                class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
              >
                <div class="p-8 pb-4 text-center">
                  <div
                    class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600"
                  >
                    <i class="fa-solid fa-comments text-2xl"></i>
                  </div>
                  <h3 class="text-xl font-black text-slate-900 dark:text-white">새 채팅 시작</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    대화하고 싶은 사용자의 고유 ID를<br />입력하여 연결해보세요.
                  </p>
                </div>

                <div class="p-8 pt-0">
                  <div class="relative group mb-6">
                    <i
                      class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                    ></i>
                    <input
                      v-model="newChatTargetEmail"
                      type="text"
                      placeholder="사용자 Email"
                      @input="errorMessage = ''"
                      @keyup.enter="confirmCreateChat"
                      :class="[
                        'w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm transition-all outline-none dark:text-white',
                        errorMessage
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-100 dark:border-slate-700 focus:border-amber-400',
                      ]"
                    />
                  </div>

                  <div class="h-6 mb-4">
                    <transition name="fade">
                      <p
                        v-if="errorMessage"
                        class="text-xs text-rose-500 font-bold flex items-center gap-1.5 px-1"
                      >
                        <i class="fa-solid fa-circle-exclamation"></i>
                        {{ errorMessage }}
                      </p>
                    </transition>
                  </div>

                  <div class="flex gap-3">
                    <button
                      @click="isNewChatModalOpen = false"
                      class="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      취소
                    </button>
                    <button
                      @click="confirmCreateChat"
                      class="flex-[2] py-4 px-6 bg-amber-400 text-amber-950 font-black rounded-2xl hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-400/20 transition-all active:scale-95"
                    >
                      대화 시작하기
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-12 gap-6 min-h-0">
      <aside class="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-0"
        >
          <div class="p-5 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-widest"
                  >Chat List</span
                >
                <span
                  class="px-2 py-0.5 ml-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold"
                  >{{ filteredRooms.length }}</span
                >
              </div>
              <span
                v-if="totalUnreadCount !== 0"
                class="px-1.5 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-black"
              >
                {{ totalUnreadCount }}
              </span>
            </div>
            <div class="relative">
              <i
                class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              ></i>
              <input
                v-model="searchQuery"
                class="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-amber-400 transition-all outline-none dark:text-white"
                placeholder="이름, 회사 또는 키워드"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2 thin-scroll">
            <button
              v-for="room in filteredRooms"
              :key="room.id"
              @click="setActiveRoom(room.id)"
              :class="[
                'room-card w-full text-left p-4 rounded-2xl transition-all flex items-start gap-4 border',
                activeRoomId === room.id
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 shadow-md'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent',
              ]"
            >
              <div class="relative shrink-0">
                <div class="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    :src="room.avatar || '/default-avatar.png'"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  v-if="room.unread > 0"
                  class="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                >
                  {{ room.unread > 99 ? '99+' : room.unread }}
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex justify-between items-center mb-0.5">
                  <h3 class="font-bold truncate text-slate-900 dark:text-slate-100">
                    {{ room.name }}
                  </h3>
                  <span class="text-[10px] text-slate-400 font-medium">
                    {{ formatMessageTime(room.time) }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-2">
                  {{ room.company }} · {{ room.role }}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-300 truncate font-medium">
                  {{ room.content }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <section
        class="col-span-12 lg:col-span-8 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <template v-if="activeRoomId">
          <div
            class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                <img :src="activeRoom.avatar" class="w-full h-full object-cover" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="font-black text-slate-900 dark:text-white">{{ activeRoom.name }}</h2>
                  <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ activeRoom.company }} · {{ activeRoom.role }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="startVideoCall" class="btn-action" title="화상 채팅">
                <i class="fa-solid fa-video"></i>
              </button>
              <button
                @click="toggleCard"
                class="btn-action bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                title="명함 정보"
              >
                <i class="fa-solid fa-address-card"></i>
              </button>

              <div class="relative">
                <button
                  @click="isMenuOpen = !isMenuOpen"
                  class="btn-action"
                  :class="{ 'bg-slate-100 dark:bg-slate-800': isMenuOpen }"
                >
                  <i class="fa-solid fa-ellipsis-vertical"></i>
                </button>

                <transition name="fade-in">
                  <div
                    v-if="isMenuOpen"
                    class="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                  >
                    <button
                      @click="reportUser"
                      class="w-full px-4 py-3 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      <i class="fa-solid fa-triangle-exclamation text-amber-500"></i> 신고하기
                    </button>
                    <div class="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                    <button
                      @click="leaveChat"
                      class="w-full px-4 py-3 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-3"
                    >
                      <i class="fa-solid fa-door-open"></i> 채팅방 나가기
                    </button>
                  </div>
                </transition>

                <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>
              </div>
            </div>
          </div>

          <div
            ref="messageArea"
            class="flex-1 overflow-y-auto p-6 space-y-6 thin-scroll bg-slate-50/50 dark:bg-slate-950/20"
            @scroll="onMessageAreaScroll"
          >
            <div
              v-if="isLoadingMore"
              class="flex justify-center py-3 text-xs text-slate-400"
            >
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>이전 메시지 불러오는 중...
            </div>
            <div
              v-for="(m, idx) in currentMessages"
              :key="m.messageId ?? idx"
              :class="[
                'flex w-full',
                m.who === 'system' ? 'justify-center' : m.who === 'me' ? 'justify-end' : 'justify-start',
              ]"
            >
              <div
                v-if="m.who === 'system'"
                class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                {{ m.text }}
              </div>
              <div
                v-else
                :class="['max-w-[75%] flex flex-col', m.who === 'me' ? 'items-end' : 'items-start']"
              >
                <div :class="['bubble', m.who === 'me' ? 'bubble-me' : 'bubble-them']">
                  <p v-if="m.text" class="whitespace-pre-wrap">{{ m.text }}</p>

                  <div
                    v-if="m.attachments && m.attachments.length > 0"
                    class="mt-2 flex flex-col gap-2"
                  >
                    <div v-for="file in m.attachments" :key="file.idx">
                      <template v-if="file.fileType && file.fileType.startsWith('image/')">
                        <img
                          :src="file.filePath"
                          class="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          @click="window.open(file.filePath, '_blank')"
                        />
                      </template>

                      <template v-else>
                        <a
                          :href="file.filePath"
                          target="_blank"
                          class="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/10 rounded-lg hover:bg-black/10 transition-colors no-underline"
                        >
                          <i class="fa-solid fa-file-arrow-down text-lg text-slate-500"></i>
                          <div class="flex flex-col overflow-hidden text-left">
                            <span
                              class="text-xs font-medium truncate max-w-[150px] dark:text-slate-200 text-slate-700"
                            >
                              {{ file.fileName }}
                            </span>
                            <span class="text-[10px] opacity-60 dark:text-slate-400 text-slate-500">
                              {{ (file.fileSize / 1024).toFixed(1) }} KB
                            </span>
                          </div>
                        </a>
                      </template>
                    </div>
                  </div>
                </div>
                <span
                  v-if="m.who !== 'system'"
                  class="text-[10px] mt-1.5 text-slate-400 font-bold px-1 uppercase"
                >
                  {{ m.time }}
                  <template v-if="m.who === 'me'"> · {{ m.isRead ? '읽음' : '안읽음' }} </template>
                </span>
              </div>
            </div>
          </div>

          <div
            class="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0"
          >
            <div
              v-if="!isOpponentLeft"
              class="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar"
            >
              <button @click="quickReply('안녕하세요! 반갑습니다 👋')" class="btn-tag">
                👋 인사
              </button>
              <button
                @click="quickReply('포트폴리오 내용에 대해 궁금한 점이 있어요.')"
                class="btn-tag"
              >
                ❓ 질문
              </button>
              <button @click="quickReply('편하신 시간에 대화 가능할까요?')" class="btn-tag">
                📅 제안
              </button>
              <button @click="quickReply('감사합니다!')" class="btn-tag">🙏 감사</button>
            </div>
            <p
              v-else
              class="mb-4 text-sm text-slate-500 dark:text-slate-400 text-center"
            >
              상대방이 나갔으므로 채팅을 입력할 수 없습니다.
            </p>

            <div
              v-if="selectedFiles.length > 0 && !isOpponentLeft"
              class="flex flex-wrap gap-2 mb-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-600"
            >
              <div v-for="(file, index) in selectedFiles" :key="index" class="relative group">
                <div
                  class="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm text-[11px]"
                >
                  <i :class="getFileIcon(file)" class="text-amber-500"></i>
                  <span class="max-w-[80px] truncate dark:text-slate-200">{{ file.name }}</span>
                  <button @click="removeFile(index)" class="text-slate-400 hover:text-red-500">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>

            <div
              :class="[
                'flex items-end gap-3 p-2 rounded-2xl border transition-all',
                isOpponentLeft
                  ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/50 opacity-75'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 focus-within:border-amber-400',
              ]"
            >
              <div v-if="!isOpponentLeft" class="flex items-center">
                <button
                  @click="$refs.docInput?.click()"
                  class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                  title="문서 추가"
                >
                  <i class="fa-solid fa-file-lines"></i>
                </button>
                <div class="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                <button
                  @click="$refs.imageInput?.click()"
                  class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
                  title="이미지 추가"
                >
                  <i class="fa-solid fa-image"></i>
                </button>
              </div>

              <input
                type="file"
                ref="imageInput"
                class="hidden"
                accept="image/*"
                multiple
                @change="handleFileChange($event, 'IMAGE')"
              />
              <input
                type="file"
                ref="docInput"
                class="hidden"
                accept=".pdf, .doc, .docx, .txt, .hwpx, .hwp"
                multiple
                @change="handleFileChange($event, 'DOC')"
              />

              <textarea
                ref="textareaRef"
                v-model="messageInput"
                :disabled="isOpponentLeft"
                @input="adjustTextareaHeight"
                @keydown.enter.prevent="handleSend"
                rows="1"
                class="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 resize-none max-h-32 dark:text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-70"
                :placeholder="
                  isOpponentLeft ? '상대방이 나갔으므로 채팅을 입력할 수 없습니다.' : '메시지를 입력하세요...'
                "
              ></textarea>

              <button
                @click="handleSend"
                :disabled="isOpponentLeft"
                class="w-10 h-10 flex-shrink-0 bg-amber-400 hover:bg-amber-500 rounded-xl flex items-center justify-center text-amber-950 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-400"
              >
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </template>

        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center"
        >
          <div
            class="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"
          >
            <i class="fa-solid fa-comments text-4xl opacity-20"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            대화를 시작해보세요
          </h3>
          <p class="text-sm max-w-xs leading-relaxed">
            상대방을 선택하여 새로운 프로젝트나 커리어나눔을 시작할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}

/* 명함 플립 (PortfolioView.vue와 동일) */
.scene {
  perspective: 1000px;
}

.card-object {
  transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.card-object.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-front {
  transform: rotateY(0deg);
}

/* Custom Scrollbar */
.thin-scroll::-webkit-scrollbar {
  width: 5px;
}

.thin-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.dark .thin-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Custom Component Styles */
.btn-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.dark .btn-action:hover {
  background: #1e293b;
  color: #f8fafc;
}

.btn-tag {
  white-space: nowrap;
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-tag:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #0f172a;
}

.dark .btn-tag {
  background: #1e293b;
  color: #94a3b8;
}

.dark .btn-tag:hover {
  background: #334155;
  color: #f8fafc;
}

/* Chat Bubbles */
.bubble {
  padding: 12px 18px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 22px;
  position: relative;
  word-break: break-all;
}

.bubble-me {
  background: #fbbf24;
  color: #451a03;
  border-bottom-right-radius: 4px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

.bubble-them {
  background: white;
  color: #1e293b;
  border-bottom-left-radius: 4px;
  border: 1px solid #e2e8f0;
}

.dark .bubble-them {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #334155;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.card-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-pop-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

/* 드롭다운 애니메이션 */
.fade-in-enter-active {
  transition: all 0.2s ease-out;
}

.fade-in-leave-active {
  transition: all 0.15s ease-in;
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.fade-in-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
