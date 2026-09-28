import test from 'node:test'
import assert from 'node:assert/strict'
import { goalEditValues, goalUpdateChanges, isGoalDetails } from '../src/utils/goalUpdate.js'

const draft = { id: 1, goalText: '完成项目', status: 'DRAFT', priority: null, deadline: null }
const active = { ...draft, status: 'ACTIVE', priority: 'MEDIUM', deadline: '2026-12-20T21:30:49.123456' }
const changes = (goal, fields) => goalUpdateChanges(goal, { ...goalEditValues(goal), ...fields })

test('empty changes and surrounding whitespace do not produce PATCH fields', () => {
  assert.deepEqual(changes(draft, {}), { patch: {}, errors: {} })
  assert.deepEqual(changes(draft, { goalText: '  完成项目 \n' }).patch, {})
  assert.deepEqual(changes(active, {}).patch, {}, 'Do not truncate unchanged deadline seconds')
})
test('only changed writable fields are sent; no status, id, or null clearing', () => {
  assert.deepEqual(changes(draft, { goalText: ' 新目标\n分两步 ', priority: 'HIGH', deadline: '2026-12-20T21:30' }).patch,
    { goalText: '新目标\n分两步', priority: 'HIGH', deadline: '2026-12-20T21:30:00' })
  for (const status of ['NEEDS_CLARIFICATION', 'READY_TO_PLAN', 'ACTIVE', 'COMPLETED', 'ARCHIVED']) {
    assert.deepEqual(changes({ ...active, status }, { goalText: '不能修改原文', priority: 'LOW' }), { patch: { priority: 'LOW' }, errors: {} })
  }
})
test('empty and overlong draft descriptions are invalid', () => {
  assert.ok(changes(draft, { goalText: ' \n ' }).errors.goalText)
  assert.ok(changes(draft, { goalText: '目'.repeat(1001) }).errors.goalText)
  assert.ok(!changes(draft, { goalText: '目'.repeat(1000) }).errors.goalText)
})
test('priority and deadline cannot be cleared after being set', () => {
  const result = changes(active, { priority: '', deadline: '' })
  assert.ok(result.errors.priority && result.errors.deadline)
  assert.deepEqual(result.patch, {})
  assert.ok(changes(active, { priority: 'URGENT' }).errors.priority)
})
test('calendar values remain wall-clock strings without timezone conversion', () => {
  for (const date of ['2028-02-29T00:00', '2026-01-01T00:05', '0099-01-01T23:59']) {
    assert.deepEqual(changes(draft, { deadline: date }).patch, { deadline: date + ':00' })
  }
  for (const date of ['2026-02-29T12:00', '2100-02-29T12:00', '2026-04-31T12:00', '0000-01-01T00:00', '2026-12-20T24:00', '2026-12-20T20:60', '2026-13-01T12:00', '2026-12-00T12:00', '2026-12-20', '2026-12-20T12:00Z']) {
    assert.ok(changes(draft, { deadline: date }).errors.deadline, date)
  }
})
test('identity and malformed snapshots cannot be mistaken for a saved goal', () => {
  assert.ok(isGoalDetails(draft, 1))
  assert.ok(isGoalDetails(active, 1))
  for (const data of [null, {}, { ...draft, id: 2 }, { ...draft, goalText: '' }, { ...draft, status: 'UNKNOWN' }, { ...draft, priority: 'NONE' }, { ...draft, deadline: 'invalid' }]) {
    assert.ok(!isGoalDetails(data, 1))
  }
})
