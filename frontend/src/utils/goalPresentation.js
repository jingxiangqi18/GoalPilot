import { formatDateTime } from './dateTime.js'

const states = {
  DRAFT: { label: '草稿', tone: 'slate', chapter: '一个新的起点', hint: '想法已保存，下一步可以开始分析。', step: 0 },
  NEEDS_CLARIFICATION: { label: '待补充', tone: 'rose', chapter: '让方向更清晰', hint: '目标已分析，还有关键信息等待补充。', step: 1 },
  READY_TO_PLAN: { label: '待规划', tone: 'lilac', chapter: '准备好下一步', hint: '信息已经充足，可以生成行动计划。', step: 2 },
  ACTIVE: { label: '进行中', tone: 'blue', chapter: '想法正在发生', hint: '正式计划已启用，打开路线查看阶段与任务。', step: 2 },
  COMPLETED: { label: '已完成', tone: 'sage', chapter: '这一程，已抵达', hint: '目标已完成，回看这段旅程的行动路线。', step: 3 },
  ARCHIVED: { label: '已归档', tone: 'slate', chapter: '留存一段旅程', hint: '目标已归档，仍可查看已保存的信息。', step: 3 },
}

export function goalPresentation(status) {
  return states[status] || { label: '状态待确认', tone: 'slate', chapter: '你的目标手记', hint: '打开详情，查看已保存的目标信息。', step: -1 }
}

export function priorityLabel(priority) {
  return { LOW: '低优先级', MEDIUM: '中优先级', HIGH: '高优先级' }[priority] || '未设置'
}

export function goalDate(value, includeTime = false) {
  return formatDateTime(value, { includeYear: true, includeTime }) || '未记录'
}
