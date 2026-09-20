import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// State-changing APIs are mocked. No real plan is approved or rejected.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-decisions-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'decision-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const requests = []
const goal = { id: 12, goalText: '完成一个能够独立部署的 Java 后端项目', status: 'READY_TO_PLAN', createdAt: '2026-09-07T10:00:00' }
let planId = 76
let planStatus = 'DRAFT'
let rejectionStatus = 204
let approvalStatus = 200
let generationStatus = 201
let pendingReject = null
const plan = () => ({
  planId, goalId: goal.id, sourceAnalysisId: 91, versionNumber: planStatus === 'ACTIVE' ? 1 : null,
  status: planStatus, planTitle: '把想法变成一件拿得出手的作品', createdAt: '2026-09-07T10:00:00',
  planSummary: '从一个小而完整的需求出发，逐步完成核心功能、验证与部署。给每一步留下明确的交付物。',
  stages: [
    { stageId: 21, title: '明确边界，建立基础', timeRange: '第 1—2 周', objective: '交付可运行的项目骨架。', tasks: [{ taskId: 31, title: '梳理核心需求', description: '记录最小功能清单，搭建项目结构。', completionCriteria: '本地能够运行并执行测试。', status: 'TODO' }] },
    { stageId: 22, title: '实现功能，完成部署', timeRange: '第 3—6 周', objective: '交付可以演示的完整作品。', tasks: [{ taskId: 32, title: '验证与部署', description: '补齐异常流程，整理部署步骤。', completionCriteria: '按文档可以重复部署。', status: 'TODO' }] },
  ],
})
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData(), headers: request.headers() })
  let status = 200, data
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: [goal], page: 1, total: 1, totalPages: 1 }
  else if (path === '/api/goals/12') data = goal
  else if (path === '/api/plans/generate') {
    status = generationStatus
    if (status === 201) { planId++; planStatus = 'DRAFT'; data = plan() }
    else data = { message: '模拟生成失败，请稍后再试。' }
  } else if (path.endsWith('/reject')) {
    if (pendingReject) await pendingReject
    status = rejectionStatus
    if (status === 204) {
      planStatus = 'REJECTED'
      return route.fulfill({ status: 204 })
    }
    data = { message: status === 409 ? '计划状态已变化' : status === 404 ? '该计划不存在' : '模拟拒绝失败，请重试。' }
  } else if (path.endsWith('/approve')) {
    status = approvalStatus
    if (status === 200) { goal.status = 'ACTIVE'; planStatus = 'ACTIVE'; data = { planStatus, goalStatus: goal.status, versionNumber: 1 } }
    else data = { message: '更新状态失败' }
  } else if (path.endsWith('/active-plan')) data = plan()
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const count = suffix => requests.filter(request => request.path.endsWith(suffix)).length
const settle = () => page.waitForTimeout(400)
async function screenshot(name, selector = '.plan-decision') {
  await settle()
  await page.locator(selector).screenshot({ path: join(artifacts, name + '.png') })
}
async function openLibrary() {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.card-open').waitFor()
}
async function generateFromLibrary() {
  await openLibrary()
  await page.getByRole('button', { name: '刷新目标列表' }).click()
  await page.getByRole('button', { name: '生成计划', exact: true }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
}
async function chooseReject() {
  await page.getByRole('button', { name: '不采用这版', exact: true }).click()
  await page.getByRole('button', { name: '确定不采用', exact: true }).waitFor()
  await settle()
}

try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('#goal-input').waitFor()
  await generateFromLibrary()
  await openLibrary()
  await page.getByRole('button', { name: '查看计划草稿' }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(count('/generate'), 1, 'Reopening the session draft must not generate another plan')
  await screenshot('decision-default')
  await page.getByRole('button', { name: '↗ 路线总览', exact: true }).click()
  await screenshot('plan-overview', '.plan-summary')
  await page.getByRole('button', { name: '☷ 任务清单', exact: true }).click()
  assert.equal(count('/generate'), 1)
  await chooseReject()
  assert.equal(count('/reject'), 0, 'Opening confirmation must not write')
  assert.equal(await page.getByRole('button', { name: '保留这版' }).evaluate(el => document.activeElement === el), true)
  await screenshot('decision-confirm')
  for (const width of [2560, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Page overflow at ' + width)
    assert.ok(await page.locator('.plan-decision').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Decision overflow at ' + width)
    if (width === 390) await screenshot('decision-confirm-390')
  }
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(count('/reject'), 0)
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '暂不启用' }).click()
  assert.equal(count('/approve'), 0)

  // Transient errors preserve the draft and allow explicit retry.
  await chooseReject()
  rejectionStatus = 500
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '模拟拒绝失败' }).waitFor()
  assert.equal(planStatus, 'DRAFT')
  assert.equal(count('/generate'), 1)
  rejectionStatus = 204
  let releaseReject
  pendingReject = new Promise(resolve => { releaseReject = resolve })
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  await page.getByRole('button', { name: '正在保存…', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '正在保存…', exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: '保留这版', exact: true }).isDisabled(), true)
  await page.keyboard.press('Enter')
  releaseReject(); pendingReject = null
  await page.getByRole('heading', { name: '这版草稿未采用，目标仍然保留' }).waitFor()
  assert.equal(count('/reject'), 2, 'Busy confirmation must not submit twice')
  assert.equal(goal.status, 'READY_TO_PLAN')
  assert.equal(count('/generate'), 1, 'Rejection must not regenerate automatically')
  assert.equal(await page.getByRole('button', { name: '确认并启用计划' }).count(), 0)
  const rejectedRequest = requests.filter(request => request.path.endsWith('/reject')).at(-1)
  assert.equal(rejectedRequest.method, 'POST')
  assert.equal(rejectedRequest.path, '/api/plans/77/reject')
  assert.equal(rejectedRequest.body, null)
  assert.equal(rejectedRequest.headers.authorization, 'Bearer decision-test-only')
  await screenshot('decision-rejected-320')

  generationStatus = 502
  await page.getByRole('button', { name: '重新生成草稿' }).click()
  await page.getByRole('alert').filter({ hasText: '模拟生成失败' }).waitFor()
  assert.equal(planStatus, 'REJECTED')
  assert.equal(await page.locator('.plan-status').innerText(), '未采用')
  generationStatus = 201
  await page.getByRole('button', { name: '重新生成草稿' }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(planId, 78)
  assert.equal(requests.filter(request => request.path.endsWith('/generate')).at(-1).body, JSON.stringify({ goalId: 12 }))
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.locator('.approval-complete').waitFor()
  assert.equal(goal.status, 'ACTIVE')
  assert.equal(await page.getByRole('button', { name: '不采用这版', exact: true }).count(), 0)
  assert.equal(requests.filter(request => request.path.endsWith('/approve')).at(-1).path, '/api/plans/78/approve')
  await page.setViewportSize({ width: 1600, height: 1000 })
  await screenshot('decision-active')

  // Failed compare-and-set writes cannot be treated as successful decisions.
  goal.status = 'READY_TO_PLAN'
  await generateFromLibrary()
  rejectionStatus = 409
  await chooseReject()
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '这版草稿的状态已变化' }).waitFor()
  assert.equal(planStatus, 'DRAFT')
  assert.equal(await page.locator('.plan-status').innerText(), '状态待核对')
  assert.equal(await page.getByRole('button', { name: '不采用这版', exact: true }).count(), 0)
  assert.equal(await page.getByRole('button', { name: '确认并启用计划' }).count(), 0)
  await screenshot('decision-conflict')
  await page.getByRole('button', { name: '查看目标最新状态' }).click()
  await page.locator('.card-open').waitFor()
  await generateFromLibrary()
  approvalStatus = 409
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.getByRole('alert').filter({ hasText: '这版草稿的状态已变化' }).waitFor()
  assert.equal(await page.locator('.approval-complete').count(), 0)
  await generateFromLibrary()
  rejectionStatus = 404
  await chooseReject()
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '这版草稿已无法读取' }).waitFor()
  assert.equal(await page.getByRole('button', { name: '不采用这版', exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS: reject confirmation/cancel/Escape; exact POST with 204; busy lock; 500 retry; retained goal; manual regeneration/retry/new plan; approval; rejection and approval 409; 404; responsive 320–2560.')
  console.log('Decision screenshots:', artifacts)
} catch (error) {
  console.log('Page:', (await page.locator('body').innerText()).slice(-4000))
  console.log('Errors:', errors)
  throw error
} finally { await browser.close() }
