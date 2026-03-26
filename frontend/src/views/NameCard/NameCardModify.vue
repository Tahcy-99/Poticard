<script setup>
import { onMounted, ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'
import api from '@/api/namecard'
import portfolioApi from '@/api/portfolio'

const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click();
}

const handleFileChange = (event) =>{
  const file = event.target.files[0]
  if (file) {
    console.log("선택된 파일 : ", file.name)
    uploadImage(file);
  }
}

const uploadImage = async (file) => {
  try {
    await api.editProfileImage(file)
    alert('프로필 이미지가 변경되었습니다.')

    await loadMyCard()
  } catch (error){
    console.error('업로드 실패 : ',error)
  }
}

const router = useRouter()

const edit = async (cardData) => {
  try {
    await api.editNamcard(cardData)
    alert('명함이 성공적으로 저장되었습니다.')
    // router.push('/namecard/search') // 필요시 주석 해제하여 이동
  } catch (error){
    console.error(error.message)
    alert('저장 중 오류가 발생했습니다.')
  }
}

const userInfo = JSON.parse(localStorage.getItem('USERINFO'))

const dummy = {
  email: userInfo.email,
  title: "등록되지 않은 명함",
  affiliation: userInfo.affiliation,
  description:"아래 '수정 완료'를 눌러 최초 등록을 실행해주세요.",
  name: userInfo.name,
  career: userInfo.career
}


// 2. 상태 관리
const cardData = ref({ ...dummy }) 
const isLoading = ref(true)
const isFlipped = ref(false)

// 포트폴리오에서 가져온 중복 제거된 키워드 목록
const availableKeywords = ref([])

const loadMyCard = async () => {
const currentUserId = userInfo.idx
  try {
  const response = await api.getSingleNamecard(currentUserId)
    if (response) {
      const responseData = response.data || response
      cardData.value = { 
        ...dummy, 
        userIdx: currentUserId, // ✨ [추가됨] 더미 데이터에도 현재 접속한 유저의 식별자를 강제로 주입
        ...responseData,
        keywords: responseData.keywords || [] ,
        profileImage: responseData.profileImage
      }
    } else {
      // ✨ 데이터가 아예 없을 때(신규 유저)를 대비한 로직 추가
      cardData.value = {
        ...dummy,
        userIdx: currentUserId,
        keywords: []
      }
    }
  } catch (e) {
    console.error("데이터 로드 실패, 기본값 사용", e);
    cardData.value = {
      ...dummy,
      userIdx: currentUserId,
      keywords: []
    }
  }
  isLoading.value = false
}

// 포트폴리오 키워드 불러오기 로직
const loadPortfolioKeywords = async () => {
  try {
    const response = await portfolioApi.getAllKeywords();
    const fetchedKeywords = response.data || response; 

    if (fetchedKeywords && Array.isArray(fetchedKeywords)) {
      availableKeywords.value = [...new Set(fetchedKeywords)];
    }
  } catch (error) {
    console.error("키워드 로드 실패", error);
  }
}

// 키워드 선택/해제 토글 (최대 8개 제한)
const toggleKeyword = (keyword) => {
  // 안전장치: keywords가 배열인지 한번 더 확인
  if (!cardData.value.keywords) {
    cardData.value.keywords = [];
  }

  const index = cardData.value.keywords.indexOf(keyword);
  
  if (index > -1) {
    cardData.value.keywords.splice(index, 1);
  } else {
    if (cardData.value.keywords.length < 8) {
      cardData.value.keywords.push(keyword);
    } else {
      alert("키워드는 최대 8개까지만 선택할 수 있습니다.");
    }
  }
}

onMounted(async () => {
  await loadMyCard()
  await loadPortfolioKeywords()
})

// 카드 조작 함수
const toggleFlip = () => { isFlipped.value = !isFlipped.value }
const setFace = (face) => { isFlipped.value = face !== 'front' }

// 스타일 변경 함수
const updateColor = (color) => {
  cardData.value.color = color
}

</script>

<template>
  <div class="bg-pattern text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col min-h-screen">
    <main class="flex-1 pt-24 pb-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div class="lg:col-span-5 space-y-6">
            <div class="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6 md:p-8">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <i class="fa-solid fa-paintbrush text-yellow-400"></i> 스타일 커스터마이징
              </h2>

              <div class="mb-8">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Accent Color</label>
                <div class="flex flex-wrap gap-3">
                  <button 
                    @click="updateColor('YELLOW')"
                    :class="[cardData.color === 'YELLOW' ? 'ring-yellow-400' : 'ring-transparent']"
                    class="w-10 h-10 rounded-full bg-yellow-400 ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button 
                    @click="updateColor('BLUE')"
                    :class="[cardData.color === 'BLUE' ? 'ring-blue-500' : 'ring-transparent']"
                    class="w-10 h-10 rounded-full bg-blue-500 ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button 
                    @click="updateColor('GREEN')"
                    :class="[cardData.color === 'GREEN' ? 'ring-green-500' : 'ring-transparent']"
                    class="w-10 h-10 rounded-full bg-green-500 ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                  <button 
                    @click="updateColor('PURPLE')"
                    :class="[cardData.color === 'PURPLE' ? 'ring-purple-500' : 'ring-transparent']"
                    class="w-10 h-10 rounded-full bg-purple-500 ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all hover:scale-110"></button>
                </div>
              </div>

              <div class="mb-8">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Typography</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="cursor-pointer group relative">
                    <input type="radio" v-model="cardData.layout" value="Type A" class="peer sr-only" />
                    <div class="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 peer-checked:border-yellow-400 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 text-center transition-all">
                      <span class="font-sans font-bold text-gray-700 dark:text-gray-200 block text-lg">Sans-serif</span>
                    </div>
                  </label>
                  <label class="cursor-pointer group relative">
                    <input type="radio" v-model="cardData.layout" value="Type B" class="peer sr-only" />
                    <div class="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 peer-checked:border-yellow-400 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 text-center transition-all">
                      <span class="font-serif font-bold text-gray-700 dark:text-gray-200 block text-lg">Serif</span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="mb-8">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">Keywords (최대 8개)</label>
                <div class="flex flex-wrap gap-2">
                  <button 
                    v-for="keyword in availableKeywords" 
                    :key="keyword"
                    @click="toggleKeyword(keyword)"
                    :class="[
                      cardData.keywords?.includes(keyword) 
                        ? 'bg-yellow-400 text-gray-900 border-yellow-400 font-bold shadow-sm' 
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700'
                    ]"
                    class="px-3 py-1.5 text-sm rounded-xl border transition-all cursor-pointer">
                    {{ keyword }}
                  </button>
                </div>
                <div class="mt-2 text-right">
                  <span class="text-xs font-medium" :class="(cardData.keywords?.length || 0) >= 8 ? 'text-red-500' : 'text-gray-400'">
                    선택된 키워드: {{ cardData.keywords?.length || 0 }} / 8
                  </span>
                </div>
              </div>

              <div class="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">title</label>
                <div class="space-y-4">
                  <input v-model="cardData.title" placeholder="이름" class="w-full px-4 py-2 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <br>
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">description</label>
                <div class="space-y-4">  
                  <textarea v-model="cardData.description" placeholder="소개글" class="w-full px-4 py-2 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700 h-20"></textarea>
                </div>
                <br>
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">address</label>
                <div class="space-y-4">
                  <input v-model="cardData.address" placeholder="주소" class="w-full px-4 py-2 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <br>
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-3">github url</label>
                <div class="space-y-4">
                  <input v-model="cardData.url" placeholder="깃허브 URL" class="w-full px-4 py-2 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 flex flex-col">
            <div class="sticky top-24">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Live Preview</h3>
                <div class="bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg flex text-xs font-bold">
                  <button @click="setFace('front')" class="px-4 py-1.5 rounded-md transition-all duration-200"
                    :class="!isFlipped ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'">
                    앞면 (Profile)
                  </button>
                  <button @click="setFace('back')" class="px-4 py-1.5 rounded-md transition-all duration-200"
                    :class="isFlipped ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'">
                    뒷면 (Info)
                  </button>
                </div>
              </div>

              <div class="perspective-container relative w-full h-96 bg-gray-200 dark:bg-zinc-800 rounded-3xl shadow-inner flex items-center justify-center p-8">
                <div class="card-object w-full max-w-md aspect-[1.58/1] shadow-2xl rounded-2xl cursor-pointer"
                  :class="{ 'is-flipped': isFlipped }" @click="toggleFlip">

                  <div class="card-face card-front">
                    <NamecardsFront :cardInfo="cardData" class="w-full h-full" />
                    <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
                      Click to flip <i class="fa-solid fa-rotate ml-1"></i>
                    </div>
                  </div>

                  <div class="card-face card-back">
                    <NamecardsBack :cardInfo="cardData" class="w-full h-full" />
                    <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
                      Click to flip <i class="fa-solid fa-rotate ml-1"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept="image/*"
                  @change="handleFileChange"
                />
                <button 
                  @click="triggerFileInput"
                  class="col-span-1 py-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-1">
                  <i class="fa-solid fa-image text-xl mb-1"></i>
                  <span class="text-xs">프로필 이미지 설정</span>
                </button>
                <button @click="edit(cardData)" class="col-span-2 md:col-span-1 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black shadow-lg hover:bg-yellow-300 transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-1">
                  <i class="fa-solid fa-rocket text-xl mb-1"></i>
                  <span class="text-xs">수정 완료</span>
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
.perspective-container { perspective: 1000px; }
.card-object {
  position: relative;
  transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}
.card-object.is-flipped { transform: rotateY(180deg); }
.card-face {
  position: absolute;
  inset: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 1rem;
  overflow: hidden;
}
.card-front { transform: rotateY(0deg); z-index: 2; }
.card-back { transform: rotateY(180deg); }
.bg-pattern { background-color: #f8fafc; }
.dark .bg-pattern { background-color: #18181b; }
</style>