import test from 'node:test'
import assert from 'node:assert/strict'
import { taskEditValues, taskUpdateChanges, isTaskUpdateReceipt } from '../src/utils/taskUpdate.js'

const task = { id: 25, title: '任务', description: ' 原有说明 ', completionCriteria: '可演示', priority: 'MEDIUM', status: 'DONE', goalId: 1, planTaskId: null, deadline: '2028-02-29T00:05:37.123', createdAt: '2026-10-11T10:00:00', updatedAt: '2026-10-11T10:01:00' }
const changes = values => taskUpdateChanges(task, { ...taskEditValues(task), ...values })
test('Task updates contain only changed writable fields, including state but never association', () => {
  assert.deepEqual(changes({}), { patch: {}, errors: {} })
  assert.deepEqual(changes({ title: '  新任务  ', goalId: 8, status: 'TODO', id: 8, planTaskId: 9, completedAt: 'fake' }).patch, { title: '新任务', status: 'TODO' })
  assert.deepEqual(changes({ title: '  任务  ', priority: 'MEDIUM' }).patch, {})
  assert.deepEqual(changes({ description: '', completionCriteria: '  ' }).patch, { description: '', completionCriteria: '' })
  assert.deepEqual(changes({ description: ' 修改后说明 ' }).patch, { description: '修改后说明' })
})
test('Status changes use the Task enum without writing completion timestamps', () => {
  for (const status of ['TODO', 'IN_PROGRESS', 'SKIPPED']) assert.deepEqual(changes({ status }).patch, { status })
  for (const status of ['', null, undefined, 'COMPLETED']) assert.ok(changes({ status }).errors.status)
  assert.deepEqual(changes({ status: 'DONE', completedAt: null }).patch, {})
  assert.ok(isTaskUpdateReceipt({ ...task, status: 'TODO' }, 25, { status: 'TODO' }))
  assert.equal(isTaskUpdateReceipt(task, 25, { status: 'TODO' }), false)
  assert.equal(isTaskUpdateReceipt(task, 25, { status: 'DONE' }), false, 'Completion must come with a server timestamp')
  assert.ok(isTaskUpdateReceipt({ ...task, completedAt: '2026-10-13T09:00:00' }, 25, { status: 'DONE' }))
})
test('Task PATCH enforces lengths, nonblank title and priority enum', () => {
  for (const title of ['', ' \n ', '字'.repeat(301)]) assert.ok(changes({ title }).errors.title)
  assert.deepEqual(changes({ title: '字'.repeat(300), description: '字'.repeat(5000), completionCriteria: '字'.repeat(2000) }).errors, {})
  assert.ok(changes({ description: '字'.repeat(5001) }).errors.description)
  assert.ok(changes({ completionCriteria: '字'.repeat(2001) }).errors.completionCriteria)
  for (const priority of ['', null, 'URGENT']) assert.ok(changes({ priority }).errors.priority)
})
test('Deadline updates stay local, can be cleared, and preserve untouched seconds', () => {
  assert.deepEqual(changes({ title: '别的标题' }).patch, { title: '别的标题' })
  assert.deepEqual(changes({ deadline: '' }).patch, { clearDeadline: true })
  assert.deepEqual(changes({ deadline: '2028-02-29T00:06' }).patch, { deadline: '2028-02-29T00:06:00' })
  assert.deepEqual(taskUpdateChanges({ ...task, deadline: null }, { ...taskEditValues(task), deadline: '' }).patch, {})
  for (const deadline of ['2026-02-29T10:00', '2026-10-11T24:00', '2026-10-11T10:99']) assert.ok(changes({ deadline }).errors.deadline)
})
test('Only an authoritative Task update response confirms the requested values', () => {
  assert.ok(isTaskUpdateReceipt({ ...task, description: '' }, 25, { description: '' }))
  assert.ok(isTaskUpdateReceipt({ ...task, deadline: null }, 25, { clearDeadline: true }))
  assert.ok(isTaskUpdateReceipt({ ...task, deadline: '2028-02-29T00:06:00' }, 25, { deadline: '2028-02-29T00:06:00' }))
  assert.equal(isTaskUpdateReceipt(task, 25, { clearDeadline: true }), false)
  assert.equal(isTaskUpdateReceipt(task, 25, { title: '未保存的标题' }), false)
  for (const overrides of [{ id: 99 }, { id: undefined, taskId: 25 }, { updatedAt: '' }, { status: 'INVALID' }, { title: '' }]) assert.equal(isTaskUpdateReceipt({ ...task, ...overrides }, 25, {}), false)
})
