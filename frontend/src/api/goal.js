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

export async function analyzeGoal(goalText) {
  return postJson('/api/goals/analyze', { goalText })
}

export async function clarifyGoal(goalText, clarificationHistory) {
  return postJson('/api/goals/clarify', { goalText, clarificationHistory })
}
