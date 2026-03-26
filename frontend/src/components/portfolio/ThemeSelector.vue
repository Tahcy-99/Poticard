<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'minimal' }
})
const emit = defineEmits(['update:modelValue'])

const themes = [
  { id: 'minimal', name: '미니멀 베이직', desc: '호불호 없는 정석 이력서' },
  { id: 'notion', name: '노션 도큐먼트', desc: '가독성에 집중한 문서형' },
  { id: 'bento', name: '벤토 박스', desc: '트렌디한 애플 스타일 위젯' },
  { id: 'saas', name: '모던 SaaS', desc: '고급스러운 다크 모드 특화' },
  { id: 'terminal', name: '터미널 콘솔', desc: '해커 스타일의 CUI 감성' },
  { id: 'brutalism', name: '네오 브루탈리즘', desc: '강렬한 대비와 굵은 테두리' },
  { id: 'glassmorphism', name: '글래스모피즘', desc: '투명하고 부드러운 유리 질감' },
  { id: 'retro', name: '레트로 픽셀', desc: '8비트 오락실 감성' },
  { id: 'paper', name: '에디토리얼 매거진', desc: '종이 질감의 잡지 레이아웃' },
  { id: 'monochrome', name: '모노크롬 스케일', desc: '오직 흑과 백, 우아한 대비' },
  { id: 'blueprint', name: '설계 블루프린트', desc: '그리드 기반의 아키텍처 도면' },
  { id: 'claymorphism', name: '클레이모피즘', desc: '푹신하고 귀여운 3D 점토 느낌' },
  { id: 'neon', name: '사이버펑크 네온', desc: '화려하게 빛나는 야간 감성' },
  { id: 'macos', name: '데스크탑 윈도우', desc: '친숙한 OS 창 모양 UI' }
]

const currentIndex = computed({
  get: () => {
    const index = themes.findIndex(t => t.id === props.modelValue)
    return index === -1 ? 0 : index
  },
  set: (val) => {
    emit('update:modelValue', themes[Number(val)].id)
  }
})

const currentTheme = computed(() => themes[currentIndex.value] || themes[0])
</script>

<template>
  <div class="mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-sm font-black tracking-widest text-zinc-400">THEME</h3>
      <span class="text-xs font-bold px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-md">
        {{ currentIndex + 1 }} / {{ themes.length }}
      </span>
    </div>

    <div class="mb-6 relative">
      <input 
        type="range" 
        min="0" 
        :max="themes.length - 1" 
        v-model="currentIndex"
        class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
      >
      <div class="flex justify-between text-[10px] font-bold text-zinc-400 mt-2 px-1">
        <span>Slide</span>
        <span>to preview</span>
      </div>
    </div>

    <div class="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 text-center transition-all duration-300">
      <div class="font-black text-lg text-zinc-900 dark:text-zinc-100">{{ currentTheme.name }}</div>
      <div class="text-sm font-medium text-zinc-500 mt-1">{{ currentTheme.desc }}</div>
    </div>
  </div>
</template>

<style scoped>
/* 커스텀 슬라이더 스타일링 (Tailwind accent-color 외 추가 조정이 필요할 경우) */
input[type=range]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #facc15;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.4);
  transition: transform 0.1s;
}
input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
input[type=range]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: #facc15;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.4);
  transition: transform 0.1s;
}
input[type=range]::-moz-range-thumb:hover {
  transform: scale(1.2);
}
</style>