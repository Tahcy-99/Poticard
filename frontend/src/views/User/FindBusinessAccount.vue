<script setup>
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'

// 상태 관리 
const activeTab = ref('findId')
const findResult = ref(null)

const idForm = reactive({
  businessNumber: '',
  formattedBusinessNumber: '',
})

const pwForm = reactive({
  email: '',
  businessNumber: '',
  formattedBusinessNumber: '',
})

const touched = reactive({
  idBusNum: false,
  pwEmail: false,
  pwBusNum: false,
})

// 메서드

// 사업자 번호 포맷팅 로직
const handleBusinessNumberInput = (e, targetForm) => {
  let val = e.target.value.replace(/[^0-9]/g, '')
  if (val.length > 10) val = val.slice(0, 10)

  const formatted =
    val.length <= 3
      ? val
      : val.length <= 5
        ? val.slice(0, 3) + '-' + val.slice(3)
        : val.slice(0, 3) + '-' + val.slice(3, 5) + '-' + val.slice(5)

  if (targetForm === 'id') {
    idForm.businessNumber = val
    idForm.formattedBusinessNumber = formatted
  } else {
    pwForm.businessNumber = val
    pwForm.formattedBusinessNumber = formatted
  }
}

// 아이디 찾기 실행
const handleFindId = () => {
  touched.idBusNum = true
  if (idForm.businessNumber.length === 10) {
    findResult.value = 'id_success'
  }
}

// 비밀번호 재설정 실행
const handleResetPw = () => {
  touched.pwEmail = true
  touched.pwBusNum = true
  if (pwForm.email && pwForm.businessNumber.length === 10) {
    findResult.value = 'pw_success'
  }
}

// 탭 변경
const setTab = (tab) => {
  activeTab.value = tab
  findResult.value = null
  touched.idBusNum = false
  touched.pwEmail = false
  touched.pwBusNum = false
}
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center min-h-screen py-12 px-4 transition-colors bg-slate-50 bg-white dark:bg-zinc-950">
    <!-- 메인 카드 -->
    <div
      class="w-full max-w-lg rounded-3xl shadow-2xl transition-all bg-white border border-slate-100 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white overflow-hidden">
      <!-- 헤더 세션 -->
      <div class="pt-12 pb-10 px-8 text-center">
        <h2 class="text-4xl font-bold dark:text-[#facc15] text-black mb-3 tracking-tight font-poppins">
          Find Account
        </h2>
        <p class="text-base mt-3 text-slate-500 dark:text-zinc-400">
          등록된 기업 정보를 통해 계정을 확인하세요.
        </p>
      </div>

      <!-- 탭 메뉴 -->
      <div class="px-8">
        <div class="flex border-b border-slate-100 dark:border-zinc-800/50 relative">
          <button @click="setTab('findId')" class="flex-1 py-4 font-bold text-sm transition-all relative outline-none"
            :class="activeTab === 'findId'
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              ">
            아이디 찾기
            <div v-if="activeTab === 'findId'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          </button>
          <button @click="setTab('resetPw')" class="flex-1 py-4 font-bold text-sm transition-all relative outline-none"
            :class="activeTab === 'resetPw'
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              ">
            비밀번호 재설정
            <div v-if="activeTab === 'resetPw'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          </button>
        </div>
      </div>

      <div class="p-8 md:p-10">
        <!-- 아이디 찾기 탭 -->
        <div v-if="activeTab === 'findId'">
          <div v-if="!findResult" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">사업자 등록 번호</label>
              <input v-model="idForm.formattedBusinessNumber" @input="handleBusinessNumberInput($event, 'id')"
                type="text" inputmode="numeric" placeholder="'-' 없이 10자리 입력"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-poppins"
                :class="{
                  'border-red-500 ring-1 ring-red-500 dark:border-[#facc15] dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]':
                    touched.idBusNum && idForm.businessNumber.length < 10,
                }" />
              <p class="text-[11px] text-slate-400 ml-1 font-medium">
                기업 회원가입 시 등록한 사업자 번호를 입력해주세요.
              </p>
            </div>

            <button @click="handleFindId"
              class="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-primary text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              :disabled="idForm.businessNumber.length < 10">
              아이디 찾기
            </button>
          </div>

          <!-- 아이디 찾기 결과 -->
          <div v-else-if="findResult === 'id_success'" class="text-center space-y-6 py-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl bg-green-100 dark:bg-green-900/30 text-green-500">
              <i class="fa-solid fa-user-check"></i>
            </div>
            <div>
              <p class="text-slate-500 dark:text-zinc-400 text-sm mb-1 text-center font-medium">
                입력하신 정보와 일치하는 아이디입니다.
              </p>
              <h3 class="text-2xl font-bold text-center tracking-tight text-slate-900 dark:text-white font-poppins">
                poti****@company.com
              </h3>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <button @click="setTab('resetPw')"
                class="flex-1 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                비밀번호 찾기
              </button>
              <RouterLink to="/login?type=business"
                class="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm transition-opacity hover:opacity-90">
                로그인하기</RouterLink>
            </div>
          </div>
        </div>

        <!-- 비밀번호 재설정 탭 -->
        <div v-if="activeTab === 'resetPw'">
          <div v-if="!findResult" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">가입 이메일(아이디)</label>
              <input v-model="pwForm.email" type="email" placeholder="example@company.com"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">사업자 등록 번호</label>
              <input v-model="pwForm.formattedBusinessNumber" @input="handleBusinessNumberInput($event, 'pw')"
                type="text" inputmode="numeric" placeholder="'-' 없이 10자리 입력"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-poppins" />
            </div>

            <button @click="handleResetPw"
              class="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-primary text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              :disabled="!pwForm.email || pwForm.businessNumber.length < 10">
              임시 비밀번호 발송
            </button>
          </div>

          <!-- 비밀번호 재설정 결과 -->
          <div v-else-if="findResult === 'pw_success'" class="text-center space-y-6 py-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2 text-center text-slate-900 dark:text-white">
                이메일이 발송되었습니다!
              </h3>
              <p class="text-slate-500 dark:text-zinc-400 text-sm mb-1 text-center font-medium leading-relaxed">
                <span class="font-bold text-slate-700 dark:text-zinc-200">{{ pwForm.email }}</span>
                계정으로<br />
                비밀번호 재설정 링크를 보내드렸습니다.
              </p>
            </div>
            <button @click="findResult = null"
              class="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl font-bold hover:opacity-90 transition-opacity">
              확인
            </button>
          </div>
        </div>

        <!-- 하단 링크 -->
        <div
          class="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/50 flex justify-center items-center gap-4 text-xs sm:text-sm text-slate-400">
          <RouterLink to="/login?type=business" class="hover:text-primary transition-colors py-1">로그인으로 돌아가기
          </RouterLink>
          <div class="w-px h-3 bg-slate-200 dark:bg-zinc-800"></div>
          <RouterLink to="/signup-business"
            class="hover:text-primary transition-colors font-bold text-slate-600 dark:text-zinc-300 py-1">기업 회원가입
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(body) {
  font-family: 'Noto Sans KR', sans-serif;
}

.font-poppins {
  font-family: 'Poppins', sans-serif;
}

.text-primary {
  color: #facc15;
}

.bg-primary {
  background-color: #facc15;
}
</style>
