// API timestamps without an offset are local wall-clock values. Date-only values
// must also stay local; parsing YYYY-MM-DD directly would make them UTC dates.
export function getDateParts(value) {
  if (value == null || value === '' || (typeof value !== 'string' && !(value instanceof Date))) return null
  const source = typeof value === 'string' ? value.trim() : value
  if (!source) return null
  const dateOnly = typeof source === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(source)
  let date
  if (dateOnly) {
    const [, year, month, day] = dateOnly.map(Number)
    date = new Date(0)
    date.setFullYear(year, month - 1, day)
    date.setHours(0, 0, 0, 0)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  } else {
    date = new Date(source)
  }
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const weekday = `周${'日一二三四五六'[date.getDay()]}`
  return {
    year, month, day, dayPadded: String(day).padStart(2, '0'), time, weekday,
    hasTime: !dateOnly,
    datetime: dateOnly ? source : date.toISOString(),
    fullLabel: `${year}年${month}月${day}日 · ${weekday}${dateOnly ? '' : ` · ${time}`}`,
  }
}

export function formatDateTime(value, { includeYear = false, includeTime = true } = {}) {
  const date = getDateParts(value)
  if (!date) return ''
  return `${includeYear ? `${date.year}年` : ''}${date.month}月${date.day}日${includeTime && date.hasTime ? ` · ${date.time}` : ''}`
}
