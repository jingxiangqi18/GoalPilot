const pad = value => String(value).padStart(2, '0')

export function daysInMonth(year, month) {
  if (year < 1 || year > 9999 || month < 1 || month > 12) return 0
  return [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}

export function readCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  if (day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function calendarKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${pad(month)}-${pad(day)}`
}

// UTC is used ONLY for Gregorian calendar arithmetic (including years 1–99).
// Deadline values remain local wall-clock strings; never serialize via toISOString.
function calendarDate(parts) {
  const date = new Date(0)
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

export function calendarWeekday(key) {
  const parts = readCalendarDate(key)
  return parts ? calendarDate(parts).getUTCDay() : null
}

export function shiftCalendarDay(key, offset) {
  const parts = readCalendarDate(key)
  if (!parts) return null
  const date = calendarDate(parts)
  date.setUTCDate(date.getUTCDate() + offset)
  const year = date.getUTCFullYear()
  return year < 1 || year > 9999 ? null : calendarKey(year, date.getUTCMonth() + 1, date.getUTCDate())
}

export function shiftCalendarMonth(key, offset) {
  const parts = readCalendarDate(key)
  if (!parts) return null
  const monthIndex = (parts.year - 1) * 12 + parts.month - 1 + offset
  if (monthIndex < 0 || monthIndex >= 9999 * 12) return null
  const year = Math.floor(monthIndex / 12) + 1, month = monthIndex % 12 + 1
  return calendarKey(year, month, Math.min(parts.day, daysInMonth(year, month)))
}

export function calendarCells(year, month) {
  if (!daysInMonth(year, month)) return []
  const first = calendarKey(year, month, 1)
  const offset = (calendarWeekday(first) + 6) % 7 // Monday first.
  return Array.from({ length: 42 }, (_, index) => {
    const key = shiftCalendarDay(first, index - offset)
    return key ? { key, ...readCalendarDate(key) } : null
  })
}

export function localToday(date = new Date()) {
  return calendarKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function calendarLabel(key, weekday = false) {
  const date = readCalendarDate(key)
  if (!date) return ''
  return `${date.year}年${date.month}月${date.day}日${weekday ? ` · 周${'日一二三四五六'[calendarWeekday(key)]}` : ''}`
}

export function localMinuteValue(date, hour, minute) {
  if (!readCalendarDate(date) || !/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || Number(hour) > 23 || Number(minute) > 59) return null
  return `${date}T${pad(Number(hour))}:${pad(Number(minute))}`
}

export function readLocalMinute(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = value.slice(0, 10), hour = value.slice(11, 13), minute = value.slice(14, 16)
  return localMinuteValue(date, hour, minute) ? { date, hour, minute, ...readCalendarDate(date) } : null
}
