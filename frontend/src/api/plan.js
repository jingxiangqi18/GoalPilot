import { postJson } from './client'

export async function generatePlan(goalId) {
  return postJson('/api/plans/generate', { goalId })
}

export async function approvePlan(planId) {
  return postJson(`/api/plans/${encodeURIComponent(planId)}/approve`)
}
