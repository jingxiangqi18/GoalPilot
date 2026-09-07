import test from 'node:test'
import assert from 'node:assert/strict'
import { goalPresentation, goalDate, priorityLabel } from '../src/utils/goalPresentation.js'

test('goal states have readable labels and distinct visual tones', () => {
  assert.equal(goalPresentation('READY_TO_PLAN').label, '待规划')
  assert.equal(goalPresentation('ACTIVE').label, '进行中')
  assert.notEqual(goalPresentation('READY_TO_PLAN').tone, goalPresentation('ACTIVE').tone)
  assert.equal(goalPresentation('COMPLETED').step, 3)
})
test('unknown backend values are not exposed as technical labels', () => {
  assert.equal(goalPresentation('INTERNAL_STATE').label, '状态待确认')
  assert.equal(goalPresentation(null).step, -1)
  assert.equal(priorityLabel('MEDIUM'), '中优先级')
  assert.equal(priorityLabel('INTERNAL_PRIORITY'), '未设置')
  assert.equal(goalDate('not-a-date'), '未记录')
  assert.equal(goalDate(null), '未记录')
})
