import { apiFetch } from '@/plugins/interceptor'

// 공지사항 목록 조회 (페이징 포함)
export const getNoticeList = async (page = 0, size = 10) => {
  try {
    const res = await apiFetch(`/notice/list?page=${page}&size=${size}`)
    return res
  } catch (error) {
    console.error('공지사항 목록 호출 실패:', error.message)
    throw error
  }
}

// 공지사항 상세 조회
export const getNoticeDetail = async (noticeIdx) => {
  try {
    const res = await apiFetch(`/notice/${noticeIdx}`)
    return res
  } catch (error) {
    console.error('공지사항 상세 호출 실패:', error.message)
    throw error
  }
}

export default {
  getNoticeList,
  getNoticeDetail
}