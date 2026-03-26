function initHeader() {
  // 헤더 기능 바인딩
  const nav = document.getElementById('mainNav')
  const btn = document.getElementById('menuBtn')

  const flyouts = Array.from(document.querySelectorAll('#mainNav .nav-item'))
  const namecardFlyout = document.getElementById('flyout-namecard')
  const namecardLink = namecardFlyout
    ? namecardFlyout.querySelector('.nav-title a[href="#namecard"]')
    : null
  const namecardPanel = namecardFlyout ? namecardFlyout.querySelector('.nav-panel') : null

  let namecardOpen = false
  function setNamecard(open) {
    namecardOpen = open
    document.documentElement.classList.toggle('namecard-open', open)
    if (namecardPanel) {
      namecardPanel.style.opacity = ''
      namecardPanel.style.visibility = ''
      namecardPanel.style.pointerEvents = ''
    }
  }

  let forcedOpen = false
  function setForced(open) {
    forcedOpen = open
    if (btn) btn.setAttribute('aria-expanded', String(open))
    document.documentElement.classList.toggle('menu-open', open)

    flyouts.forEach((f) => {
      if (!f) return
      if (open) f.classList.add('force-open')
      else f.classList.remove('force-open')
    })

    if (open) setNamecard(false)
  }

  // 로그인/회원가입(개인/법인) 모달
  const authBtn = document.getElementById('authBtn')
  const modal = document.getElementById('authModal')
  const closeBtn = document.getElementById('authClose')

  function openModal() {
    document.documentElement.classList.add('modal-open')
    if (modal) modal.setAttribute('aria-hidden', 'false')
  }
  function closeModal() {
    document.documentElement.classList.remove('modal-open')
    if (modal) modal.setAttribute('aria-hidden', 'true')
  }

  if (authBtn && modal) {
    authBtn.addEventListener('click', (e) => {
      e.preventDefault()
      openModal()
    })

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      closeModal()
    })

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal()
    })
  }

  // 테마 토글
  const themeBtn = document.getElementById('themeBtn')
  themeBtn?.addEventListener('click', () => {
    if (typeof window.toggleTheme === 'function') {
      window.toggleTheme()
    } else {
      document.documentElement.classList.toggle('dark')
    }
  })
  const chatBtn = document.getElementById('chatBtn')
  chatBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    window.location.href = '/chat'
  })
  // 알림 팝업 토글
  const notiBtn = document.getElementById('notiBtn')
  const notiPopup = document.getElementById('notiPopup')
  const notiClear = document.getElementById('notiClear')

  let notiOpen = false

  function setNoti(open) {
    notiOpen = open
    if (notiPopup) {
      notiPopup.classList.toggle('hidden', !open)
    }
  }

  // 버튼 클릭
  notiBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    setNoti(!notiOpen)
  })

  // 바깥 클릭 닫기
  document.addEventListener('click', (e) => {
    if (!notiOpen) return
    if (notiPopup?.contains(e.target) || notiBtn?.contains(e.target)) return
    setNoti(false)
  })

  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNoti(false)
  })

  // 모두 읽음
  notiClear?.addEventListener('click', (e) => {
    e.preventDefault()
    setNoti(false)

    // 뱃지 숨기기
    const badge = notiBtn?.querySelector('span')
    if (badge) badge.style.display = 'none'
  })
}

export { initHeader }
