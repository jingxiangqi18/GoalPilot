import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyTaskDraft, isTaskCreateReceipt, taskCreateChanges } from '../src/utils/taskDraft.js'

const changes = values => taskCreateChanges({ ...emptyTaskDraft(), ...values })
test('independent Task creation sends no goal, status or PlanTask ID', () => {
  assert.deepEqual(changes({ title: ' 整理演示视频 ' }), { body: { title: '整理演示视频', priority: 'MEDIUM' }, errors: {} })
  assert.equal(emptyTaskDraft(42).goalId, 42)
  assert.equal(emptyTaskDraft().goalId, '')
})
test('task fields follow backend length and enum validation', () => {
  for (const title of ['', '   ', 'a'.repeat(301)]) assert.ok(changes({ title }).errors.title)
  assert.deepEqual(changes({ title: 'a'.repeat(300), description: 'a'.repeat(5000), completionCriteria: 'a'.repeat(2000) }).errors, {})
  assert.ok(changes({ title: '任务', description: 'a'.repeat(5001) }).errors.description)
  assert.ok(changes({ title: '任务', completionCriteria: 'a'.repeat(2001) }).errors.completionCriteria)
  assert.ok(changes({ title: '任务', priority: 'URGENT' }).errors.priority)
  for (const goalId of [-1, 0, 1.5, '42', NaN]) assert.ok(changes({ title: '任务', goalId }).errors.goalId)
})
test('optional fields preserve text and local wall-clock time without timezone conversion', () => {
  assert.deepEqual(changes({ title: '任务', goalId: 42, description: ' 保留\n说明 ', completionCriteria: '可运行', priority: 'HIGH', deadline: '2028-02-29T00:05' }).body,
    { title: '任务', goalId: 42, description: ' 保留\n说明 ', completionCriteria: '可运行', priority: 'HIGH', deadline: '2028-02-29T00:05:00' })
  assert.ok(changes({ title: '任务', deadline: '2026-02-29T12:00' }).errors.deadline)
})
test('only a complete authoritative creation receipt is accepted, never a PlanTask response', () => {
  const request = changes({ title: '任务' }).body
  const receipt = { ...request, id: 1, goalId: null, planTaskId: null, status: 'TODO', createdAt: '2026-09-24T12:00:00' }
  assert.ok(isTaskCreateReceipt(receipt, request))
  for (const overrides of [{ id: null }, { id: -1 }, { title: '别的任务' }, { status: 'DONE' }, { goalId: 2 }, { planTaskId: 1 }, { createdAt: '' }, { completedAt: '2026-09-24T12:00:00' }, { priority: 'LOW' }]) assert.ok(!isTaskCreateReceipt({ ...receipt, ...overrides }, request))
  assert.ok(!isTaskCreateReceipt({ taskId: 1, title: '任务', status: 'TODO' }, request))
})
