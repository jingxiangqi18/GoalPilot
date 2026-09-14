import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-agent-workspace-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'agent-workspace-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = [{ id: 13, goalText: '三个月内完成一个可以独立部署的 Java 后端项目', status: 'ACTIVE', createdAt: '2026-09-03T21:30:00' }, { id: 14, goalText: '建立自己的阅读系统', status: 'ACTIVE' }]
const plan = { planId: 77, goalId: 13, status: 'ACTIVE', versionNumber: 1, planTitle: '从项目骨架到独立交付', planSummary: '先跑通核心流程，再逐步完善。每个阶段都留下一份可验证的成果。', createdAt: goals[0].createdAt, stages: ['搭建基础', '业务与认证', '测试与优化', '部署交付'].map((title, index) => ({ stageId: index + 1, title, timeRange: `第 ${index * 3 + 1} 至 ${index * 3 + 3} 周`, objective: '完成可以独立验证的阶段成果。', tasks: ['初始化项目', '实现核心接口', '验证登录流程', '整理部署文档'].map((title, taskIndex) => ({ taskId: index * 4 + taskIndex + 1, title, status: ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'][taskIndex], description: taskIndex === 0 ? '使用 Spring Boot 创建项目，配置数据库连接。' : '实现并保留关键的验证步骤。', completionCriteria: '服务可以在本地运行，健康检查返回成功。' })) })) }
const requests = [], errors = []
let hold, release
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: goals, total: 2, page: 1, totalPages: 1 }
  else if (/^\/api\/goals\/(13|14)$/.test(path)) data = goals.find(goal => goal.id === Number(path.split('/').at(-1)))
  else if (path === '/api/goals/13/active-plan') data = plan
  else if (path === '/api/goals/13/assistant') { if (hold) await hold; data = { reply: '## 从一个能运行的版本开始\n1. 使用 Spring Boot 初始化项目。\n2. 配置数据库，验证健康检查。\n\n**完成标准**：服务能独立启动，保留验证步骤。' } }
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const input = page.getByRole('textbox', { name: '向 GoalPilot 提问' })
const search = page.getByRole('searchbox', { name: '搜索当前阶段任务' })
const questions = () => requests.filter(request => request.path.endsWith('/assistant'))
const settle = () => page.waitForTimeout(350)
async function tools() { await page.locator('.session-tools').getByRole('button', { name: /计划与任务/ }).click(); await page.locator('#plan').waitFor() }
async function askTask(title = '初始化项目') { await page.getByRole('button', { name: '向 Agent 询问：' + title, exact: true }).click(); await input.waitFor() }
async function capture(name) {
  await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('.panel-scroll')?.scrollTo({ top: 0, behavior: 'instant' }) }); await settle()
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184')
  await page.locator('.recent-goal').first().waitFor()
  await capture('agent-home-1600')
  await page.locator('.recent-goal').first().getByRole('button', { name: '查看任务清单' }).click()
  await search.waitFor()
  assert.equal(questions().length, 0)
  await capture('agent-and-todo-1600')
  // Search is local and respects the current status filter, never changes a task.
  const before = requests.length
  await search.fill('spring BOOT')
  assert.equal(await page.locator('.task-card').count(), 1)
  assert.match(await page.locator('.task-title').innerText(), /初始化项目/)
  await page.locator('.task-filters').getByRole('button', { name: /已完成/ }).click()
  assert.match(await page.locator('.task-empty').innerText(), /没有找到匹配/)
  await page.getByRole('button', { name: '查看全部任务' }).click()
  assert.equal(await search.inputValue(), '')
  assert.equal(await page.locator('.task-card').count(), 4)
  assert.equal(requests.length, before)
  await askTask()
  assert.match(await input.inputValue(), /阶段「搭建基础」中的任务「初始化项目」/)
  assert.equal(questions().length, 0)
  assert.equal(await input.evaluate(el => el === document.activeElement), true)
  await capture('task-to-agent-draft')
  // A handoff never silently overwrites existing text, including across goal switches.
  await input.fill('这段文字还没有发送，请保留')
  await tools(); await askTask('实现核心接口')
  assert.equal(await input.inputValue(), '这段文字还没有发送，请保留')
  await page.getByRole('button', { name: '保留原输入，忽略任务问题' }).click()
  assert.equal(await input.inputValue(), '这段文字还没有发送，请保留')
  await tools(); await askTask()
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.goal-card').filter({ hasText: goals[1].goalText }).getByRole('button', { name: '进入会话' }).click()
  assert.equal(await input.inputValue(), '')
  assert.equal(await page.locator('.task-handoff').count(), 0)
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.goal-card').filter({ hasText: goals[0].goalText }).getByRole('button', { name: '进入会话' }).click()
  assert.equal(await input.inputValue(), '这段文字还没有发送，请保留')
  await page.getByRole('button', { name: '使用任务问题', exact: true }).click()
  assert.match(await input.inputValue(), /初始化项目/)
  assert.equal(questions().length, 0)
  // A handoff received while the agent is working waits without replacing the in-flight question.
  const sentText = await input.inputValue()
  hold = new Promise(resolve => { release = resolve })
  await page.getByRole('button', { name: '发送问题', exact: true }).click()
  await page.locator('.assistant-thinking').waitFor()
  await tools(); await askTask('验证登录流程')
  assert.equal(await page.getByRole('button', { name: '使用任务问题', exact: true }).isDisabled(), true)
  assert.equal(await input.inputValue(), sentText)
  release(); hold = null
  await page.locator('.assistant-reply').waitFor()
  assert.equal(questions().length, 1)
  assert.deepEqual(JSON.parse(questions()[0].body), { message: sentText })
  assert.equal(await input.inputValue(), '')
  await page.getByRole('button', { name: '使用任务问题', exact: true }).click()
  assert.match(await input.inputValue(), /验证登录流程/)
  await capture('agent-reply-and-next-task')
  for (const width of [2560, 1600, 1100, 800, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1800 ? 1440 : 1100 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Conversation overflow at ' + width)
    assert.ok(await page.locator('.question-form').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'Agent input remains visible at ' + width)
    await tools(); await settle()
    assert.ok(await page.locator('.session-panel').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Panel overflow at ' + width)
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'Tools scroll internally without blank space below the page at ' + width)
    if ([2560, 390].includes(width)) await capture('todo-tools-' + width)
    await askTask('初始化项目')
    assert.match(await input.inputValue(), /验证登录流程/)
    await page.getByRole('button', { name: '保留原输入，忽略任务问题' }).click()
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await tools(); await search.fill('初始化项目')
  await page.getByRole('button', { name: '向 Agent 询问：初始化项目', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: '使用任务问题', exact: true }).focus(); await page.keyboard.press('Enter')
  assert.match(await input.inputValue(), /初始化项目/)
  assert.ok(parseFloat(await page.locator('.agent-signal').first().evaluate(el => getComputedStyle(el).animationDuration)) < .01)
  assert.equal(questions().length, 1)
  assert.ok(requests.every(request => request.method === 'GET' || request.path.endsWith('/assistant')), 'Manual context handoffs never write tasks')
  assert.deepEqual(errors, [])
  console.log('PASS: Agent-first workspace, local task search, task-to-chat draft, explicit replacement, per-goal isolation, in-flight handoff, exact single-turn payload, keyboard and 320–2560 layouts. Screenshots: ' + artifacts)
} finally { await browser.close() }
