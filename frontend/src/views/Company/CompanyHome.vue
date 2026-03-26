<script setup>
import { RouterLink } from 'vue-router'

const activeJobsSummary = [
  {
    id: 1,
    title: '[플랫폼본부] 프렌차이즈시너지그룹 AI 에이전트 엔지니어 (AI 어시스턴트)',
    newApplicants: 8,
  },
  { id: 2, title: '[메이플스토리 PC] 2D 애니메이션 아티스트', newApplicants: 3 },
  { id: 3, title: '[기술본부] AI 데이터 엔지니어', newApplicants: 1 },
]

const quickCards = [
  { title: '공고 등록', to: '/company/jobcreate', icon: '➕', color: 'blue' },
  { title: '공고 관리', to: '/company/joblist', icon: '📋', color: 'indigo' },
  { title: '인재 검색', to: '/namecard-search', icon: '🔍', color: 'amber' },
]
</script>

<template>
  <div class="bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">
    <main class="max-w-7xl mx-auto px-6 pt-10 pb-20">
      <section class="mb-12">
        <div class="flex items-end justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">안녕하세요, 담당자님!</h1>
            <p class="text-zinc-500 dark:text-zinc-400 mt-1">
              오늘 확인해야 할 지원자가 총
              <span class="font-bold text-indigo-600 tracking-normal">12명</span> 있습니다.
            </p>
          </div>
          <RouterLink to="/company/joblist"
            class="text-sm font-semibold text-zinc-400 hover:text-indigo-600 transition">공고 현황 확인 →</RouterLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="job in activeJobsSummary" :key="job.id"
            class="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
              <span
                class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {{ job.dept }}
              </span>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span class="text-[10px] font-bold text-zinc-400 uppercase">Recruiting</span>
              </div>
            </div>
            <h3 class="text-lg font-bold mb-6 line-clamp-1">{{ job.title }}</h3>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-500">금일 지원자 현황</span>
              <span class="text-3xl font-black text-indigo-600">+{{ job.newApplicants }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RouterLink v-for="c in quickCards" :key="c.title" :to="c.to"
              class="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm">
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xl group-hover:scale-110 transition-transform">
                  {{ c.icon }}
                </div>
                <span class="font-bold text-zinc-700 dark:text-zinc-200">{{ c.title }}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>

          <div
            class="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div class="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 class="font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <span class="text-indigo-500 text-xl">📢</span> 공지사항
              </h3>
              <button class="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition">
                전체보기 +
              </button>
            </div>
            <div class="divide-y divide-zinc-50 dark:divide-zinc-800">
              <div v-for="i in 4" :key="i"
                class="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-950 transition cursor-pointer group">
                <div class="flex items-center gap-4">
                  <span class="text-xs font-bold text-indigo-500/50 group-hover:text-indigo-500">0{{ i }}</span>
                  <span
                    class="text-sm font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    기업 회원 서비스 이용약관 개정 안내 (2026.02.01 시행)
                  </span>
                </div>
                <span class="text-[11px] text-zinc-400 font-mono">2026.01.17</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="lg:col-span-4 space-y-6">
          <div
            class="rounded-[2rem] bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
            <div
              class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700">
            </div>

            <h3 class="text-lg font-bold relative z-10">채용에 어려움이 있나요?</h3>
            <p class="mt-2 text-sm text-indigo-100/80 leading-relaxed relative z-10">
              전담 매니저가 기업에 딱 맞는 인재 매칭을 도와드립니다.
            </p>

            <button
              class="mt-8 w-full py-4 rounded-2xl font-bold bg-white text-indigo-600 hover:bg-indigo-50 transition shadow-lg relative z-10">
              1:1 컨설팅 신청하기
            </button>
          </div>

          <div class="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
            <h4 class="font-bold text-zinc-800 dark:text-zinc-100 mb-4">고객센터</h4>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm">
                  📞
                </div>
                <div class="text-sm font-bold text-zinc-600 dark:text-zinc-300">02-1234-5678</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm">
                  💬
                </div>
                <div class="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                  실시간 채팅 상담
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 더 부드러운 둥근 모서리와 폰트 효과 */
.rounded-3xl {
  border-radius: 1.5rem;
}

.rounded-\[2rem\] {
  border-radius: 2rem;
}
</style>
