export const goalPriorities = ['LOW', 'MEDIUM', 'HIGH']
const goalStatuses = ['DRAFT', 'NEEDS_CLARIFICATION', 'READY_TO_PLAN', 'ACTIVE', 'COMPLETED', 'ARCHIVED']

// LocalDateTime is a wall-clock value, not a UTC instant. Keep it as a string;
// unchanged values must not lose the server's seconds or fractional precision.
export function goalEditValues(goal) {
  return {
    goalText: goal.goalText || '',
    priority: goal.priority || '',
    deadline: goal.deadline ? goal.deadline.slice(0, 16) : '',
  }
}

function validLocalMinute(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day, hour, minute] = match.map(Number)
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] && hour < 24 && minute < 60
}

export function goalUpdateChanges(goal, values) {
  const original = goalEditValues(goal)
  const patch = {}, errors = {}
  if (goal.status === 'DRAFT') {
    const text = values.goalText.trim()
    if (!text) errors.goalText = '请填写目标原文。'
    else if (values.goalText.length > 1000) errors.goalText = '目标原文不能超过 1000 个字符。'
    else if (text !== original.goalText.trim()) patch.goalText = text
  }
  if (values.priority !== original.priority) {
    if (!goalPriorities.includes(values.priority)) errors.priority = '已设置的优先级暂不支持清空，请选择低、中或高。'
    else patch.priority = values.priority
  }
  if (values.deadline !== original.deadline) {
    if (!values.deadline) errors.deadline = '已设置的截止时间暂不支持清空，请选择新的时间。'
    else if (!validLocalMinute(values.deadline)) errors.deadline = '请填写有效的日期和时间。'
    else patch.deadline = `${values.deadline}:00`
  }
  return { patch, errors }
}

export function isGoalDetails(data, goalId) {
  return data?.id === goalId && typeof data.goalText === 'string' && !!data.goalText.trim()
    && goalStatuses.includes(data.status)
    && (data.priority == null || goalPriorities.includes(data.priority))
    && (data.deadline == null || (typeof data.deadline === 'string' && validLocalMinute(data.deadline.slice(0, 16))))
}
