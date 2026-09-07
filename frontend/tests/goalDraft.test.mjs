import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGoalText } from '../src/utils/goalDraft.js'

test('plain descriptions keep the existing API contract', () => {
  assert.equal(buildGoalText('  写一本书  '), '写一本书')
  assert.equal(buildGoalText('', {}), '')
})
test('only filled optional conditions are serialized, in a stable order', () => {
  assert.equal(buildGoalText('完成项目', { success: '可以部署', deadline: ' 三个月内 ', timeBudget: '  ', ignored: '不可提交' }),
    '完成项目\n期待完成时间：三个月内\n怎样算完成：可以部署')
})
test('free-form input is preserved and conditions are never silently truncated', () => {
  assert.equal(buildGoalText('起点\n目标', { timeBudget: '每周 5 小时' }), '起点\n目标\n可投入的时间：每周 5 小时')
  assert.ok(buildGoalText('目'.repeat(995), { deadline: '三个月内' }).length > 1000)
})
