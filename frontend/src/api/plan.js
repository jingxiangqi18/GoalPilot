import { getJson, patchJson, postJson } from './client'
import { readDraftPage } from '../utils/planDraft'

export async function getDraftPlan(goalId) {
  // The backend orders by createdAt/id descending; only the latest draft is needed.
  const query = new URLSearchParams({ goalId, status: 'DRAFT', page: 1, size: 1 })
  return readDraftPage(await getJson(`/api/plans?${query}`), goalId)
}

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

export function updatePlanTaskStatus(taskId, status) {
  return patchJson(`/api/tasks/${encodeURIComponent(taskId)}/status`, { status })
}
