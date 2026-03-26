<!-- src/views/VideoChat.vue -->
<template>
  <div class="page">
    <video ref="remoteVideoRef" id="remoteVideo" autoplay playsinline></video>

    <div id="sharePreviewContainer" :style="{ display: sharePreviewVisible ? 'block' : 'none' }"
      :class="{ 'full-size': sharePreviewFullSize }" @click="toggleShareSize">
      <video ref="sharePreviewVideoRef" id="sharePreviewVideo" autoplay playsinline muted></video>
    </div>

    <div class="local-video-container" id="localContainer" :class="{ enlarged: localEnlarged }">
      <video ref="localVideoRef" class="local-video" id="localVideo" autoplay muted playsinline></video>
      <button type="button" class="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-xl text-white"
        @click="toggleEnlarge">
        <i class="fa-solid fa-maximize"></i>
      </button>
    </div>

    <aside class="side-panel" id="sidePanel" :class="{ collapsed: sideCollapsed }">
      <div class="p-6 text-zinc-100">
        <div class="flex items-center gap-4 mb-6 text-left min-w-0">
          <div class="w-12 h-12 shrink-0 bg-zinc-700/80 rounded-2xl overflow-hidden ring-1 ring-white/10">
            <img :src="partnerInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
              class="w-full h-full object-cover" :alt="partnerInfo?.name || 'avatar'" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="font-black text-lg text-white truncate" :title="partnerInfo?.name || '상대방'">
              {{ partnerInfo?.name || '상대방' }}
            </h2>
            <p class="text-[10px] text-yellow-400 font-bold uppercase tracking-wide mt-0.5">Live Session</p>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" @click="openModal('cardModal')"
            class="w-full py-3 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 shadow-inner transition-colors">
            명함 상세보기
          </button>
        </div>
      </div>

      <button type="button" class="toggle-trigger" @click="toggleSidePanel">
        <i id="toggleIcon" :class="sideCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
      </button>
    </aside>

    <nav class="controls">
      <button id="micBtn" type="button" class="control-btn" :class="{ on: micOn }" @click="toggleStatus('mic')">
        <i :class="micOn ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash'"></i>
        <span class="status-label">{{ micOn ? 'ON' : 'OFF' }}</span>
      </button>

      <button id="camBtn" type="button" class="control-btn" :class="{ on: camOn }" @click="toggleStatus('cam')">
        <i :class="camOn ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'"></i>
        <span class="status-label">{{ camOn ? 'ON' : 'OFF' }}</span>
      </button>

      <button id="shareBtn" type="button" class="control-btn" :class="{ on: screenStream !== null }"
        @click="handleShareClick">
        <i class="fa-solid fa-desktop"></i><span class="status-label">SHARE</span>
      </button>

      <button id="setBtn" type="button" class="control-btn" @click="openModal('settingsModal')">
        <i class="fa-solid fa-gear"></i><span class="status-label">SETTING</span>
      </button>

      <button id="callBtn" type="button" class="control-btn" @click="makeCall" :disabled="callDisabled">
        <i class="fa-solid fa-phone"></i><span class="status-label">CALL</span>
      </button>

      <div class="w-px h-10 bg-white/10 mx-1"></div>

      <button type="button" class="control-btn" style="background: #ef4444; color: white; border: none" @click="goExit">
        <i class="fa-solid fa-phone-slash"></i><span class="status-label">EXIT</span>
      </button>
    </nav>

    <!-- Settings Modal -->
    <div id="settingsModal" class="modal" :class="{ open: modals.settingsModal }"
      @click="onBackdropClick('settingsModal', $event)">
      <div class="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black flex items-center gap-2">
            <i class="fa-solid fa-gear text-yellow-400"></i> 환경설정
          </h3>
          <button type="button" @click="closeModal('settingsModal')" class="text-zinc-500 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="space-y-4 text-left">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 mb-2 block uppercase">Camera Source</label>
            <select class="w-full bg-zinc-800 p-3 rounded-xl text-sm border-none">
              <option>Default</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-zinc-500 mb-2 block uppercase">Audio Source</label>
            <select class="w-full bg-zinc-800 p-3 rounded-xl text-sm border-none">
              <option>Default</option>
            </select>
          </div>
        </div>
        <button type="button" @click="closeModal('settingsModal')"
          class="w-full mt-8 py-4 bg-yellow-400 text-black rounded-2xl font-black">
          설정 저장
        </button>
      </div>
    </div>

    <!-- Share Modal -->
    <div id="shareModal" class="modal" :class="{ open: modals.shareModal }"
      @click="onBackdropClick('shareModal', $event)">
      <div class="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-md text-center relative">
        <button type="button" @click="closeModal('shareModal')"
          class="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div
          class="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-yellow-400 text-2xl">
          <i class="fa-solid fa-desktop"></i>
        </div>
        <h3 class="text-xl font-black mb-2">화면 공유 시작</h3>
        <p class="text-sm text-zinc-500 mb-8 leading-relaxed">
          공유할 브라우저 탭이나 프레젠테이션<br />파일을 선택해 주세요.
        </p>
        <button type="button" @click="startScreenShare"
          class="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black">
          공유 할 탭 선택하기
        </button>
      </div>
    </div>

    <!-- Card Modal (PortfolioView.vue 명함 플립과 동일 구조) -->
    <div id="cardModal" class="modal" :class="{ open: modals.cardModal }" @click="onBackdropClick('cardModal', $event)">
      <div v-if="partnerCardInfo" class="scene w-full max-w-md aspect-[1.58/1] cursor-pointer group">
        <div
          class="card-object w-full h-full relative shadow-2xl rounded-2xl transition-all duration-500"
          :class="{ 'is-flipped': cardFlipped }"
          @click="toggleFlip"
        >
          <div class="card-face card-front rounded-2xl overflow-hidden bg-white">
            <NamecardsFront :cardInfo="partnerCardInfo" />
            <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
              Click to flip <i class="fa-solid fa-rotate ml-1"></i>
            </div>
          </div>
          <div class="card-face card-back rounded-2xl overflow-hidden">
            <NamecardsBack :cardInfo="partnerCardInfo" :hidePortfolioBtn="false" />
          </div>
        </div>
      </div>
    </div>

    <!-- Debug log -->
    <div id="log">{{ logText }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import chatApi from '@/api/chat/index.js'
import namecardApi from '@/api/namecard/index.js'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'

const senderId = Math.random().toString(36).substring(2, 9)

/* refs */
const remoteVideoRef = ref(null)
const localVideoRef = ref(null)
const sharePreviewVideoRef = ref(null)

/* router */
const router = useRouter()
const route = useRoute()

/* 상대방 정보 */
const partnerInfo = ref(null)
const partnerCardInfo = ref(null)

function buildCardInfoForVideo(room, apiPayload = null) {
  const d =
    apiPayload != null && typeof (apiPayload?.data ?? apiPayload) === 'object'
      ? apiPayload?.data ?? apiPayload
      : {}
  const qOid =
    route.query.opponentIdx != null && String(route.query.opponentIdx) !== ''
      ? Number(route.query.opponentIdx)
      : null
  const profileRaw = d.profileImage ?? d.avatar ?? room?.avatar ?? ''
  const profileImage =
    profileRaw && !String(profileRaw).startsWith('http')
      ? `/api${String(profileRaw).startsWith('/') ? '' : '/'}${profileRaw}`
      : profileRaw || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  const rawKw = d.keywords ?? d.tags ?? room?.tags ?? []
  const keywords = Array.isArray(rawKw) ? rawKw.map((t) => String(t).replace(/^#/, '')) : []
  const opponentUserId =
    (Number.isFinite(qOid) ? qOid : undefined) ??
    room?.opponentIdx ??
    d.userIdx ??
    d.userId ??
    d.user_id ??
    d.idx
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

async function loadPartnerCardInfo() {
  const room = partnerInfo.value
  const qOid =
    route.query.opponentIdx != null && String(route.query.opponentIdx) !== ''
      ? Number(route.query.opponentIdx)
      : null
  const opponentIdx = Number.isFinite(qOid) ? qOid : room?.opponentIdx
  partnerCardInfo.value = buildCardInfoForVideo(room, null)
  try {
    if (opponentIdx != null && !Number.isNaN(Number(opponentIdx))) {
      const res = await namecardApi.getSingleNamecard(Number(opponentIdx))
      partnerCardInfo.value = buildCardInfoForVideo(room, res)
    }
  } catch {
    partnerCardInfo.value = buildCardInfoForVideo(room, null)
  }
}

/* UI state */
const micOn = ref(true)
const camOn = ref(true)
const sideCollapsed = ref(false)
const localEnlarged = ref(false)
const cardFlipped = ref(false)

function toggleFlip() {
  cardFlipped.value = !cardFlipped.value
}

const sharePreviewVisible = ref(false)
const sharePreviewFullSize = ref(false)

const modals = ref({
  settingsModal: false,
  shareModal: false,
  cardModal: false,
  authModal: false,
})

const portfolios = ref([])

/* 포트폴리오 로드 */
async function loadPortfolios() {
  try {
    const res = await chatApi.loadPortfolios()

    if (res && res.data && Array.isArray(res.data)) {
      portfolios.value = res.data.map((item, index) => ({
        id: index + 1,
        title: item.portfolio_name || '',
        desc: item.portfolio_summary || '',
        tags: item.keywords ? item.keywords.map(tag => tag.replace('#', '')) : []
      }))
      console.log('포트폴리오 로드 완료:', portfolios.value)
    } else if (Array.isArray(res)) {
      portfolios.value = res.map((item, index) => ({
        id: index + 1,
        title: item.portfolio_name || '',
        desc: item.portfolio_summary || '',
        tags: item.keywords ? item.keywords.map(tag => tag.replace('#', '')) : []
      }))
      console.log('포트폴리오 로드 완료 (배열 형식):', portfolios.value)
    }
  } catch (error) {
    console.error('포트폴리오 로드 실패:', error)
  }
}
const selectedIds = ref(new Set())

const selectionCountText = computed(
  () => `${selectedIds.value.size}개의 프로젝트가 선택되었습니다.`,
)

/* debug log */
const logText = ref('')
function log(m) {
  console.log(m)
  logText.value = (logText.value + `\n> ${m}`).trim()
}

/* WebRTC */
const localStream = ref(null)
const screenStream = ref(null)

const stompClientRef = ref(null)
const pc = ref(null)

const wsOpen = ref(false)

const roomIdx = computed(() => (route.query.id ? Number(route.query.id) : null))
// google STUN서버
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

const callDisabled = computed(() => !wsOpen.value || roomIdx.value == null)

function initWebSocket() {
  if (stompClientRef.value?.connected) return
  if (roomIdx.value == null) return

  const socket = new SockJS('/ws')
  const stomp = Stomp.over(socket)
  stomp.debug = null
  stompClientRef.value = stomp

  stomp.connect({}, () => {
    wsOpen.value = true
    log(`STOMP connected (room ${roomIdx.value} /sub/webrtc)`)

    stomp.subscribe('/sub/webrtc', async (message) => {
      const data = JSON.parse(message.body)
      if (data.senderId === senderId) return
      if (Number(data.roomIdx) !== Number(roomIdx.value)) return

      try {
        if (data.type === 'offer') await handleOffer(data.offer)
        else if (data.type === 'answer') await handleAnswer(data.answer)
        else if (data.type === 'candidate') await handleCandidate(data.candidate)
      } catch (err) {
        console.error(err)
        log(`Signal handle error: ${err?.message || err}`)
      }
    })
  })
}

function createPeerConnectionIfNeeded() {
  if (pc.value) return

  pc.value = new RTCPeerConnection(rtcConfig)

  // 로컬 트랙 추가 (없으면 수신 전용)
  if (localStream.value) {
    localStream.value.getTracks().forEach((track) => pc.value.addTrack(track, localStream.value))
  }

  // 상대방 트랙 수신
  pc.value.ontrack = (e) => {
    const [remoteStream] = e.streams
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = remoteStream
    log('Remote stream received')
  }

  // ICE 후보 전달
  pc.value.onicecandidate = (e) => {
    if (e.candidate && stompClientRef.value?.connected && roomIdx.value != null) {
      stompClientRef.value.send(
        `/pub/${roomIdx.value}/webrtc`,
        {},
        JSON.stringify({
          type: 'candidate',
          candidate: e.candidate,
          senderId,
          roomIdx: roomIdx.value,
        }),
      )
    }
  }

  pc.value.onconnectionstatechange = () => log(`PC state: ${pc.value.connectionState}`)
}

async function makeCall() {
  if (!localStream.value) {
    try {
      await startLocalMedia()
    } catch (e) {
      console.error(e)
      const isPermissionDenied =
        e?.name === 'NotAllowedError' || e?.message?.includes('Permission denied')
      if (isPermissionDenied) {
        alert('카메라/마이크 권한을 허용해주세요.')
      } else {
        alert(
          '카메라/마이크에 접근할 수 없습니다. 다른 탭이나 앱에서 사용 중이 아닌지 확인한 뒤 다시 시도해 주세요.',
        )
      }
      return
    }
  }
  initWebSocket()
  createPeerConnectionIfNeeded()

  const offer = await pc.value.createOffer()
  await pc.value.setLocalDescription(offer)

  stompClientRef.value.send(
    `/pub/${roomIdx.value}/webrtc`,
    {},
    JSON.stringify({ type: 'offer', offer, senderId, roomIdx: roomIdx.value }),
  )
  log('Offer sent')
}

async function handleOffer(offer) {
  if (!localStream.value) {
    try {
      await startLocalMedia()
    } catch (e) {
      console.warn('로컬 미디어 없이 수신 전용으로 연결합니다.', e)
      log('수신 전용 모드 (카메라 없이 상대 영상만 수신)')
    }
  }

  initWebSocket()
  createPeerConnectionIfNeeded()

  await pc.value.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await pc.value.createAnswer()
  await pc.value.setLocalDescription(answer)

  stompClientRef.value.send(
    `/pub/${roomIdx.value}/webrtc`,
    {},
    JSON.stringify({ type: 'answer', answer, senderId, roomIdx: roomIdx.value }),
  )
  log('Offer received → Answer sent')
}

async function handleAnswer(answer) {
  await pc.value.setRemoteDescription(new RTCSessionDescription(answer))
  log('Answer received → Connected')
}

async function handleCandidate(candidate) {
  if (!pc.value) return
  await pc.value.addIceCandidate(new RTCIceCandidate(candidate))
}

async function startLocalMedia() {
  localStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  if (localVideoRef.value) localVideoRef.value.srcObject = localStream.value
  log('Local media ready')

  const at = localStream.value.getAudioTracks()[0]
  const vt = localStream.value.getVideoTracks()[0]
  if (at) at.enabled = micOn.value
  if (vt) vt.enabled = camOn.value
}

async function startScreenShare() {
  try {
    screenStream.value = await navigator.mediaDevices.getDisplayMedia({ video: true })
    if (sharePreviewVideoRef.value) sharePreviewVideoRef.value.srcObject = screenStream.value
    sharePreviewVisible.value = true

    if (pc.value) {
      const sender = pc.value.getSenders().find((s) => s.track && s.track.kind === 'video')
      const newTrack = screenStream.value.getVideoTracks()[0]
      if (sender && newTrack) await sender.replaceTrack(newTrack)
    }
    screenStream.value.getVideoTracks()[0].onended = () => stopScreenShare()

    closeModal('shareModal')
  } catch (err) {
    console.error(err)
    log(`Screen share error: ${err?.message || err}`)
  }
}

async function stopScreenShare() {
  if (screenStream.value) {
    screenStream.value.getTracks().forEach((t) => t.stop())
    screenStream.value = null
  }
  sharePreviewVisible.value = false
  sharePreviewFullSize.value = false

  if (pc.value && localStream.value) {
    const sender = pc.value.getSenders().find((s) => s.track && s.track.kind === 'video')
    const camTrack = localStream.value.getVideoTracks()[0]
    if (sender && camTrack) await sender.replaceTrack(camTrack)
  }
}

/** UI handlers (same behavior) */
function toggleStatus(type) {
  if (type === 'mic') {
    micOn.value = !micOn.value
    const t = localStream.value?.getAudioTracks?.()[0]
    if (t) t.enabled = micOn.value
  } else {
    camOn.value = !camOn.value
    const t = localStream.value?.getVideoTracks?.()[0]
    if (t) t.enabled = camOn.value
  }
}

function handleShareClick() {
  if (screenStream.value) {
    stopScreenShare()
  } else {
    openModal('shareModal')
  }
}

function toggleShareSize() {
  if (sharePreviewVisible.value) sharePreviewFullSize.value = !sharePreviewFullSize.value
}

async function openModal(id) {
  modals.value[id] = true
  if (id === 'authModal') {
    await loadPortfolios()
  }
  if (id === 'cardModal') {
    cardFlipped.value = false
    await loadPartnerCardInfo()
  }
}

function closeModal(id) {
  modals.value[id] = false
}

function onBackdropClick(id, e) {
  if (e.target?.id === id) closeModal(id)
}

function toggleSidePanel() {
  sideCollapsed.value = !sideCollapsed.value
}

function toggleEnlarge() {
  localEnlarged.value = !localEnlarged.value
}

function togglePortfolio(id) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

function onPortfolioWheel(e) {
  const el = e.currentTarget
  if (el) el.scrollLeft += e.deltaY
}

function confirmAuth() {
  alert('부여되었습니다.')
  closeModal('authModal')
}

function goExit() {
  window.location.href = '/chat'
}

/* 상대방 정보 가져오기 */
async function loadPartnerInfo() {
  try {
    const roomId = route.query.id ? Number(route.query.id) : null
    if (!roomId) {
      console.warn('roomId가 없습니다.')
      return
    }

    const res = await chatApi.chatRoomList()
    const list = res?.data?.content ?? (Array.isArray(res?.data) ? res.data : res)
    if (list && Array.isArray(list)) {
      const room = list.find((r) => r.id === roomId)
      if (room) {
        partnerInfo.value = room
        console.log('상대방 정보 로드 완료:', room)
      } else {
        console.warn(`roomId ${roomId}에 해당하는 방을 찾을 수 없습니다.`)
      }
    } else if (Array.isArray(res)) {
      const room = res.find((r) => r.id === roomId)
      if (room) {
        partnerInfo.value = room
        console.log('상대방 정보 로드 완료:', room)
      }
    }
  } catch (error) {
    console.error('상대방 정보 로드 실패:', error)
  }
}

/* lifecycle */
onMounted(async () => {
  // 상대방 정보 가져오기
  await loadPartnerInfo()
  initWebSocket()
  // 카메라/마이크는 CALL 버튼 클릭 시 요청 (사용자 동작 후에 요청)
})

onBeforeUnmount(() => {
  try {
    if (stompClientRef.value?.connected) stompClientRef.value.disconnect()
  } catch { }
  try {
    if (pc.value) pc.value.close()
  } catch { }

  try {
    if (screenStream.value) screenStream.value.getTracks().forEach((t) => t.stop())
  } catch { }
  try {
    if (localStream.value) localStream.value.getTracks().forEach((t) => t.stop())
  } catch { }
})
</script>

<style scoped>
:root {
  --bg: #000000;
  --card: #121214;
  --text: #fafafa;
  --accent: #facc15;
  --danger: #ef4444;
  --border: rgba(255, 255, 255, 0.08);
}

.page {
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
  margin: 0;
  width: 100%;
  height: 100%;
}

#remoteVideo {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  background-color: #000000;
}

#sharePreviewContainer {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 200px;
  aspect-ratio: 16/9;
  border-radius: 12px;
  border: 2px solid var(--accent);
  background: #000;
  z-index: 200;
  display: none;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

#sharePreviewContainer.full-size {
  width: calc(100vw - 48px);
  height: calc(100vh - 120px);
  top: 24px;
  right: 24px;
  z-index: 250;
}

#sharePreviewVideo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-video-container {
  position: fixed;
  bottom: 20px;
  right: 24px;
  width: 240px;
  z-index: 100;
  transition: width 0.3s ease;
}

.local-video-container.enlarged {
  width: 440px;
}

.local-video {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 16px;
  border: 2px solid var(--accent);
  object-fit: cover;
  background: #000;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
}

.side-panel {
  position: fixed;
  top: 0;
  left: 24px;
  width: 320px;
  background: rgba(18, 18, 20, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 0 0 20px 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  transition: transform 0.4s ease;
  z-index: 50;
}

.side-panel.collapsed {
  transform: translateY(-100%);
}

.toggle-trigger {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 54px;
  height: 32px;
  background: rgba(18, 18, 20, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--accent);
}

.controls {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(20px);
  padding: 14px 24px;
  border-radius: 28px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 150;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #71717a;
  border: 1px solid var(--border);
}

.control-btn.on {
  background: var(--accent);
  color: #000;
  border: none;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.status-label {
  font-size: 9px;
  font-weight: 800;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal.open {
  display: flex;
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

.portfolio-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}

.portfolio-scroll::-webkit-scrollbar {
  height: 6px;
}

.portfolio-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.portfolio-scroll::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 10px;
}

.portfolio-item {
  flex: 0 0 320px;
  background: #1c1c1f;
  border-radius: 24px;
  border: 3px solid transparent;
  padding: 28px;
  cursor: pointer;
}

.portfolio-item.selected {
  border-color: var(--accent);
  background: rgba(250, 204, 21, 0.05);
}

/* 디버그 로그 (필요없으면 display:none) */
#log {
  position: none;
  top: 16px;
  left: 16px;
  z-index: 999;
  font-size: 11px;
  color: #9ca3af;
  white-space: pre-line;
  pointer-events: none;
}
</style>
