import { postJson } from './client'

export async function generatePlan(goalText, goalAnalysis) {
  return postJson('/api/plans/generate', { goalText, goalAnalysis })
}
