import { readLocalMinute } from './calendar.js'
import { isTaskRecord } from './taskPage.js'
import { taskPriorities } from './taskDraft.js'

export const taskStatuses = [
  { value: 'TODO', label: '待开始' }, { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'DONE', label: '已完成' }, { value: 'SKIPPED', label: '已跳过' },
]

export function taskEditValues(task) {
  return {
    title: task.title || '', description: task.description || '',
    completionCriteria: task.completionCriteria || '', priority: task.priority, status: task.status,
    // LocalDateTime is not UTC; leave untouched seconds/fractions on the server.
    deadline: task.deadline ? task.deadline.slice(0, 16) : '',
  }
}

export function taskUpdateChanges(task, values) {
  const original = taskEditValues(task), patch = {}, errors = {}
  for (const [key, limit, label] of [['title', 300, '标题'], ['description', 5000, '说明'], ['completionCriteria', 2000, '完成标准']]) {
    const value = values[key]
    if (typeof value !== 'string' || value.length > limit) errors[key] = `${label}不能超过 ${limit} 字。`
    else if (key === 'title' && !value.trim()) errors.title = '任务标题不能为空。'
    else if (value !== original[key] && value.trim() !== original[key]) patch[key] = value.trim()
  }
  if (values.priority !== original.priority) {
    if (!taskPriorities.some(option => option.value === values.priority)) errors.priority = '请选择低、中或高优先级。'
    else patch.priority = values.priority
  }
  if (values.status !== original.status) {
    if (!taskStatuses.some(option => option.value === values.status)) errors.status = '请选择有效的任务状态。'
    else patch.status = values.status
  }
  if (values.deadline !== original.deadline) {
    if (values.deadline === '') patch.clearDeadline = true
    else if (!readLocalMinute(values.deadline)) errors.deadline = '请选择有效的日期和时间。'
    else patch.deadline = values.deadline + ':00'
  }
  return { patch, errors }
}

export function isTaskUpdateReceipt(task, id, patch) {
  if (!isTaskRecord(task) || task.id !== id || typeof task.updatedAt !== 'string' || !task.updatedAt) return false
  if (patch.status === 'DONE' && !readLocalMinute(task.completedAt?.slice(0, 16))) return false
  return Object.entries(patch).every(([key, value]) => {
    if (key === 'clearDeadline') return value === true && task.deadline === null
    if (key === 'deadline') return typeof task.deadline === 'string' && task.deadline.slice(0, 19) === value
    return task[key] === value
  })
}
