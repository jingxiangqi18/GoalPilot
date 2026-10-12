import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = async file => readFile(new URL('../src/' + file, import.meta.url), 'utf8')

test('no persistent operation tutorials or backend-capability footnotes', async () => {
  const removed = {
    TaskDesk: ['receipt-scope', 'page-scope-note', '任务已与账户同步', '勾选完成、查看阶段'],
    TaskDetails: ['read-only-note', '支持新建、查看与编辑资料', '当前不能修改任务归属'],
    GoalComposer: ['save-note', '发送后保存目标并开始', '选择后可以自由修改'],
    GoalAssistantView: ['chat-disclaimer', 'assistant-question-hint', '只读问答'],
    GoalInfoPanel: ['info-note', 'original-note'],
    GoalEditForm: ['goal-edit-help', 'edit-rule'],
    PlanningConversation: ['planning-disclaimer'],
    GoalLibrary: ['filter-note'],
    ClarificationForm: ['可以点击左侧问题', '不确定的地方也可以说明'],
    PlanLaunchPanel: ['计划生成后会自动保存，无需重复填写目标信息'],
  }
  for (const [component, phrases] of Object.entries(removed)) {
    const content = await source(`components/workspace/${component}.vue`)
    const template = content.slice(content.indexOf('<template>'), content.lastIndexOf('</template>'))
    for (const phrase of phrases) assert.ok(!template.includes(phrase), `${component}: ${phrase}`)
  }
})

test('data scope, error feedback and explicit confirmations remain', async () => {
  assert.match(await source('components/workspace/TaskDesk.vue'), /本页关联任务/)
  assert.match(await source('components/workspace/TaskDetails.vue'), /有未保存的修改/)
  assert.match(await source('components/workspace/TaskDetails.vue'), /role="alert"/)
  assert.match(await source('components/workspace/PlanDecisionPanel.vue'), /确定不采用这版草稿/)
})

test('three versioned, local, alpha-capable WebP assets have documented prompts', async () => {
  const component = await source('components/workspace/PixelAccent.vue')
  const record = await source('assets/2026-10-12-decorations.md')
  for (const name of ['pocket-garden', 'flower-kiosk', 'tram-stop']) {
    const file = `goalpilot-pixel-${name}-v1.webp`
    const bytes = await readFile(new URL('../src/assets/' + file, import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    assert.ok(bytes.includes(Buffer.from('ALPH')), `${file} retains alpha`)
    assert.ok(bytes.length < 500_000, `${file} fits its asset budget`)
    assert.ok(component.includes(file))
    assert.ok(record.includes(file))
  }
  for (const attribute of ['alt=""', 'aria-hidden="true"', 'loading="lazy"', 'draggable="false"']) assert.ok(component.includes(attribute))
  assert.match(component, /pointer-events: none/)
})
