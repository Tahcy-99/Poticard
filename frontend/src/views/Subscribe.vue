<template>
  <div class="page">
    <div class="container">
      <header class="top">
        <h1 class="title">Poticard</h1>
      </header>

      <div class="grid">
        <section class="card">
          <div class="cardHead">
            <h2 class="cardTitle">요금제</h2>
            <div class="pill">
              <button
                type="button"
                class="pillBtn"
                :class="{ on: billingCycle === 'monthly' }"
                @click="billingCycle = 'monthly'"
              >
                월간
              </button>
              <button
                type="button"
                class="pillBtn"
                :class="{ on: billingCycle === 'yearly' }"
                @click="billingCycle = 'yearly'"
              >
                연간 <span class="badge">할인</span>
              </button>
            </div>
          </div>

          <div class="plans">
            <button
              v-for="p in displayPlans"
              :key="p.id"
              type="button"
              class="plan"
              :class="{ selected: planId === p.id }"
              @click="planId = p.id"
            >
              <div class="planTop">
                <div>
                  <div class="planName">{{ p.name }}</div>
                  <div class="planDesc">{{ p.desc }}</div>
                </div>
                <div class="price">
                  <div class="priceMain">{{ formatWon(p.price) }}</div>
                  <div class="priceSub">/ {{ billingCycle === 'monthly' ? '월' : '년' }}</div>
                </div>
              </div>

              <ul class="benefits">
                <li v-for="b in p.benefits" :key="b">✔ {{ b }}</li>
              </ul>
            </button>
          </div>
        </section>

        <section class="card">
          <h2 class="cardTitle">결제 정보</h2>

          <div class="field">
            <label class="label">이메일</label>
            <input
              class="input"
              type="email"
              v-model.trim="email"
              placeholder="example@poticard.com"
            />
          </div>

          <div class="line"></div>

          <div class="summary">
            <div class="row">
              <span>선택 요금제</span>
              <b>{{ selectedPlan?.name || '-' }}</b>
            </div>
            <div class="row">
              <span>청구 주기</span>
              <b>{{ billingCycle === 'monthly' ? '월간' : '연간' }}</b>
            </div>
            <div class="row">
              <span>소계</span>
              <b>{{ formatWon(selectedPlan?.price ?? 0) }}</b>
            </div>

            <div class="row">
              <span>할인</span>
              <b>- {{ formatWon(discount) }}</b>
            </div>

            <div class="row total">
              <span>결제 금액</span>
              <b>{{ formatWon(total) }}</b>
            </div>
          </div>

          <div class="line"></div>

          <div class="agreements">
            <label class="chk">
              <input type="checkbox" v-model="agreeTerms" />
              <span>이용약관 및 결제/환불 정책에 동의합니다.</span>
            </label>
            <label class="chk">
              <input type="checkbox" v-model="agreeAutoRenew" />
              <span>정기결제(자동 갱신)에 동의합니다.</span>
            </label>
          </div>

          <button class="cta" type="button" :disabled="!canPay" @click="onPay">
            {{ payButtonText }}
          </button>

          <p class="fine">결제 후 언제든지 구독을 해지할 수 있어요. (다음 결제일부터 적용)</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import planApi from '@/api/plan'
import ordersApi from '@/api/orders'

const billingCycle = ref('monthly')
const planId = ref('')
const email = ref('')
const agreeTerms = ref(false)
const agreeAutoRenew = ref(false)
const isPaying = ref(false) 

const plans = ref([])

onMounted(async () => {
  try {
    const data = await planApi.getPlanList()
    console.log('요금제 API 전체 응답:', data)

    let planArray = []
    if (Array.isArray(data)) {
      planArray = data
    } else if (data && Array.isArray(data.result)) {
      planArray = data.result
    } else if (data && Array.isArray(data.data)) {
      planArray = data.data
    }

    if (planArray.length > 0) {
      plans.value = planArray.map((p) => ({
        id: (p.name || '').toLowerCase(), 
        name: p.name,
        monthly: p.monthlyPrice,
        yearly: p.yearlyPrice,
        benefits: p.benefits || [],
        highlight: (p.name || '').toLowerCase() === 'pro',
      }))

      const defaultPlan = plans.value.find((p) => p.id === 'pro') || plans.value[0]
      if (defaultPlan) planId.value = defaultPlan.id
    } else {
      console.warn('데이터에서 요금제 배열을 찾을 수 없습니다.', data)
    }
  } catch (error) {
    console.error('요금제 로딩 에러:', error)
  }
})

const displayPlans = computed(() =>
  plans.value.map((p) => ({
    ...p,
    price: billingCycle.value === 'monthly' ? p.monthly : p.yearly,
  })),
)

const selectedPlan = computed(() => displayPlans.value.find((p) => p.id === planId.value))

const discount = computed(() => {
  if (!selectedPlan.value) return 0
  if (billingCycle.value === 'yearly') {
    const original = selectedPlan.value.monthly * 12
    return Math.max(0, original - selectedPlan.value.price)
  }
  return 0
})

const total = computed(() => {
  const price = selectedPlan.value?.price ?? 0
  return Math.max(0, price)
})

const canPay = computed(() => {
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  return !!selectedPlan.value && hasEmail && agreeTerms.value && agreeAutoRenew.value && !isPaying.value
})

const payButtonText = computed(() => {
  if (!selectedPlan.value) return '요금제를 불러오는 중...'
  if (isPaying.value) return '결제창을 띄우는 중...'
  return `${formatWon(total.value)} 결제하고 구독 시작`
})

function formatWon(v) {
  const n = Number(v || 0)
  return n.toLocaleString('ko-KR') + '원'
}

async function onPay() {
  if (!window.PortOne) {
    alert('포트원 결제 모듈을 불러올 수 없습니다. (스크립트 교체 확인)');
    return;
  }

  isPaying.value = true;
  const paymentId = `mid_${new Date().getTime()}`;

  try {
    const response = await window.PortOne.requestPayment({
      storeId: "store-9f76cf8e-f930-4d15-bde0-2a89967613fc",
      channelKey: "channel-key-3d557ee7-31ae-4b5d-a7bc-32241dd1c3ef",
      paymentId: paymentId,
      orderName: `Poticard ${selectedPlan.value.name} 구독`,
      totalAmount: Number(total.value),
      currency: "CURRENCY_KRW",
      payMethod: "CARD", // 복잡한 조건문 제거하고 기본 CARD로 하드코딩
      customer: {
        email: email.value,
        fullName: "테스트유저",
        phoneNumber: "010-1234-5678",
      }
    });

    isPaying.value = false;

    if (response.code != null) {
      console.error("🚨 포트원 V2 결제 실패:", response);
      return alert(`결제 실패 [${response.code}]: ${response.message}`);
    }

    const verifyResult = await ordersApi.verifyPayment({
      paymentId: response.paymentId, 
      merchantUid: paymentId,
      planCode: planId.value,
      email: email.value,
      amount: total.value,
    });

    if (verifyResult.isSuccess || verifyResult.code === 1000) {
      alert('결제가 성공적으로 완료되었습니다!');
      window.location.href = '/'; 
    } else {
      alert(`결제 검증 실패: ${verifyResult.message || '금액 위변조가 의심됩니다.'}`);
    }

  } catch (error) {
    isPaying.value = false;
    console.error("결제 프로세스 에러:", error);
    alert('결제 모듈 실행 중 오류가 발생했습니다.');
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 40px 16px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.top {
  margin-bottom: 18px;
}

.title {
  font-size: 28px;
  font-weight: 900;
  margin: 0;
}

.sub {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 18px;
}

.cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cardTitle {
  font-size: 16px;
  font-weight: 900;
  margin: 0 0 12px;
}

.pill {
  display: flex;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 4px;
}

.pillBtn {
  border: 0;
  background: transparent;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
}

.pillBtn.on {
  background: #111827;
  color: #fff;
}

.badge {
  margin-left: 6px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #facc15;
  color: #111;
}

.plans {
  display: grid;
  gap: 12px;
}

.plan {
  position: relative;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.plan:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.plan.selected {
  border-color: #111827;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.12);
}

.planTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.planName {
  font-size: 16px;
  font-weight: 900;
}

.planDesc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.price {
  text-align: right;
}

.priceMain {
  font-weight: 900;
  font-size: 18px;
}

.priceSub {
  font-size: 11px;
  color: #6b7280;
}

.benefits {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #374151;
}

.highlight {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #facc15;
  color: #111;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.field {
  margin-top: 10px;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 6px;
  color: #111827;
}

.input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  outline: none;
}

.input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
}

.hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #6b7280;
}

.line {
  height: 1px;
  background: #e5e7eb;
  margin: 14px 0;
}

.summary {
  display: grid;
  gap: 8px;
  font-size: 13px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #374151;
}

.total {
  font-size: 14px;
  color: #111827;
}

.agreements {
  display: grid;
  gap: 8px;
}

.chk {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  color: #374151;
}

.chk input {
  margin-top: 2px;
}

.cta {
  width: 100%;
  margin-top: 12px;
  border: 0;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 900;
  background: #facc15;
  color: #111;
}

.cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fine {
  margin: 10px 0 0;
  font-size: 11px;
  color: #6b7280;
}
</style>