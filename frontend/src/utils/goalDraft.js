export const goalDetailFields = [
  { key: 'deadline', label: '期待完成时间', placeholder: '例如：三个月内', suggestions: ['一个月内', '三个月内', '今年内'] },
  { key: 'timeBudget', label: '可投入的时间', placeholder: '例如：每周 5 小时', suggestions: ['每天半小时', '每周 5 小时', '周末为主'] },
  { key: 'success', label: '怎样算完成', placeholder: '例如：能独立部署并演示', suggestions: [] },
]

// The existing API accepts one goalText string, not extra structured fields.
export function buildGoalText(description, details = {}) {
  return [
    String(description || '').trim(),
    ...goalDetailFields.flatMap(field => {
      const value = String(details[field.key] || '').trim()
      return value ? [field.label + '：' + value] : []
    }),
  ].filter(Boolean).join('\n')
}
