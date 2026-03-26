<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import noticeApi from '@/api/notice/index.js'

const router = useRouter()

const notices = ref([])
const currentPage = ref(0)
const totalPages = ref(1)

const fetchNotices = async (page = 0) => {
  try {
    const res = await noticeApi.getNoticeList(page, 10)
    
    // Spring Data JPA의 Page 객체 구조(res.data.content)에 맞춰 데이터 추출
    const pageData = res.data || res.result
    if (pageData && pageData.content) {
      notices.value = pageData.content
      currentPage.value = pageData.number
      totalPages.value = pageData.totalPages
    }
  } catch (error) {
    console.error('공지사항을 불러오는 중 오류 발생:', error)
  }
}

onMounted(() => {
  fetchNotices(0)
})

const goToDetail = (idx) => {
  router.push(`/notice/${idx}`)
}

const changePage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    fetchNotices(page)
  }
}

// 날짜 포맷 함수 (YYYY.MM.DD)
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-24 pb-20 transition-colors duration-300">
    <main class="max-w-5xl mx-auto px-4">
      
      <div class="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6 flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-black tracking-tight mb-2">공지사항</h2>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th class="py-4 px-6 text-sm font-bold text-zinc-500 dark:text-zinc-400 w-24 text-center">번호</th>
              <th class="py-4 px-6 text-sm font-bold text-zinc-500 dark:text-zinc-400">제목</th>
              <th class="py-4 px-6 text-sm font-bold text-zinc-500 dark:text-zinc-400 w-32 text-center">등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="notice in notices" :key="notice.idx" 
                class="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group" 
                @click="goToDetail(notice.idx)">
              <td class="py-4 px-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                {{ notice.idx }}
              </td>
              <td class="py-4 px-6 text-base font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-yellow-500 transition-colors">
                {{ notice.title }}
              </td>
              <td class="py-4 px-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                {{ formatDate(notice.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="notices.length === 0" class="py-16 text-center text-zinc-500 dark:text-zinc-400">
          등록된 공지사항이 없습니다.
        </div>
      </div>

      <div v-if="totalPages > 0" class="flex justify-center mt-8 gap-2">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 0"
          class="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        
        <button v-for="page in totalPages" :key="page" @click="changePage(page - 1)"
          :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors',
            currentPage === (page - 1) 
              ? 'bg-yellow-400 text-white shadow-md shadow-yellow-400/30' 
              : 'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700'
          ]">
          {{ page }}
        </button>
        
        <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages - 1"
          class="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      
    </main>
  </div>
</template>

<style scoped>
</style>