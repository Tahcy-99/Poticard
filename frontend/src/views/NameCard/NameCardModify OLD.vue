<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  function updateColor(colorClass, bgClass, borderClass) {
    const previewCard = document.getElementById('preview-card')
    const previewDeco = document.getElementById('preview-deco')
    const previewBadges = document.querySelectorAll('.preview-badge')
    previewDeco.className = `absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20 transition-colors ${bgClass}`

    previewBadges.forEach((badge) => {
      badge.style.borderColor = 'currentColor'
      badge.className = badge.className.replace(/text-\w+-\d+/, colorClass)
      badge.className = badge.className.replace(/bg-\w+-\d+/, bgClass.replace('/20', '/10'))
    })
  }

  function toggleCardFace(face) {
    const front = document.getElementById('card-front')
    const back = document.getElementById('card-back')
    const btnFront = document.getElementById('btn-front')
    const btnBack = document.getElementById('btn-back')

    if (face === 'front') {
      front.classList.remove('hidden')
      back.classList.add('hidden')
      btnFront.classList.add('bg-gray-800', 'text-white')
      btnFront.classList.remove('bg-gray-100', 'text-gray-600')
      btnBack.classList.remove('bg-gray-800', 'text-white')
      btnBack.classList.add('bg-gray-100', 'text-gray-600')
    } else {
      front.classList.add('hidden')
      back.classList.remove('hidden')
      btnBack.classList.add('bg-gray-800', 'text-white')
      btnBack.classList.remove('bg-gray-100', 'text-gray-600')
      btnFront.classList.remove('bg-gray-800', 'text-white')
      btnFront.classList.add('bg-gray-100', 'text-gray-600')
    }
  }
})
</script>

<template>
  <div class="bg-pattern text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col min-h-screen">
    <!-- 메인 콘텐츠 -->
    <main class="flex-1 pt-24 pb-20 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- 단계 표시기 - 3단계 완료 -->

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- 좌측: 스타일 편집 패널 -->
          <div class="lg:col-span-5 space-y-6">
            <div
              class="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6 md:p-8">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <i class="fa-solid fa-paintbrush text-point-yellow"></i> 스타일 커스터마이징
              </h2>

              <!-- 컬러 팔레트 -->
              <div class="mb-8">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Accent
                  Color</label>
                <div class="flex flex-wrap gap-3">
                  <button data-color="text-point-yellow" data-bg="bg-yellow-500" data-border="border-yellow-500"
                    class="w-10 h-10 rounded-full bg-point-yellow ring-2 ring-offset-2 ring-point-yellow dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button data-color="text-blue-500" data-bg="bg-blue-500" data-border="border-blue-500"
                    class="w-10 h-10 rounded-full bg-blue-500 ring-2 ring-offset-2 ring-transparent hover:ring-blue-500 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button data-color="text-green-500" data-bg="bg-green-500" data-border="border-green-500"
                    class="w-10 h-10 rounded-full bg-green-500 ring-2 ring-offset-2 ring-transparent hover:ring-green-500 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button data-color="text-purple-500" data-bg="bg-purple-500" data-border="border-purple-500"
                    class="w-10 h-10 rounded-full bg-purple-500 ring-2 ring-offset-2 ring-transparent hover:ring-purple-500 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button data-color="text-pink-500" data-bg="bg-pink-500" data-border="border-pink-500"
                    class="w-10 h-10 rounded-full bg-pink-500 ring-2 ring-offset-2 ring-transparent hover:ring-pink-500 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                </div>
              </div>

              <!-- 폰트 스타일 -->
              <div class="mb-8">
                <label
                  class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Typography</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="cursor-pointer group relative">
                    <input type="radio" name="font" class="peer sr-only" checked />
                    <div
                      class="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 peer-checked:border-point-yellow peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 text-center transition-all">
                      <span class="font-sans font-bold text-gray-700 dark:text-gray-200 block text-lg">Sans-serif</span>
                      <span class="text-xs text-gray-500">Modern & Clean</span>
                    </div>
                  </label>
                  <label class="cursor-pointer group relative">
                    <input type="radio" name="font" class="peer sr-only" />
                    <div
                      class="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 peer-checked:border-point-yellow peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 text-center transition-all">
                      <span class="font-serif font-bold text-gray-700 dark:text-gray-200 block text-lg">Serif</span>
                      <span class="text-xs text-gray-500">Classic & Elegant</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- 배경 패턴 -->
              <div class="mb-8">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Card
                  Texture</label>
                <div class="grid grid-cols-3 gap-3">
                  <label class="cursor-pointer">
                    <input type="radio" name="texture" class="peer sr-only" checked />
                    <div
                      class="h-12 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 peer-checked:border-point-yellow peer-checked:ring-1 peer-checked:ring-point-yellow flex items-center justify-center text-xs text-gray-400">
                      None
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="texture" class="peer sr-only" />
                    <div
                      class="h-12 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pattern-dots text-gray-300 peer-checked:border-point-yellow peer-checked:ring-1 peer-checked:ring-point-yellow flex items-center justify-center text-xs font-bold">
                      Dots
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="texture" class="peer sr-only" />
                    <div
                      class="h-12 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pattern-grid text-gray-200 peer-checked:border-point-yellow peer-checked:ring-1 peer-checked:ring-point-yellow flex items-center justify-center text-xs font-bold">
                      Grid
                    </div>
                  </label>
                </div>
              </div>

              <!-- 옵션 -->
              <div>
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Options</label>
                <div class="space-y-3">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Poticard 로고 표시</span>
                    <input type="checkbox" checked
                      class="w-5 h-5 rounded text-point-yellow border-gray-300 focus:ring-point-yellow" />
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">QR 코드 포함</span>
                    <input type="checkbox" checked
                      class="w-5 h-5 rounded text-point-yellow border-gray-300 focus:ring-point-yellow" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 우측: 실시간 미리보기 -->
          <div class="lg:col-span-7 flex flex-col">
            <div class="sticky top-24">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Live Preview</h3>
                <div class="bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg flex text-xs font-bold">
                  <button id="btn-front" class="px-4 py-1.5 rounded-md bg-gray-800 text-white shadow-sm transition-all">
                    앞면 (Profile)
                  </button>
                  <button id="btn-back"
                    class="px-4 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                    뒷면 (Projects)
                  </button>
                </div>
              </div>

              <!-- 카드 미리보기 영역 -->
              <div
                class="relative w-full aspect-[1.58/1] bg-gray-200 dark:bg-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center group perspective-1000">
                <!-- 카드 컨테이너 -->
                <div id="preview-card"
                  class="relative w-[90%] h-[90%] bg-white dark:bg-zinc-900 rounded-2xl shadow-inner border border-gray-100 dark:border-zinc-700 overflow-hidden transition-all duration-500">
                  <!-- 장식용 배경 (커스텀 가능) -->
                  <div id="preview-deco"
                    class="absolute top-0 right-0 w-40 h-40 bg-yellow-400/20 rounded-bl-full transition-colors duration-300">
                  </div>
                  <div
                    class="absolute bottom-0 left-0 w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-tr-full opacity-50">
                  </div>

                  <!-- CARD FRONT -->
                  <div id="card-front" class="absolute inset-0 p-8 md:p-10 flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start z-10">
                      <div>
                        <p class="text-xs font-bold text-point-yellow uppercase tracking-widest mb-1">
                          UX/UI Designer
                        </p>
                        <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                          Kim Poti
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          사용자 경험을 디자인하는 디자이너 김포티입니다.
                        </p>
                      </div>
                      <div
                        class="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg overflow-hidden bg-gray-100">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile"
                          class="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div class="space-y-4 z-10">
                      <div class="flex gap-2 flex-wrap">
                        <span
                          class="preview-badge px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-point-yellow text-xs font-bold rounded-lg border border-yellow-100 dark:border-yellow-900/30">#Figma</span>
                        <span
                          class="preview-badge px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-point-yellow text-xs font-bold rounded-lg border border-yellow-100 dark:border-yellow-900/30">#Prototyping</span>
                        <span
                          class="preview-badge px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-point-yellow text-xs font-bold rounded-lg border border-yellow-100 dark:border-yellow-900/30">#Problem_Solver</span>
                      </div>

                      <div class="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-end">
                        <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p><i class="fa-regular fa-envelope mr-2"></i>contact@poticard.io</p>
                          <p><i class="fa-brands fa-github mr-2"></i>github.com/kimpoti</p>
                        </div>
                        <div class="text-right">
                          <i class="fa-solid fa-qrcode text-4xl text-gray-800 dark:text-white"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- CARD BACK -->
                  <div id="card-back"
                    class="hidden absolute inset-0 p-8 md:p-10 flex flex-col h-full bg-gray-50 dark:bg-zinc-800/50">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                      Featured Projects
                    </h3>

                    <div class="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                      <!-- Project Item 1 -->
                      <div
                        class="flex gap-4 items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <div class="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg flex-shrink-0"></div>
                        <div>
                          <h4 class="font-bold text-sm text-gray-900 dark:text-white">
                            E-commerce App Redesign
                          </h4>
                          <p class="text-[10px] text-gray-500 dark:text-gray-400">
                            2023.01 - Solo Project
                          </p>
                        </div>
                      </div>
                      <!-- Project Item 2 -->
                      <div
                        class="flex gap-4 items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <div class="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg flex-shrink-0"></div>
                        <div>
                          <h4 class="font-bold text-sm text-gray-900 dark:text-white">
                            Finance Dashboard
                          </h4>
                          <p class="text-[10px] text-gray-500 dark:text-gray-400">
                            2023.05 - Team Lead
                          </p>
                        </div>
                      </div>
                      <!-- Project Item 3 -->
                      <div
                        class="flex gap-4 items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <div class="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg flex-shrink-0"></div>
                        <div>
                          <h4 class="font-bold text-sm text-gray-900 dark:text-white">
                            Design System 구축
                          </h4>
                          <p class="text-[10px] text-gray-500 dark:text-gray-400">
                            2023.08 - Contribution 80%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700 text-center">
                      <p class="text-[10px] text-gray-400 uppercase tracking-widest">
                        Powered by Poticard
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 하단 액션 버튼 그룹 -->
              <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  class="col-span-1 py-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex flex-col items-center justify-center gap-1">
                  <i class="fa-solid fa-image text-xl mb-1"></i>
                  <span class="text-xs">이미지 저장</span>
                </button>
                <button
                  class="col-span-1 py-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex flex-col items-center justify-center gap-1">
                  <i class="fa-solid fa-share-nodes text-xl mb-1"></i>
                  <span class="text-xs">링크 공유</span>
                </button>
                <button
                  class="col-span-2 md:col-span-1 py-4 bg-point-yellow text-gray-900 rounded-2xl font-black shadow-lg shadow-yellow-200/50 dark:shadow-none hover:bg-yellow-300 transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-1">
                  <i class="fa-solid fa-rocket text-xl mb-1"></i>
                  <span class="text-xs">게시하기 (완료)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
:deep(body) {
  font-family: 'Noto Sans KR', sans-serif;
}

.font-poppins {
  font-family: 'Poppins', sans-serif;
}

.bg-pattern {
  background-color: #f8fafc;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
}

.dark .bg-pattern {
  background-color: #18181b;
  background-image: radial-gradient(#3f3f46 1px, transparent 1px);
}

/* 패턴 클래스들 */
.pattern-dots {
  background-image: radial-gradient(currentColor 1px, transparent 1px);
  background-size: 12px 12px;
}

.pattern-grid {
  background-image:
    linear-gradient(currentColor 1px, transparent 1px),
    linear-gradient(90deg, currentColor 1px, transparent 1px);
  background-size: 20px 20px;
}

.pattern-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
}
</style>
