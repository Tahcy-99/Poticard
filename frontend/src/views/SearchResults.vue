<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 pt-10 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-10">
        <h2 class="text-3xl font-black text-gray-900 dark:text-white mb-2">
          "<span class="text-point-yellow">{{ route.query.q }}</span>" 검색 결과
        </h2>
        <p v-if="!isLoading" class="text-gray-500 font-bold">총 {{ totalResults }}개의 결과가 검색되었습니다.</p>
        <p v-else class="text-gray-500 font-bold italic animate-pulse">데이터를 불러오는 중...</p>
      </div>

      <div class="flex gap-4 mb-8 border-b border-gray-200 dark:border-zinc-800">
        <button v-for="tab in ['전체', '명함', '기업']" :key="tab" @click="currentTab = tab" :class="[
          'pb-4 px-2 text-sm font-bold transition-all relative',
          currentTab === tab ? 'text-point-yellow' : 'text-gray-500 hover:text-gray-700'
        ]">
          {{ tab }}
          <div v-if="currentTab === tab" class="absolute bottom-0 left-0 w-full h-1 bg-point-yellow rounded-full"></div>
        </button>
      </div>

      <div v-if="isLoading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-point-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="filteredResults.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-for="item in filteredResults" :key="item.uniqueId">

          <div v-if="item.category === '명함'" class="h-[200px]">
            <MiniNamecards :userId="item.userId" />
          </div>

          <div v-else-if="item.category === '기업'"
            class="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-extrabold text-zinc-500 dark:text-zinc-400">
                    {{ item.type || '기업' }} · {{ item.location }}
                  </div>
                  <div class="mt-1 text-lg font-extrabold">{{ item.name }}</div>
                  <div class="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    {{ item.role }}
                  </div>
                  <div class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{{ item.exp }}</div>
                </div>
                <div class="text-right text-xs text-zinc-500 dark:text-zinc-400">
                  <div>❤ {{ item.likes }}</div>
                  <div class="mt-1">👁 {{ item.views }}</div>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="b in item.badges" :key="b"
                  class="px-2.5 py-1 rounded-full text-xs font-extrabold border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {{ b }}
                </span>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <span v-for="s in item.skills" :key="s"
                  class="px-2.5 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {{ s }}
                </span>
              </div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <div class="text-xs text-zinc-500 dark:text-zinc-400">업데이트: {{ item.updatedAt }}</div>
              <button
                class="px-3 py-2 rounded-2xl font-extrabold bg-amber-400 text-zinc-900 hover:bg-amber-300 transition-colors"
                @click="() => alert(`(데모) ${item.name} 상세 페이지 이동`)">
                보기
              </button>
            </div>
          </div>
        </template>
      </div>

      <div v-else class="text-center py-40">
        <div class="text-6xl mb-6">🔍</div>
        <p class="text-gray-400 font-bold text-lg">찾으시는 검색 결과가 없습니다.</p>
        <button @click="router.push('/')" class="mt-4 text-point-yellow font-bold hover:underline">
          홈으로 돌아가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MiniNamecards from '@/components/namecards/MiniNamecards.vue'
import matchingApi from '@/api/matching/index.js'
import namecardApi from '@/api/namecard/index.js'

const route = useRoute()
const router = useRouter()
const currentTab = ref('전체')
const results = ref([])
const isLoading = ref(false)

const fetchResults = async (query) => {
  if (!query) return
  isLoading.value = true

  try {
    // 기업 데이터와 개별 명함 데이터들을 동시에 호출
    const [matchingData, namecardList] = await Promise.all([
      matchingApi.list(),
      namecardApi.list() // 개별 userId_XX.json 파일들을 취합해옴
    ])

    // 명함 데이터 검색용 uniqueId 추가
    const normalizedNamecards = namecardList.map(nc => ({
      ...nc,
      userId: nc.id,
      uniqueId: `nc-${nc.id}`
    }))

    // 기업 데이터 (기존 로직 유지)
    const companyList = matchingData.map(c => ({
      ...c,
      category: '기업',
      uniqueId: `cp-${c.id}`
    }))

    const combined = [...normalizedNamecards, ...companyList]

    // 필터링 로직: 이름, 역할, 키워드, 기술스택 등에서 검색
    const q = query.toLowerCase()
    results.value = combined.filter(item => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.role?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) || // 명함의 title/설명 검색 추가
        item.keywords?.some(k => k.toLowerCase().includes(q)) ||
        item.skills?.some(s => s.toLowerCase().includes(q))
      )
    })

  } catch (error) {
    console.error("데이터 로드 실패:", error)
  } finally {
    isLoading.value = false
  }
}

const filteredResults = computed(() => {
  if (currentTab.value === '전체') return results.value
  return results.value.filter(item => item.category === currentTab.value)
})

const totalResults = computed(() => filteredResults.value.length)

onMounted(() => {
  fetchResults(route.query.q)
})

watch(() => route.query.q, (newQuery) => {
  fetchResults(newQuery)
})
</script>

<style scoped>
.text-point-yellow {
  color: #facc15;
}

.bg-point-yellow {
  background-color: #facc15;
}
</style>