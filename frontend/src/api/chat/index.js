import { apiFetch } from '../../plugins/interceptor.js'

// API 응답의 room 객체를 템플릿용으로 매핑
const mapRoom = (room) => ({
  id: room.idx,
  opponentIdx: room.opponentUserIdx,
  name: room.opponentUserName || '-',
  avatar: room.opponentUserProfileImage || room.opponentProfileImg || null,
  company: room.opponentUserCompany || room.company || '',
  role: room.opponentUserCareer || room.role || '',
  content: room.lastContents || room.lastContent || '',
  time: room.lastContentsTime || room.lastContentTime || null,
  unread: room.unreadCount ?? room.unread ?? 0,
  tags: room.tags || [],
  intro: room.intro || '',
  opponentLeft: !!room.opponentLeft,
})

// 채팅방 목록 - Slice<ChatRoomDto.ListRes> 응답
const chatRoomList = async (page = 0, size = 10) => {
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    const res = await apiFetch(`/chat/room/list?${params}`)

    if (!res?.data) return res

    // BaseResponse.success(Slice) → data.content
    const rawList = Array.isArray(res.data.content) ? res.data.content : []
    const mappedData = rawList.map(mapRoom)

    return { ...res, data: { ...res.data, content: mappedData } }
  } catch (error) {
    console.error('채팅방 목록 호출 실패:', error.message)
    throw error
  }
}

// 특정 채팅방의 메시지 가져오기 - Slice<ChatMessageDto.Res> 응답
const getChatMessages = async (roomId, page = 0, size = 20) => {
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    const res = await apiFetch(`/chat/room/${roomId}/messages?${params}`)
    return res
  } catch (error) {
    console.error(`${roomId}번 방 이전 채팅 내역 조회 실패`, error.message)
    throw error
  }
}

// 화상 채팅 정보
const loadPortfolios = async () => {
  try {
    const res = await apiFetch('/json/chat/my-portfolios')
    console.log(res)
    return res
  } catch (error) {
    console.error('API 호출 실패:', error.message)
    throw error
  }
}

// 채팅방 생성
const createChatRoom = async (guestUserEmail) => {
  try {
    const res = await apiFetch(`/chat/room/create/${guestUserEmail}`, {
      method: 'POST',
    })
    return res
  } catch (error) {
    console.error('채팅방 생성 실패:', error.message)
    throw error
  }
}

// 채팅방 나가기
const leaveChatRoom = async (roomIdx) => {
  try {
    const res = await apiFetch(`/chat/room/${roomIdx}/leave`, {
      method: 'PATCH',
    })
    return res
  } catch (error) {
    console.error('채팅방 나가기 실패:', error.message)
    throw error
  }
}

// 채팅방 파일 업로드 (type: IMAGE | DOC)
const uploadChatFiles = async (roomId, formData, type) => {
  try {
    const res = await apiFetch(`/chat/room/${roomId}/upload/${type}`, {
      method: 'POST',
      body: formData,
    })
    return res
  } catch (error) {
    console.error('채팅 파일 업로드 실패:', error.message)
    throw error
  }
}

export default {
  chatRoomList,
  getChatMessages,
  loadPortfolios,
  createChatRoom,
  leaveChatRoom,
  uploadChatFiles,
}
