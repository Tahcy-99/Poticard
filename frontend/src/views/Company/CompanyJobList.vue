<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { apiFetch } from '@/plugins/interceptor'

const router = useRouter()
const currentFilter = ref('ALL')
const isLoading = ref(false)

const jobs = ref([])

const listInfo = ref({
  totalCount: 0,
  recruitingCount: 0,
  totalApplicants: 0,
})

const getEmploymentTypeLabel = (type) => {
  if (type === 'FULL_TIME') return '정규직'
  if (type === 'CONTRACT') return '계약직'
  if (type === 'INTERN') return '인턴'
  if (type === 'PART_TIME') return '파트타임'
  return type || '-'
}

const formatCreatedAt = (value) => {
  if (!value) return '-'

  const parts = value.split('-')
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`
  }

  return value
}

const isPrivateJob = (job) => !job.publicOpen

const getStatusLabel = (job) => {
  if (isPrivateJob(job)) return '비공개'
  return job.status === 'RECRUITING' ? '채용 중' : '마감됨'
}

const getStatusClass = (job) => {
  if (isPrivateJob(job)) {
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
  }

  if (job.status === 'RECRUITING') {
    return 'bg-green-50 dark:bg-green-900/20 text-green-600'
  }

  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
}

const fetchJobs = async () => {
  isLoading.value = true

  try {
    const res = await apiFetch('/company/list?page=0&size=10')
    const data = res?.data || {}

    jobs.value = (data.companyList || []).map((item) => ({
      id: item.idx,
      title: item.title,
      category: item.category,
      employmentType: getEmploymentTypeLabel(item.employmentType),
      applicants: Number(item.applicants ?? 0),
      newApplicants: Number(item.newApplicants ?? 0),
      deadline: item.deadline || '-',
      status: item.status,
      publicOpen: Boolean(item.publicOpen),
      createdAt: formatCreatedAt(item.createdAt),
    }))

    listInfo.value = {
      totalCount: Number(data.totalCount ?? 0),
      recruitingCount: Number(data.recruitingCount ?? 0),
      totalApplicants: Number(data.totalApplicants ?? 0),
    }
  } catch (error) {
    console.error('공고 목록 조회 실패:', error)

    jobs.value = []
    listInfo.value = {
      totalCount: 0,
      recruitingCount: 0,
      totalApplicants: 0,
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchJobs()
})

const stats = computed(() => {
  return {
    total: listInfo.value.totalCount,
    active: listInfo.value.recruitingCount,
    totalApplicants: listInfo.value.totalApplicants,
  }
})

const filteredJobs = computed(() => {
  if (currentFilter.value === 'ALL') return jobs.value
  if (currentFilter.value === 'PRIVATE') return jobs.value.filter((j) => !j.publicOpen)
  if (currentFilter.value === 'RECRUITING') return jobs.value.filter((j) => j.publicOpen && j.status === 'RECRUITING')
  if (currentFilter.value === 'CLOSED') return jobs.value.filter((j) => j.publicOpen && j.status === 'CLOSED')
  return jobs.value
})

const goEdit = (jobId) => {
  router.push({ path: '/company/jobcreate', query: { jobId } })
}

const closeJob = async (jobId) => {
  const confirmed = window.confirm('이 공고를 마감할까요?')
  if (!confirmed) return

  try {
    await apiFetch(`/company/close/${jobId}`, {
      method: 'PATCH',
    })
    await fetchJobs()
  } catch (error) {
    alert(error.message || '공고 마감 처리에 실패했습니다.')
  }
}

const deleteJob = async (jobId) => {
  const confirmed = window.confirm('이 공고를 삭제할까요?')
  if (!confirmed) return

  try {
    await apiFetch(`/company/delete/${jobId}`, {
      method: 'DELETE',
    })
    await fetchJobs()
  } catch (error) {
    alert(error.message || '공고 삭제에 실패했습니다.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-pattern text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
    <main class="max-w-7xl mx-auto px-6 py-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">공고 관리 현황</h1>
        </div>
        <RouterLink to="/company/jobcreate"
          class="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all gap-2">
          <span>➕ 새 공고 등록하기</span>
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p class="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-2">전체 공고</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-zinc-900 dark:text-white">{{ stats.total }}</span>
            <span class="text-zinc-400 font-medium">건</span>
          </div>
        </div>
        <div class="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p class="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-2">채용 중</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-indigo-600">{{ stats.active }}</span>
            <span class="text-zinc-400 font-medium">건</span>
          </div>
        </div>
        <div class="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p class="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-2">누적 지원자</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-zinc-900 dark:text-white">{{
              stats.totalApplicants
            }}</span>
            <span class="text-zinc-400 font-medium">명</span>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div class="px-8 pt-8 flex items-center gap-6 border-b border-zinc-50 dark:border-zinc-800">
          <button @click="currentFilter = 'ALL'" :class="currentFilter === 'ALL'
            ? 'text-indigo-600 border-b-2 border-indigo-600 pb-4 font-bold'
            : 'text-zinc-400 pb-4 font-medium hover:text-zinc-600 transition-colors'
            ">
            전체 보기
          </button>
          <button @click="currentFilter = 'RECRUITING'" :class="currentFilter === 'RECRUITING'
            ? 'text-indigo-600 border-b-2 border-indigo-600 pb-4 font-bold'
            : 'text-zinc-400 pb-4 font-medium hover:text-zinc-600 transition-colors'
            ">
            채용 중
          </button>
          <button @click="currentFilter = 'PRIVATE'" :class="currentFilter === 'PRIVATE'
            ? 'text-indigo-600 border-b-2 border-indigo-600 pb-4 font-bold'
            : 'text-zinc-400 pb-4 font-medium hover:text-zinc-600 transition-colors'
            ">
            비공개
          </button>
          <button @click="currentFilter = 'CLOSED'" :class="currentFilter === 'CLOSED'
            ? 'text-indigo-600 border-b-2 border-indigo-600 pb-4 font-bold'
            : 'text-zinc-400 pb-4 font-medium hover:text-zinc-600 transition-colors'
            ">
            마감됨
          </button>
        </div>

        <div class="divide-y divide-zinc-50 dark:divide-zinc-800">
          <div v-for="job in filteredJobs" :key="job.id"
            class="p-8 hover:bg-zinc-50/50 dark:hover:bg-zinc-950 transition-colors group">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <span :class="[
                    'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
                    getStatusClass(job),
                  ]">
                    {{ getStatusLabel(job) }}
                  </span>
                  <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">{{
                    job.category
                  }}</span>
                  <span v-if="job.newApplicants > 0"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-bold animate-bounce">
                    NEW {{ job.newApplicants }}
                  </span>
                </div>
                <h3 class="text-xl font-bold group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                  {{ job.title }}
                </h3>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
                  <span class="flex items-center gap-1.5">📅 등록일: {{ job.createdAt }}</span>
                  <span class="flex items-center gap-1.5">⏳ 마감일:
                    <span :class="job.status === 'RECRUITING' ? 'text-indigo-600 font-semibold' : ''">{{ job.deadline
                    }}</span></span>
                  <span class="flex items-center gap-1.5">👤 고용형태: {{ job.employmentType }}</span>
                </div>
              </div>

              <div class="flex items-center gap-8 lg:border-l lg:dark:border-zinc-800 lg:pl-10">
                <div class="text-center">
                  <p class="text-[10px] font-bold text-zinc-400 uppercase mb-1">Total Applicants</p>
                  <p class="text-2xl font-black text-zinc-900 dark:text-white">
                    {{ job.applicants }}
                  </p>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-end">
                  <button @click="goEdit(job.id)"
                    class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-zinc-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button v-if="job.status === 'RECRUITING'" @click="closeJob(job.id)"
                    class="px-4 py-3 rounded-xl border border-amber-200 text-amber-600 hover:bg-amber-50 transition text-sm font-bold">
                    마감
                  </button>
                  <button @click="deleteJob(job.id)"
                    class="px-4 py-3 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition text-sm font-bold">
                    삭제
                  </button>
                  <RouterLink :to="{ path: '/company/applicantlist', query: { jobId: String(job.id) } }"
                    class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition shadow-md">
                    지원자 보기
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!isLoading && filteredJobs.length === 0" class="py-20 text-center">
            <div class="text-4xl mb-4 text-zinc-300">🔍</div>
            <p class="text-zinc-500 font-medium">해당 조건에 맞는 공고가 없습니다.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
button,
a,
div {
  transition: all 0.2s ease-in-out;
}

.rounded-\[2\.5rem\] {
  border-radius: 2.5rem;
}

.rounded-\[2rem\] {
  border-radius: 2rem;
}

.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}
</style>