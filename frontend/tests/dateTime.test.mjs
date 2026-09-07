import test from 'node:test'
import assert from 'node:assert/strict'
import { getDateParts, formatDateTime } from '../src/utils/dateTime.js'
import { goalDate } from '../src/utils/goalPresentation.js'

test('local API timestamps use Chinese dates and a separate clock', () => {
  const date = getDateParts('2026-09-03T21:30:00')
  assert.equal(date.fullLabel, '2026年9月3日 · 周四 · 21:30')
  assert.equal(date.dayPadded, '03')
  assert.equal(date.hasTime, true)
  assert.equal(formatDateTime('2026-09-03T21:30:00'), '9月3日 · 21:30')
  assert.equal(goalDate('2026-09-03T21:30:00', true), '2026年9月3日 · 21:30')
  assert.equal(goalDate('2026-09-03T21:30:00'), '2026年9月3日')
})

test('date-only deadlines stay on the calendar day and never invent a time', () => {
  const date = getDateParts('2026-09-03')
  assert.equal(date.datetime, '2026-09-03')
  assert.equal(date.fullLabel, '2026年9月3日 · 周四')
  assert.equal(date.hasTime, false)
  assert.equal(goalDate('2026-09-03', true), '2026年9月3日')
  assert.equal(getDateParts('2024-02-29').day, 29)
})

test('offset timestamps represent the same instant', () => {
  const date = getDateParts('2026-09-03T21:30:00+08:00')
  assert.equal(date.datetime, '2026-09-03T13:30:00.000Z')
  const local = new Date('2026-09-03T13:30:00Z')
  assert.equal(date.day, local.getDate())
  assert.equal(date.time, `${String(local.getHours()).padStart(2, '0')}:30`)
})

test('missing and invalid dates do not appear as just saved', () => {
  for (const value of [undefined, null, '', '   ', 'not-a-date', '2026-02-29', '2026-09-31', '2026-13-01', 42, {}, new Date('invalid')]) {
    assert.equal(getDateParts(value), null)
    assert.equal(formatDateTime(value), '')
    assert.equal(goalDate(value), '未记录')
  }
})
