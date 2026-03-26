<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import portfolioApi from '@/api/portfolio/index.js'

const router = useRouter()
const route = useRoute()

const theme = ref('minimal')
const layoutType = ref('single')

const projectInfo = ref({
  name: '',
  period: '',
  tags: [],
  heroImage: '',
  fullStory: []
})

const fetchProjectDetail = async () => {
  try {
    const portfolioIdx = route.query.idx;
    if (!portfolioIdx) return;

    const res = await portfolioApi.getProjectDetail(portfolioIdx);
    // BaseResponse 패턴 분기 처리
    const data = res.data?.result || res.data;
    
    if (data) {
  projectInfo.value = {
    name: data.title || '제목 없음',
    period: data.period || '',
    tags: data.keywords || [],
    heroImage: data.image || '', 
    
    // ✨ isVisible -> visible 로 변경!
    fullStory: data.sectionList ? data.sectionList
      .filter(sec => sec.visible !== false) // 숨김 처리된 섹션 제외
      .sort((a, b) => (a.sectionOrder || 0) - (b.sectionOrder || 0)) // 순서대로 정렬
      .map(sec => ({
        title: sec.sectionTitle,
        content: sec.contents,
        icon: '📌'
      })) : []
  }

      // 테마와 레이아웃 적용
      if (data.theme) theme.value = data.theme;
      if (data.layoutType) layoutType.value = data.layoutType;
    }
  } catch (error) {
    console.error('프로젝트 상세 정보를 불러오는 데 실패했습니다.', error)
  }
}

onMounted(() => {
  fetchProjectDetail()
})

const accentMap = {
  amber: { text: 'text-yellow-500', pillBg: 'bg-yellow-100', pillText: 'text-yellow-800', border: 'border-yellow-200', bg: 'bg-yellow-400' },
}
const a = accentMap.amber

// 테마별 CSS 매핑 로직
const tc = computed(() => {
  switch(theme.value) {
    case 'notion': 
      return { wrapperBg: 'bg-white dark:bg-[#191919]', card: 'bg-white dark:bg-[#191919] text-zinc-900 dark:text-zinc-100 border-none shadow-none', section: 'bg-transparent py-6 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 rounded-none p-0' }
    case 'bento': 
      return { wrapperBg: 'bg-[#f5f5f7] dark:bg-black', card: 'bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 border-none shadow-none', section: 'bg-white dark:bg-zinc-900/80 rounded-[2rem] p-8 shadow-sm border border-black/5 dark:border-white/5' }
    case 'saas': 
      return { wrapperBg: 'bg-[#0a0a0a]', card: 'bg-[#0a0a0a] text-zinc-100 border border-zinc-800/60 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)]', section: 'bg-zinc-900/40 rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700 transition-colors' }
    case 'terminal':
      return { wrapperBg: 'bg-zinc-900 dark:bg-zinc-950', card: 'bg-black text-green-500 font-mono border border-green-500/30 rounded-lg shadow-none', section: 'bg-black/50 border border-green-500/20 rounded-lg p-6' }
    case 'brutalism':
      return { wrapperBg: 'bg-yellow-300 dark:bg-yellow-500', card: 'bg-white text-black border-4 border-black rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)]', section: 'bg-white border-4 border-black p-6 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]' }
    case 'glassmorphism':
      return { wrapperBg: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900', card: 'bg-white/30 dark:bg-black/40 backdrop-blur-xl text-zinc-900 dark:text-zinc-100 border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl', section: 'bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md' }
    case 'retro':
      return { wrapperBg: 'bg-indigo-900', card: 'bg-black text-white border-4 border-white rounded-none shadow-[4px_4px_0_0_#fff]', section: 'bg-blue-900 border-2 border-white p-6 rounded-none' }
    case 'paper':
      return { wrapperBg: 'bg-zinc-200 dark:bg-zinc-800', card: 'bg-[#f4f1ea] dark:bg-[#2c2a26] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 shadow-md rounded-none font-serif', section: 'bg-transparent border-t-2 border-b-2 border-zinc-300 dark:border-zinc-700 py-6 px-0 rounded-none' }
    case 'monochrome':
      return { wrapperBg: 'bg-zinc-300 dark:bg-zinc-900', card: 'bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-none shadow-none', section: 'bg-transparent border-l-4 border-black dark:border-white pl-6 rounded-none py-4' }
    case 'blueprint':
      return { wrapperBg: 'bg-blue-950', card: 'bg-blue-900 text-blue-100 border border-blue-400 font-mono rounded-none shadow-none', section: 'bg-transparent border border-blue-400/50 p-6 rounded-none' }
    case 'claymorphism':
      return { wrapperBg: 'bg-zinc-100 dark:bg-zinc-900', card: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-[3rem] shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.5),-12px_-12px_24px_rgba(255,255,255,0.05)] border-none', section: 'bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.05)]' }
    case 'neon':
      return { wrapperBg: 'bg-zinc-950', card: 'bg-zinc-950 text-fuchsia-100 border border-fuchsia-500 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.2)]', section: 'bg-black/50 border border-fuchsia-500/50 p-6 rounded-xl shadow-[inset_0_0_10px_rgba(217,70,239,0.1)]' }
    case 'macos':
      return { wrapperBg: 'bg-zinc-200 dark:bg-zinc-800', card: 'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-xl rounded-xl', section: 'bg-zinc-100/50 dark:bg-black/20 rounded-lg p-6 border border-zinc-200/50 dark:border-zinc-700/50' }
    default: 
      return { wrapperBg: 'bg-zinc-50 dark:bg-zinc-950', card: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] shadow-sm text-zinc-900 dark:text-zinc-100', section: 'bg-zinc-50 dark:bg-zinc-800/40 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800/60' }
  }
})

const isPlain = computed(() => ['notion', 'paper', 'monochrome'].includes(theme.value))
const isTech = computed(() => ['saas', 'terminal', 'neon', 'blueprint'].includes(theme.value))
const isHarsh = computed(() => ['brutalism', 'retro'].includes(theme.value))

const layoutClass = computed(() => {
  switch(layoutType.value) {
    case 'single': return 'space-y-6 md:space-y-8 flex flex-col'
    case 'cards': return 'grid sm:grid-cols-2 gap-4 md:gap-6'
    case 'masonry': return 'columns-1 sm:columns-2 gap-4 md:gap-6 space-y-4 md:space-y-6 block'
    case 'split': return 'space-y-8 md:space-y-12' 
    case 'horizontal': return 'flex gap-4 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar'
    case 'zigzag': return 'space-y-8 md:space-y-12'
    case 'hero-grid': return 'grid sm:grid-cols-2 gap-4 md:gap-6' 
    case 'compact': return 'space-y-2 md:space-y-3'
    case 'timeline': return 'relative border-l border-current opacity-80 ml-4 space-y-8 pb-4'
    default: return 'space-y-6 md:space-y-8'
  }
})

// 배열형 데이터(리스트) 처리
const parsedSections = computed(() => {
  return projectInfo.value.fullStory.map(sec => {
    let parsedContent = sec.content;
    let isList = false;
    try {
      if (typeof parsedContent === 'string' && (parsedContent.startsWith('[') || parsedContent.startsWith('{'))) {
        parsedContent = JSON.parse(parsedContent);
        isList = Array.isArray(parsedContent);
      }
    } catch(e) {}
    return {
      ...sec,
      parsedContent,
      isList
    }
  })
})

const getSectionClasses = (idx) => {
  let baseClass = tc.value.section;
  if (['single', 'timeline', 'split', 'zigzag', 'compact'].includes(layoutType.value) && ['minimal', 'paper', 'monochrome'].includes(theme.value)) {
    baseClass = 'border-t border-current/20 pt-8 mt-8 first:border-0 first:pt-0 first:mt-0 !bg-transparent !shadow-none';
  }

  return [
    baseClass,
    layoutType.value === 'masonry' ? 'break-inside-avoid mb-4' : '',
    layoutType.value === 'horizontal' ? 'min-w-[280px] md:min-w-[320px] max-w-[400px] snap-center shrink-0' : '',
    layoutType.value === 'hero-grid' && idx === 0 ? 'sm:col-span-2 md:p-10' : '',
    layoutType.value === 'split' ? 'md:flex md:gap-8 items-start' : '',
    layoutType.value === 'compact' ? 'flex flex-col sm:flex-row sm:items-start gap-4 !p-4 !py-3' : '',
    layoutType.value === 'zigzag' && idx % 2 === 1 ? 'ml-auto text-right max-w-[90%]' : (layoutType.value === 'zigzag' ? 'mr-auto max-w-[90%]' : ''),
  ]
}

const goBack = () => router.push('/portfolio-view') 
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 font-sans">
    <main class="max-w-[1400px] mx-auto">
      
      <nav class="flex items-center justify-between mb-8 opacity-60 hover:opacity-100 transition-opacity max-w-5xl mx-auto">
        <button @click="goBack" class="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
          <span class="text-lg">←</span> 뒤로가기
        </button>
       
      </nav>

      <div :class="['max-w-5xl mx-auto backdrop-blur-3xl rounded-[2.5rem] p-4 md:p-8 border border-white/50 dark:border-zinc-700/30 shadow-2xl transition-all duration-500', tc.wrapperBg]">
        
        <div :class="[tc.card, 'p-8 md:p-12 lg:p-16 transition-all duration-500 overflow-hidden relative min-h-[800px]']">
          
          <header class="mb-12 border-b border-current/10 pb-12">
             <div :class="[
                isPlain ? 'inline-block text-sm font-medium opacity-70 mb-2' :
                isTech ? 'inline-block px-3 py-1 rounded-full border border-current opacity-70 text-[10px] font-medium tracking-widest uppercase mb-4' :
                isHarsh ? 'inline-block px-3 py-1 border-2 border-current bg-transparent text-[10px] font-bold tracking-widest uppercase mb-4' :
                `inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${a.pillBg} ${a.pillText} mb-4`
             ]">
               {{ projectInfo.period || 'ROLE / PERIOD' }}
             </div>
             
             <h1 class="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">
               {{ projectInfo.name }}
             </h1>
             
             <div class="mt-8 flex flex-wrap gap-2">
               <span v-for="tag in projectInfo.tags" :key="tag"
                 :class="[
                    isPlain ? 'opacity-60 text-sm mr-3' :
                    isTech ? 'px-2.5 py-1 rounded-md border border-current opacity-70 text-xs font-medium' :
                    isHarsh ? 'px-3 py-1 border-2 border-current bg-transparent text-xs font-bold' :
                    'px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50'
                 ]">
                 #{{ tag }}
               </span>
             </div>

             <div v-if="projectInfo.heroImage" class="mt-12 relative mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-current/10">
              <img :src="projectInfo.heroImage" alt="Hero" class="w-full aspect-[21/9] object-contain bg-zinc-100 dark:bg-zinc-800 p-4" />
             </div>
          </header>

          <div :class="layoutClass">
            <div v-for="(section, idx) in parsedSections" :key="idx"
                 :class="layoutType === 'timeline' ? 'relative pl-8' : ''">
              
              <div v-if="layoutType === 'timeline'" :class="`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-transparent ${a.bg}`"></div>

              <section :class="getSectionClasses(idx)">
                <div :class="[
                  'flex items-center gap-3 mb-4',
                  layoutType === 'split' ? 'md:w-1/3 shrink-0 md:mb-0' : '',
                  layoutType === 'compact' ? 'mb-0 shrink-0 sm:w-1/4' : '',
                  layoutType === 'zigzag' && idx % 2 === 1 ? 'justify-end flex-row-reverse' : ''
                ]">
                  <template v-if="isPlain">
                    <h3 class="text-xl font-bold tracking-tight flex items-center gap-2">
                      <span class="text-xl">{{ section.icon }}</span> {{ section.title }}
                    </h3>
                  </template>
                  <template v-else-if="isTech">
                    <div class="w-8 h-8 rounded-lg border border-current opacity-80 flex items-center justify-center text-sm">{{ section.icon }}</div>
                    <h3 class="text-base font-semibold tracking-wide">{{ section.title }}</h3>
                  </template>
                  <template v-else-if="isHarsh">
                    <div class="w-8 h-8 border-2 border-current flex items-center justify-center text-sm font-bold">{{ section.icon }}</div>
                    <h3 class="text-lg font-bold tracking-tight uppercase">{{ section.title }}</h3>
                  </template>
                  <template v-else>
                    <div :class="`flex items-center justify-center w-8 h-8 rounded-full ${a.pillBg} ${a.pillText} text-sm font-bold`">
                      {{ section.icon || '✦' }}
                    </div>
                    <h3 class="text-lg font-bold tracking-tight">{{ section.title }}</h3>
                  </template>
                </div>

                <div :class="[
                  ['terminal', 'blueprint'].includes(theme) ? 'opacity-80 leading-relaxed text-sm font-mono' :
                  ['brutalism', 'retro'].includes(theme) ? 'font-bold leading-relaxed text-sm' :
                  ['notion', 'paper'].includes(theme) ? 'opacity-80 leading-relaxed text-[15px]' :
                  'opacity-70 leading-relaxed text-sm',
                  layoutType === 'split' ? 'md:w-2/3' : ''
                ]">
                  <ul v-if="section.isList" class="space-y-2.5">
                    <li v-for="(line, i) in section.parsedContent" :key="i"
                        :class="['flex items-start gap-3', layoutType === 'zigzag' && idx % 2 === 1 ? 'flex-row-reverse text-right' : '']">
                      <span v-if="isPlain" class="mt-1.5 w-1 h-1 bg-current opacity-80 shrink-0"></span>
                      <span v-else-if="isTech" class="mt-2 w-1.5 h-1.5 border border-current opacity-80 shrink-0"></span>
                      <span v-else-if="isHarsh" class="mt-1.5 w-2 h-2 bg-current shrink-0"></span>
                      <span v-else class="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0"></span>
                      <span>{{ typeof line === 'object' ? (line.name || JSON.stringify(line)) : line }}</span>
                    </li>
                  </ul>
                  <div v-else class="whitespace-pre-line" v-html="section.parsedContent"></div>
                </div>
              </section>
            </div>
          </div>
          
          <div class="mt-24 flex flex-col items-center">
            <button @click="goBack"
              :class="['group relative px-10 py-4 font-black text-sm overflow-hidden transition-all hover:-translate-y-1', 
                ['saas', 'bento', 'macos'].includes(theme) ? 'bg-zinc-900 text-white dark:bg-white dark:text-black rounded-2xl shadow-lg' : 
                ['brutalism', 'retro'].includes(theme) ? 'bg-white text-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none' : 
                ['terminal', 'blueprint'].includes(theme) ? 'bg-transparent text-current border border-current rounded-none' : 
                'bg-zinc-100 dark:bg-zinc-800 text-current rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700'
              ]">
              <span class="relative z-10 flex items-center gap-2">
                목록으로 돌아가기
                <span class="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>