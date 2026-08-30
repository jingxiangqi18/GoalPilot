import { postJson } from './client'

export async function analyzeGoal(goalText) {
  return postJson('/api/goals/analyze', { goalText })
}

export async function clarifyGoal(goalText, clarificationHistory) {
  return postJson('/api/goals/clarify', { goalText, clarificationHistory })
}

