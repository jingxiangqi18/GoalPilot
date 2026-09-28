import test from 'node:test'
import assert from 'node:assert/strict'
import { isTaskPage, TASK_PAGE_SIZE } from '../src/utils/taskPage.js'

const task = { id: 1, goalId: null, planTaskId: null, title: '整理笔记', status: 'TODO', priority: 'MEDIUM', createdAt: '2026-09-28T09:15:00' }
const page = { items: [task], page: 1, size: TASK_PAGE_SIZE, total: 21, totalPages: 2 }

test('TaskPage uses exact page/size and server totals; empty pages are valid', () => {
  assert.ok(isTaskPage(page, 1, 20))
  assert.ok(isTaskPage({ ...page, items: [], total: 0, totalPages: 0 }, 1, 20))
  assert.ok(isTaskPage({ ...page, page: 3, items: [] }, 3, 20), 'Out-of-range pages are recovered by the reader')
  for (const overrides of [{ page: 2 }, { page: '1' }, { size: 10 }, { total: -1 }, { total: 1.5 }, { total: '21' }, { totalPages: 1 }, { items: null }, { items: Array(21).fill(task) }]) {
    assert.equal(isTaskPage({ ...page, ...overrides }, 1, 20), false)
  }
})
test('Task list accepts historical states and links, but not PlanTask IDs or duplicate rows', () => {
  for (const status of ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED']) {
    assert.ok(isTaskPage({ ...page, items: [{ ...task, status, goalId: 8, planTaskId: 3, completedAt: '2026-09-28T10:00:00' }] }, 1, 20))
  }
  for (const overrides of [{ id: null, taskId: 1 }, { id: -1 }, { title: ' ' }, { status: 'OTHER' }, { priority: 'URGENT' }, { goalId: '8' }, { planTaskId: 0 }, { description: {} }, { createdAt: '' }]) {
    assert.equal(isTaskPage({ ...page, items: [{ ...task, ...overrides }] }, 1, 20), false)
  }
  assert.equal(isTaskPage({ ...page, items: [task, task] }, 1, 20), false)
  assert.equal(isTaskPage(undefined, 1, 20), false)
})
