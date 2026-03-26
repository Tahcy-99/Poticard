import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/namecard/index'

export const namecardListStore = defineStore('namecardList', () => {
  const listData = ref(null)

  // ✨ force 매개변수 추가 (기본값 false)
  const namecardList = async (page = 1, size = 20, force = false) => {
    const pageKey = `namecardList_${page}_${size}`

    try {
      // 1. 강제 새로고침(force)이 false일 때만 캐시를 확인합니다.
      if (!force) {
        const cacheStr = sessionStorage.getItem(pageKey)
        if (cacheStr) {
          const parsed = JSON.parse(cacheStr)
          listData.value = parsed
          return parsed
        }
      }

      // 2. 캐시가 없거나, force가 true일 때 무조건 API를 호출합니다.
      const res = await api.getNamecardList(page, size)

      if (res && res.data) {
        const responseData = res.data

        sessionStorage.setItem(pageKey, JSON.stringify(responseData))
        listData.value = responseData
        return responseData
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e)
      return null
    }
  }
  
  return { listData, namecardList }
})