import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { calendarCells, calendarLabel, calendarWeekday, daysInMonth, localMinuteValue, localToday, readCalendarDate, readLocalMinute, shiftCalendarDay, shiftCalendarMonth } from '../src/utils/calendar.js'

test('Gregorian calendar validates leap days and supported year boundaries', () => {
  assert.equal(daysInMonth(1900, 2), 28)
  assert.equal(daysInMonth(2000, 2), 29)
  assert.equal(daysInMonth(2028, 2), 29)
  for (const value of ['0000-01-01', '10000-01-01', '2026-02-29', '2026-04-31', '2026-00-12', '2026-13-01', '2026-09-00', '21/09/2026', '2026-9-21']) assert.equal(readCalendarDate(value), null, value)
  for (const value of ['0001-01-01', '0099-12-31', '2000-02-29', '9999-12-31']) assert.ok(readCalendarDate(value), value)
})
test('day and month navigation crosses years, clamps month ends and stops at boundaries', () => {
  assert.equal(shiftCalendarDay('2026-12-31', 1), '2027-01-01')
  assert.equal(shiftCalendarDay('2028-03-01', -1), '2028-02-29')
  assert.equal(shiftCalendarDay('2026-09-21', 7), '2026-09-28')
  assert.equal(shiftCalendarDay('0001-01-01', -1), null)
  assert.equal(shiftCalendarDay('9999-12-31', 1), null)
  assert.equal(shiftCalendarMonth('2026-01-31', 1), '2026-02-28')
  assert.equal(shiftCalendarMonth('2028-03-31', -1), '2028-02-29')
  assert.equal(shiftCalendarMonth('2028-02-29', -12), '2027-02-28')
  assert.equal(shiftCalendarMonth('2026-12-30', 1), '2027-01-30')
  assert.equal(shiftCalendarMonth('0001-01-01', -1), null)
  assert.equal(shiftCalendarMonth('9999-12-31', 1), null)
})
test('six-week calendars begin on Monday with adjacent-month dates, including years 1–99', () => {
  const cells = calendarCells(2026, 9)
  assert.equal(cells.length, 42)
  assert.equal(cells[0].key, '2026-08-31')
  assert.equal(cells.at(-1).key, '2026-10-11')
  assert.equal(calendarWeekday(cells[0].key), 1)
  assert.equal(calendarCells(1, 1)[0].key, '0001-01-01')
  assert.ok(calendarCells(9999, 12).includes(null))
  assert.equal(calendarWeekday('0099-01-01'), 4)
  assert.deepEqual(calendarCells(0, 1), [])
})
test('visible labels are Chinese and deadline strings never undergo a timezone conversion', () => {
  assert.equal(calendarLabel('2026-09-21', true), '2026年9月21日 · 周一')
  assert.equal(calendarLabel('2028-02-29'), '2028年2月29日')
  assert.equal(localToday(new Date(2026, 8, 21, 0, 5)), '2026-09-21')
  assert.equal(localMinuteValue('2027-01-01', '0', '5'), '2027-01-01T00:05')
  assert.equal(localMinuteValue('2028-02-29', '23', '59'), '2028-02-29T23:59')
  assert.equal(readLocalMinute('2027-01-01T00:05').hour, '00')
  assert.equal(readLocalMinute('2027-01-01T00:05').minute, '05')
  for (const [hour, minute] of [['24', '00'], ['23', '60'], ['', '00'], ['00', ''], ['-1', '00'], ['a', '5'], ['003', '5']]) assert.equal(localMinuteValue('2026-09-21', hour, minute), null)
  for (const value of ['2026-02-29T12:00', '2026-09-21T24:00', '2026-09-21T12:00Z', '21/09/2026 12:00', null]) assert.equal(readLocalMinute(value), null)
})
test('UI must not reintroduce native date/time pickers or slash-based date placeholders', () => {
  const root = fileURLToPath(new URL('../src', import.meta.url))
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) inspect(path)
      else if (entry.name.endsWith('.vue')) {
        const source = readFileSync(path, 'utf8')
        assert.doesNotMatch(source, /type\s*=\s*["'](?:date|datetime-local|time)["']/, path)
        assert.doesNotMatch(source, /(?:y{2,4}\/m{1,2}\/d{1,2}|d{1,2}\/m{1,2}\/y{2,4})/i, path)
      }
    }
  }
  inspect(root)
})
