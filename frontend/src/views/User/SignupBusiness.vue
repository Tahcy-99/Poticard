<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 사업자 번호 관련 상태
const rawBusinessNumber = ref('')
const formattedBusinessNumber = ref('')
const isDuplicateChecked = ref(false)
const isBusinessNumberFocused = ref(false)

const form = reactive({
  file: null,
})

const touched = reactive({
  businessNumber: false,
  file: true,
  terms: true,
})

const fileName = ref('')
const fileInput = ref(null)

const terms = reactive([
  { title: 'Poticard 이용약관 동의', required: true, checked: false },
  { title: '개인정보 수집 및 이용 동의', required: true, checked: false },
  { title: '기업 인증 서비스 이용 동의', required: true, checked: false },
  { title: '마케팅 정보 수신 동의', required: false, checked: false },
])

const allChecked = ref(false)

// 사업자 번호 입력 처리 (숫자만 추출 및 하이픈 삽입)
const handleBusinessNumberInput = (e) => {
  isDuplicateChecked.value = false

  // 숫자가 아닌 모든 문자를 즉시 제거
  let val = e.target.value.replace(/[^0-9]/g, '')
  if (val.length > 10) {
    val = val.slice(0, 10)
  }

  rawBusinessNumber.value = val

  // 하이픈 자동 삽입 로직
  if (val.length <= 3) {
    formattedBusinessNumber.value = val
  } else if (val.length <= 5) {
    formattedBusinessNumber.value = val.slice(0, 3) + '-' + val.slice(3)
  } else {
    formattedBusinessNumber.value = val.slice(0, 3) + '-' + val.slice(3, 5) + '-' + val.slice(5)
  }
}

// 중복 확인 시뮬레이션
const checkDuplicate = () => {
  if (rawBusinessNumber.value.length === 10) {
    isDuplicateChecked.value = true
  }
}

const handleAllCheckedChange = () => {
  touched.terms = true
  terms.forEach((t) => (t.checked = allChecked.value))
}

const handleTermChange = () => {
  touched.terms = true
  const allCheckedStatus = terms.every((t) => t.checked)
  allChecked.value = allCheckedStatus
}

const handleFileUpload = (event) => {
  touched.file = true
  const file = event.target.files[0]
  if (file) {
    form.file = file
    fileName.value = file.name
  } else {
    form.file = null
    fileName.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const requiredTermsChecked = computed(() => {
  return terms.filter((t) => t.required).every((t) => t.checked)
})

const canProceed = computed(() => {
  return (
    rawBusinessNumber.value.length === 10 &&
    isDuplicateChecked.value &&
    form.file &&
    requiredTermsChecked.value
  )
})

const markAllAsTouched = () => {
  touched.businessNumber = true
  touched.file = true
  touched.terms = true
}

const handleSubmit = () => {
  if (canProceed.value) {
    // 기업 회원가입 상세 정보 입력 페이지로 이동 (type=business로 전달)
    router.push({
      name: 'signup',
      query: { type: 'business' },
    })
  }
}
</script>

<template>
  <div
    class="business-signup-container min-h-screen justify-center bg-slate-50 bg-white text-slate-900 dark:bg-zinc-950/70 dark:text-white flex flex-col items-center py-12 px-4 transition-colors">
    <!-- 메인 카드 -->
    <div
      class="w-full max-w-lg rounded-3xl shadow-2xl p-8 md:p-10 border transition-all bg-white border-slate-100 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white">
      <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- 상단 로고 및 헤더 -->
        <div class="mb-10 text-center">
          <h2 class="text-4xl font-bold dark:text-[#facc15] text-black mb-2 font-poppins">
            Join Poticard
          </h2>
          <p class="text-sm mt-2 text-slate-500 dark:text-zinc-400">
            인재 채용을 위한 기업 인증 단계입니다.
          </p>
        </div>

        <!-- 사업자 정보 섹션 -->
        <section class="space-y-5">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <i class="fa-solid fa-briefcase text-[#facc15] text-sm"></i>
            기업 인증 정보
          </h3>

          <!-- 사업자 등록 번호 -->
          <div class="space-y-2">
            <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">사업자 등록 번호</label>
            <div class="flex gap-2">
              <input v-model="formattedBusinessNumber" @input="handleBusinessNumberInput" type="text"
                inputmode="numeric" placeholder="사업자 번호 10자리 입력"
                class="flex-1 px-4 py-3 border rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-[#facc15] transition-all text-sm font-poppins bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                :class="{
                  'border-red-500 ring-1 ring-red-500':
                    !isBusinessNumberFocused &&
                    touched.businessNumber &&
                    rawBusinessNumber.length < 10,
                  'dark:border-[#facc15] dark:ring-[#facc15]':
                    !isBusinessNumberFocused &&
                    touched.businessNumber &&
                    rawBusinessNumber.length < 10,
                }" maxlength="12" @focus="isBusinessNumberFocused = true" @blur="
                  isBusinessNumberFocused = false;
                touched.businessNumber = true;
                " />
              <button type="button" @click="checkDuplicate" :disabled="rawBusinessNumber.length < 10"
                class="px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap dark:bg-black dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
                중복 확인
              </button>
            </div>

            <p v-if="isDuplicateChecked && rawBusinessNumber.length === 10"
              class="text-xs ml-1 mt-1 font-medium text-blue-500 dark:text-blue-400">
              <i class="fa-solid fa-check-circle mr-1"></i> 사업자 번호 중복 확인이 완료되었습니다.
            </p>

            <p v-if="touched.businessNumber && rawBusinessNumber.length < 10"
              class="text-xs ml-1 mt-1 font-medium text-red-500 dark:text-[#facc15]">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> 사업자 번호 10자리를 정확히
              입력해주세요.
            </p>
          </div>

          <!-- 파일 업로드 -->
          <div class="space-y-2">
            <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">사업자등록증명원</label>
            <div @click="triggerFileInput"
              class="border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer group text-center bg-slate-50 border-slate-200 hover:border-[#facc15] dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-[#facc15]">
              <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" />
              <i
                class="fa-solid fa-cloud-arrow-up text-2xl mb-2 transition-colors text-slate-400 group-hover:text-[#facc15] dark:text-zinc-500 dark:group-hover:text-[#facc15]"></i>
              <p class="text-sm font-medium text-slate-500 dark:text-zinc-400" v-if="!fileName">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p class="text-sm font-bold text-slate-900 dark:text-[#facc15]" v-else>
                {{ fileName }}
              </p>
              <p class="text-[11px] font-poppins mt-1 text-slate-400 dark:text-zinc-500">
                PDF, JPG, PNG (MAX 5MB)
              </p>
            </div>
            <p v-if="touched.file && !form.file" class="text-xs ml-1 mt-1 font-medium text-red-500 dark:text-[#facc15]">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> 증빙 서류 업로드는 필수입니다.
            </p>
          </div>
        </section>

        <!-- 약관 동의 섹션 -->
        <section class="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-[#facc15] text-sm"></i>
            약관 동의
          </h3>

          <div class="space-y-3 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-800/50">
            <div class="flex items-center pb-3 border-b border-slate-200 dark:border-zinc-700">
              <input type="checkbox" id="all-check" v-model="allChecked" @change="handleAllCheckedChange"
                class="w-5 h-5 custom-checkbox cursor-pointer" />
              <label for="all-check" class="ml-3 text-sm font-bold cursor-pointer">전체 동의하기</label>
            </div>

            <div v-for="(term, index) in terms" :key="index" class="flex items-center justify-between">
              <div class="flex items-center">
                <input type="checkbox" :id="'term-' + index" v-model="term.checked" @change="handleTermChange"
                  class="w-4 h-4 custom-checkbox cursor-pointer" />
                <label :for="'term-' + index" class="ml-3 text-sm cursor-pointer text-slate-600 dark:text-zinc-300">
                  <span class="font-bold"
                    :class="term.required ? 'text-red-500 dark:text-[#facc15]' : 'text-slate-400'">
                    {{ term.required ? '[필수]' : '[선택]' }}
                  </span>
                  {{ term.title }}
                </label>
              </div>
              <button type="button" class="text-xs text-slate-400 underline hover:text-[#facc15]">
                보기
              </button>
            </div>
          </div>
          <p v-if="touched.terms && !requiredTermsChecked"
            class="text-xs ml-1 font-medium text-red-500 dark:text-[#facc15]">
            <i class="fa-solid fa-circle-exclamation mr-1"></i> 필수 약관에 모두 동의하셔야 합니다.
          </p>
        </section>

        <!-- 다음 버튼 -->
        <button type="submit" @click="markAllAsTouched"
          class="w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          :disabled="!canProceed">
          다음
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-zinc-400">
        이미 기업 계정이 있으신가요?
        <router-link to="/login?type=business" class="font-bold hover:underline text-[#facc15]">
          로그인
        </router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Poppins:wght@400;600;700&display=swap');

.font-poppins {
  font-family: 'Poppins', sans-serif;
}

.custom-checkbox {
  accent-color: #facc15;
}

.business-signup-container {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
</style>
