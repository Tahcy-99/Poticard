import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/namecard/index'

export const useNamecardStore = defineStore('namecard', () => {
  const cardData = ref(null)

  // async 함수가 데이터를 반환하도록 수정
  const getNamecard = async (userId) => {
    if (!userId) return null

    const storageKey = `user_card_${userId}`

    try {
      // 세션 스토리지 확인
      const cachedData = sessionStorage.getItem(storageKey)
      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        cardData.value = parsed
        return parsed
      }

      // API 호출
      const res = await api.getSingleNamecard(userId)

      if (res && res.data) {
        const mappedData = {
          name: res.data.name,
          role: res.data.affiliation,
          description: res.data.title,
          profileImage: res.data.profileImage,
          keywords: res.data.keywords,
          email: res.data.email,
          color: res.data.color,
          phone: res.data.phone,
          address: res.data.address,
          url: res.data.url,
        }

        sessionStorage.setItem(storageKey, JSON.stringify(mappedData))
        cardData.value = mappedData
        return mappedData
      }
    } catch (error) {
      console.error('데이터 로딩 실패', error)
      return null
    }
  }

  return { cardData, getNamecard }
})
