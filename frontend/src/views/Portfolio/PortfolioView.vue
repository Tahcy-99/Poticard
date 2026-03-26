<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'
import { getPortfolioList, getUserPortfolioList, deletePortfolio } from '@/api/portfolio/index.js'
import api from '@/api/namecard'

const route = useRoute()

const userInfo = JSON.parse(localStorage.getItem('USERINFO')) || {}
const myUserId = userInfo.idx 
const pageUserId = route.query.userId || myUserId
const isMyPortfolio = computed(() => myUserId == pageUserId);

const cardData = ref(null)
const isLoading = ref(true)

const loadMyCard = async () => {
  isLoading.value = true
  // 접속한 페이지 주인의 명함 조회
  const response = await api.getSingleNamecard(pageUserId)
  if (response.isSuccess){
    cardData.value = response.data
  }
  isLoading.value = false
}

const isFlipped = ref(false)
const portfolios = ref([])

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

const isDeleteModalOpen = ref(false)
const portfolioToDelete = ref(null)
const deleteInputTitle = ref('')

const openDeleteModal = (portfolio) => {
  portfolioToDelete.value = portfolio
  deleteInputTitle.value = ''
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  portfolioToDelete.value = null
  deleteInputTitle.value = ''
}

const confirmDelete = async () => {
  if (deleteInputTitle.value !== portfolioToDelete.value?.title) {
    alert('입력한 제목이 일치하지 않습니다.');
    return;
  }

  try {
    const res = await deletePortfolio(portfolioToDelete.value.idx, deleteInputTitle.value);
    if (res.isSuccess) {
      alert('포트폴리오가 성공적으로 삭제되었습니다.');
      portfolios.value = portfolios.value.filter(p => p.idx !== portfolioToDelete.value.idx);
      closeDeleteModal();
    } else {
      alert('삭제 실패: ' + (res.data || '오류가 발생했습니다.')); 
    }
  } catch (error) {
    console.error(error);
    alert('삭제 처리 중 오류가 발생했습니다.');
  }
}

onMounted(async () => {
  document.body.style.overflow = ''
  
  loadMyCard()

  try {
    let res;
    if (isMyPortfolio.value) {
      res = await getPortfolioList(0, 10);
    } else {
      res = await getUserPortfolioList(pageUserId, 0, 10);
    }
    
    const fetchedData = res.data?.result || res.result || res.data?.data?.result || []
    
    if (Array.isArray(fetchedData)) {
      portfolios.value = fetchedData
    }
  } catch (error) {
    console.error('포트폴리오 목록을 불러오는 중 오류 발생:', error)
  }
})
</script>
<template>
  <div class="bg-pattern text-gray-800 dark:text-gray-100 transition-colors duration-300 min-h-screen flex flex-col relative">
    <div id="header-placeholder"></div>

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 pt-28 pb-20">
      <section class="flex justify-center items-center min-h-[400px]">

        <div class="scene w-full max-w-md aspect-[1.58/1] cursor-pointer group">

          <div class="card-object w-full h-full relative shadow-2xl rounded-2xl transition-all duration-500"
            :class="{ 'is-flipped': isFlipped }" @click="toggleFlip">

            <div class="card-face card-front">
              <NamecardsFront :cardInfo="cardData" />

              <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
                Click to flip <i class="fa-solid fa-rotate ml-1"></i>
              </div>
            </div>

            <div class="card-face card-back">
              <NamecardsBack :cardInfo="cardData" :hidePortfolioBtn="!isMyPortfolio" />
            </div>

          </div>
        </div>

      </section>

      <section>
        <div class="flex items-center gap-3 mb-8">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isMyPortfolio ? 'My Portfolios' : 'Portfolios' }}
          </h3>
          <div class="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="portfolio in portfolios" :key="portfolio.idx"
            class="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-yellow-100/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            
            <div class="w-full h-48 bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
              <img v-if="portfolio.image" :src="portfolio.image" alt="Hero Image" class="w-full h-full object-contain p-2"/>
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-zinc-700">
                <i class="fa-regular fa-image text-4xl"></i>
              </div>
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <router-link :to="{ path: '/project-detail', query: { idx: portfolio.idx } }"
                  class="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-full text-sm font-bold border border-white/30 hover:bg-white/40 transition-all text-yellow-300 hover:text-yellow-400 border-yellow-300/30 hover:border-yellow-400">
                  상세 보기
                </router-link>
                
                <template v-if="isMyPortfolio">
                  <router-link :to="{ path: '/portfolio-update-n-check', query: { idx: portfolio.idx } }"
                    class="px-4 py-2 bg-yellow-400/90 backdrop-blur text-zinc-900 rounded-full text-sm font-bold hover:bg-yellow-400 transition-all border border-yellow-400 shadow-lg">
                    수정하기
                  </router-link>
                  <button @click.stop="openDeleteModal(portfolio)"
                    class="px-3 py-2 bg-red-500/90 backdrop-blur text-white rounded-full text-xs font-bold hover:bg-red-600 transition-all border border-red-500 shadow-lg cursor-pointer">
                    삭제하기
                  </button>
                </template>
              </div>
            </div>

            <div class="p-6">
              <div class="flex justify-between items-start mb-2">
                <span
                  class="text-[10px] font-bold text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded uppercase tracking-wide">
                  PORTFOLIO
                </span>
                <span class="text-xs text-gray-400">{{ portfolio.createdAt }}</span>
              </div>
              
              <h4
                class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-yellow-500 transition-colors">
                {{ portfolio.title || '제목 없음' }}
              </h4>
              
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                {{ portfolio.role || '상세 내용을 확인하려면 View Details를 클릭하세요.' }}
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>

    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" @click="closeDeleteModal">
      <div class="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-md overflow-hidden transform scale-100 transition-all" @click.stop>
        <div class="p-6 md:p-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
              <i class="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">포트폴리오 삭제</h3>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            이 작업은 되돌릴 수 없습니다. 삭제를 하시려면 아래 입력창에 <br>
            <strong class="text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">'{{ portfolioToDelete?.title }}'</strong> 을(를) 정확히 입력해주세요.
          </p>

          <input 
            v-model="deleteInputTitle" 
            type="text" 
            placeholder="포트폴리오 제목 입력"
            class="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 dark:text-white mb-8 font-bold"
            @keyup.enter="confirmDelete"
          />

          <div class="flex gap-3">
            <button @click="closeDeleteModal" class="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
              취소
            </button>
            <button @click="confirmDelete" 
              :disabled="deleteInputTitle !== portfolioToDelete?.title" 
              class="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/30">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.flipped {
  transform: rotateY(180deg);
}

#card-inner {
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #09090b;
}

.scene {
  perspective: 1000px;
}

.card-object {
  transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.card-object.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-front {
  transform: rotateY(0deg);
}
</style>