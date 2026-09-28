import { readLocalMinute } from './calendar.js'

export const taskPriorities = [
  { value: 'LOW', label: '低优先级', description: '有空时推进', badge: '↓' },
  { value: 'MEDIUM', label: '中优先级', description: '按计划安排', badge: '＝' },
  { value: 'HIGH', label: '高优先级', description: '优先处理', badge: '↑' },
]

export function emptyTaskDraft(goalId = null) {
  return { title: '', description: '', completionCriteria: '', priority: 'MEDIUM', deadline: '', goalId: goalId || '' }
}

export function taskCreateChanges(draft) {
  const errors = {}, body = { title: draft.title.trim(), priority: draft.priority }
  if (!body.title || draft.title.length > 300) errors.title = '请填写 1–300 字的任务标题。'
  if (draft.description.length > 5000) errors.description = '说明不能超过 5000 字。'
  if (draft.completionCriteria.length > 2000) errors.completionCriteria = '完成标准不能超过 2000 字。'
  if (!taskPriorities.some(option => option.value === draft.priority)) errors.priority = '请选择有效的优先级。'
  if (draft.description) body.description = draft.description
  if (draft.completionCriteria) body.completionCriteria = draft.completionCriteria
  if (draft.deadline) {
    if (!readLocalMinute(draft.deadline)) errors.deadline = '请选择有效的日期与时间。'
    else body.deadline = draft.deadline + ':00'
  }
  if (draft.goalId !== '' && draft.goalId != null) {
    if (!Number.isSafeInteger(draft.goalId) || draft.goalId <= 0) errors.goalId = '请选择要关联的目标。'
    else body.goalId = draft.goalId
  }
  return { body, errors }
}

// New Tasks and existing PlanTasks have independent IDs, even though their URLs
// share /api/tasks. A create receipt must never become a PlanTask status PATCH.
export function isTaskCreateReceipt(task, request) {
  return Number.isSafeInteger(task?.id) && task.id > 0
    && task.title === request.title && task.status === 'TODO'
    && (task.goalId ?? null) === (request.goalId ?? null)
    && task.planTaskId == null && task.completedAt == null
    && task.priority === request.priority
    && (task.description ?? null) === (request.description ?? null)
    && (task.completionCriteria ?? null) === (request.completionCriteria ?? null)
    && (request.deadline ? typeof task.deadline === 'string' && task.deadline.slice(0, 19) === request.deadline : task.deadline == null)
    && typeof task.createdAt === 'string' && !!task.createdAt
}
