<script setup>
import { computed } from 'vue'

const props = defineProps({
  cardInfo: {
    type: Object,
    required: true
  }
})

// 색상 키값에 따른 상세 Tailwind 클래스 매핑
const colorClasses = computed(() => {
  const color = props.cardInfo?.color || 'YELLOW'
  
  const mapping = {
    YELLOW: {
      bgLight: 'bg-yellow-100',
      bgHover: 'group-hover:bg-yellow-300',
      borderHover: 'hover:border-yellow-300',
      textAccent: 'text-yellow-600',
      textHover: 'group-hover:text-yellow-600',
      avatarBorder: 'group-hover:border-yellow-400',
      iconHover: 'group-hover:text-yellow-500'
    },
    BLUE: {
      bgLight: 'bg-blue-100',
      bgHover: 'group-hover:bg-blue-300',
      borderHover: 'hover:border-blue-300',
      textAccent: 'text-blue-600',
      textHover: 'group-hover:text-blue-600',
      avatarBorder: 'group-hover:border-blue-400',
      iconHover: 'group-hover:text-blue-500'
    },
    GREEN: {
      bgLight: 'bg-green-100',
      bgHover: 'group-hover:bg-green-300',
      borderHover: 'hover:border-green-300',
      textAccent: 'text-green-600',
      textHover: 'group-hover:text-green-600',
      avatarBorder: 'group-hover:border-green-400',
      iconHover: 'group-hover:text-green-500'
    },
    PURPLE: {
      bgLight: 'bg-purple-100',
      bgHover: 'group-hover:bg-purple-300',
      borderHover: 'hover:border-purple-300',
      textAccent: 'text-purple-600',
      textHover: 'group-hover:text-purple-600',
      avatarBorder: 'group-hover:border-purple-400',
      iconHover: 'group-hover:text-purple-500'
    }
  }
  
  return mapping[color] || mapping.YELLOW
})
</script>

<template>
  <div
    class="relative w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between p-5 overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl z-0 hover:z-10 group"
    :class="colorClasses.borderHover"
  >
    <template v-if="cardInfo">
      <!-- 우측 상단 데코레이션 (색상 연동) -->
      <div
        class="absolute top-0 right-0 w-16 h-16 rounded-bl-full transition-colors duration-500"
        :class="[colorClasses.bgLight, colorClasses.bgHover]"
      >
      </div>

      <div class="relative z-10">
        <!-- 역할/소속 텍스트 (색상 연동) -->
        <p 
          class="text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-500"
          :class="colorClasses.textAccent"
        >
          {{ cardInfo.affiliation || cardInfo.role }}
        </p>
        
        <!-- 이름 (호버 시 색상 연동) -->
        <h4
          class="text-lg font-black text-gray-900 dark:text-white leading-tight transition-colors duration-500 line-clamp-2"
          :class="colorClasses.textHover"
        >
          {{ cardInfo.name }}
        </h4>

        <div class="mt-3 flex flex-wrap gap-1">
          <span v-for="tag in cardInfo.keywords" :key="tag"
            class="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full font-medium">
            #{{ tag }}
          </span>
        </div>
      </div>

      <div class="flex justify-between items-end mt-4">
        <!-- 아바타 테두리 (색상 연동) -->
        <div
          class="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-500 bg-gray-50 dark:bg-zinc-800"
          :class="colorClasses.avatarBorder"
        >
          <img :src="cardInfo.profileImage" alt="Avatar" class="w-full h-full object-cover" />
        </div>

        <!-- 화살표 아이콘 (색상 연동) -->
        <i
          class="fa-solid fa-arrow-right text-gray-300 dark:text-zinc-700 transition-all duration-500 transform group-hover:translate-x-1"
          :class="colorClasses.iconHover"
        ></i>
      </div>
    </template>

    <!-- 로딩 상태 -->
    <template v-else>
      <div class="animate-pulse flex flex-col justify-between h-full">
        <div>
          <div class="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/3 mb-2"></div>
          <div class="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
          <div class="flex gap-1">
            <div class="h-4 w-10 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
            <div class="h-4 w-12 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
          </div>
        </div>
        <div class="flex justify-between items-end">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
          <div class="w-4 h-4 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 추가적인 스타일이 필요할 경우 작성 */
</style>