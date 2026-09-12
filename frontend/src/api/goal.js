import { getJson, postJson } from './client'

export async function createGoal(goalText) {
  return postJson('/api/goals', { goalText })
}

export async function getGoals(page = 1, size = 9) {
  return getJson(`/api/goals?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`)
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
