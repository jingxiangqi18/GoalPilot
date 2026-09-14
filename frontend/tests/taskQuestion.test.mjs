import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTaskQuestion } from '../src/utils/taskQuestion.js'

test('task handoff asks about the current plan with human-readable titles only', () => {
  const text = buildTaskQuestion({ taskId: 314159, stageId: 271828, taskTitle: '  初始化项目  ', stageTitle: '搭建基础' })
  assert.match(text, /当前正式计划/)
  assert.match(text, /阶段「搭建基础」中的任务「初始化项目」/)
  assert.match(text, /怎样判断已经完成/)
  assert.doesNotMatch(text, /314159|271828/)
})

test('missing title produces no draft and a missing stage never fabricates one', () => {
  for (const context of [undefined, null, {}, { taskTitle: ' ' }, { taskTitle: 123 }]) assert.equal(buildTaskQuestion(context), '')
  assert.match(buildTaskQuestion({ taskTitle: '测试部署' }), /任务「测试部署」/)
  assert.doesNotMatch(buildTaskQuestion({ taskTitle: '测试部署' }), /阶段|undefined|null/)
})

test('long and unicode task titles stay inside the 2000-character API input limit', () => {
  const text = buildTaskQuestion({ stageTitle: '🚀'.repeat(800), taskTitle: '🌱'.repeat(1000) })
  assert.ok(text.length <= 2000)
  assert.match(text, /…/)
  assert.equal(text.includes('\uFFFD'), false)
})
