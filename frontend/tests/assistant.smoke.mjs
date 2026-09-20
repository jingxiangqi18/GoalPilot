import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// All APIs (including model requests) are mocked. Never call the real assistant.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-assistant-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'assistant-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = [], requests = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const goal = { id: 13, goalText: '完成一个可以独立部署的 Java 后端项目', status: 'ACTIVE', createdAt: '2026-09-08T09:00:00' }
const otherGoal = { id: 14, goalText: '养成一个长期阅读的习惯', status: 'READY_TO_PLAN', createdAt: goal.createdAt }
const plan = {
  planId: 77, goalId: 13, status: 'ACTIVE', versionNumber: 1, planTitle: '从项目骨架到独立交付', planSummary: '先实现完整的小功能，再完善测试与部署。', createdAt: goal.createdAt,
  stages: [{ stageId: 20, title: '搭建基础', timeRange: '第 1 至 2 周', objective: '项目能独立运行。', tasks: [{ taskId: 101, status: 'TODO', title: '初始化项目', description: '配置并启动服务。', completionCriteria: '本地运行成功。' }] }],
}
const defaultReply = '## 当前正式计划\n**从项目骨架到独立交付 · 版本 1**\n\n1. 搭建基础：完成项目初始化。\n2. 验证交付：补齐测试与部署。\n\n- 已完成：无。\n- 已跳过：文档整理，不计入已完成。'
let response = { status: 200, body: { reply: defaultReply } }, holdNext = null
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData(), headers: request.headers() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: [goal, otherGoal], page: 1, total: 2, totalPages: 1 }
  else if (path === '/api/goals/13') data = goal
  else if (path === '/api/goals/14') data = otherGoal
  else if (path === '/api/goals/13/active-plan') data = plan
  else if (/^\/api\/goals\/(13|14)\/assistant$/.test(path)) {
    const currentResponse = structuredClone(response), gate = holdNext
    holdNext = null
    if (gate) await gate
    if (currentResponse.status === 0) return route.abort('failed')
    status = currentResponse.status
    data = currentResponse.body
  } else if (path === '/api/plans/generate') data = { ...plan, goalId: 14, status: 'DRAFT' }
  else if (path === '/api/plans/77/approve') data = { planStatus: 'ACTIVE', goalStatus: 'ACTIVE', versionNumber: 1, updatedAt: '2026-09-08T09:20:00' }
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: status === 204 ? undefined : JSON.stringify(data) })
})

const input = page.getByRole('textbox', { name: '向 GoalPilot 提问' })
const send = () => page.locator('.question-actions button')
const assistantRequests = () => requests.filter(request => request.path.endsWith('/assistant'))
const count = () => assistantRequests().length
const settle = () => page.waitForTimeout(550)
async function library() {
  const desktop = page.locator('.main-nav').getByRole('button', { name: /我的目标/ })
  await (await desktop.isVisible() ? desktop : page.locator('.mobile-nav').getByRole('button', { name: '目标库' })).click()
  await page.locator('.goal-card').first().waitFor()
}
async function openFromDetail(item = goal) {
  await library()
  await page.locator('.goal-card').filter({ hasText: item.goalText }).getByRole('button', { name: '进入会话', exact: true }).click()
  await input.waitFor()
  await settle()
  assert.equal(await page.locator('#app').evaluate(element => element.inert), false, 'Closing details must restore page interaction')
}
async function ask(message, expected = null) {
  await input.fill(message)
  await send().click()
  if (expected) await page.locator('.assistant-reply').filter({ hasText: expected }).last().waitFor()
  await page.waitForFunction(() => !document.querySelector('#assistant-question')?.disabled || !!document.querySelector('.assistant-error'))
}
async function screenshot(name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await settle()
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}

try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('#goal-input').fill('这是一段尚未提交的目标草稿')
  await library()
  await page.getByRole('button', { name: '查看正式计划', exact: true }).click()
  await page.getByRole('button', { name: '↗ 路线总览', exact: true }).click()
  await page.getByRole('button', { name: /询问目标助手/ }).click()
  await input.waitFor()
  await settle()
  assert.equal(count(), 0, 'Opening the assistant must not spend a model request')
  assert.match(await page.locator('.session-title').innerText(), new RegExp(goal.goalText))
  assert.match(await page.locator('.chat-disclaimer').innerText(), /不会修改计划或任务/)
  assert.match(await page.locator('.chat-disclaimer').innerText(), /不携带上文/)
  await screenshot('assistant-empty-1600')

  await input.fill('   \n  ')
  assert.equal(await send().isDisabled(), true)
  await send().dispatchEvent('click')
  assert.equal(count(), 0)
  await input.fill('')
  await page.getByRole('button', { name: /看清整体安排/ }).click()
  assert.equal(count(), 0, 'Suggestion selection only fills a draft')
  assert.match(await input.inputValue(), /概述当前正式计划/)
  assert.equal(await page.getByRole('button', { name: /查看任务进展/ }).count(), 0, 'Suggestions cannot overwrite a draft')
  await input.fill('当前计划如何安排？')
  await input.press('End')
  await input.press('Enter')
  assert.equal(count(), 0, 'Plain Enter inserts a newline, it does not submit')

  let release
  holdNext = new Promise(resolve => { release = resolve })
  await input.fill('  请概述当前正式计划。  ')
  await send().click()
  await page.locator('.assistant-thinking').waitFor()
  assert.equal(await input.isDisabled(), true)
  await send().dispatchEvent('click')
  assert.equal(count(), 1, 'Repeated submit is locked while pending')
  release()
  await page.locator('.assistant-reply h3').filter({ hasText: '当前正式计划' }).waitFor()
  assert.equal(await input.inputValue(), '')
  assert.equal(await page.locator('.assistant-reply ol li').count(), 2)
  assert.equal(await page.locator('.assistant-reply ul li').count(), 2)
  assert.match(await page.locator('.assistant-reply strong').innerText(), /版本 1/)
  assert.equal(assistantRequests()[0].path, '/api/goals/13/assistant')
  assert.equal(assistantRequests()[0].body, JSON.stringify({ message: '请概述当前正式计划。' }))
  assert.equal(assistantRequests()[0].headers.authorization, 'Bearer assistant-test-only')
  assert.match(assistantRequests()[0].headers['content-type'], /application\/json/)

  response.body.reply = '第一阶段的标准是：**本地运行成功**。\n<img src=x onerror="window.assistantInjected=true">\n[链接](javascript:alert(1))'
  await ask('第一阶段的任务怎样才算完成？', '本地运行成功')
  assert.equal(await page.locator('.assistant-reply img, .assistant-reply script, .assistant-reply a').count(), 0)
  assert.equal(await page.evaluate(() => window.assistantInjected), undefined)
  assert.equal(await page.locator('.question-entry').count(), 2)
  assert.equal(assistantRequests()[1].body, JSON.stringify({ message: '第一阶段的任务怎样才算完成？' }), 'Previous questions and replies are not submitted')
  response.body.reply = defaultReply
  await ask('请分别说明当前任务状态。', '已跳过')
  await screenshot('assistant-answer-1600')

  for (const failure of [
    { status: 400, body: { message: '请求消息不能为空' }, expected: '请求消息不能为空' },
    { status: 502, body: { message: '助手服务暂时不可用' }, expected: '这不代表当前目标没有正式计划' },
    { status: 200, body: { reply: '   ' }, expected: '未返回有效回答' },
    { status: 200, body: { reply: { invalid: true } }, expected: '未返回有效回答' },
    { status: 204, body: null, expected: '未返回有效回答' },
    { status: 500, body: {}, expected: 'HTTP 500' },
    { status: 0, body: null, expected: '无法连接后端服务' },
  ]) {
    response = failure
    const before = count(), previousAnswers = await page.locator('.assistant-reply').count()
    await ask('失败后应保留我的问题')
    await page.getByRole('alert').filter({ hasText: failure.expected }).waitFor()
    assert.equal(await input.inputValue(), '失败后应保留我的问题')
    assert.equal(await send().isDisabled(), false)
    assert.equal(count(), before + 1, 'No automatic retries')
    assert.equal(await page.locator('.assistant-reply').count(), previousAnswers, 'A failed call is not a fabricated answer')
  }
  response = { status: 200, body: { reply: '已恢复，可以继续查询当前正式计划。' } }
  await send().click()
  await page.locator('.assistant-reply').filter({ hasText: '已恢复' }).waitFor()
  assert.equal(await page.locator('.assistant-error').count(), 0)

  // Client-side length guards also work for programmatically supplied values.
  assert.equal(await input.getAttribute('maxlength'), '2000')
  await input.evaluate(element => { element.value = '问'.repeat(2001); element.dispatchEvent(new Event('input', { bubbles: true })) })
  assert.equal(await send().isDisabled(), true)
  const beforeLong = count()
  await send().dispatchEvent('click')
  assert.equal(count(), beforeLong)
  await input.fill('问'.repeat(2000))
  await send().click()
  await page.waitForFunction(() => document.querySelector('#assistant-question')?.value === '')
  assert.equal(JSON.parse(assistantRequests().at(-1).body).message.length, 2000)

  await page.getByRole('button', { name: '计划与任务', exact: false }).first().click()
  await page.locator('.saved-plan-view #plan').waitFor()
  await page.locator('.main-nav').getByRole('button', { name: '规划工作台', exact: true }).click()
  assert.equal(await page.locator('#goal-input').inputValue(), '这是一段尚未提交的目标草稿')

  // Detail entry works before a formal plan exists, without creating one.
  await openFromDetail(otherGoal)
  assert.equal(await page.locator('.assistant-reply').count(), 0)
  response = { status: 200, body: { reply: '当前目标尚无正式计划。可以先在规划工作台生成草稿并确认启用。' } }
  await ask('这个目标目前有正式计划吗？', '尚无正式计划')
  assert.equal(assistantRequests().at(-1).path, '/api/goals/14/assistant')

  for (const status of [403, 404]) {
    response = { status, body: {} }
    await ask('还能访问这个目标吗？')
    await page.getByRole('alert').filter({ hasText: '已不存在或暂时无法访问' }).waitFor()
    assert.equal(await send().isDisabled(), true)
    await page.getByRole('alert').getByRole('button', { name: /返回目标库/ }).click()
    await openFromDetail(otherGoal)
  }

  // A late response cannot leak into the new goal or disable its input.
  response = { status: 200, body: { reply: '这是一条旧目标的迟到回答，不能显示在新目标。' } }
  holdNext = new Promise(resolve => { release = resolve })
  await input.fill('阅读目标有哪些安排？')
  await send().click()
  await page.locator('.assistant-thinking').waitFor()
  await openFromDetail(goal)
  const retainedReplies = await page.locator('.assistant-reply').count()
  response = { status: 200, body: { reply: defaultReply } }
  release()
  await settle()
  assert.equal(await page.locator('.assistant-reply').count(), retainedReplies)
  assert.equal(await input.isDisabled(), false)
  await ask('这个 Java 项目的当前计划是什么？', '版本 1')
  assert.doesNotMatch(await page.locator('.conversation').innerText(), /迟到回答|阅读目标/)

  for (const width of [2560, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1100 })
    await settle()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(overflow, false, `No horizontal page overflow at ${width}px`)
    const bounds = await input.boundingBox()
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `Question input fits at ${width}px`)
    if ([2560, 390].includes(width)) await screenshot('assistant-' + width)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await input.fill('请解释第一阶段的任务。')
  await send().focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('#assistant-question')?.value === '')
  assert.equal(await input.inputValue(), '')
  assert.ok(requests.every(request => request.method === 'GET' || (request.method === 'POST' && request.path.endsWith('/assistant'))), 'Assistant interactions never generate/approve plans or change task status')

  // The workbench entry appears only after a draft is approved, and returns to it.
  await page.setViewportSize({ width: 1600, height: 1100 })
  await library()
  await page.locator('.goal-card').filter({ hasText: otherGoal.goalText }).getByRole('button', { name: '生成计划', exact: true }).click()
  await page.locator('#plan').waitFor()
  assert.equal(await page.locator('.plan-assistant-button').count(), 0)
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.getByRole('button', { name: '↗ 路线总览', exact: true }).click()
  await page.locator('.plan-assistant-button').click()
  await input.waitFor()
  assert.match(await page.locator('.session-title').innerText(), new RegExp(otherGoal.goalText))
  await page.getByRole('button', { name: '计划与任务', exact: false }).first().click()
  await page.locator('#plan').waitFor()
  assert.match(await page.locator('.plan-status').innerText(), /已启用/)
  await page.getByRole('button', { name: '↗ 路线总览', exact: true }).click()
  await page.locator('.plan-assistant-button').click()

  response = { status: 401, body: {} }
  await input.fill('读取当前计划')
  await send().click()
  await page.getByRole('heading', { name: /继续你的旅程/ }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), null)
  assert.equal(await page.locator('.assistant-reply').count(), 0)
  assert.deepEqual(errors, [])
  console.log('Assistant regression passed: single-turn API, safe formatting, errors, isolation, entry points and responsive layout. Screenshots: ' + artifacts)
} finally {
  await browser.close()
}
