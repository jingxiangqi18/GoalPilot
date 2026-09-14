import test from 'node:test'
import assert from 'node:assert/strict'
import { taskStatusOptions, taskStatusLabel, taskProgress, taskStatusCounts, replacePlanTask } from '../src/utils/planTasks.js'

test('task controls match the backend enum without leaking technical labels', () => {
  assert.deepEqual(taskStatusOptions.map(option => option.value), ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'])
  assert.equal(taskStatusLabel('IN_PROGRESS'), '进行中')
  assert.equal(taskStatusLabel('INTERNAL_STATUS'), '状态待确认')
})

test('only DONE counts as completed; skipped and unknown statuses remain in the total', () => {
  assert.deepEqual(taskProgress([]), { total: 0, done: 0, skipped: 0, percent: 0 })
  assert.deepEqual(taskProgress(['DONE', 'SKIPPED', 'IN_PROGRESS', 'TODO', 'UNKNOWN'].map(status => ({ status }))), { total: 5, done: 1, skipped: 1, percent: 20 })
})

test('server task response replaces only its task, not the plan status or timestamp', () => {
  const plan = { planId: 1, status: 'ACTIVE', updatedAt: '2026-09-03T21:30:00', stages: [{ tasks: [{ taskId: 10, status: 'TODO', title: '任务 A' }, { taskId: 11, status: 'DONE' }] }] }
  const updated = replacePlanTask(plan, { taskId: 10, status: 'DONE', title: '任务 A · 已核对' })
  assert.equal(updated.stages[0].tasks[0].status, 'DONE')
  assert.equal(updated.stages[0].tasks[0].title, '任务 A · 已核对')
  assert.equal(plan.stages[0].tasks[0].status, 'TODO')
  assert.equal(updated.stages[0].tasks[1], plan.stages[0].tasks[1])
  assert.equal(updated.status, 'ACTIVE')
  assert.equal(updated.updatedAt, plan.updatedAt)
})

test('status overview counts each task exactly once, including unknown states', () => {
  assert.deepEqual(taskStatusCounts([]), { TODO: 0, IN_PROGRESS: 0, DONE: 0, SKIPPED: 0, UNKNOWN: 0 })
  const tasks = ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED', 'DONE', 'OTHER', undefined].map(status => ({ status }))
  const counts = taskStatusCounts(tasks)
  assert.deepEqual(counts, { TODO: 1, IN_PROGRESS: 1, DONE: 2, SKIPPED: 1, UNKNOWN: 2 })
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count), tasks.length)
})
