import test from 'node:test'
import assert from 'node:assert/strict'
import { readDraftPage } from '../src/utils/planDraft.js'

const draft = { planId: 7, goalId: 2, status: 'DRAFT', planTitle: '已有草稿', versionNumber: null, stages: [{ tasks: [{ taskId: 9 }] }] }
const page = { items: [draft], page: 1, size: 1, total: 1, totalPages: 1 }
test('restores the newest full draft with a nullable version', () => {
  assert.equal(readDraftPage(page, 2), draft)
  assert.equal(readDraftPage({ ...page, total: 3, totalPages: 3 }, 2), draft)
})
test('only a verified empty page means no draft', () => {
  assert.equal(readDraftPage({ ...page, items: [], total: 0, totalPages: 0 }, 2), null)
  for (const value of [null, {}, '', { ...page, items: [] }, { ...page, total: 0 }, { ...page, page: 2 }, { ...page, size: 10 }, { ...page, total: -1 }, { ...page, totalPages: 2 }, { ...page, total: '1' }]) {
    assert.throws(() => readDraftPage(value, 2))
  }
})
test('rejects wrong goal, wrong status, absent identity or incomplete snapshots', () => {
  for (const patch of [{ goalId: 3 }, { status: 'ACTIVE' }, { status: 'REJECTED' }, { planId: null }, { planTitle: '' }, { stages: [] }, { stages: [{ tasks: [] }] }]) {
    assert.throws(() => readDraftPage({ ...page, items: [{ ...draft, ...patch }] }, 2))
  }
})
