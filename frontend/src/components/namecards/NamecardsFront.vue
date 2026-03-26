<script setup>
import { computed } from 'vue'

const props = defineProps({
  cardInfo: {
    type: Object,
    required: true,
  }
})

// 색상 키값에 따른 Tailwind 클래스 매핑
const colorClasses = computed(() => {
  const color = props.cardInfo?.color || 'YELLOW'
  
  const mapping = {
    YELLOW: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-400/20',
      hover: 'hover:text-yellow-400'
    },
    BLUE: {
      text: 'text-blue-500',
      bg: 'bg-blue-500/20',
      hover: 'hover:text-blue-500'
    },
    GREEN: {
      text: 'text-green-500',
      bg: 'bg-green-500/20',
      hover: 'hover:text-green-500'
    },
    PURPLE: {
      text: 'text-purple-500',
      bg: 'bg-purple-500/20',
      hover: 'hover:text-purple-500'
    }
  }
  
  return mapping[color] || mapping.YELLOW
})
</script>

<template>
  <div v-if="cardInfo" class="relative w-full max-w-md aspect-[1.58/1] mx-auto">
    <div
      class="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8 backface-hidden overflow-hidden shadow-lg"
    >
      <!-- 동적 배경 장식 -->
      <div 
        class="absolute top-0 right-0 w-32 h-32 rounded-bl-full transition-colors duration-500"
        :class="colorClasses.bg"
      ></div>
      
      <div class="flex flex-col justify-between h-full relative z-10">
        <div class="flex justify-between items-start">
          <div class="pr-4">
            <!-- 동적 소속 텍스트 컬러 -->
            <p 
              class="text-xs font-bold uppercase tracking-widest mb-1 transition-colors duration-500"
              :class="colorClasses.text"
            >
              {{ cardInfo.affiliation }}
            </p>
            <p 
              class="text-s font-bold tracking-widest mb-1 text-gray-700 duration-500"
            >
              {{ cardInfo.title }}
            </p>
            <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 truncate">
              {{ cardInfo.name }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-2">
              {{ cardInfo.description }}
            </p>
          </div>
          <div
            class="shrink-0 w-20 h-20 rounded-full border-4 border-white dark:border-zinc-800 shadow-md overflow-hidden bg-gray-100"
          >
            
            <img :src="cardInfo.profileImage" alt="Default" class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex gap-2 flex-wrap">
            <span v-for="(tag, index) in cardInfo.keywords" :key="index"
              class="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-md">
              #{{ tag }}
            </span>
          </div>

          <div class="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <div class="flex gap-3 text-gray-400 dark:text-gray-500">
              <!-- 동적 호버 컬러 (GitHub) -->
              <a v-if="cardInfo.url" :href="'https://' + cardInfo.url" target="_blank"
                class="transition-colors duration-300"
                :class="colorClasses.hover">
                <i class="fa-brands fa-github text-xl"></i>
              </a>

              <!-- 동적 호버 컬러 (Email) -->
              <a v-if="cardInfo.email" :href="'mailto:' + cardInfo.email"
                class="transition-colors duration-300"
                :class="colorClasses.hover">
                <i class="fa-solid fa-envelope text-xl"></i>
              </a>
            </div>

            <i
              class="fa-solid fa-qrcode text-3xl text-gray-800 dark:text-white opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center text-red-500 mt-10">사용자 정보를 찾을 수 없습니다.</div>
</template>

<style scoped>
/* 기존의 하드코딩된 스타일 대신 동적 클래스 사용 */
.backface-hidden {
  backface-visibility: hidden;
}
</style>