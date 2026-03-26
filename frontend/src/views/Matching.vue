<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import matchingApi from '@/api/matching'

const route = useRoute()
const router = useRouter()

const companies = ref([])
const loading = ref(false)
const loadError = ref('')
const detailLoading = ref(false)
const selectedCompany = ref(null)
const favoriteOnly = ref(false)

const q = ref('')
const sort = ref('popular')
const category = ref('ALL')
const selectedSkills = ref([])
const page = ref(1)
const pageSize = 6

const categoryOptions = [
  { value: 'ALL', label: '전체' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Fullstack', label: 'Fullstack' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Database', label: 'Database' },
  { value: 'AI', label: 'AI' },
]

const skillOptions = computed(() => {
  const set = new Set()
  companies.value.forEach((c) => (c.skills || []).forEach((s) => set.add(s)))
  return Array.from(set)
})

const filteredCompanies = computed(() => {
  let list = [...companies.value]

  if (selectedSkills.value.length > 0) {
    list = list.filter((company) => selectedSkills.value.every((skill) => company.skills.includes(skill)))
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCompanies.value.length / pageSize)))
const pagedCompanies = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredCompanies.value.slice(start, start + pageSize)
})

const loadCompanies = async () => {
  loading.value = true
  loadError.value = ''

  try {
    companies.value = await matchingApi.list({
      keyword: q.value,
      category: category.value,
      favoriteOnly: favoriteOnly.value,
      sort: sort.value,
    })
  } catch (error) {
    companies.value = []
    loadError.value = error?.message || '채용 공고를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const buildLoginRedirect = () => {
  return {
    path: '/login',
    query: {
      type: 'personal',
      redirect: route.fullPath || '/matching',
    },
  }
}

const requirePersonalLogin = () => {
  if (localStorage.getItem('USERINFO')) {
    return true
  }

  alert('로그인이 필요한 기능입니다. 개인계정으로 로그인해 주세요.')
  router.push(buildLoginRedirect())
  return false
}

const syncCompany = (companyId, payload = {}) => {
  const target = companies.value.find((company) => company.id === companyId)
  if (target) {
    Object.assign(target, payload)
  }

  if (selectedCompany.value && selectedCompany.value.id === companyId) {
    Object.assign(selectedCompany.value, payload)
  }
}

const openDetail = async (companyId) => {
  detailLoading.value = true

  try {
    const detail = await matchingApi.detail(companyId)
    selectedCompany.value = detail

    syncCompany(companyId, {
      views: detail.views,
      likes: detail.likes,
      isFavorite: detail.isFavorite,
      isApplied: detail.isApplied,
      isMine: detail.isMine,
      detail: detail.detail,
    })
  } catch (error) {
    alert(error.message || '상세 정보를 불러오지 못했습니다.')
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = async () => {
  selectedCompany.value = null

  if (route.query.jobId) {
    const nextQuery = { ...route.query }
    delete nextQuery.jobId
    await router.replace({
      path: route.path,
      query: nextQuery,
    })
  }
}

const toggleFavorite = async (company) => {
  try {
    const res = await matchingApi.toggleFavorite(company.id)
    const result = res?.data || {}

    company.isFavorite = Boolean(result.favorite)
    company.likes = Number(result.favoriteCount ?? company.likes)

    if (selectedCompany.value && selectedCompany.value.id === company.id) {
      selectedCompany.value.isFavorite = company.isFavorite
      selectedCompany.value.likes = company.likes
    }

    if (favoriteOnly.value) {
      await loadCompanies()
    }
  } catch (error) {
    alert(error.message || '즐겨찾기 처리에 실패했습니다.')
  }
}

const applyCompany = async (company) => {
  if (!company || company.isApplied || company.isMine) return

  if (!requirePersonalLogin()) {
    return
  }

  try {
    const res = await matchingApi.apply(company.id)
    const result = res?.data || {}

    syncCompany(company.id, {
      isApplied: Boolean(result.applied),
    })

    alert('지원이 완료되었습니다.')
  } catch (error) {
    const message = error?.message || '지원 처리에 실패했습니다.'

    if (message.includes('로그인')) {
      alert('로그인이 필요한 기능입니다. 개인계정으로 로그인해 주세요.')
      router.push(buildLoginRedirect())
      return
    }

    alert(message)
  }
}

const cancelCompany = async (company) => {
  if (!company || !company.isApplied || company.isMine) return

  if (!requirePersonalLogin()) {
    return
  }

  const confirmed = window.confirm('지원한 공고를 취소할까요?')
  if (!confirmed) return

  try {
    const res = await matchingApi.cancelApply(company.id)
    const result = res?.data || {}

    syncCompany(company.id, {
      isApplied: Boolean(result.applied),
    })

    alert('지원이 취소되었습니다.')
  } catch (error) {
    const message = error?.message || '지원 취소에 실패했습니다.'

    if (message.includes('로그인')) {
      alert('로그인이 필요한 기능입니다. 개인계정으로 로그인해 주세요.')
      router.push(buildLoginRedirect())
      return
    }

    alert(message)
  }
}

const toggleSkill = (skill) => {
  const index = selectedSkills.value.indexOf(skill)
  if (index >= 0) {
    selectedSkills.value.splice(index, 1)
  } else {
    selectedSkills.value.push(skill)
  }
  page.value = 1
}

const resetFilters = async () => {
  q.value = ''
  sort.value = 'popular'
  category.value = 'ALL'
  selectedSkills.value = []
  favoriteOnly.value = false
  page.value = 1
  await loadCompanies()
}

const changeFavoriteOnly = async () => {
  page.value = 1
  await loadCompanies()
}

const changeSearch = async () => {
  page.value = 1
  await loadCompanies()
}

const goPrev = () => {
  page.value = Math.max(1, page.value - 1)
}

const goNext = () => {
  page.value = Math.min(totalPages.value, page.value + 1)
}

onMounted(async () => {
  await loadCompanies()

  const jobId = Number(route.query.jobId)
  if (!Number.isNaN(jobId) && jobId > 0) {
    await openDetail(jobId)
  }
})
</script>

<template>
  <div class="min-h-screen bg-pattern text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
    <main class="max-w-7xl mx-auto px-5 pt-10 pb-16">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight">채용 공고</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="favoriteOnly = !favoriteOnly; changeFavoriteOnly()"
            :class="[
              'px-4 py-2.5 rounded-2xl font-bold border transition',
              favoriteOnly
                ? 'bg-amber-400 text-zinc-900 border-amber-300'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900',
            ]"
          >
            즐겨찾기만
          </button>
          <button
            @click="resetFilters"
            class="px-4 py-2.5 rounded-2xl font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            초기화
          </button>
        </div>
      </div>

      <section class="mt-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-col md:flex-row gap-3 md:items-center w-full">
            <div class="relative w-full md:max-w-md">
              <input
                v-model="q"
                @keyup.enter="changeSearch"
                type="text"
                placeholder="회사/직무/스킬/지역 검색"
                class="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 ring-amber-300"
              />
              <button
                type="button"
                @click="changeSearch"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
              >
                검색
              </button>
            </div>

            <select
              v-model="category"
              @change="changeSearch"
              class="w-full md:w-44 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <option v-for="c in categoryOptions" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>

            <select
              v-model="sort"
              @change="changeSearch"
              class="w-full md:w-44 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <option value="popular">인기순</option>
              <option value="newest">최신순</option>
              <option value="views">조회순</option>
            </select>
          </div>

          <div class="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            결과
            <span class="font-extrabold text-zinc-900 dark:text-zinc-100">{{ filteredCompanies.length }}</span>개
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="s in skillOptions"
            :key="s"
            @click="toggleSkill(s)"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-extrabold border transition',
              selectedSkills.includes(s)
                ? 'bg-amber-400 text-zinc-900 border-amber-300'
                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900',
            ]"
          >
            {{ s }}
          </button>
        </div>
      </section>

      <p v-if="loadError" class="mt-4 text-sm text-rose-500 font-bold">{{ loadError }}</p>

      <section class="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <article
          v-for="c in pagedCompanies"
          :key="c.id"
          :class="[
            'rounded-3xl border bg-white dark:bg-zinc-900 p-6 transition shadow-sm',
            c.isMine
              ? 'border-amber-300 ring-2 ring-amber-200/70 bg-amber-50/40 dark:bg-zinc-900'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-300',
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm text-zinc-500 font-bold">{{ c.category }} · {{ c.location || '미정' }}</p>
                <span
                  v-if="c.isMine"
                  class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black"
                >
                  내 공고
                </span>
              </div>
              <h3 class="mt-2 text-2xl font-black leading-tight">{{ c.name }}</h3>
              <p class="mt-1 text-lg font-bold text-zinc-700 dark:text-zinc-200">{{ c.role }}</p>
              <p class="mt-1 text-zinc-500 font-medium">{{ c.exp }}</p>
            </div>
            <div class="text-right text-sm font-bold text-zinc-500 space-y-1 shrink-0">
              <button @click.stop="toggleFavorite(c)" class="block w-full text-right hover:text-rose-500 transition">
                <span :class="c.isFavorite ? 'text-rose-500' : 'text-zinc-500'">❤</span>
                {{ c.likes }}
              </button>
              <div>👁 {{ c.views }}</div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="skill in c.skills"
              :key="skill"
              class="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold"
            >
              {{ skill }}
            </span>
          </div>

          <div class="mt-6 flex items-center justify-between gap-2">
            <div class="text-sm text-zinc-400 font-bold">업데이트: {{ c.updatedAt || '-' }}</div>
            <div class="flex items-center gap-2">
              <button
                v-if="!c.isMine && c.isApplied"
                @click="cancelCompany(c)"
                class="px-4 py-3 rounded-2xl font-black border border-rose-200 text-rose-500 hover:bg-rose-50"
              >
                지원취소
              </button>
              <button
                v-else
                @click="applyCompany(c)"
                :disabled="c.isMine"
                :class="[
                  'px-4 py-3 rounded-2xl font-black border',
                  c.isMine
                    ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-default'
                    : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-900',
                ]"
              >
                {{ c.isMine ? '내 공고' : '지원하기' }}
              </button>
              <button
                @click="openDetail(c.id)"
                class="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-900 font-black"
              >
                보기
              </button>
            </div>
          </div>
        </article>
      </section>

      <div v-if="!loading && filteredCompanies.length === 0" class="mt-7 text-center text-zinc-500 font-bold">
        조건에 맞는 공고가 없습니다.
      </div>

      <div v-if="filteredCompanies.length > pageSize" class="mt-8 flex items-center justify-center gap-3">
        <button
          @click="goPrev"
          class="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold"
        >
          이전
        </button>
        <span class="text-sm font-bold text-zinc-500">{{ page }} / {{ totalPages }}</span>
        <button
          @click="goNext"
          class="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold"
        >
          다음
        </button>
      </div>
    </main>

    <div v-if="selectedCompany" class="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div class="absolute inset-0 bg-zinc-950/60" @click="closeDetail"></div>
      <div class="relative w-full max-w-3xl rounded-[28px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm text-zinc-500 font-bold">{{ selectedCompany.category }} · {{ selectedCompany.location || '미정' }}</p>
              <span
                v-if="selectedCompany.isMine"
                class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black"
              >
                내 공고
              </span>
            </div>
            <h2 class="mt-2 text-3xl font-black">{{ selectedCompany.name }}</h2>
            <p class="mt-1 text-xl font-bold text-zinc-700 dark:text-zinc-200">{{ selectedCompany.role }}</p>
          </div>
          <button @click="closeDetail" class="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold">닫기</button>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-500">
          <span>👁 {{ selectedCompany.views }}</span>
          <button @click="toggleFavorite(selectedCompany)" :class="selectedCompany.isFavorite ? 'text-rose-500' : 'text-zinc-500'">
            ❤ {{ selectedCompany.likes }}
          </button>
          <span>경력 {{ selectedCompany.exp || '-' }}</span>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <span
            v-for="skill in selectedCompany.skills"
            :key="skill"
            class="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold"
          >
            {{ skill }}
          </span>
        </div>

        <div v-if="detailLoading" class="mt-8 text-center text-zinc-500 font-bold">불러오는 중...</div>

        <div v-else class="mt-8 space-y-6">
          <section>
            <h3 class="text-lg font-extrabold mb-2">회사 소개</h3>
            <p class="text-sm leading-7 text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">{{ selectedCompany.detail?.intro || '-' }}</p>
          </section>

          <section>
            <h3 class="text-lg font-extrabold mb-2">업무 설명</h3>
            <p class="text-sm leading-7 text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">{{ selectedCompany.detail?.description || '-' }}</p>
          </section>

          <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p class="text-xs text-zinc-400 font-bold">자격 요건</p>
              <p class="mt-2 text-sm whitespace-pre-wrap">{{ selectedCompany.detail?.requirements || '-' }}</p>
            </div>
            <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p class="text-xs text-zinc-400 font-bold">우대 사항</p>
              <p class="mt-2 text-sm whitespace-pre-wrap">{{ selectedCompany.detail?.preferred || '-' }}</p>
            </div>
            <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p class="text-xs text-zinc-400 font-bold">채용 절차</p>
              <p class="mt-2 text-sm whitespace-pre-wrap">{{ selectedCompany.detail?.process || '-' }}</p>
            </div>
            <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p class="text-xs text-zinc-400 font-bold">연락처</p>
              <p class="mt-2 text-sm whitespace-pre-wrap">
                {{ selectedCompany.detail?.contactEmail || '-' }}
                <br />
                {{ selectedCompany.detail?.contactPhone || '-' }}
              </p>
            </div>
          </section>

          <div class="mt-8 flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              v-if="!selectedCompany.isMine && selectedCompany.isApplied"
              @click="cancelCompany(selectedCompany)"
              class="px-5 py-3 rounded-2xl font-black border border-rose-200 text-rose-500 hover:bg-rose-50"
            >
              지원취소
            </button>
            <button
              v-else
              @click="applyCompany(selectedCompany)"
              :disabled="selectedCompany.isMine"
              :class="[
                'px-5 py-3 rounded-2xl font-black border',
                selectedCompany.isMine
                  ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-default'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-900',
              ]"
            >
              {{ selectedCompany.isMine ? '내 공고' : '지원하기' }}
            </button>
            <button
              @click="closeDetail"
              class="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-900 font-black"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}
</style>