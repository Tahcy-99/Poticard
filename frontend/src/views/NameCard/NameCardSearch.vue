<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'
import MiniNamecards from '@/components/namecards/MiniNamecards.vue'
import { namecardListStore } from '@/stores/namecardListStore'

const currentPage = ref(1)
const isLoadingMore = ref(false)
const isLastPage = ref(false)
const cardList = ref([])
const store = namecardListStore()
const size = 100

const bottomSensor = ref(null)
let observer = null

const loadMoreCards = async () => {
  if (isLoadingMore.value || isLastPage.value) return
  
  isLoadingMore.value=true;

  try {
    // ✨ 핵심 수정: 세 번째 인자로 true를 넘겨주어 강제 새로고침(Force Refresh) 실행
    const response = await store.namecardList(currentPage.value, size, true)

    if (response){
      const newCards = response.namecardList

      cardList.value = [...cardList.value, ...newCards]

      if (newCards.length < size){
        isLastPage.value=true
      }else{
        currentPage.value++
      }
    }else{
      isLastPage.value=true
    }
  }catch(error){
    console.error(error)
  }finally{
    isLoadingMore.value=false
  }
}

onMounted(()=>{
  loadMoreCards()

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting){
      loadMoreCards()
    }
  }, {
      threshold: 0.1
    })

  if (bottomSensor.value){
    observer.observe(bottomSensor.value)
  }
})

onUnmounted(()=>{
  if (observer && bottomSensor.value){
    observer.unobserve(bottomSensor.value)
  }
})

// 모달 관련 로직
const selectedUserId = ref(null)
const isModalCardFlipped = ref(false)

const openModal = (id) => {
  selectedUserId.value = id
  isModalCardFlipped.value = false
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  selectedUserId.value = null
  document.body.style.overflow = ''
}

const toggleModalCardFlip = () => {
  isModalCardFlipped.value = !isModalCardFlipped.value
}
</script>

<template>
  <div class="bg-pattern min-h-screen text-gray-800">
    <div class="flex pt-16 h-screen">
      <aside
        class="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/90 backdrop-blur border-r border-gray-100 p-6 overflow-y-auto z-40 hidden lg:block transition-colors duration-300">
        <div class="mb-8">
          <h2 class="text-xs font-black text-point-yellow uppercase tracking-wider mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-point-yellow rounded-full"></span> Targeting
          </h2>

          <div class="space-y-6">
            <div>
              <h3 class="font-bold text-gray-800 d mb-3 flex justify-between items-center text-sm">
                직군 (Job Group)
              </h3>

              <div class="space-y-2.5">
                <label
                  class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 bg-gray-100" />

                  <span class="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">기획/PM</span>
                </label>

                <label
                  class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked
                    class="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 bg-gray-100" />

                  <span class="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">디자인</span>
                </label>

                <label
                  class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked
                    class="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 bg-gray-100" />

                  <span class="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">개발 (FE/BE)</span>
                </label>
              </div>
            </div>

            <div class="w-full h-px bg-gray-100"></div>

            <div>
              <h3 class="font-bold text-gray-800 mb-3 text-sm">필수 스킬</h3>

              <div class="flex flex-wrap gap-2">
                <span
                  class="px-3 py-1.5 bg-yellow-50 dtext-yellow-700 text-xs font-bold rounded-lg cursor-pointer border border-yellow-100 hover:bg-yellow-100 transition-colors">React</span>

                <span
                  class="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-100 transition-colors">Figma</span>

                <span
                  class="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-100 transition-colors">Python</span>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute bottom-6 left-6 right-6">
          <button
            class="w-full py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 shadow-lg transition-all transform hover:-translate-y-1">
            필터 적용하기
          </button>
        </div>
      </aside>

      <main class="flex-1 lg:ml-64 p-8 overflow-y-auto h-full scrollbar-hide">
        <div class="grid grid-cols-[repeat(auto-fill,280px)] justify-center gap-8 pb-10">
          <div v-for="(card, i) in cardList" :key="card.idx" class="group cursor-pointer perspective-container"
            @click="openModal(i)">
            <div
              class="relative w-full aspect-[1.58/1] transition-transform duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl rounded-2xl">
              <MiniNamecards :cardInfo="card" />
            </div>
          </div>
        </div>

        <div ref="loadTrigger" class="w-full py-10 flex justify-center items-center">
          <span v-if="isLoadingMore" class="text-gray-400 font-mono text-sm">
            <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading cards...
          </span>
        </div>

        <Teleport to="body">
          <Transition name="modal-fade">
            <div v-if="selectedUserId !== null" class="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8">
              <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

              <div class="absolute top-4 right-4 z-50">
                <button @click="closeModal"
                  class="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md">
                  <i class="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <div class="scene w-full max-w-[450px] aspect-[1.58/1]">
                <div class="card-object w-full h-full relative cursor-pointer shadow-2xl rounded-2xl"
                  :class="{ 'is-flipped': isModalCardFlipped }" @click="toggleModalCardFlip">
                  <div class="card-face card-front">
                    <NamecardsFront :cardInfo="cardList[selectedUserId]" />
                    <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
                      Click to flip <i class="fa-solid fa-rotate ml-1"></i>
                    </div>
                  </div>
                  <div class="card-face card-back">
                    <NamecardsBack :cardInfo="cardList[selectedUserId]" />
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
        <div ref="bottomSensor" style="height: 20px;"></div>
      </main>
    </div>
  </div>
</template>

<style scoped>
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
}

.card-back {
  transform: rotateY(180deg);
}

.card-front {
  transform: rotateY(0deg);
}

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .scene,
.modal-fade-leave-to .scene {
  transform: scale(0.95) translateY(20px);
}

/* 배경 패턴 */
.bg-pattern {
  background-color: #f8fafc;
}
</style>