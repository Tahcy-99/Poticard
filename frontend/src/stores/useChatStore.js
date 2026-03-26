import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 채팅방 화면에서 현재 보고 있는 roomId (SSE 알림 시 헤더 스킵 판단용) */
export const useChatStore = defineStore('chat', () => {
  const activeRoomId = ref(null)

  const setActiveRoom = (roomId) => {
    activeRoomId.value = roomId
  }

  const clearActiveRoom = () => {
    activeRoomId.value = null
  }

  return { activeRoomId, setActiveRoom, clearActiveRoom }
})
