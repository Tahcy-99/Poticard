<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'single' }
})
const emit = defineEmits(['update:modelValue'])

const layouts = [
  { id: 'single', name: 'Single Column', desc: '기본적인 1단 세로 배열' },
  { id: 'split', name: 'Split View', desc: '좌측 제목, 우측 내용 분할' },
  { id: 'cards', name: 'Cards Grid', desc: '균일한 2단 카드 그리드' },
  { id: 'masonry', name: 'Masonry', desc: '높이가 다른 벽돌형 배치' },
  { id: 'hero-grid', name: 'Hero & Grid', desc: '첫 섹션 강조, 이후 2단' },
  { id: 'horizontal', name: 'Horizontal', desc: '가로 스크롤형 배치' },
  { id: 'zigzag', name: 'Zigzag', desc: '좌우 교차 지그재그 배열' },
  { id: 'timeline', name: 'Timeline', desc: '시간 흐름 순서도' },
  { id: 'compact', name: 'Compact', desc: '여백을 최소화한 압축형' }
]

const currentIndex = computed({
  get: () => {
    const index = layouts.findIndex(l => l.id === props.modelValue)
    return index === -1 ? 0 : index
  },
  set: (val) => {
    emit('update:modelValue', layouts[Number(val)].id)
  }
})

const currentLayout = computed(() => layouts[currentIndex.value] || layouts[0])
</script>

<template>
  <div class="mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-sm font-black tracking-widest text-zinc-400">LAYOUT</h3>
      <span class="text-xs font-bold px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-md">
        {{ currentIndex + 1 }} / {{ layouts.length }}
      </span>
    </div>

    <div class="mb-6 relative">
      <input 
        type="range" 
        min="0" 
        :max="layouts.length - 1" 
        v-model="currentIndex"
        class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
      >
      <div class="flex justify-between text-[10px] font-bold text-zinc-400 mt-2 px-1">
        <span>Slide</span>
        <span>to preview</span>
      </div>
    </div>

    <div class="flex items-center gap-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 transition-all duration-300">
      <div class="w-14 h-14 shrink-0 rounded-xl bg-white dark:bg-zinc-900 flex overflow-hidden relative items-center justify-center p-2 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        
        <template v-if="currentLayout.id === 'single'">
          <div class="flex flex-col gap-1 w-full"><div class="w-full h-1.5 bg-yellow-400 rounded-full"></div><div class="w-full h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'split'">
          <div class="flex gap-1 w-full h-full"><div class="w-1/3 h-full bg-yellow-400 rounded-sm"></div><div class="w-2/3 h-full bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'cards'">
          <div class="flex flex-wrap gap-1 w-full h-full"><div class="w-[calc(50%-2px)] h-[calc(50%-2px)] bg-yellow-400 rounded-sm"></div><div class="w-[calc(50%-2px)] h-[calc(50%-2px)] bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div><div class="w-[calc(50%-2px)] h-[calc(50%-2px)] bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div><div class="w-[calc(50%-2px)] h-[calc(50%-2px)] bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'masonry'">
          <div class="flex gap-1 w-full h-full items-start"><div class="w-1/2 h-full bg-yellow-400 rounded-sm"></div><div class="w-1/2 h-3/4 bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'hero-grid'">
          <div class="flex flex-col gap-1 w-full h-full"><div class="w-full h-1/2 bg-yellow-400 rounded-sm"></div><div class="flex gap-1 h-[calc(50%-2px)]"><div class="w-1/2 bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div><div class="w-1/2 bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'horizontal'">
          <div class="flex gap-1 w-full h-full"><div class="w-3 shrink-0 h-full bg-yellow-400 rounded-sm"></div><div class="w-3 shrink-0 h-full bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div><div class="w-3 shrink-0 h-full bg-zinc-300 dark:bg-zinc-600 rounded-sm"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'zigzag'">
          <div class="flex flex-col gap-1.5 w-full justify-center"><div class="w-2/3 h-1.5 bg-yellow-400 rounded-full self-start"></div><div class="w-2/3 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full self-end"></div></div>
        </template>
        <template v-else-if="currentLayout.id === 'timeline'">
          <div class="w-0.5 h-full bg-zinc-300 dark:bg-zinc-600 absolute left-3"></div><div class="w-2 h-2 rounded-full bg-yellow-400 z-10 my-1 ml-2.5 self-start shadow-[0_0_4px_#facc15]"></div>
        </template>
        <template v-else-if="currentLayout.id === 'compact'">
          <div class="flex flex-col gap-0.5 w-full"><div class="w-full h-1 bg-yellow-400 rounded-full"></div><div class="w-full h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full"></div><div class="w-full h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full"></div></div>
        </template>

      </div>
      
      <div>
        <div class="font-black text-base text-zinc-900 dark:text-zinc-100">{{ currentLayout.name }}</div>
        <div class="text-xs font-medium text-zinc-500 mt-0.5">{{ currentLayout.desc }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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