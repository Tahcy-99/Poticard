<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// ✨ 1. API 함수 변경: 전체 데이터를 가져오는 getProjectDetail 사용
import { updateStyle, getProjectDetail } from '@/api/portfolio/index.js'

import ThemeSelector from '@/components/portfolio/ThemeSelector.vue'
import LayoutSelector from '@/components/portfolio/LayoutSelector.vue'

const router = useRouter()
const route = useRoute()

const theme = ref('minimal')
const layout = ref('single')
const accent = ref('amber')
const font = ref('sans')
const sections = ref([])

// ✨ 2. 포트폴리오 기본 데이터 및 초기 섹션 상태를 담을 변수 추가
const portfolioData = ref({
  title: '',
  role: '',
  keywords: [],
  Image: ''
})
const initialSections = ref([]) // 초기화 버튼을 위해 원래 DB 상태를 보관하는 곳

const portfolioIdx = route.query.idx || 1; 

const defaultSections = [
  { id: 's1', title: 'INTRO', icon: '👋', visible: true, kind: 'summary', content: '문제를 단순하게 만들고, 사용자가 바로 이해하는 코드를 작성합니다.' },
  { id: 's2', title: 'SKILLS', icon: '🧰', visible: true, kind: 'summary', content: ['Java', 'Spring Boot', 'Vue.js', 'MariaDB'].join(', ') },
  { id: 's3', title: 'PROJECTS', icon: '🧩', visible: true, kind: 'detail', content: 'Poticard 포트폴리오 플랫폼 개발\n- 소셜 로그인 연동 (OAuth 2.0)\n- Master-Slave DB 레플리케이션 구축' },
]

onMounted(async () => {
  try {
    // ✨ 3. 포트폴리오 데이터와 섹션을 한 번에 조회
    const res = await getProjectDetail(portfolioIdx);
    const fetchedData = res.data?.result || res.data; // BaseResponse 형태에 맞게 분기
    
    if (fetchedData) {
      portfolioData.value = fetchedData; // 화면에 뿌려줄 기본 정보 저장

      if (Array.isArray(fetchedData.sectionList) && fetchedData.sectionList.length > 0) {
        sections.value = fetchedData.sectionList.map((sec, index) => ({
          id: sec.idx, 
          title: sec.sectionTitle || `SECTION ${index + 1}`, 
          icon: '📌', 
          visible: sec.visible !== false, // 백엔드의 isVisible 변수 매핑
          kind: 'detail', 
          content: sec.contents || '내용이 없습니다.' 
        }));
        // ✨ 4. 성공적으로 불러온 데이터를 깊은 복사하여 보관 (초기화용)
        initialSections.value = JSON.parse(JSON.stringify(sections.value));
      } else {
        sections.value = JSON.parse(JSON.stringify(defaultSections));
        initialSections.value = JSON.parse(JSON.stringify(defaultSections));
      }
    }
  } catch (error) {
    sections.value = JSON.parse(JSON.stringify(defaultSections)); 
    initialSections.value = JSON.parse(JSON.stringify(defaultSections));
  }

  renderList()
  renderPreview()
})

watch([theme, layout], () => {
  renderPreview()
})

// ✨ 5. 초기화 기능 수정: 더미데이터가 아닌 initialSections(오리지널 DB)로 복구
const resetSections = () => {
  sections.value = JSON.parse(JSON.stringify(initialSections.value))
  renderList()
  renderPreview()
}

// ✨ 6. 저장 시 isVisible 필드 백엔드 DTO에 맞게 전송
const saveStyle = async () => {
  const styleData = {
    theme: theme.value,
    layoutType: layout.value,
    sectionList: sections.value.map((s, index) => ({
      idx: s.id, 
      sectionOrder: index + 1,
      visible: s.visible // boolean isVisible 매핑
    }))
  };

  try {
    await updateStyle(portfolioIdx, styleData);
    alert('스타일 설정이 저장되었습니다.');
    router.push({ path: '/portfolio-view', query: { idx: portfolioIdx } });
  } catch (error) {
    alert('스타일 저장 중 오류가 발생했습니다.');
  }
};

const accentMap = {
  amber: { text: 'text-yellow-500', pillBg: 'bg-yellow-100', pillText: 'text-yellow-800', border: 'border-yellow-200', bg: 'bg-yellow-400' },
  sky: { text: 'text-sky-500', pillBg: 'bg-sky-100', pillText: 'text-sky-800', border: 'border-sky-200', bg: 'bg-sky-400' },
  emerald: { text: 'text-emerald-500', pillBg: 'bg-emerald-100', pillText: 'text-emerald-800', border: 'border-emerald-200', bg: 'bg-emerald-400' },
  violet: { text: 'text-violet-500', pillBg: 'bg-violet-100', pillText: 'text-violet-800', border: 'border-violet-200', bg: 'bg-violet-400' },
  pink: { text: 'text-pink-500', pillBg: 'bg-pink-100', pillText: 'text-pink-800', border: 'border-pink-200', bg: 'bg-pink-400' },
}

function getThemeClasses() {
  switch(theme.value) {
    case 'notion': return { wrapperBg: 'bg-white dark:bg-[#191919]', card: 'bg-white dark:bg-[#191919] text-zinc-900 dark:text-zinc-100 border-none shadow-none', section: 'bg-transparent py-6 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 rounded-none p-0', avatar: 'rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm' }
    case 'bento': return { wrapperBg: 'bg-[#f5f5f7] dark:bg-black', card: 'bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 border-none shadow-none', section: 'bg-white dark:bg-zinc-900/80 rounded-[2rem] p-8 shadow-sm border border-black/5 dark:border-white/5', avatar: 'rounded-full border-4 border-white dark:border-zinc-800 shadow-lg' }
    case 'saas': return { wrapperBg: 'bg-[#0a0a0a]', card: 'bg-[#0a0a0a] text-zinc-100 border border-zinc-800/60 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)]', section: 'bg-zinc-900/40 rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700 transition-colors', avatar: 'rounded-2xl border border-zinc-800' }
    case 'terminal': return { wrapperBg: 'bg-zinc-900 dark:bg-zinc-950', card: 'bg-black text-green-500 font-mono border border-green-500/30 rounded-lg shadow-none', section: 'bg-black/50 border border-green-500/20 rounded-lg p-6', avatar: 'rounded-none border-2 border-green-500 bg-black' }
    case 'brutalism': return { wrapperBg: 'bg-yellow-300 dark:bg-yellow-500', card: 'bg-white text-black border-4 border-black rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)]', section: 'bg-white border-4 border-black p-6 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]', avatar: 'rounded-none border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white' }
    case 'glassmorphism': return { wrapperBg: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900', card: 'bg-white/30 dark:bg-black/40 backdrop-blur-xl text-zinc-900 dark:text-zinc-100 border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl', section: 'bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md', avatar: 'rounded-full border-2 border-white/50 bg-white/30 dark:bg-black/30' }
    case 'retro': return { wrapperBg: 'bg-indigo-900', card: 'bg-black text-white border-4 border-white rounded-none shadow-[4px_4px_0_0_#fff]', section: 'bg-blue-900 border-2 border-white p-6 rounded-none', avatar: 'rounded-none border-2 border-white bg-blue-900' }
    case 'paper': return { wrapperBg: 'bg-zinc-200 dark:bg-zinc-800', card: 'bg-[#f4f1ea] dark:bg-[#2c2a26] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 shadow-md rounded-none font-serif', section: 'bg-transparent border-t-2 border-b-2 border-zinc-300 dark:border-zinc-700 py-6 px-0 rounded-none', avatar: 'rounded-none border border-zinc-400 p-1 bg-transparent' }
    case 'monochrome': return { wrapperBg: 'bg-zinc-300 dark:bg-zinc-900', card: 'bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-none shadow-none', section: 'bg-transparent border-l-4 border-black dark:border-white pl-6 rounded-none py-4', avatar: 'rounded-full border-2 border-black dark:border-white grayscale bg-transparent' }
    case 'blueprint': return { wrapperBg: 'bg-blue-950', card: 'bg-blue-900 text-blue-100 border border-blue-400 font-mono rounded-none shadow-none', section: 'bg-transparent border border-blue-400/50 p-6 rounded-none', avatar: 'rounded-none border border-blue-400 bg-transparent' }
    case 'claymorphism': return { wrapperBg: 'bg-zinc-100 dark:bg-zinc-900', card: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-[3rem] shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.5),-12px_-12px_24px_rgba(255,255,255,0.05)] border-none', section: 'bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.05)]', avatar: 'rounded-full shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] bg-transparent border-none' }
    case 'neon': return { wrapperBg: 'bg-zinc-950', card: 'bg-zinc-950 text-fuchsia-100 border border-fuchsia-500 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.2)]', section: 'bg-black/50 border border-fuchsia-500/50 p-6 rounded-xl shadow-[inset_0_0_10px_rgba(217,70,239,0.1)]', avatar: 'rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] bg-black' }
    case 'macos': return { wrapperBg: 'bg-zinc-200 dark:bg-zinc-800', card: 'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-xl rounded-xl', section: 'bg-zinc-100/50 dark:bg-black/20 rounded-lg p-6 border border-zinc-200/50 dark:border-zinc-700/50', avatar: 'rounded-full border shadow-sm bg-white dark:bg-zinc-800' }
    default: return { wrapperBg: 'bg-zinc-50 dark:bg-zinc-950', card: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] shadow-sm text-zinc-900 dark:text-zinc-100', section: 'bg-zinc-50 dark:bg-zinc-800/40 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800/60', avatar: 'rounded-full border border-zinc-200 dark:border-zinc-700' }
  }
}

function renderPreview() {
  const previewSectionsEl = document.getElementById('previewSections')
  const tagRowEl = document.getElementById('tagRow')
  const previewCardEl = document.getElementById('previewCard')
  const roleTextEl = document.getElementById('roleText')
  const avatarEl = document.getElementById('avatar')
  const previewWrapperEl = document.getElementById('previewWrapper')

  if(!previewSectionsEl) return;

  const a = accentMap[accent.value] || accentMap.amber
  const tc = getThemeClasses()

  previewWrapperEl.className = `${tc.wrapperBg} backdrop-blur-3xl rounded-[2.5rem] p-4 md:p-8 border border-white/50 dark:border-zinc-700/30 shadow-2xl transition-all duration-500`
  previewCardEl.className = `${tc.card} p-8 md:p-12 transition-all duration-500 overflow-hidden relative min-h-[600px] ${font.value === 'serif' ? 'font-serif' : 'font-sans'}`
  
  const isPlain = ['notion', 'paper', 'monochrome'].includes(theme.value);
  const isTech = ['saas', 'terminal', 'neon', 'blueprint'].includes(theme.value);
  const isHarsh = ['brutalism', 'retro'].includes(theme.value);
  const isGlass = theme.value === 'glassmorphism';

  if (isPlain) roleTextEl.className = `inline-block text-sm font-medium opacity-70 mb-2`
  else if (isTech) roleTextEl.className = `inline-block px-3 py-1 rounded-full border border-current opacity-70 text-[10px] font-medium tracking-widest uppercase mb-4`
  else if (isHarsh) roleTextEl.className = `inline-block px-3 py-1 border-2 border-current bg-transparent text-[10px] font-bold tracking-widest uppercase mb-4`
  else roleTextEl.className = `inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${a.pillBg} ${a.pillText} mb-4`
  
  const useAccentAvatar = !isPlain && !isTech && !isHarsh && !isGlass && theme.value !== 'macos' && theme.value !== 'claymorphism';
  
  // ✨ 아바타(이미지) 클래스 설정
  avatarEl.className = `w-24 h-24 flex place-items-center justify-center text-4xl overflow-hidden ${tc.avatar} ${useAccentAvatar ? a.pillBg : ''}`

  // ✨ 기술 스택(키워드) 동적 렌더링 수정
  tagRowEl.innerHTML = ''
  const currentKeywords = portfolioData.value.keywords || [];
  
  currentKeywords.forEach((t) => {
    const span = document.createElement('span')
    if (isPlain) span.className = `opacity-60 text-sm mr-3`
    else if (isTech) span.className = `px-2.5 py-1 rounded-md border border-current opacity-70 text-xs font-medium`
    else if (isHarsh) span.className = `px-3 py-1 border-2 border-current bg-transparent text-xs font-bold`
    else span.className = `px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50`
    
    // 키워드에 '#'이 없으면 붙여서 출력
    span.textContent = t.startsWith('#') ? t : `#${t}`
    tagRowEl.appendChild(span)
  })

  const visibleSections = sections.value.filter((s) => s.visible)
  previewSectionsEl.innerHTML = ''

  if (layout.value === 'single') {
    const wrapper = document.createElement('div'); wrapper.className = 'space-y-6 md:space-y-8'
    visibleSections.forEach((s) => wrapper.appendChild(renderSectionBlock(s, a, tc, layout.value)))
    previewSectionsEl.appendChild(wrapper)
  } else if (layout.value === 'cards' || layout.value === 'masonry') {
    const grid = document.createElement('div')
    grid.className = layout.value === 'masonry' ? 'columns-1 sm:columns-2 gap-4 md:gap-6 space-y-4 md:space-y-6' : 'grid sm:grid-cols-2 gap-4 md:gap-6'
    visibleSections.forEach((s) => {
      const el = renderSectionBlock(s, a, tc, layout.value);
      if (layout.value === 'masonry') el.classList.add('break-inside-avoid', 'mb-4');
      grid.appendChild(el);
    })
    previewSectionsEl.appendChild(grid)
  } else if (layout.value === 'timeline') {
    const timelineWrapper = document.createElement('div'); timelineWrapper.className = 'relative border-l border-current opacity-80 ml-4 space-y-8 pb-4'
    visibleSections.forEach((s) => {
      const item = document.createElement('div'); item.className = 'relative pl-8'
      const dot = document.createElement('div'); dot.className = `absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-transparent ${a.bg}`
      item.appendChild(dot); item.appendChild(renderSectionBlock(s, a, tc, layout.value))
      timelineWrapper.appendChild(item)
    })
    previewSectionsEl.appendChild(timelineWrapper)
  } else if (layout.value === 'split') {
    const wrapper = document.createElement('div'); wrapper.className = 'space-y-8 md:space-y-12'
    visibleSections.forEach((s) => wrapper.appendChild(renderSectionBlock(s, a, tc, layout.value)))
    previewSectionsEl.appendChild(wrapper)
  } else if (layout.value === 'horizontal') {
    const wrapper = document.createElement('div'); wrapper.className = 'flex gap-4 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar'
    visibleSections.forEach((s) => {
      const el = renderSectionBlock(s, a, tc, layout.value);
      el.classList.add('min-w-[280px]', 'md:min-w-[320px]', 'max-w-[400px]', 'snap-center', 'shrink-0');
      wrapper.appendChild(el);
    })
    previewSectionsEl.appendChild(wrapper)
  } else if (layout.value === 'zigzag') {
    const wrapper = document.createElement('div'); wrapper.className = 'space-y-8 md:space-y-12'
    visibleSections.forEach((s, idx) => {
      const el = renderSectionBlock(s, a, tc, layout.value);
      if (idx % 2 === 1) {
        el.classList.add('ml-auto');
        el.style.textAlign = 'right';
        const header = el.querySelector('div.flex.items-center');
        if (header) {
          header.classList.remove('justify-start');
          header.classList.add('justify-end', 'flex-row-reverse');
        }
        const lis = el.querySelectorAll('li');
        lis.forEach(li => {
           li.classList.remove('items-start');
           li.classList.add('items-start', 'flex-row-reverse', 'text-right');
        });
      } else {
        el.classList.add('mr-auto');
      }
      el.classList.add('max-w-[90%]');
      wrapper.appendChild(el);
    })
    previewSectionsEl.appendChild(wrapper)
  } else if (layout.value === 'hero-grid') {
    const grid = document.createElement('div'); grid.className = 'grid sm:grid-cols-2 gap-4 md:gap-6'
    visibleSections.forEach((s, idx) => {
      const el = renderSectionBlock(s, a, tc, layout.value);
      if (idx === 0) el.classList.add('sm:col-span-2', 'md:p-10'); 
      grid.appendChild(el);
    })
    previewSectionsEl.appendChild(grid)
  } else if (layout.value === 'compact') {
    const wrapper = document.createElement('div'); wrapper.className = 'space-y-2 md:space-y-3'
    visibleSections.forEach((s) => wrapper.appendChild(renderSectionBlock(s, a, tc, layout.value)))
    previewSectionsEl.appendChild(wrapper)
  }
}

function renderSectionHeader(section, a, tc) {
  const header = document.createElement('div'); header.className = 'flex items-center gap-3 mb-4'
  const isPlain = ['notion', 'paper', 'monochrome'].includes(theme.value);
  const isTech = ['saas', 'terminal', 'neon', 'blueprint'].includes(theme.value);
  const isHarsh = ['brutalism', 'retro'].includes(theme.value);

  if (isPlain) header.innerHTML = `<h3 class="text-xl font-bold tracking-tight flex items-center gap-2"><span class="text-xl">${section.icon}</span> ${section.title}</h3>`
  else if (isTech) header.innerHTML = `<div class="w-8 h-8 rounded-lg border border-current opacity-80 flex items-center justify-center text-sm">${section.icon}</div><h3 class="text-base font-semibold tracking-wide">${section.title}</h3>`
  else if (isHarsh) header.innerHTML = `<div class="w-8 h-8 border-2 border-current flex items-center justify-center text-sm font-bold">${section.icon}</div><h3 class="text-lg font-bold tracking-tight uppercase">${section.title}</h3>`
  else header.innerHTML = `<div class="flex items-center justify-center w-8 h-8 rounded-full ${a.pillBg} ${a.pillText} text-sm font-bold">${section.icon || '✦'}</div><h3 class="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">${section.title}</h3>`
  return header
}

function renderSectionBody(section) {
  const body = document.createElement('div'); 
  
  if (['terminal', 'blueprint'].includes(theme.value)) body.className = 'opacity-80 leading-relaxed text-sm font-mono'
  else if (['brutalism', 'retro'].includes(theme.value)) body.className = 'font-bold leading-relaxed text-sm'
  else if (['notion', 'paper'].includes(theme.value)) body.className = 'opacity-80 leading-relaxed text-[15px]'
  else body.className = 'opacity-70 leading-relaxed text-sm'

  let contentData = section.content;
  try {
    if (typeof contentData === 'string' && (contentData.startsWith('[') || contentData.startsWith('{'))) {
      contentData = JSON.parse(contentData);
    }
  } catch (e) { }

  if (Array.isArray(contentData)) {
    const ul = document.createElement('ul')
    ul.className = 'space-y-2.5'
    contentData.forEach((line) => {
      const li = document.createElement('li')
      li.className = 'flex items-start gap-3'
      
      let marker = '';
      if (['notion', 'paper', 'monochrome'].includes(theme.value)) marker = `<span class="mt-1.5 w-1 h-1 bg-current opacity-80 shrink-0"></span>`
      else if (['saas', 'terminal', 'neon', 'blueprint'].includes(theme.value)) marker = `<span class="mt-2 w-1.5 h-1.5 border border-current opacity-80 shrink-0"></span>`
      else if (['brutalism', 'retro'].includes(theme.value)) marker = `<span class="mt-1.5 w-2 h-2 bg-current shrink-0"></span>`
      else marker = `<span class="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0"></span>`
        
      li.innerHTML = `${marker}<span>${typeof line === 'object' ? line.name || JSON.stringify(line) : line}</span>`
      ul.appendChild(li)
    })
    body.appendChild(ul)
    return body
  }

  const p = document.createElement('div')
  p.className = 'whitespace-pre-line'
  p.innerHTML = String(contentData ?? '')
  body.appendChild(p)
  return body
}

function renderSectionBlock(section, a, tc, layoutType) {
  const wrap = document.createElement('div')
  
  let baseClass = tc.section;
  if (['single', 'timeline', 'split', 'zigzag', 'compact'].includes(layoutType) && ['minimal', 'paper', 'monochrome'].includes(theme.value)) {
    baseClass = 'border-t border-current/20 pt-8 mt-8 first:border-0 first:pt-0 first:mt-0';
  }
  wrap.className = baseClass;

  const header = renderSectionHeader(section, a, tc);
  const body = renderSectionBody(section);

  if (layoutType === 'split') {
    wrap.classList.add('md:flex', 'md:gap-8', 'items-start');
    const hWrap = document.createElement('div'); hWrap.className = 'md:w-1/3 shrink-0 mb-4 md:mb-0';
    const bWrap = document.createElement('div'); bWrap.className = 'md:w-2/3';
    hWrap.appendChild(header);
    bWrap.appendChild(body);
    wrap.appendChild(hWrap);
    wrap.appendChild(bWrap);
  } else if (layoutType === 'compact') {
    wrap.classList.add('flex', 'flex-col', 'sm:flex-row', 'sm:items-start', 'gap-4', '!p-4', '!py-3');
    header.classList.remove('mb-4');
    header.classList.add('mb-0', 'shrink-0', 'sm:w-1/4');
    wrap.appendChild(header);
    wrap.appendChild(body);
  } else {
    wrap.appendChild(header);
    wrap.appendChild(body);
  }
  return wrap
}

function renderList() {
  const sectionListEl = document.getElementById('sectionList')
  if(!sectionListEl) return;
  sectionListEl.innerHTML = ''
  sections.value.forEach((s, idx) => {
    const item = document.createElement('div'); item.className = 'drag-item group flex items-center justify-between gap-4 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow-sm transition-all'; item.draggable = true; item.dataset.id = s.id
    const left = document.createElement('div'); left.className = 'flex items-center gap-4 min-w-0'
    left.innerHTML = `<div class="cursor-grab active:cursor-grabbing w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 grid place-items-center text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"><i class="fa-solid fa-grip-vertical"></i></div><div class="min-w-0"><div class="text-[10px] font-bold text-zinc-400">SEC 0${idx + 1}</div><div class="font-bold text-zinc-800 dark:text-zinc-100 truncate">${s.icon} ${s.title}</div></div>`
    const right = document.createElement('div'); right.className = 'flex items-center'
    right.innerHTML = `<label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" ${s.visible ? 'checked' : ''} class="sr-only peer" /><div class="w-11 h-6 bg-zinc-200 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div></label>`
    
    right.querySelector('input').addEventListener('change', (e) => { s.visible = e.target.checked; renderPreview() })
    
    item.addEventListener('dragstart', () => item.classList.add('dragging', 'opacity-50'))
    item.addEventListener('dragend', () => { item.classList.remove('dragging', 'opacity-50'); document.querySelectorAll('.drag-item').forEach(x => x.classList.remove('over')) })
    item.addEventListener('dragover', (e) => { e.preventDefault(); item.classList.add('over'); const dragging = document.querySelector('.drag-item.dragging'); if (!dragging || dragging === item) return; const rect = item.getBoundingClientRect(); const after = e.clientY - rect.top > rect.height / 2; if (after) item.after(dragging); else item.before(dragging) })
    item.addEventListener('dragleave', () => item.classList.remove('over'))
    item.addEventListener('drop', () => {
      const newOrder = [...sectionListEl.querySelectorAll('.drag-item')].map(el => String(el.dataset.id))
      sections.value = newOrder.map(id => sections.value.find(s => String(s.id) === id))
      renderPreview(); renderList()
    })
    
    item.appendChild(left); item.appendChild(right); sectionListEl.appendChild(item)
  })
}
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors selection:bg-yellow-200 selection:text-zinc-900">
    <main class="py-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      
      <div class="mb-12 max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-black tracking-widest mb-6 uppercase">
          Step 03
        </div>
        <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-4">어떤 스타일로 보여줄까요?</h1>
        <p class="text-zinc-500 dark:text-zinc-400">당신의 프로젝트가 가장 잘 돋보이는 테마와 레이아웃을 선택하세요.</p>
        
        <div class="mt-8 flex justify-center gap-2 text-sm font-bold text-zinc-300 dark:text-zinc-700">
          <span>작성</span><span>―</span><span>수정</span><span>―</span><span class="text-yellow-500">스타일</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <section class="lg:col-span-4 space-y-6">
          <div class="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/40 dark:shadow-none border border-zinc-200/60 dark:border-zinc-800 p-8 h-auto">
            
            <ThemeSelector v-model="theme" />
            <LayoutSelector v-model="layout" />

            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-black tracking-widest text-zinc-400">SECTIONS (드래그)</h3>
                <button @click="resetSections" class="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <i class="fa-solid fa-rotate-right mr-1"></i>초기화
                </button>
              </div>
              <div id="sectionList" class="flex flex-col gap-3"></div>
            </div>

          </div>
        </section>

        <section class="lg:col-span-8">
          <div class="sticky top-8">
            <div id="previewWrapper" class="bg-zinc-200/50 dark:bg-zinc-800/30 backdrop-blur-3xl rounded-[2.5rem] p-4 md:p-8 border border-white/50 dark:border-zinc-700/30 shadow-2xl transition-all duration-500">
              <div class="flex items-center gap-2 mb-6 px-2">
                <div class="w-3 h-3 rounded-full bg-red-400"></div><div class="w-3 h-3 rounded-full bg-yellow-400"></div><div class="w-3 h-3 rounded-full bg-green-400"></div>
                <div class="ml-4 text-xs font-bold text-zinc-400">Preview Mode</div>
              </div>
              <div id="previewCard" class="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-sm border border-zinc-200/50 dark:border-zinc-800/80 p-8 md:p-12 transition-all duration-500 overflow-hidden relative min-h-[600px]">
                
                <header class="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 border-b border-current/10 pb-12">
                  <div class="order-2 md:order-1 max-w-2xl">
                    <div id="roleText">DEVELOPER</div>
                    
                    <h1 class="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">
                      {{ portfolioData.title || '포트폴리오 제목' }}
                    </h1>
                    
                    <p class="text-lg opacity-80 leading-relaxed font-medium whitespace-pre-line">
                      {{ portfolioData.role || '한 줄 소개를 입력해주세요.' }}
                    </p>
                    
                    <div id="tagRow" class="mt-8 flex flex-wrap gap-2"></div>
                  </div>
                  
                  <div id="avatar" class="order-1 md:order-2 shrink-0">
                    <img v-if="portfolioData.Image" :src="portfolioData.Image" class="w-full h-full object-cover rounded-full" alt="profile" />
                    <span v-else class="text-3xl">💻</span>
                  </div>
                </header>

                <div id="previewSections"></div>
              </div>
            </div>

            <div class="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-end">
              <a href="portfolio-update-n-check" class="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-center">
                <i class="fa-solid fa-arrow-left mr-2"></i> 이전 단계
              </a>
              <button @click="saveStyle" class="px-10 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black shadow-lg shadow-yellow-400/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-400/40 transition-all text-center">
                저장 및 완료하기 <i class="fa-solid fa-check ml-2"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.drag-item.over {
  outline: 2px dashed #facc15;
  outline-offset: 4px;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>