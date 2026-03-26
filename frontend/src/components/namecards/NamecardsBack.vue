<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  cardInfo: {
    type: Object,
    required: true,
  },
  hidePortfolioBtn: {
    type: Boolean,
    default: false
  }
})

// 색상 키값에 따른 Tailwind 클래스 매핑
const colorClasses = computed(() => {
  const color = props.cardInfo?.color || 'YELLOW'
  
  const mapping = {
    YELLOW: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-400',
      hover: 'hover:text-yellow-400',
      btnBg: 'bg-yellow-400',
      btnText: 'text-zinc-900',
      btnHover: 'hover:bg-yellow-500'
    },
    BLUE: {
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      hover: 'hover:text-blue-500',
      btnBg: 'bg-blue-500',
      btnText: 'text-white',
      btnHover: 'hover:bg-blue-600'
    },
    GREEN: {
      text: 'text-green-500',
      bg: 'bg-green-500',
      hover: 'hover:text-green-500',
      btnBg: 'bg-green-500',
      btnText: 'text-white',
      btnHover: 'hover:bg-green-600'
    },
    PURPLE: {
      text: 'text-purple-500',
      bg: 'bg-purple-500',
      hover: 'hover:text-purple-500',
      btnBg: 'bg-purple-500',
      btnText: 'text-white',
      btnHover: 'hover:bg-purple-600'
    }
  }
  
  return mapping[color] || mapping.YELLOW
})

const goToPortfolioList = () => {
  document.body.style.overflow = ''
  
  const targetUserId = props.cardInfo?.userIdx || props.cardInfo?.userId || props.cardInfo?.user_id;
  
  if (targetUserId) {
    router.push({ path: '/portfolio-view', query: { userId: targetUserId } })
  } else {
    alert('해당 유저의 식별 정보를 찾을 수 없습니다.');
  }
}
</script>

<template>
  <div v-if="cardInfo" class="relative w-full max-w-md aspect-[1.58/1] mx-auto">
    <div
      class="card-face card-back absolute inset-0 w-full h-full bg-zinc-900 text-white rounded-2xl border border-zinc-700 p-6 sm:p-8 flex flex-col overflow-hidden shadow-lg"
    >
      <div class="absolute bottom-0 left-0 w-24 h-24 bg-zinc-800 rounded-tr-full opacity-50 pointer-events-none"></div>

      <div class="relative z-10 h-full flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <span 
              class="w-1.5 h-6 rounded-full transition-colors duration-500"
              :class="colorClasses.bg"
            ></span>
            Contact Info
          </h3>
          
          <button v-if="!hidePortfolioBtn" @click.stop="goToPortfolioList" 
            class="px-3 py-1.5 text-xs font-bold rounded-lg shadow-md transition-all duration-300"
            :class="[colorClasses.btnBg, colorClasses.btnText, colorClasses.btnHover]">
            포트폴리오 <i class="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>

        <div class="space-y-4 flex-1 text-sm text-gray-300">
          <div v-if="cardInfo.phone" class="flex items-center gap-3">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-phone text-lg"></i>
            </div>
            <span>{{ cardInfo.phone }}</span>
          </div>

          <div v-if="cardInfo.address" class="flex items-center gap-3">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-location-dot text-lg"></i>
            </div>
            <span>{{ cardInfo.address }}</span>
          </div>

          <a v-if="cardInfo.email" :href="`mailto:${cardInfo.email}`"
            class="flex items-center gap-3 transition-colors duration-300"
            :class="colorClasses.hover">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-envelope text-lg"></i>
            </div>
            <span>{{ cardInfo.email }}</span>
          </a>

          <a v-if="cardInfo.url" :href="`https://${cardInfo.url}`" target="_blank"
            class="flex items-center gap-3 transition-colors duration-300"
            :class="colorClasses.hover">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-link text-lg"></i>
            </div>
            <span class="truncate">{{ cardInfo.url }}</span>
          </a>
        </div>

        <div class="text-right mt-auto pt-4 border-t border-zinc-800">
          <span class="text-[10px] font-bold tracking-widest opacity-40">POTICARD</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center text-red-500 mt-10">정보를 불러올 수 없습니다.</div>
</template>

<style scoped>
.card-back {
  backface-visibility: hidden;
}
</style>