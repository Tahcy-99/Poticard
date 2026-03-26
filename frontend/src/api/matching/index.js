import { apiFetch } from '@/plugins/interceptor'

const PUBLIC_LIST_URL = '/company/public/list'
const PUBLIC_DETAIL_URL = (id) => `/company/public/read/${id}`
const PUBLIC_FAVORITE_URL = (id) => `/company/public/favorite/${id}`
const PUBLIC_APPLY_URL = (id) => `/company/public/apply/${id}`
const PUBLIC_CANCEL_URL = (id) => `/company/public/cancel/${id}`
const PUBLIC_RECOMMEND_URL = (size) => `/company/public/recommend?size=${size}`

const getUserKey = () => {
  try {
    const raw = localStorage.getItem('USERINFO')
    if (!raw) return 'guest'
    const user = JSON.parse(raw)
    return String(user?.id ?? user?.idx ?? user?.email ?? 'guest')
  } catch (error) {
    return 'guest'
  }
}

const favoriteKey = () => `MATCHING_FAVORITES_${getUserKey()}`
const appliedKey = () => `MATCHING_APPLIED_${getUserKey()}`
const viewKey = () => `MATCHING_VIEWS_${getUserKey()}`

const readSet = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch (error) {
    return new Set()
  }
}

const writeSet = (key, value) => {
  localStorage.setItem(key, JSON.stringify(Array.from(value)))
}

const readMap = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

const writeMap = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const unwrapData = (response) => response?.data ?? response ?? null

const pickBoolean = (...values) => {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value
    }
  }
  return false
}

const makeContactEmail = (name = 'company') => {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
  return `recruit@${slug || 'company'}.com`
}

const makeDetail = (raw = {}) => ({
  intro:
    raw.intro ||
    `${raw.name || raw.companyName || '회사'}에서 ${raw.role || raw.title || '포지션'} 인재를 찾고 있습니다.`,
  description:
    raw.description ||
    `${raw.role || raw.title || '포지션'} 포지션으로 서비스 개발과 운영을 담당합니다. 주요 기술은 ${(raw.skills || []).join(', ') || '협의'} 입니다.`,
  requirements:
    raw.requirements ||
    `${(raw.skills || []).join(', ') || '관련 기술'} 경험 또는 빠르게 학습할 수 있는 분`,
  preferred: raw.preferred || '협업 경험, 포트폴리오 또는 프로젝트 경험이 있는 분',
  process: raw.process || '서류 검토 → 실무 인터뷰 → 최종 합류',
  contactEmail: raw.contactEmail || makeContactEmail(raw.name || raw.companyName),
  contactPhone: raw.contactPhone || '02-0000-0000',
})

const normalize = (raw = {}) => {
  const favorites = readSet(favoriteKey())
  const applied = readSet(appliedKey())
  const views = readMap(viewKey())
  const id = Number(raw.id ?? raw.idx)
  const isFavorite = pickBoolean(raw.isFavorite, raw.favorite)
  const isApplied = pickBoolean(raw.isApplied, raw.applied)

  return {
    id,
    name: raw.name || raw.companyName || '',
    role: raw.role || raw.title || '',
    category: raw.category || 'ALL',
    location: raw.location || '',
    exp: raw.exp || raw.experience || '',
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    likes: Number(raw.likes ?? raw.favoriteCount ?? 0),
    views: Number(raw.views ?? raw.viewCount ?? views[id] ?? 0),
    updatedAt: raw.updatedAt || '',
    isFavorite:
      typeof raw.isFavorite === 'boolean' || typeof raw.favorite === 'boolean'
        ? isFavorite
        : favorites.has(id),
    isApplied:
      typeof raw.isFavorite === 'boolean' || typeof raw.applied === 'boolean' || typeof raw.isApplied === 'boolean'
        ? isApplied
        : applied.has(id),
    isMine: pickBoolean(raw.isMine, raw.mine),
    remotePossible:
      typeof raw.remotePossible === 'boolean'
        ? raw.remotePossible
        : String(raw.location || '').toLowerCase().includes('remote'),
    detail: {
      ...raw,
      ...makeDetail({
        ...raw,
        name: raw.name || raw.companyName || '',
        role: raw.role || raw.title || '',
        skills: Array.isArray(raw.skills) ? raw.skills : [],
      }),
    },
  }
}

const buildListQuery = ({ keyword = '', category = 'ALL', favoriteOnly = false, sort = 'popular' } = {}) => {
  const params = new URLSearchParams()
  params.set('keyword', keyword || '')
  params.set('category', category || 'ALL')
  params.set('favoriteOnly', String(Boolean(favoriteOnly)))
  params.set('sort', sort || 'popular')
  return params.toString()
}

const compareMineFirst = (a, b, compare) => {
  if (a.isMine !== b.isMine) {
    return a.isMine ? -1 : 1
  }
  return compare(a, b)
}

const loadMatches = async ({ keyword = '', category = 'ALL', favoriteOnly = false, sort = 'popular' } = {}) => {
  const query = buildListQuery({ keyword, category, favoriteOnly, sort })
  const response = await apiFetch(`${PUBLIC_LIST_URL}?${query}`)
  const data = unwrapData(response)

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item) => normalize(item))
}

const list = async ({
  keyword = '',
  category = 'ALL',
  favoriteOnly = false,
  appliedOnly = false,
  sort = 'popular',
} = {}) => {
  let results = await loadMatches({ keyword, category, favoriteOnly, sort })

  const q = keyword.trim().toLowerCase()
  if (q) {
    results = results.filter((item) =>
      [item.name, item.role, item.category, item.location, item.exp, ...(item.skills || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }

  if (category && category !== 'ALL') {
    results = results.filter((item) => item.category === category)
  }

  if (favoriteOnly) {
    results = results.filter((item) => item.isFavorite)
  }

  if (appliedOnly) {
    results = results.filter((item) => item.isApplied)
  }

  if (sort === 'views') {
    results.sort((a, b) => compareMineFirst(a, b, (x, y) => y.views - x.views))
  } else if (sort === 'newest') {
    results.sort((a, b) =>
      compareMineFirst(a, b, (x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt))),
    )
  } else {
    results.sort((a, b) =>
      compareMineFirst(a, b, (x, y) => (y.likes * 2 + y.views) - (x.likes * 2 + x.views)),
    )
  }

  return results
}

const detail = async (id) => {
  const targetId = Number(id)
  const response = await apiFetch(PUBLIC_DETAIL_URL(targetId))
  const data = unwrapData(response)

  if (!data) {
    throw new Error('공고를 찾을 수 없습니다.')
  }

  const item = normalize(data)

  const views = readMap(viewKey())
  views[item.id] = Number(item.views ?? 0)
  writeMap(viewKey(), views)

  return item
}

const toggleFavorite = async (id) => {
  const targetId = Number(id)
  const response = await apiFetch(PUBLIC_FAVORITE_URL(targetId), {
    method: 'PATCH',
  })

  const result = unwrapData(response) || {}
  const favorites = readSet(favoriteKey())

  if (Boolean(result.favorite)) {
    favorites.add(targetId)
  } else {
    favorites.delete(targetId)
  }

  writeSet(favoriteKey(), favorites)

  return {
    data: {
      companyIdx: targetId,
      favorite: Boolean(result.favorite),
      favoriteCount: Number(result.favoriteCount ?? 0),
    },
  }
}

const apply = async (id) => {
  const targetId = Number(id)
  const response = await apiFetch(PUBLIC_APPLY_URL(targetId), {
    method: 'POST',
  })

  const result = unwrapData(response) || {}
  const applied = readSet(appliedKey())

  if (Boolean(result.applied ?? true)) {
    applied.add(targetId)
    writeSet(appliedKey(), applied)
  }

  return {
    data: {
      companyIdx: targetId,
      applied: Boolean(result.applied ?? true),
      applicants: Number(result.applicants ?? 0),
      newApplicants: Number(result.newApplicants ?? 0),
    },
  }
}

const cancelApply = async (id) => {
  const targetId = Number(id)
  const response = await apiFetch(PUBLIC_CANCEL_URL(targetId), {
    method: 'DELETE',
  })

  const result = unwrapData(response) || {}
  const applied = readSet(appliedKey())
  applied.delete(targetId)
  writeSet(appliedKey(), applied)

  return {
    data: {
      companyIdx: targetId,
      applied: Boolean(result.applied ?? false),
      applicants: Number(result.applicants ?? 0),
      newApplicants: Number(result.newApplicants ?? 0),
    },
  }
}

const recommend = async (size = 4) => {
  const response = await apiFetch(PUBLIC_RECOMMEND_URL(size))
  const data = unwrapData(response)

  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => normalize(item))
    .sort((a, b) => (b.likes * 2 + b.views) - (a.likes * 2 + a.views))
    .slice(0, size)
}

export default { list, detail, toggleFavorite, apply, cancelApply, recommend }