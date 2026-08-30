const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'goalpilot.access_token'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function getErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (data?.detail) return data.detail

  if (status === 400) return '提交的数据不符合要求，请检查后重试。'
  if (status === 401) return '账号或密码错误，或当前登录状态已失效。'
  if (status === 409) return '用户名或邮箱已被使用。'
  if (status === 502) return 'AI 返回了无效结果，请稍后再试。'
  return `请求失败（HTTP ${status}）`
}

async function requestJson(path, options = {}) {
  let response
  const token = getAccessToken()

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('无法连接后端服务，请确认 Spring Boot 已在 8080 端口启动。', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const responseText = await response.text()
  let data = responseText

  if (contentType.includes('application/json') && responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }
  }

  if (!response.ok) {
    const isPublicAuthRequest = path === '/api/auth/login' || path === '/api/auth/register'

    if (response.status === 401 && !isPublicAuthRequest) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('goalpilot:unauthorized'))
    }

    throw new ApiError(getErrorMessage(data, response.status), response.status)
  }

  return data
}

export function getJson(path) {
  return requestJson(path, { method: 'GET' })
}

export function postJson(path, body) {
  return requestJson(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

