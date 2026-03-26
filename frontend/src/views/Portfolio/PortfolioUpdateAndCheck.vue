<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import portfolioApi from '@/api/portfolio/index'
import { checkProUser } from '@/api/orders/index'
import SectionEditor from '@/components/SectionEditor.vue'

const router = useRouter()
const route = useRoute()

const extractedKeywords = ref([])
const projects = ref([])
const isAiLoading = ref(false)

const isProUser = ref(false)

const ui = reactive({
  open: false,
  projectIndex: 0,
})

const toast = reactive({
  open: false,
  message: '',
  timer: null,
})

const circledNums = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
]

const getCircled = (n) => circledNums[n - 1] || String(n)

const showToast = (message) => {
  toast.message = message
  toast.open = true

  if (toast.timer) clearTimeout(toast.timer)

  toast.timer = setTimeout(() => {
    toast.open = false
  }, 2000)
}

const extractKeywords = async () => {
  const loadingBtn = document.getElementById('extract-btn')
  const tagSection = document.getElementById('keyword-result-section')
  const nextStepBtn = document.getElementById('next-step-btn')
  const editBtn = document.getElementById('top-edit-btn')

  if (!loadingBtn || !tagSection || !nextStepBtn) return

  loadingBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> 확정 및 분석 중...'
  loadingBtn.disabled = true

  try {
    const portfolioIdx = route.query.idx || 1

    for (const p of projects.value) {
      if (p.idx) {
        await portfolioApi.updateSection(p.idx, {
          idx: p.idx,
          sectionTitle: p.title,
          contents: p.original 
        })
      }
    }

    const allContents = projects.value
      .map((p) => `[${p.title}]\n${p.original}`)
      .join('\n\n')

    const aiRes = await portfolioApi.extractKeywordsAi(allContents)
    
    if (aiRes.isSuccess && aiRes.data) {
      extractedKeywords.value = aiRes.data
    } else {
      extractedKeywords.value = ['분석 결과 없음']
    }

    await portfolioApi.updateKeywords(portfolioIdx, extractedKeywords.value)

    tagSection.classList.remove('hidden')
    loadingBtn.classList.add('hidden')
    nextStepBtn.classList.remove('hidden')
    
    if (editBtn) editBtn.style.display = 'none'
    
    tagSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    showToast('내용 저장 및 AI 키워드 추출이 완료되었습니다.')

  } catch (error) {
    console.error('내용 및 키워드 저장 실패:', error)
    alert('키워드 추출에 실패했습니다. 포트폴리오 내용을 다시 확인해 주세요.')
    
    loadingBtn.innerHTML = '내용 확정 및 키워드 추출 <i class="fa-solid fa-wand-sparkles text-yellow-500"></i>'
    loadingBtn.disabled = false
  }
}

const makeReview = async (contentToReview) => {
  const o = (contentToReview || '').trim()

  if (!o) return ''

  isAiLoading.value = true

  try {
    const res = await portfolioApi.getAiReview(o) 
    
    if (res?.isSuccess && typeof res.data === 'string') {
      return res.data
    } 
    else if (res?.isSuccess === false) {
      alert(res.message || 'AI 첨삭에 실패했습니다.')
      return o 
    }

    return o
  } catch (error) {
    console.error('AI 첨삭 호출 실패:', error)
    alert('오류가 발생했습니다. 다시 시도해 주세요.')
    return o
  } finally {
    isAiLoading.value = false
  }
}

const requestAiReview = async () => {
  if (!isProUser.value) {
    alert('PRO 요금제 사용자만 이용할 수 있습니다.');
    return;
  }

  const p = projects.value[ui.projectIndex]
  if (!p) return

  const currentText = p.reviewDraft || p.original
  const generatedReview = await makeReview(currentText)
  
  if (generatedReview !== currentText) {
    p.review = generatedReview
    p.reviewDraft = generatedReview
    showToast('AI가 내용을 다듬었습니다!')
  }
}

const openEval = () => {
  ui.open = true
  ui.projectIndex = 0
}

const closeEval = () => {
  ui.open = false
}

const selectProject = (idx) => {
  ui.projectIndex = idx
}

const applyReview = () => {
  const p = projects.value[ui.projectIndex]
  if (!p) return

  const edited = (p.reviewDraft || '').trim()
  if (!edited) return

  p.original = edited
  
  showToast('수정된 내용이 임시 적용되었습니다!')
}

const activeProject = () => projects.value[ui.projectIndex]

onMounted(async () => {
  const portfolioIdx = route.query.idx || 1

  try {
    const proRes = await checkProUser() 
    if (proRes?.isSuccess) {
      isProUser.value = proRes.data
    }
  } catch (error) {
    console.error('PRO 상태 확인 실패:', error)
  }

  try {
    const response = await portfolioApi.getPortfolioSections(portfolioIdx)
    if (response?.isSuccess && response?.data) {
      projects.value = response.data.map((section) => ({
        idx: section.idx,
        title: section.sectionTitle,
        original: section.contents,
        review: '',
        reviewDraft: section.contents, 
      }))
    }
  } catch (error) {
    console.error('섹션 데이터를 불러오는 중 에러 발생:', error)
    alert('데이터를 불러오지 못했습니다.')
  }
})

watch(
  () => ui.open,
  (v) => {
    document.documentElement.classList.toggle('eval-open', !!v)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.documentElement.classList.remove('eval-open')

  if (toast.timer) {
    clearTimeout(toast.timer)
  }
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors selection:bg-yellow-200 selection:text-zinc-900 flex flex-col">
    <main class="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
      
      <div class="mb-12 max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-black tracking-widest mb-6 uppercase">
          Step 02
        </div>
        <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-4">프로젝트 수정 및 확인</h1>
        <p class="text-zinc-500 dark:text-zinc-400">작성한 내용을 최종 점검하고, 핵심 키워드를 추출하세요.</p>
        
        <div class="mt-8 flex justify-center gap-2 text-sm font-bold text-zinc-300 dark:text-zinc-700">
          <span>작성</span>
          <span>―</span>
          <span class="text-yellow-500">수정</span>
          <span>―</span>
          <span>스타일</span>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/40 dark:shadow-none border border-zinc-200/60 dark:border-zinc-800 p-8 md:p-14 relative overflow-hidden">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-zinc-100 dark:border-zinc-800 pb-8 gap-6">
            <div>
              <h2 class="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
                내용 확정 및 키워드 분석
              </h2>
              <p class="text-zinc-500 dark:text-zinc-400 text-sm">
                내용이 확정되면 하단의 버튼을 눌러 AI 키워드를 추출해주세요.<br />
                <span class="text-yellow-500 font-bold">분석 후에는 내용을 수정할 수 없습니다.</span>
              </p>
            </div>

            <button id="top-edit-btn" type="button" @click="openEval"
              class="px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm whitespace-nowrap">
              <i class="fa-solid fa-pen text-yellow-500"></i> 내용 수정하기
            </button>
          </div>

          <div class="space-y-12 mb-16">
            <div v-for="(project, index) in projects" :key="index" class="relative pl-6 border-l-2 border-zinc-100 dark:border-zinc-800">
              <div class="absolute w-3 h-3 bg-yellow-400 rounded-full -left-[7px] top-1 ring-4 ring-white dark:ring-zinc-900"></div>
              <h3 class="text-xs font-black text-zinc-400 mb-4 uppercase tracking-[0.2em]">
                SEC 0{{ index + 1 }} : {{ project.title }}
              </h3>
              <div class="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line" v-html="project.original"></div>
            </div>
          </div>

          <div id="keyword-result-section" class="hidden mt-10 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-200/60 dark:border-zinc-700/50 transition-all duration-500">
            <h4 class="text-sm font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <i class="fa-solid fa-check-circle text-emerald-500 text-lg"></i>
              분석이 완료되었습니다. 추출된 핵심 스택입니다.
            </h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="(keyword, idx) in extractedKeywords" :key="idx"
                class="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl shadow-sm">
                #{{ keyword }}
              </span>
            </div>
          </div>

          <div class="mt-12 flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <button id="extract-btn" type="button" @click="extractKeywords()"
              class="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
              내용 확정 및 키워드 추출
              <i class="fa-solid fa-wand-sparkles text-yellow-400"></i>
            </button>

            <RouterLink id="next-step-btn" :to="{ path: '/portfolio-style', query: { idx: route.query.idx || 1 } }"
              class="hidden px-10 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black shadow-lg shadow-yellow-400/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-400/40 transition-all sm:inline-flex items-center justify-center text-center w-full sm:w-auto">
              스타일 설정하기 <i class="fa-solid fa-arrow-right ml-2 text-lg"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </main>

    <div class="eval-overlay" :class="ui.open ? 'eval-open' : ''" aria-hidden="true">
      <div class="eval-dim" @click="closeEval"></div>

      <section class="eval-modal bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" role="dialog" aria-modal="true">
        
        <header class="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 flex items-center justify-center text-lg font-black border border-yellow-200 dark:border-yellow-900/50">
              <i class="fa-solid fa-pen"></i>
            </div>
            <div>
              <h2 class="text-base font-black text-zinc-900 dark:text-white">섹션 내용 수정</h2>
              <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{{ ui.projectIndex + 1 }} / {{ projects.length }}</p>
            </div>
          </div>
          <button @click="closeEval" class="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            ✕
          </button>
        </header>

        <div class="flex flex-col md:flex-row h-[calc(100%-80px)]">
          <aside class="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 overflow-y-auto">
            <p class="text-xs font-black text-zinc-400 mb-4 tracking-widest uppercase">Sections</p>
            <div class="space-y-2">
              <button v-for="(p, idx) in projects" :key="p.title + idx" @click="selectProject(idx)"
                :class="['w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border font-bold text-sm', 
                idx === ui.projectIndex ? 'bg-white dark:bg-zinc-800 border-yellow-400 ring-2 ring-yellow-400/20 text-zinc-900 dark:text-white' : 'bg-transparent border-transparent text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800']">
                <span class="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-[10px]">{{ getCircled(idx + 1) }}</span>
                <span class="truncate">{{ p.title }}</span>
              </button>
            </div>
          </aside>

          <main class="flex-1 p-6 overflow-y-auto space-y-6 bg-white dark:bg-zinc-900">
            
            <section class="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-zinc-50 dark:bg-zinc-800/30">
              <div class="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-3">
                <h3 class="text-sm font-black text-zinc-900 dark:text-white">원본 내용</h3>
                <span class="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md uppercase tracking-wider">Original</span>
              </div>
              <div class="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed" v-html="activeProject()?.original"></div>
            </section>

            <section class="border-2 border-dashed border-yellow-300 dark:border-zinc-700 rounded-2xl p-5 bg-yellow-50/30 dark:bg-zinc-800/50">
              <div class="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-3">
                <h3 class="text-sm font-black text-zinc-900 dark:text-white">수정 에디터</h3>
                <button @click="requestAiReview" :disabled="isAiLoading"
                  :class="['text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm', 
                  isProUser ? 'bg-yellow-400 border-yellow-500 text-zinc-900 hover:bg-yellow-500' : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700']">
                  <i class="fa-solid fa-wand-sparkles"></i> AI 자동 첨삭
                </button>
              </div>

              <div v-if="isAiLoading" class="py-12 text-center text-zinc-500 font-bold flex flex-col items-center">
                <i class="fa-solid fa-circle-notch animate-spin text-yellow-500 text-3xl mb-4"></i>
                <p>AI가 문장을 매끄럽게 교정하고 있습니다...</p>
              </div>

              <div v-else>
                <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-yellow-400/50 transition-all">
                  <SectionEditor v-if="projects[ui.projectIndex]" :key="ui.projectIndex" v-model="projects[ui.projectIndex].reviewDraft"
                    class="w-full min-h-[200px] text-sm text-zinc-900 dark:text-white p-2">
                  </SectionEditor>
                </div>

                <div class="flex justify-end gap-3 mt-5">
                  <button type="button" @click="closeEval" class="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">취소</button>
                  <button type="button" @click="applyReview" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-yellow-400 text-zinc-900 hover:bg-yellow-500 shadow-sm transition-colors">임시 저장</button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>

    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl transition-all duration-300 z-[10000]"
      :class="toast.open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'">
      {{ toast.message }}
    </div>
  </div>
</template>

<style>
/* 기존 CSS 변수와 구조를 유지하면서 테마에 맞게 덮어쓰기 */
html.eval-open,
html.eval-open body {
  overflow: hidden;
}

.eval-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.eval-overlay.eval-open {
  pointer-events: auto;
  opacity: 1;
}

.eval-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.eval-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -48%) scale(0.96);
  width: min(1000px, calc(100vw - 32px));
  height: min(760px, calc(100vh - 32px));
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.eval-overlay.eval-open .eval-modal {
  transform: translate(-50%, -50%) scale(1);
}

/* 모달 내부 스크롤바 디자인 */
.eval-modal aside::-webkit-scrollbar,
.eval-modal main::-webkit-scrollbar {
  width: 6px;
}
.eval-modal aside::-webkit-scrollbar-track,
.eval-modal main::-webkit-scrollbar-track {
  background: transparent;
}
.eval-modal aside::-webkit-scrollbar-thumb,
.eval-modal main::-webkit-scrollbar-thumb {
  background-color: #e4e4e7;
  border-radius: 10px;
}
.dark .eval-modal aside::-webkit-scrollbar-thumb,
.dark .eval-modal main::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
}
</style>