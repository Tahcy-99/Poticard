const BASE_URL = '/api' // local
// const BASE_URL = 'http://192.100.200.10:8080/' // tomcat
// const BASE_URL = 'https://www.beyond24lsj.kro.kr/api/' // aws
// const BASE_URL = 'https://www.sspam.kro.kr/api/'

export async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const config = {
    method: options.method || 'GET',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    credentials: 'include',
  }

  let response

  try {
    const finalUrl = BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    
    response = await fetch(finalUrl, config)
  } catch (error) {
    console.log('요청 보낼 때 네트워크 에러')
    throw error
  }

  //응답 인터셉터
  const body = await response.json().catch(() => null)
    if (body.code == 3001) {
      const role = JSON.parse(localStorage.getItem('USERINFO')).role
      console.log(role)
      if (role == 'ROLE_USER'){
        window.location.href = '/login?type=personal';
      }else{
        window.location.href = '/login?type=company';
      }
      localStorage.removeItem('USERINFO');
      
  }
  else if (!response.ok) {
    console.log('응답 받을 때 HTTP 에러')
    throw new Error(body?.message || `HTTP ${response.status}`)
  }

  return body
}