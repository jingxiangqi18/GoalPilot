import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-checklist-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'checklist-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goal = { id: 42, goalText: '三个月内完成一个适合找 Java 后端实习的项目', status: 'ACTIVE', createdAt: '2026-09-03T21:30:00' }
const plan = { planId: 24, goalId: 42, status: 'ACTIVE', versionNumber: 1, planTitle: '三个月 Java 后端博客项目开发计划', planSummary: '先跑通核心流程，再逐步完善。每个阶段都有可以验证的成果。', createdAt: goal.createdAt,
  stages: ['项目搭建与基础核心模块', '文章、分类标签与评论功能', '互动与消息功能', '优化完善与交付'].map((title, index) => ({ stageId: index + 1, title, timeRange: `第 ${index * 3 + 1} 至 ${index * 3 + 3} 周`, objective: '完成项目初始化与基础能力建设，确保可运行、可验证。', tasks: ['初始化项目与技术栈集成', '设计数据库与基础模型', '实现用户注册与身份认证', '补齐接口验证'].map((title, taskIndex) => ({ taskId: index * 4 + taskIndex + 1, title, status: ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'][taskIndex], description: '明确输入和输出，逐步实现核心逻辑，记录关键的技术选择。', completionCriteria: '本地运行成功，并保留可复现的验证步骤。' })) })) }
let items = [goal, { ...goal, id: 43, goalText: '建立自己的阅读系统', status: 'NEEDS_CLARIFICATION' }]
let listStatus = 200, patchStatus = 200, holdPatch, release
const requests = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') { status = listStatus; data = { items, total: items.length, page: 1, totalPages: items.length ? 1 : 0 } }
  else if (path === '/api/goals/42') data = goal
  else if (path === '/api/goals/42/active-plan') data = plan
  else if (/^\/api\/tasks\/\d+\/status$/.test(path)) {
    if (holdPatch) await holdPatch
    status = patchStatus
    const task = plan.stages.flatMap(stage => stage.tasks).find(task => task.taskId === Number(path.split('/')[3]))
    if (status === 200) task.status = request.postDataJSON().status
    data = status === 200 ? task : { message: '模拟保存异常' }
  } else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
page.on('pageerror', error => errors.push(error.message))
const settle = () => page.waitForTimeout(350)
const filters = page.locator('.task-filters')
const checks = page.getByRole('checkbox')
const patches = () => requests.filter(item => item.method === 'PATCH')
async function capture(name) { await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('.panel-scroll')?.scrollTo({ top: 0, behavior: 'instant' }) }); await settle(); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function filter(name) { await filters.getByRole('button', { name: new RegExp(name) }).click() }
async function progress(done) { assert.equal(await page.getByRole('progressbar', { name: '任务完成进度' }).getAttribute('aria-valuenow'), String(done)) }
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('.recent-goal').first().waitFor()
  await page.locator('.garden-art img').evaluate(img => img.decode())
  assert.equal(requests.filter(item => item.path.endsWith('active-plan')).length, 0, 'Home must not prefetch every plan')
  for (const width of [2560, 1600, 1320, 1100, 800, 620, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1800 ? 1440 : 1000 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Home overflow at ' + width)
    assert.ok(await page.locator('.writing-card').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Composer overflow at ' + width)
    if ([2560, 1600, 390].includes(width)) await capture('home-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.getByRole('button', { name: '查看任务清单' }).click()
  await page.locator('#plan').waitFor()
  assert.equal(await page.locator('.task-disclosure.open').count(), 0)
  assert.equal(await checks.count(), 4)
  await progress(4)
  for (const width of [2560, 1600, 1100, 800, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1800 ? 1440 : 1000 }); await settle()
    assert.ok(await page.locator('.stage-picker').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'No sideways stage picker scrolling at ' + width)
    if ([2560, 1600, 390].includes(width)) await capture('checklist-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  // Checkbox is controlled by the API response, not an optimistic visual change.
  holdPatch = new Promise(resolve => { release = resolve })
  await checks.nth(0).focus(); await page.keyboard.press('Space')
  await page.locator('.task-status.saving').waitFor()
  assert.equal(await checks.nth(0).getAttribute('aria-checked'), 'false')
  assert.equal(await checks.nth(1).isDisabled(), true)
  await checks.nth(0).dispatchEvent('click'); await progress(4)
  assert.equal(patches().length, 1)
  release(); holdPatch = null
  await page.locator('.execution-notice.success').waitFor()
  await progress(5)
  assert.equal(await checks.nth(0).getAttribute('aria-checked'), 'true')
  assert.equal(patches()[0].body, JSON.stringify({ status: 'DONE' }))
  await checks.nth(0).click(); await page.locator('.execution-notice.success').filter({ hasText: '待开始' }).waitFor(); await progress(4)
  assert.equal(patches()[1].body, JSON.stringify({ status: 'TODO' }))
  // Filtering doesn't change backend order or the task ID used for updates.
  await filter('待办'); assert.equal(await checks.count(), 2)
  await checks.nth(1).focus(); await page.keyboard.press('Space')
  await page.locator('.execution-notice.success').filter({ hasText: '基础模型' }).waitFor()
  assert.equal(patches().at(-1).path, '/api/tasks/2/status')
  await page.waitForFunction(() => document.querySelectorAll('.task-check[role="checkbox"]').length === 1)
  assert.equal(await filters.getByRole('button', { name: /待办/ }).evaluate(el => el === document.activeElement), true)
  await filter('已完成'); assert.equal(await checks.count(), 2)
  await filter('已跳过'); assert.equal(await checks.count(), 1)
  assert.equal(await checks.first().getAttribute('aria-checked'), 'false')
  await progress(5)
  await filter('全部')
  patchStatus = 500
  await checks.first().click()
  await page.locator('.execution-notice.error').waitFor()
  assert.equal(await checks.first().getAttribute('aria-checked'), 'false')
  assert.equal(await checks.first().isDisabled(), true)
  await progress(5)
  patchStatus = 200
  await page.getByRole('button', { name: '重新读取状态' }).click()
  await page.locator('.execution-notice.info').waitFor()
  assert.equal(await checks.first().isDisabled(), false)
  await filter('待办'); await checks.first().click()
  await page.locator('.stage-card .task-empty').waitFor()
  assert.match(await page.locator('.task-empty').innerText(), /没有待办任务/)
  await page.getByRole('button', { name: '查看全部任务' }).click()
  assert.equal(await checks.count(), 4)
  assert.equal(goal.status, 'ACTIVE')
  // Unknown states remain visible and cannot be overwritten by a guessed checkbox value.
  plan.stages[0].tasks[0].status = 'UNKNOWN'
  await page.getByRole('button', { name: '刷新计划', exact: true }).click()
  await page.locator('.task-status').filter({ hasText: '状态待确认' }).waitFor()
  assert.equal(await checks.first().isDisabled(), true)
  await page.getByRole('button', { name: '↗ 路线总览', exact: true }).click()
  assert.match(await page.locator('.progress-legend').innerText(), /待确认\s*1/)
  // Home empty/error states, not fabricated progress cards.
  items = []; await page.goto((process.env.APP_URL || 'http://127.0.0.1:5184') + '/#/new')
  await page.reload(); await page.locator('.recent-empty').waitFor()
  listStatus = 500; await page.reload(); await page.locator('.recent-notice[role="alert"]').waitFor()
  listStatus = 200; await page.getByRole('button', { name: '重新读取', exact: true }).click(); await page.locator('.recent-empty').waitFor()
  assert.deepEqual(errors, [])
  assert.ok(requests.every(item => item.method === 'GET' || /^\/api\/tasks\/\d+\/status$/.test(item.path)))
  console.log('PASS: generated home artwork, 320–2560 layouts, checklist filters, keyboard check/reopen, authoritative progress, duplicate/failure guards, filtered focus, unknown/empty/error states. Screenshots: ' + artifacts)
} finally { await browser.close() }
