import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Requires a local Playwright installation; every API call is mocked.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-smoke-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'smoke-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const requests = []
let queryStatus = 200
let failClarification = false
let generateStatus = 200, goalReadStatus = 200, delayedGoal = null
let savedGoal = null
const items = [
  { id: 11, goalText: '做一个可以展示的 Java 项目', status: 'DRAFT' },
  { id: 12, goalText: '建立自己的阅读系统', status: 'READY_TO_PLAN' },
  { id: 13, goalText: '规律跑步，完成一次半程马拉松', status: 'ACTIVE' },
].map(goal => ({ ...goal, createdAt: '2026-09-05T10:00:00', priority: 'MEDIUM' }))
const analysis = {
  analysisId: 91, goalId: 42, versionNumber: 1, createdAt: '2026-09-05T10:00:00',
  goalSummary: '完成一个 Java 后端项目，方向为 Agent 服务，使用 Spring Boot 与 MySQL。',
  knownInformation: ['已有一定 Java 基础', '期望产出可部署的项目'], missingInformation: ['时间投入', '项目展示方式'],
  readiness: 'NEEDS_CLARIFICATION',
  clarificationQuestions: [{ questionId: 101, question: '每周可以投入多少小时？' }, { questionId: 102, question: '最终希望怎样展示项目？' }],
}
const plan = {
  planId: 77, goalId: 42, sourceAnalysisId: 92, versionNumber: 1, status: 'DRAFT', createdAt: '2026-09-05T10:00:00',
  planTitle: '从想法到作品：项目实践路线', planSummary: '先明确项目边界，再实现核心功能，最后完成验证与部署。',
  stages: ['明确方向与搭建基础', '实现与验证核心功能'].map((title, index) => ({
    stageId: 20 + index, title, timeRange: index ? '第 3—6 周' : '第 1—2 周', objective: '完成可以独立验证的阶段成果。',
    tasks: [{ taskId: 30 + index, title: '阶段任务 ' + (index + 1), description: '整理方案，逐步实现并记录过程。', completionCriteria: '能够独立运行，并通过测试。', status: index ? 'TODO' : 'DONE' }],
  })),
}
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request()
  const path = new URL(req.url()).pathname
  requests.push({ path, method: req.method(), body: req.postDataJSON() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path.endsWith('/active-plan')) {
    status = queryStatus
    data = status === 200 ? { ...plan, goalId: 13, versionNumber: 3, status: 'ACTIVE' } : { message: status === 404 ? '当前没有正式计划' : '正式计划状态异常' }
  }
  else if (path === '/api/goals' && req.method() === 'GET') {
    const query = new URL(req.url()).searchParams
    const matches = items.filter(item => !query.has('status') || item.status === query.get('status'))
    data = { items: matches, page: Number(query.get('page')), size: Number(query.get('size')), total: matches.length, totalPages: matches.length ? 1 : 0 }
  }
  else if (path === '/api/goals' && req.method() === 'POST') { savedGoal = { id: 42, ...req.postDataJSON(), status: 'DRAFT', createdAt: '2026-09-05T10:00:00' }; items.unshift(savedGoal); data = savedGoal }
  else if (path.endsWith('/analyze')) { await new Promise(resolve => setTimeout(resolve, 250)); data = analysis; if (savedGoal) savedGoal.status = 'NEEDS_CLARIFICATION' }
  else if (path.endsWith('/clarifications')) {
    if (failClarification) { status = 502; data = { message: '模拟补充信息提交失败' }; failClarification = false }
    else { data = { ...analysis, analysisId: 92, readiness: 'READY', clarificationQuestions: [], missingInformation: [] }; if (savedGoal) savedGoal.status = 'READY_TO_PLAN' }
  }
  else if (path === '/api/plans/generate') { status = generateStatus; data = status === 200 ? plan : { message: '模拟计划生成失败' } }
  else if (path === '/api/plans/77/approve') { data = { planStatus: 'ACTIVE', goalStatus: 'ACTIVE', versionNumber: 1 }; plan.status = 'ACTIVE'; savedGoal.status = 'ACTIVE' }
  else if (path.endsWith('/assistant')) data = { reply: '当前正式计划分为两个阶段。先搭建基础，再完成核心功能。' }
  else if (path.startsWith('/api/goals/')) { const id = Number(path.split('/').at(-1)); const gate = id === 11 ? delayedGoal : null; if (gate) await gate; data = items.find(goal => goal.id === id); status = data ? goalReadStatus : 404; if (status !== 200) data = { message: '模拟目标读取失败' } }
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})


const settle = () => page.waitForTimeout(350)
const count = path => requests.filter(request => request.path === path).length
const input = page.getByRole('textbox', { name: '向 GoalPilot 提问' })
const toolsButton = name => page.locator('.session-tools').getByRole('button', { name: new RegExp(name) })
async function library() {
  const desktop = page.locator('.main-nav').getByRole('button', { name: /我的目标/ })
  await (await desktop.isVisible() ? desktop : page.locator('.mobile-nav').getByRole('button', { name: '目标库' })).click()
  await page.locator('.goal-card').first().waitFor()
}
async function open(id) {
  await library()
  await page.locator('.goal-card').filter({ hasText: items.find(goal => goal.id === id).goalText }).getByRole('button', { name: '进入会话' }).click()
  await page.locator('.goal-session').waitFor()
}
async function closeTools() { await page.getByRole('button', { name: '关闭工具面板，返回对话' }).click() }
async function snapshot(name) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await settle(); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function noOverflow(label) {
  const sizes = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  assert.ok(sizes[0] <= sizes[1] + 1, label + ': ' + sizes)
}
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('#goal-input').waitFor()
  await snapshot('new-conversation-1600')
  assert.equal(await page.locator('.journey-nav, .writing-companion').count(), 0, 'New goal starts with a natural-language composer, not a multi-column wizard')
  await page.locator('#goal-input').fill('完成一个可以实际部署的 Java 项目')
  await page.locator('.details-toggle').click()
  await page.locator('#goal-deadline').fill('三个月内')
  await page.locator('#goal-timeBudget').fill('每周 5 小时')
  await page.locator('#goal-success').fill('可以在线演示核心功能')
  await page.locator('.example-grid button').first().click()
  await page.getByRole('button', { name: '保留原文' }).click()
  assert.match(await page.locator('#goal-input').inputValue(), /实际部署/)
  await page.locator('#goal-timeBudget').fill('问'.repeat(180))
  await page.locator('#goal-input').fill('问'.repeat(950))
  assert.equal(await page.locator('.analyze-button').isDisabled(), true)
  await page.locator('#goal-input').fill('完成一个可以实际部署的 Java 项目')
  await page.locator('#goal-timeBudget').fill('每周 5 小时')
  await page.locator('.analyze-button').click()
  await page.locator('.planning-response').getByText(analysis.goalSummary).waitFor()
  assert.match(page.url(), /#\/goals\/42$/)
  assert.equal(await page.locator('.drawer-layer').count(), 0, 'A goal opens as a full page, never the former drawer')
  const created = requests.find(request => request.path === '/api/goals' && request.method === 'POST')
  assert.match(created.body.goalText, /三个月内/)
  assert.match(created.body.goalText, /每周 5 小时/)
  assert.equal(count('/api/goals/42/analyze'), 1)
  await snapshot('planning-conversation-1600')

  await page.locator('#clarification-answer-0').fill('每周可以投入十小时')
  await toolsButton('目标资料').click()
  await page.locator('.goal-info-panel').waitFor()
  assert.match(await page.locator('.goal-info-panel').innerText(), /三个月内/)
  await page.locator('.panel-heading h2').press('Escape')
  assert.equal(await page.locator('#clarification-answer-0').inputValue(), '每周可以投入十小时')
  await page.getByRole('button', { name: '下一题 →' }).click()
  await page.locator('#clarification-answer-1').fill('部署线上服务，并写好演示文档')
  failClarification = true
  await page.getByRole('button', { name: /提交全部回答/ }).click()
  await page.getByRole('alert').filter({ hasText: '模拟补充信息提交失败' }).waitFor()
  assert.equal(await page.locator('#clarification-answer-1').inputValue(), '部署线上服务，并写好演示文档')
  await page.getByRole('button', { name: /提交全部回答/ }).click()
  await page.getByRole('button', { name: '生成计划草稿', exact: false }).waitFor()
  assert.deepEqual(requests.filter(request => request.path.endsWith('/clarifications')).at(-1).body, {
    answers: [{ questionId: 101, answer: '每周可以投入十小时' }, { questionId: 102, answer: '部署线上服务，并写好演示文档' }],
  })
  generateStatus = 502
  await page.getByRole('button', { name: '生成计划草稿', exact: false }).click()
  await page.getByRole('alert').filter({ hasText: '模拟计划生成失败' }).waitFor()
  generateStatus = 200
  await page.getByRole('button', { name: /重试生成计划/ }).click()
  await page.locator('#plan').waitFor()
  assert.equal(await page.locator('.task-actions').count(), 0)
  await snapshot('conversation-and-draft-1600')
  await closeTools()
  await page.getByRole('button', { name: /打开草稿/ }).waitFor()
  const generations = count('/api/plans/generate')
  await library()
  await page.locator('.goal-card').filter({ hasText: savedGoal.goalText }).getByRole('button', { name: '查看计划草稿' }).click()
  await page.locator('#plan').waitFor()
  assert.equal(count('/api/plans/generate'), generations, 'Returning to a draft must not regenerate it')
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.locator('.approval-complete').waitFor()
  await closeTools()
  await input.fill('当前计划有哪些阶段？')
  await page.getByRole('button', { name: '发送问题', exact: true }).click()
  await page.locator('.assistant-reply').filter({ hasText: '两个阶段' }).waitFor()
  await input.fill('尚未发送的问题，应该保留')
  await toolsButton('计划与任务').click()
  await page.locator('#plan').waitFor()
  await closeTools()
  assert.equal(await input.inputValue(), '尚未发送的问题，应该保留')
  assert.equal(await page.locator('.assistant-reply').count(), 1)

  await library()
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('阅读')
  await page.waitForFunction(() => document.querySelectorAll('.goal-card').length === 1)
  assert.equal(await page.locator('.goal-card').count(), 1)
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('')
  await page.getByRole('button', { name: '已归档', exact: true }).click()
  await page.getByRole('button', { name: '清除筛选，查看全部目标 →' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.goal-card').length === 4)
  assert.equal(await page.locator('.goal-card').count(), 4)
  await snapshot('goal-library-1600')
  await page.goBack()
  await input.waitFor()
  assert.match(page.url(), /#\/goals\/42$/)
  assert.equal(await input.inputValue(), '尚未发送的问题，应该保留', 'Browser Back restores the goal-specific draft')
  await page.goForward()
  await page.locator('.library-view').waitFor()

  await open(13)
  assert.equal(await input.inputValue(), '')
  assert.equal(await page.locator('.assistant-reply').count(), 0)
  const reads = count('/api/goals/13/active-plan')
  await toolsButton('计划与任务').click()
  await page.locator('.saved-plan-view #plan').waitFor()
  assert.equal(count('/api/goals/13/active-plan'), reads + 1)
  await closeTools()
  await input.fill('这属于跑步目标的问题')
  await open(42)
  assert.equal(await input.inputValue(), '尚未发送的问题，应该保留')
  assert.equal(await page.locator('.assistant-reply').count(), 1)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await input.waitFor()
  assert.match(page.url(), /#\/goals\/42$/)
  assert.equal(await input.inputValue(), '', 'Refresh reloads the goal but does not invent server-side chat history')
  assert.equal(await page.locator('.assistant-reply').count(), 0)
  assert.equal(count('/api/goals/42/assistant'), 1, 'No automatic requests on revisit or refresh')

  for (const width of [2560, 1600, 1100, 800, 390, 320]) {
    await page.setViewportSize({ width, height: width < 800 ? 850 : 1100 })
    await settle()
    await noOverflow('conversation ' + width)
    const box = await input.boundingBox()
    assert.ok(box && box.y + box.height <= (width < 800 ? 850 : 1100), 'Composer remains in the viewport at ' + width)
    await toolsButton('目标资料').click()
    await noOverflow('tools ' + width)
    if (width <= 1100) {
      assert.equal(await input.isVisible(), false)
      assert.equal(await page.locator('.session-conversation').evaluate(element => element.inert), true)
    } else assert.equal(await input.isVisible(), true)
    await snapshot('goal-session-tools-' + width)
    await closeTools()
    assert.equal(await input.isVisible(), true)
  }

  await page.setViewportSize({ width: 1600, height: 1100 })
  let release
  delayedGoal = new Promise(resolve => { release = resolve })
  await library()
  await page.locator('.goal-card').filter({ hasText: items.find(goal => goal.id === 11).goalText }).getByRole('button', { name: '进入会话' }).click()
  await page.getByRole('heading', { name: '正在打开目标会话' }).waitFor()
  await page.locator('.recent-goals').getByRole('button', { name: items.find(goal => goal.id === 13).goalText }).click()
  await input.waitFor()
  release(); delayedGoal = null
  await settle()
  assert.match(await page.locator('.session-title h1').innerText(), /跑步/)
  await page.goto((process.env.APP_URL || 'http://127.0.0.1:5184') + '/#/goals/404')
  await page.getByRole('alert').filter({ hasText: '不存在或无法访问' }).waitFor()
  assert.equal(await page.locator('#assistant-question').count(), 0)
  goalReadStatus = 500
  await library()
  await page.locator('.goal-card').filter({ hasText: items.find(goal => goal.id === 11).goalText }).getByRole('button', { name: '进入会话' }).click()
  await page.getByRole('alert').filter({ hasText: '模拟目标读取失败' }).waitFor()
  goalReadStatus = 200
  await page.getByRole('button', { name: '重新读取', exact: true }).click()
  await input.waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: conversation-first creation/clarification; manual plan panels; draft reuse; per-goal chat/draft memory; routes/back/forward/reload; stale reads; errors; responsive 320–2560. Screenshots: ' + artifacts)
} finally {
  await browser.close()
}
