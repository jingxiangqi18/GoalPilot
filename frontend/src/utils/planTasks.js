export const taskStatusOptions = [
  { value: 'TODO', label: '待开始', action: '设为待开始', symbol: '○' },
  { value: 'IN_PROGRESS', label: '进行中', action: '开始进行', symbol: '◔' },
  { value: 'DONE', label: '已完成', action: '标记完成', symbol: '✓' },
  { value: 'SKIPPED', label: '已跳过', action: '跳过任务', symbol: '↷' },
]

export function taskStatusLabel(status) {
  return taskStatusOptions.find(option => option.value === status)?.label || '状态待确认'
}

export function taskProgress(tasks) {
  const total = tasks.length
  const done = tasks.filter(task => task.status === 'DONE').length
  const skipped = tasks.filter(task => task.status === 'SKIPPED').length
  return { total, done, skipped, percent: total ? Math.round(done / total * 100) : 0 }
}

export function taskStatusCounts(tasks) {
  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, SKIPPED: 0, UNKNOWN: 0 }
  for (const task of tasks) {
    const key = taskStatusOptions.some(option => option.value === task.status) ? task.status : 'UNKNOWN'
    counts[key]++
  }
  return counts
}

export function replacePlanTask(plan, task) {
  return {
    ...plan,
    stages: plan.stages.map(stage => ({
      ...stage,
      tasks: stage.tasks.map(current => current.taskId === task.taskId ? { ...current, ...task } : current),
    })),
  }
}
