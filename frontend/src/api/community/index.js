import { apiFetch } from '@/plugins/interceptor'

const toPostSummary = (item = {}) => ({
  postId: item.idx,
  category: item.category,
  isSolved: Boolean(item.solved),
  title: item.title,
  author: item.writer,
  writerIdx: item.writerIdx,
  tags: Array.isArray(item.tags) ? item.tags : [],
  likes: Number(item.likesCount ?? 0),
  replys: Number(item.commentCount ?? 0),
  views: Number(item.viewCount ?? 0),
  body: item.contents ?? '',
  createdAt: item.createdAt,
  isFavorite: Boolean(item.favorite),
  isOwner: Boolean(item.owner),
})

const toComment = (item = {}) => ({
  idx: item.idx,
  postId: item.postId,
  contents: item.contents ?? '',
  writer: item.writer ?? '-',
  writerIdx: item.writerIdx ?? null,
  owner: Boolean(item.owner),
  createdAt: item.createdAt,
})

const getPosts = async (page = 0, size = 20, scope = 'ALL') => {
  const res = await apiFetch(`/community/list?page=${page}&size=${size}&scope=${scope}`)
  const data = res?.data || {}

  return {
    ...res,
    data: {
      ...data,
      communityList: (data.communityList || []).map(toPostSummary),
    },
  }
}

const getPostDetail = async (postId) => {
  const res = await apiFetch(`/community/read/${postId}`)
  const data = res?.data || {}

  return {
    ...res,
    data: {
      ...toPostSummary(data),
      comments: Array.isArray(data.comments) ? data.comments.map(toComment) : [],
    },
  }
}

const createPost = async (req) => {
  return await apiFetch('/community/reg', {
    method: 'POST',
    body: req,
  })
}

const updatePost = async (postId, req) => {
  return await apiFetch(`/community/update/${postId}`, {
    method: 'PUT',
    body: req,
  })
}

const deletePost = async (postId) => {
  return await apiFetch(`/community/delete/${postId}`, {
    method: 'DELETE',
  })
}

const toggleFavorite = async (postId) => {
  return await apiFetch(`/community/favorite/${postId}`, {
    method: 'PATCH',
  })
}

const getSummary = async () => {
  const res = await apiFetch('/community/summary')
  const data = res?.data || {}

  return {
    ...res,
    data: {
      ...data,
      popularPosts: (data.popularPosts || []).map(toPostSummary),
      myPosts: (data.myPosts || []).map(toPostSummary),
      myComments: (data.myComments || []).map(toComment),
    },
  }
}

const getComments = async (postId) => {
  const res = await apiFetch(`/community/comment/list/${postId}`)
  return {
    ...res,
    data: Array.isArray(res?.data) ? res.data.map(toComment) : [],
  }
}

const createComment = async (postId, contents) => {
  return await apiFetch(`/community/comment/reg/${postId}`, {
    method: 'POST',
    body: { contents },
  })
}

const deleteComment = async (commentId) => {
  return await apiFetch(`/community/comment/delete/${commentId}`, {
    method: 'DELETE',
  })
}

export default {
  getPosts,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
  toggleFavorite,
  getSummary,
  getComments,
  createComment,
  deleteComment,
}