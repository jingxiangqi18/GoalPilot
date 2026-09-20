import { getJson, postJson } from './client'

export async function createGoal(goalText) {
  return postJson('/api/goals', { goalText })
}

export async function getGoals(page = 1, size = 9, status = 'ALL') {
  const query = new URLSearchParams({ page, size })
  if (status !== 'ALL') query.set('status', status)
  const data = await getJson(`/api/goals?${query}`)
  if (!Array.isArray(data?.items)) throw new Error('目标列表信息不完整，请重新读取。')
  if (status !== 'ALL' && (Number(data.page) !== page || Number(data.size) !== size || data.items.some(goal => goal.status !== status))) {
    throw new Error('返回的筛选或分页信息与请求不一致，请刷新后重试。')
  }
  return data
}

export async function getGoalDetails(goalId) {
  return getJson(`/api/goals/${encodeURIComponent(goalId)}`)
}

export async function analyzeGoal(goalId) {
  return postJson(`/api/goals/${encodeURIComponent(goalId)}/analyze`)
}

export async function clarifyGoal(goalId, answers) {
  return postJson(`/api/goals/${encodeURIComponent(goalId)}/clarifications`, { answers })
}

// The assistant is single-turn and read-only. Do not send local history or plan data.
export async function askGoalAssistant(goalId, message) {
  const data = await postJson(`/api/goals/${encodeURIComponent(goalId)}/assistant`, { message })
  if (typeof data?.reply !== 'string' || !data.reply.trim()) {
    throw new Error('助手未返回有效回答，请稍后重新提问。')
  }
  return data.reply.trim()
}
