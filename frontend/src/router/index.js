import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import FullScreenLayout from '../layouts/FullScreenLayout.vue'
import useAuthStore from '@/stores/useAuthStore'
import CompanyLayout from '@/layouts/CompanyLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/Index.vue'),
          meta: { requiresAuth: false, title: 'POTICARD' },
        },
        {
          path: 'index',
          name: 'Index',
          component: () => import('../views/Index.vue'),
          meta: { requiresAuth: false, title: 'POTICARD' },
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/User/Login.vue'),
          meta: { requiresAuth: false, title: '로그인' },
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('../views/User/Signup.vue'),
          meta: { requiresAuth: false, title: '회원가입' },
        },
        {
          path: 'signup-business',
          name: 'signupbusiness',
          component: () => import('../views/User/SignupBusiness.vue'),
          meta: { requiresAuth: false, title: '기업 회원가입' },
        },
        {
          path: 'find-business-account',
          name: 'find-business-account',
          component: () => import('../views/User/FindBusinessAccount.vue'),
          meta: { requiresAuth: false, title: '기업 계정 찾기' },
        },
        {
          path: 'find-personal-account',
          name: 'find-personal-account',
          component: () => import('../views/User/FindPersonalAccount.vue'),
          meta: { requiresAuth: false, title: '개인 계정 찾기' },
        },
        {
          path: 'namecard-search',
          name: 'namecard-search',
          component: () => import('../views/NameCard/NameCardSearch.vue'),
          meta: { requiresAuth: false, title: '명함 검색' },
        },
        {
          path: 'namecard-modify',
          name: 'namecard-modify',
          component: () => import('../views/NameCard/NameCardModify.vue'),
          meta: { requiresAuth: false, title: '명함 수정' },
        },
        {
          path: 'portfolio-project',
          name: 'portfolio-project',
          component: () => import('../views/Portfolio/PortfolioProject.vue'),
          meta: { requiresAuth: false, title: '포트폴리오 작성' },
        },
        {
          path: 'portfolio-update-n-check',
          name: 'portfolio-update-n-check',
          component: () => import('../views/Portfolio/PortfolioUpdateAndCheck.vue'),
        },
        {
          path: 'portfolio-style',
          name: 'portfolio-style',
          component: () => import('../views/Portfolio/PortfolioStyle.vue'),
        },
        {
          path: 'portfolio-view',
          name: 'portfolio-view',
          component: () => import('../views/Portfolio/PortfolioView.vue'),
          meta: { requiresAuth: false, title: '포트폴리오 목록' },
        },
        {
          path: 'project-detail',
          name: 'projectdetail',
          component: () => import('../views/Portfolio/ProjectDetail.vue'),
          meta: { requiresAuth: false, title: '프로젝트 상세' },
        },  
        {
          path: 'matching',
          name: 'matching',
          component: () => import('../views/Matching.vue'),
          meta: { requiresAuth: false, title: '채용' },
        },
        {
          path: 'community',
          name: 'community',
          component: () => import('../views/Community/Community.vue'),
          meta: { requiresAuth: false, title: '커뮤니티' },
        },
        {
          path: 'community-write',
          name: 'community-write',
          component: () => import('../views/Community/CommunityWrite.vue'),
          meta: { requiresAuth: false, title: '글쓰기' },
        },
        {
          path: 'chat',
          name: 'chat',
          component: () => import('../views/Chat/Chat.vue'),
          meta: { requiresAuth: false, title: '채팅' },
        },
        {
          path: 'subscribe',
          name: 'Subscribe',
          component: () => import('../views/Subscribe.vue'),
          meta: { requiresAuth: false, title: '구독' },
        },
        {
          path: 'notice',
          name: 'notice',
          component: () => import('../views/Notice/NoticeList.vue'),
          meta: { requiresAuth: false, title: '공지사항' },
        },
        {
          path: 'notice/:Idx',
          name: 'notice-detail',
          component: () => import('../views/Notice/NoticeDetail.vue'),
          meta: { requiresAuth: false, title: '공지사항 상세' },
        },
        {
          path: 'searchresults',
          name: 'searchresults',
          component: () => import('../views/SearchResults.vue'),
          meta: { requiresAuth: false, title: '검색 결과' },
        },
      ],
    },
    {
      path: '/company',
      component: CompanyLayout,
      children: [
        {
          path: '',
          name: 'company-home',
          component: () => import('../views/Company/CompanyHome.vue'),
          meta: { requiresAuth: false, title: '기업 홈' },
        },
        {
          path: 'jobcreate',
          name: 'CompanyJobCreate',
          component: () => import('../views/Company/CompanyJobCreate.vue'),
          meta: { requiresAuth: false, title: '공고 등록' },
        },
        {
          path: 'joblist',
          name: 'CompanyJobList',
          component: () => import('../views/Company/CompanyJobList.vue'),
          meta: { requiresAuth: false, title: '공고 확인' },
        },
        {
          path: 'applicantlist',
          name: 'CompanyApplicantList',
          component: () => import('../views/Company/CompanyApplicantList.vue'),
          meta: { requiresAuth: false, title: '공고 확인' },
        },
      ],
    },
    {
      path: '/video-chat',
      component: FullScreenLayout,
      children: [{ path: '', component: () => import('../views/Chat/VideoChat.vue') }],
    },
  ],
})

router.beforeEach((to, from, next) => {

  const authStore = useAuthStore()
  if (
    to.name === 'login' ||
    to.name === 'signup' ||
    to.name === 'signup-business' ||
    to.name === 'find-business-account' ||
    to.name === 'find-personal-account'
  ) {
    return next()
  }

  if (to.meta?.requiresAuth) {
    if (!authStore.checkLogin()) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

export default router
