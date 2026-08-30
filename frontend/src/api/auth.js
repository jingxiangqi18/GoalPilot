import {
  clearAccessToken,
  getAccessToken,
  getJson,
  postJson,
  setAccessToken,
} from './client'

export async function registerUser(username, email, password) {
  return postJson('/api/auth/register', { username, email, password })
}

export async function loginUser(account, password) {
  const session = await postJson('/api/auth/login', { account, password })
  setAccessToken(session.accessToken)
  return session
}

export async function getCurrentUser() {
  return getJson('/api/auth/me')
}

export function hasStoredSession() {
  return Boolean(getAccessToken())
}

export function logoutUser() {
  clearAccessToken()
}
