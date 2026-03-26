<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import api from '@/api/user'

const router = useRouter()
const route = useRoute()

// 폼
const joinForm = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  phone: '',
})

// UI
const showPw = ref(false)
const showPw2 = ref(false)
const serverError = ref('')
const checkingEmail = ref(false)
const emailDuplicateError = ref('')
const emailChecked = ref(false) // 중복 확인 완료 여부
let emailCheckTimeout = null

// 사용자가 해당 칸을 건드리고 떠났는지 + submit 시 전체 true
const touched = reactive({
  name: false,
  email: false,
  password: false,
  passwordConfirm: false,
  phone: false,
  terms: false,
})

const submitted = ref(false)

// 정규식
const nameRegex = /^[A-Za-z가-힣\s]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\d{3}-\d{4}-\d{4}$/

// 전화번호 자동 하이픈
const autoHyphen = (e) => {
  const onlyNum = e.target.value.replace(/[^0-9]/g, '').slice(0, 11)
  let formatted = onlyNum
  if (onlyNum.length <= 3) formatted = onlyNum
  else if (onlyNum.length <= 7) formatted = `${onlyNum.slice(0, 3)}-${onlyNum.slice(3)}`
  else formatted = `${onlyNum.slice(0, 3)}-${onlyNum.slice(3, 7)}-${onlyNum.slice(7)}`
  joinForm.phone = formatted
}

// 비밀번호 rule
const pw = computed(() => joinForm.password || '')
const pwRules = computed(() => {
  const v = pw.value
  return {
    length: v.length >= 8,
    upper: /[A-Z]/.test(v),
    lower: /[a-z]/.test(v),
    number: /[0-9]/.test(v),
    special: /[!@$]/.test(v),
  }
})

const pwChecklist = computed(() => {
  const r = pwRules.value
  return [
    { ok: r.length, text: '8자 이상' },
    { ok: r.lower, text: '영문 소문자 포함' },
    { ok: r.upper, text: '영문 대문자 포함' },
    { ok: r.number, text: '숫자 포함' },
    { ok: r.special, text: '특수문자 (!, @, $) 포함' },
  ]
})

const passwordStrength = computed(() => {
  const v = pw.value
  if (!v) return { score: 0, label: '', color: 'text-slate-400', bg: 'bg-slate-200' }

  const r = pwRules.value
  let score = 0
  if (r.length) score++
  if (r.upper) score++
  if (r.lower) score++
  if (r.number) score++
  if (r.special) score++

  if (score <= 2) return { score: 1, label: '하 (약함)', color: 'text-red-500', bg: 'bg-red-500' }
  if (score <= 4)
    return { score: 2, label: '중 (보통)', color: 'text-yellow-500', bg: 'bg-yellow-500' }
  return { score: 3, label: '상 (강함)', color: 'text-green-500', bg: 'bg-green-500' }
})

const strengthWidthClass = computed(() => {
  const s = passwordStrength.value.score
  if (s <= 0) return 'w-0'
  if (s === 1) return 'w-1/3'
  if (s === 2) return 'w-2/3'
  return 'w-full'
})

// 에러들: (touched || submitted) 일 때 보여줌
const showError = (key) => touched[key] || submitted.value

const nameError = computed(() => {
  if (!showError('name')) return ''
  const v = (joinForm.name || '').trim()
  if (!v) return '필수 정보입니다.'
  if (!nameRegex.test(v)) return '이름은 한글/영문만 입력할 수 있습니다.'
  return ''
})

const emailError = computed(() => {
  if (!showError('email')) return ''
  const v = (joinForm.email || '').trim()
  if (!v) return '필수 정보입니다.'
  if (!emailRegex.test(v)) return '이메일 형식을 확인해 주세요. (예: example@email.com)'
  if (emailDuplicateError.value) return emailDuplicateError.value
  return ''
})

// 이메일 중복 확인 함수
const checkEmailDuplicate = async (email) => {
  if (!email || !emailRegex.test(email)) {
    emailDuplicateError.value = ''
    emailChecked.value = false
    return
  }

  checkingEmail.value = true
  emailDuplicateError.value = ''
  emailChecked.value = false

  try {
    const res = await api.checkEmailDuplicate(email)
    // API 응답에 따라 중복 여부 확인
    // 일반적으로 중복이면 에러, 아니면 성공
    if (res.data) {
      emailDuplicateError.value = '이미 사용 중인 이메일입니다.'
      emailChecked.value = true
    } else {
      emailDuplicateError.value = ''
      emailChecked.value = true
    }
  } catch (e) {
    if (e.response?.status === 409 || e.response?.status === 400) {
      emailDuplicateError.value = '이미 사용 중인 이메일입니다.'
      emailChecked.value = true
    } else {
      emailDuplicateError.value = ''
      emailChecked.value = false
    }
  } finally {
    checkingEmail.value = false
  }
}

// 이메일 입력 시 debounce로 중복 확인
const onEmailInput = () => {
  emailDuplicateError.value = ''
  emailChecked.value = false

  if (emailCheckTimeout) {
    clearTimeout(emailCheckTimeout)
  }

  emailCheckTimeout = setTimeout(() => {
    const email = joinForm.email.trim()
    if (email && emailRegex.test(email)) {
      checkEmailDuplicate(email)
    }
  }, 500)
}

const phoneError = computed(() => {
  if (!showError('phone')) return ''
  const v = (joinForm.phone || '').trim()
  if (!v) return '필수 정보입니다.'
  if (!phoneRegex.test(v)) return '전화번호 형식을 확인해 주세요. (예: 010-1234-5678)'
  return ''
})

const pwTopError = computed(() => {
  if (!showError('password')) return ''
  if (!pw.value) return '필수 정보입니다.'
  const anyMissing = pwChecklist.value.some((x) => !x.ok)
  if (anyMissing) return '아래 조건을 만족해야 합니다.'
  return ''
})

const pwConfirmError = computed(() => {
  if (!showError('passwordConfirm')) return ''
  if (!joinForm.passwordConfirm) return '필수 정보입니다.'
  if (joinForm.passwordConfirm !== joinForm.password) return '비밀번호가 일치하지 않습니다.'
  return ''
})

// 약관동의 관련 상태 (personal 타입일 때만 사용)
const terms = reactive([
  { title: 'Poticard 이용약관 동의', required: true, checked: false },
  { title: '개인정보 수집 및 이용 동의', required: true, checked: false },
  { title: '마케팅 정보 수신 동의 - 이메일', required: false, checked: false },
  { title: '마케팅 정보 수신 동의 - SMS/MMS', required: false, checked: false },
])

const allChecked = ref(false)

const handleAllCheckedChange = () => {
  touched.terms = true
  terms.forEach((t) => (t.checked = allChecked.value))
}

const handleTermChange = () => {
  touched.terms = true
  const allCheckedStatus = terms.every((t) => t.checked)
  allChecked.value = allCheckedStatus
}

const requiredTermsChecked = computed(() => {
  return terms.filter((t) => t.required).every((t) => t.checked)
})

const canSubmit = computed(() => {
  const okName = !nameError.value
  const okEmail = !emailError.value && !emailDuplicateError.value && !checkingEmail.value
  const okPhone = !phoneError.value

  const okPw = !!pw.value && pwChecklist.value.every((x) => x.ok)
  const okPw2 = !!joinForm.passwordConfirm && joinForm.passwordConfirm === joinForm.password

  // personal 타입일 때만 약관동의 체크
  const okTerms = route.query.type !== 'personal' || requiredTermsChecked.value

  return okName && okEmail && okPhone && okPw && okPw2 && okTerms
})

const signup = async () => {
  submitted.value = true
  serverError.value = ''

  // submit 누르면 전부 검증 시작
  touched.name = true
  touched.email = true
  touched.password = true
  touched.passwordConfirm = true
  touched.phone = true
  if (route.query.type === 'personal') {
    touched.terms = true
  }

  if (!canSubmit.value) {
    serverError.value = '입력값을 확인해 주세요.'
    return
  }

  try {
    // 회원가입: email/phone 포함해서 반드시 전송
    await api.signup({
      name: joinForm.name.trim(),
      email: joinForm.email.trim(),
      phone: joinForm.phone.trim(),
      password: joinForm.password.trim()
    }, route.query.type)

    // 자동 로그인하지 말고 로그인 페이지로 이동
    const loginPath = route.query.type
      ? `/login?type=${route.query.type}&justSignedUp=1`
      : '/login?justSignedUp=1'
    router.push(loginPath)
  } catch (e) {
    serverError.value = e?.userMessage || '회원가입 실패'
  }
}
</script>

<template>
  <div class="flex-1 flex items-center min-h-screen justify-center pt-12 pb-12 px-4">
    <div
      class="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden relative">
      <div class="h-2 bg-point-yellow w-full"></div>

      <div class="p-8 md:p-10">
        <div class="text-center mb-8">
          <h2 class="text-4xl font-bold dark:text-[#facc15] text-black mb-2 font-poppins">
            Join Poticard
          </h2>
          <p v-if="route.query.type === 'personal'" class="mt-5 text-gray-500 dark:text-gray-400 text-sm">
            당신의 포트폴리오를 명함 한 장으로 표현하세요.
          </p>
          <p v-if="route.query.type === 'business'" class="mt-5 text-gray-500 dark:text-gray-400 text-sm">
            더 나은 팀을 만드는 여정, PotiCard가 파트너가 되겠습니다.
          </p>
        </div>

        <!-- 서버 에러 -->
        <div v-if="serverError"
          class="mb-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-bold">
          {{ serverError }}
        </div>

        <form class="space-y-6" @submit.prevent="signup" autocomplete="off">
          <!-- NAME -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">이름</label>
            <input v-model.trim="joinForm.name" type="text" placeholder="홍길동" @blur="touched.name = true"
              autocomplete="off" :class="[
                'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400',
                showError('name') && nameError
                  ? 'border-red-500 dark:border-[#facc15] ring-1 ring-red-500 dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]'
                  : 'border-transparent focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]',
              ]" />
            <p v-if="nameError" class="text-xs font-bold text-red-500 dark:text-[#facc15]">
              {{ nameError }}
            </p>
          </div>

          <!-- EMAIL -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">이메일</label>
            <div class="relative">
              <input v-model.trim="joinForm.email" type="email" placeholder="example@email.com" @input="onEmailInput"
                @blur="touched.email = true" autocomplete="off" :class="[
                  'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400',
                  showError('email') && (emailError || emailDuplicateError)
                    ? 'border-red-500 dark:border-[#facc15] ring-1 ring-red-500 dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]'
                    : 'border-transparent focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]',
                ]" />
              <div v-if="checkingEmail" class="absolute right-3 top-1/2 -translate-y-1/2">
                <div class="w-5 h-5 border-2 border-point-yellow border-t-transparent rounded-full animate-spin">
                  ✓
                </div>
              </div>
              <div v-else-if="
                joinForm.email &&
                emailRegex.test(joinForm.email) &&
                emailChecked &&
                !emailDuplicateError &&
                touched.email
              " class="absolute right-3 top-1/2 -translate-y-1/2">
                <span class="text-green-500 text-lg pr-2">✓</span>
              </div>
            </div>
            <p v-if="emailError" class="text-xs font-bold text-red-500 dark:text-[#facc15]">
              {{ emailError }}
            </p>
            <p v-else-if="checkingEmail" class="text-xs font-bold text-gray-500">
              이메일 중복 확인 중...
            </p>
          </div>

          <!-- PASSWORD -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">비밀번호</label>

            <div class="relative">
              <input v-model="joinForm.password" :type="showPw ? 'text' : 'password'" placeholder="••••••••"
                @blur="touched.password = true" autocomplete="new-password" :class="[
                  'w-full pr-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400',
                  showError('password') && pwTopError
                    ? 'border-red-500 dark:border-[#facc15] ring-1 ring-red-500 dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]'
                    : 'border-transparent focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]',
                ]" />
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center justify-center"
                :class="passwordStrength.color" :aria-label="showPw ? '비밀번호 숨기기' : '비밀번호 보기'" @click="showPw = !showPw">
                <span class="text-lg">{{ showPw ? '👁️' : '🔒' }}</span>
              </button>
            </div>

            <!-- 강도 -->
            <div v-if="joinForm.password" class="mt-2">
              <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                <div class="h-2 rounded-full transition-all" :class="[passwordStrength.bg, strengthWidthClass]"></div>
              </div>
              <p class="mt-1 text-xs font-bold" :class="passwordStrength.color">
                보안 강도: {{ passwordStrength.label }}
              </p>
            </div>

            <p v-if="pwTopError" class="text-xs font-bold text-red-500 dark:text-[#facc15]">
              {{ pwTopError }}
            </p>

            <ul v-if="showError('password')" class="text-xs list-disc pl-5 space-y-0.5">
              <li v-for="(item, i) in pwChecklist" :key="i" class="font-bold"
                :class="item.ok ? 'text-green-600' : 'text-red-500 dark:text-[#facc15]'">
                {{ item.text }}
              </li>
            </ul>
          </div>

          <!-- PASSWORD CONFIRM -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">비밀번호 확인</label>

            <div class="relative">
              <input v-model="joinForm.passwordConfirm" :type="showPw2 ? 'text' : 'password'" placeholder="••••••••"
                @blur="touched.passwordConfirm = true" autocomplete="new-password" :class="[
                  'w-full pr-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400',
                  showError('passwordConfirm') && pwConfirmError
                    ? 'border-red-500 dark:border-[#facc15] ring-1 ring-red-500 dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]'
                    : 'border-transparent focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]',
                ]" />
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center justify-center"
                :aria-label="showPw2 ? '비밀번호 재확인 숨기기' : '비밀번호 재확인 보기'" @click="showPw2 = !showPw2">
                <span class="text-lg">{{ showPw2 ? '👁️' : '🔒' }}</span>
              </button>
            </div>

            <p v-if="pwConfirmError" class="text-xs font-bold text-red-500 dark:text-[#facc15]">
              {{ pwConfirmError }}
            </p>
          </div>

          <!-- PHONE -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">휴대폰 번호</label>
            <input v-model="joinForm.phone" type="tel" placeholder="010-1234-5678" @input="autoHyphen"
              @blur="touched.phone = true" autocomplete="off" :class="[
                'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400',
                showError('phone') && phoneError
                  ? 'border-red-500 dark:border-[#facc15] ring-1 ring-red-500 dark:ring-[#facc15] focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]'
                  : 'border-transparent focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]',
              ]" />
            <p v-if="phoneError" class="text-xs font-bold text-red-500 dark:text-[#facc15]">
              {{ phoneError }}
            </p>
          </div>

          <!-- 약관 동의 섹션 (personal 타입일 때만 표시) -->
          <section v-if="route.query.type === 'personal'"
            class="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
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
              <i class="fa-solid fa-circle-exclamation mr-1"></i> 필수 약관에 모두 동의하셔야
              합니다.
            </p>
          </section>

          <button type="submit" :disabled="!canSubmit"
            class="w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50">
            포티카드 시작하기
          </button>
        </form>

        <p class="text-center mt-6 text-sm text-gray-400">
          {{
            route.query.type === 'business'
              ? '이미 기업 계정이 있으신가요?'
              : '이미 개인 계정이 있으신가요?'
          }}
          <RouterLink :to="route.query.type ? `/login?type=${route.query.type}` : '/login'"
            class="text-point-yellow hover:underline">
            로그인
          </RouterLink>
        </p>
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

.custom-checkbox {
  accent-color: #facc15;
}
</style>
