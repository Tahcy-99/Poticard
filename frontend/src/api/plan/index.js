import { apiFetch } from '@/plugins/interceptor'

export const getPlanList = async () => {
  try {
    const res = await apiFetch('/plan/list')
    return res
  } catch (error) {
    console.error('요금제 목록 호출 실패:', error.message)
    throw error
  }
}

export default {
  getPlanList
}