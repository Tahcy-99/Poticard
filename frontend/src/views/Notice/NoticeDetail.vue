<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import noticeApi from '@/api/notice/index.js'

const route = useRoute()
const router = useRouter()

const notice = ref({
  title: '',
  content: '',
  createdAt: ''
})

const fetchNoticeDetail = async () => {
  try {
    // route.params.id -> route.params.Idx 로 수정
    const noticeIdx = route.params.Idx 
    const res = await noticeApi.getNoticeDetail(noticeIdx)
    
    const data = res.data || res.result
    if (data) {
      notice.value = data
    }
  } catch (error) {
    console.error('공지사항 상세 내용을 불러오는 데 실패했습니다.', error)
    alert('존재하지 않거나 삭제된 공지사항입니다.')
    router.push('/notice')
  }
}

onMounted(() => {
  fetchNoticeDetail()
})

const goBack = () => {
  router.push('/notice')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-24 pb-20 transition-colors duration-300">
    <main class="max-w-4xl mx-auto px-4">
      
      <div class="mb-8">
        <button @click="goBack" class="group flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-yellow-500 transition-colors mb-6">
          <span class="text-lg group-hover:-translate-x-1 transition-transform">←</span>
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      <article class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm p-8 md:p-12">
        <header class="border-b border-zinc-100 dark:border-zinc-800 pb-8 mb-8">
          <h1 class="text-2xl md:text-4xl font-black tracking-tight mb-4 leading-snug">
            {{ notice.title }}
          </h1>
          <div class="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            <span class="flex items-center gap-1.5"><i class="fa-regular fa-calendar"></i> {{ formatDate(notice.createdAt) }}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span class="text-yellow-600 dark:text-yellow-500">포티카드 관리자</span>
          </div>
        </header>

        <div class="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-loose whitespace-pre-line text-lg">
          {{ notice.content }}
        </div>
      </article>

      <div class="mt-10 flex justify-center">
        <button @click="goBack" class="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold shadow-xl hover:bg-black dark:hover:bg-white transform hover:-translate-y-0.5 transition-all">
          목록으로
        </button>
      </div>

    </main>
  </div>
</template>

<style scoped>
</style>