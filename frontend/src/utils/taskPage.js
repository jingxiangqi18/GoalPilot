// GET /api/tasks currently accepts only page and size; filters are page-local.
export const TASK_PAGE_SIZE = 20

export function isTaskRecord(task) {
  return Number.isSafeInteger(task?.id) && task.id > 0
    && typeof task.title === 'string' && !!task.title.trim()
    && ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'].includes(task.status)
    && ['LOW', 'MEDIUM', 'HIGH'].includes(task.priority)
    && [task.goalId, task.planTaskId].every(id => id == null || (Number.isSafeInteger(id) && id > 0))
    && [task.description, task.completionCriteria, task.deadline, task.completedAt].every(value => value == null || typeof value === 'string')
    && typeof task.createdAt === 'string' && !!task.createdAt
}

export function isTaskPage(data, page, size) {
  if (!data || data.page !== page || data.size !== size
    || !Number.isSafeInteger(data.total) || data.total < 0
    || data.totalPages !== Math.ceil(data.total / size)
    || !Array.isArray(data.items) || data.items.length > size
    || data.items.length > data.total) return false
  const ids = new Set()
  return data.items.every(task => {
    if (!isTaskRecord(task) || ids.has(task.id)) return false
    ids.add(task.id)
    return true
  })
}
