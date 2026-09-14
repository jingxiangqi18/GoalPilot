// A task handoff is an editable question, not a tool command or a model request.
const shorten = (value, max) => {
  const chars = Array.from(String(value || '').trim())
  return chars.length > max ? chars.slice(0, max).join('') + '…' : chars.join('')
}

export function buildTaskQuestion(context) {
  if (!context || typeof context.taskTitle !== 'string' || !context.taskTitle.trim()) return ''
  const stage = shorten(context.stageTitle, 200)
  const task = shorten(context.taskTitle, 500)
  return `请根据当前正式计划，帮我理解${stage ? `阶段「${stage}」中的` : ''}任务「${task}」：这项任务要做什么，建议从哪里开始，以及怎样判断已经完成？`
}
