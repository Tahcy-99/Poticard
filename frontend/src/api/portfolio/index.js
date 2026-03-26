import { apiFetch } from '@/plugins/interceptor'

// 1. 프로젝트 목록 조회 (JSON 파일 호출)
export const getProjects = async () => {
  try {
    const res = await apiFetch('json/projects/allProjects')
    return res
  } catch (error) {
    console.error('프로젝트 목록 호출 실패:', error.message)
    return { projects: [] }
  }
}

// 프로젝트 상세 조회 API
export const getProjectDetail = async (portfolioIdx) => {
  return await apiFetch(`portfolio/${portfolioIdx}`) 
}

// 포트폴리오 생성 API
export const createPortfolio = async (portfolioData) => {
  return await apiFetch('portfolio/create', {
    method: 'POST',
    body: portfolioData
  })
}

// 포트폴리오 섹션 목록 조회 API
export const getPortfolioSections = async (portfolioIdx) => {
  return await apiFetch(`section/list/${portfolioIdx}`)
}

// 포트폴리오 진행 상황 저장 API
export const savePortfolioProgress = async (portfolioIdx, payload) => {
  return await apiFetch(`portfolio/${portfolioIdx}/save-progress`, {
    method: 'PATCH',
    body: payload
  })
}

// 포트폴리오 스타일 저장 API
export const updateStyle = async (portfolioIdx, styleData) => {
  return await apiFetch(`portfolio/${portfolioIdx}/style`, {
    method: 'PATCH',
    body: styleData
  })
}

// 포트폴리오 목록 조회 API
export const getPortfolioList = async (page = 0, size = 10) => {
  return await apiFetch(`portfolio/list?page=${page}&size=${size}`)
}

// 특정 유저 포트폴리오 목록 조회 API
export const getUserPortfolioList = async (userIdx, page = 0, size = 10) => {
  return await apiFetch(`portfolio/user/${userIdx}/list?page=${page}&size=${size}`)
}

// 포트폴리오 키워드 저장 API
export const updateKeywords = async (portfolioIdx, keywords) => {
  return await apiFetch(`portfolio/${portfolioIdx}/keywords`, {
    method: 'PATCH',
    body: keywords
  })
}

// AI 첨삭 API
export const getAiReview = async (contents) => {
  return await apiFetch('portfolio/ai-review', {
    method: 'POST',
    body: { contents }
  })
}

// AI 키워드 추출 API
export const extractKeywordsAi = async (contents) => {
  return await apiFetch('portfolio/ai-keywords', {
    method: 'POST',
    body: { contents }
  })
}

// 포트폴리오 섹션 업데이트 API
export const updateSection = async (sectionIdx, updateReq) => {
  return await apiFetch(`section/update/${sectionIdx}`, {
    method: 'PATCH',
    body: updateReq
  })
}

// 포트폴리오 삭제 API
export const deletePortfolio = async (portfolioIdx, title) => {
  return await apiFetch(`portfolio/delete/${portfolioIdx}`, {
    method: 'POST',
    body: { title }
  })
}

// 키워드 호출 API
const getAllKeywords = async () => {
  try {
    const res = await apiFetch('/portfolio/keywords')
    return res
  } catch (error) {
    console.error('포트폴리오 키워드 호출 실패:', error.message)
  }
}
export const uploadImage = async (formData) => {
  const token = localStorage.getItem('token') || ''; 
  
  const res = await fetch('/api/portfolio/image-upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error('서버 에러 발생');
  return await res.json();
}

export default {
  getProjects,  
  createPortfolio,
  getPortfolioSections,
  savePortfolioProgress,
  updateStyle,
  getPortfolioList,
  getUserPortfolioList,
  updateKeywords,
  getProjectDetail,
  getAiReview,
  extractKeywordsAi,
  updateSection,
  deletePortfolio,
  getAllKeywords,
  uploadImage,
}