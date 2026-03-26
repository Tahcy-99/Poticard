<script setup>
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'

// 상태 관리
const activeTab = ref('findId')
const findResult = ref(null)

const idForm = reactive({
  name: '',
  phoneNumber: '',
  formattedPhoneNumber: '',
})

const pwForm = reactive({
  email: '',
  name: '',
})

const touched = reactive({
  idName: false,
  idPhone: false,
  pwEmail: false,
  pwName: false,
})

// 메서드

// 휴대폰 번호 포맷팅 로직 (010-0000-0000)
const handlePhoneInput = (e) => {
  let val = e.target.value.replace(/[^0-9]/g, '')
  if (val.length > 11) val = val.slice(0, 11)

  let formatted = ''
  if (val.length <= 3) {
    formatted = val
  } else if (val.length <= 7) {
    formatted = val.slice(0, 3) + '-' + val.slice(3)
  } else {
    formatted = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7)
  }

  idForm.phoneNumber = val
  idForm.formattedPhoneNumber = formatted
}

// 아이디 찾기 실행
const handleFindId = () => {
  touched.idName = true
  touched.idPhone = true
  if (idForm.name && idForm.phoneNumber.length >= 10) {
    findResult.value = 'id_success'
  }
}

// 비밀번호 재설정 실행
const handleResetPw = () => {
  touched.pwEmail = true
  touched.pwName = true
  if (pwForm.email && pwForm.name) {
    findResult.value = 'pw_success'
  }
}

// 탭 변경
const setTab = (tab) => {
  activeTab.value = tab
  findResult.value = null
  Object.keys(touched).forEach((key) => (touched[key] = false))
}
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center min-h-screen py-12 px-4 transition-colors bg-slate-50 bg-white dark:bg-zinc-950 font-['Noto_Sans_KR']">
    <!-- 메인 카드 -->
    <div
      class="w-full max-w-lg rounded-3xl shadow-2xl transition-all bg-white border border-slate-100 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white overflow-hidden">
      <!-- 헤더 세션 -->
      <div class="pt-12 pb-10 px-8 text-center">
        <h2 class="text-4xl font-bold dark:text-[#facc15] text-black mb-3 tracking-tight font-poppins">
          Find Account
        </h2>
        <p class="text-base mt-3 text-slate-500 dark:text-zinc-400">
          개인 정보를 통해 가입하신 계정을 확인하세요.
        </p>
      </div>

      <!-- 탭 메뉴 -->
      <div class="px-8">
        <div class="flex border-b border-slate-100 dark:border-zinc-800/50 relative">
          <button @click="setTab('findId')" class="flex-1 py-4 font-bold text-sm transition-all relative outline-none"
            :class="activeTab === 'findId'
                ? 'text-[#facc15]'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              ">
            아이디 찾기
            <div v-if="activeTab === 'findId'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-[#facc15] transition-all duration-300"></div>
          </button>
          <button @click="setTab('resetPw')" class="flex-1 py-4 font-bold text-sm transition-all relative outline-none"
            :class="activeTab === 'resetPw'
                ? 'text-[#facc15]'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              ">
            비밀번호 재설정
            <div v-if="activeTab === 'resetPw'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-[#facc15] transition-all duration-300"></div>
          </button>
        </div>
      </div>

      <div class="p-8 md:p-10">
        <!-- 아이디 찾기 탭 -->
        <div v-if="activeTab === 'findId'">
          <div v-if="!findResult" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">이름</label>
              <input v-model="idForm.name" type="text" placeholder="가입하신 이름을 입력하세요"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                :class="{ 'border-red-500 ring-1 ring-red-500': touched.idName && !idForm.name }" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">휴대폰 번호</label>
              <input v-model="idForm.formattedPhoneNumber" @input="handlePhoneInput" type="text" inputmode="numeric"
                placeholder="'-' 없이 숫자만 입력"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-['Poppins']"
                :class="{
                  'border-red-500 ring-1 ring-red-500':
                    touched.idPhone && idForm.phoneNumber.length < 10,
                }" />
              <p class="text-[11px] text-slate-400 ml-1 font-medium">
                본인 명의의 휴대폰 번호를 입력해주세요.
              </p>
            </div>

            <button @click="handleFindId"
              class="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              :disabled="!idForm.name || idForm.phoneNumber.length < 10">
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
              <h3 class="text-2xl font-bold text-center tracking-tight text-slate-900 dark:text-white font-['Poppins']">
                user****@gmail.com
              </h3>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <button @click="setTab('resetPw')"
                class="flex-1 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                비밀번호 찾기
              </button>
              <RouterLink to="/login?type=personal"
                class="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center">
                로그인하기</RouterLink>
            </div>
          </div>
        </div>

        <!-- 비밀번호 재설정 탭 -->
        <div v-if="activeTab === 'resetPw'">
          <div v-if="!findResult" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">가입 이메일(아이디)</label>
              <input v-model="pwForm.email" type="email" placeholder="example@email.com"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                :class="{ 'border-red-500 ring-1 ring-red-500': touched.pwEmail && !pwForm.email }" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1 text-slate-600 dark:text-zinc-400">이름</label>
              <input v-model="pwForm.name" type="text" placeholder="가입하신 이름을 입력하세요"
                class="w-full px-4 py-4 border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#facc15] transition-all text-base bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                :class="{ 'border-red-500 ring-1 ring-red-500': touched.pwName && !pwForm.name }" />
            </div>

            <button @click="handleResetPw"
              class="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              :disabled="!pwForm.email || !pwForm.name">
              재설정 링크 발송
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
          <RouterLink to="/login?type=personal" class="hover:text-[#facc15] transition-colors py-1">로그인으로 돌아가기
          </RouterLink>
          <div class="w-px h-3 bg-slate-200 dark:bg-zinc-800"></div>
          <RouterLink href="#" to="/signup?type=personal"
            class="hover:text-[#facc15] transition-colors font-bold text-slate-600 dark:text-zinc-300 py-1">회원가입
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-poppins {
  font-family: 'Poppins', sans-serif;
}
</style>
