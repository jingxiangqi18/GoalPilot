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
