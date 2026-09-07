import { getJson, postJson } from './client'

export async function getActivePlan(goalId) {
  return getJson(`/api/goals/${encodeURIComponent(goalId)}/active-plan`)
}

export async function generatePlan(goalId) {
  return postJson('/api/plans/generate', { goalId })
}

export async function approvePlan(planId) {
  return postJson(`/api/plans/${encodeURIComponent(planId)}/approve`)
}

export async function rejectPlan(planId) {
  // The endpoint returns 204 with no JSON body.
  return postJson(`/api/plans/${encodeURIComponent(planId)}/reject`)
}
