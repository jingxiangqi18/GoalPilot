import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Every API is mocked, including PATCH. No real task or goal is changed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-tasks-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'task-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const requests = []
const goal = { id: 13, goalText: '完成一个可以部署的 Java 后端项目', status: 'READY_TO_PLAN', createdAt: '2026-09-08T09:00:00' }
const otherGoal = { id: 14, goalText: '建立一个长期阅读习惯', status: 'ACTIVE', createdAt: goal.createdAt }
let showOtherGoal = false
const plan = {
  planId: 77, goalId: 13, status: 'DRAFT', versionNumber: null, planTitle: '从项目骨架到独立交付', planSummary: '先实现一个完整的小功能，再逐步完善测试与部署。', createdAt: goal.createdAt,
  stages: ['搭建基础', '验证与交付'].map((title, stageIndex) => ({ stageId: 20 + stageIndex, title, timeRange: stageIndex ? '第 3 至 4 周' : '第 1 至 2 周', objective: '交付一个可独立验证的阶段成果。', tasks: ['整理方案', '完成验证'].map((task, index) => ({ taskId: 100 + stageIndex * 2 + index, title: title + ' · ' + task, status: 'TODO', sortOrder: index + 1, description: '记录输入和输出，完成实现并保留测试过程。', completionCriteria: '本地运行成功，并提供可以复现的验证步骤。' })) })),
}
const otherPlan = { ...structuredClone(plan), planId: 88, goalId: 14, status: 'ACTIVE', versionNumber: 1, planTitle: '另一段独立的阅读旅程' }
let patchStatus = 200, readStatus = 200, malformedResponse = false, commitOnFailure = false, holdPatch = null
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData(), headers: request.headers() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: showOtherGoal ? [goal, otherGoal] : [goal], page: 1, total: showOtherGoal ? 2 : 1, totalPages: 1 }
  else if (path === '/api/goals/13') data = goal
  else if (path === '/api/goals/14') data = otherGoal
  else if (path === '/api/goals/13/active-plan') { status = readStatus; data = status === 200 ? plan : { message: '当前没有可用计划' } }
  else if (path === '/api/goals/14/active-plan') data = otherPlan
  else if (path === '/api/plans/generate') data = plan
  else if (path === '/api/plans/77/approve') { goal.status = 'ACTIVE'; plan.status = 'ACTIVE'; plan.versionNumber = 1; data = { planStatus: 'ACTIVE', goalStatus: 'ACTIVE', versionNumber: 1, updatedAt: '2026-09-08T09:10:00' } }
  else if (/^\/api\/tasks\/\d+\/status$/.test(path)) {
    if (holdPatch) await holdPatch
    status = patchStatus
    const task = plan.stages.flatMap(stage => stage.tasks).find(task => task.taskId === Number(path.split('/')[3]))
    if (status === 200 || commitOnFailure) task.status = request.postDataJSON().status
    data = status === 200 ? { ...task, taskId: malformedResponse ? -1 : task.taskId } : { message: status === 400 ? '请选择合法的任务状态。' : '模拟状态更新异常' }
  } else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const patchCount = () => requests.filter(request => request.method === 'PATCH').length
const taskCard = index => page.locator('.task-card').nth(index)
const choice = (index, name) => taskCard(index).getByRole('button', { name, exact: true })
const settle = () => page.waitForTimeout(450)
async function expand(index = 0) {
  const heading = taskCard(index).locator('.task-heading button')
  if (await heading.getAttribute('aria-expanded') !== 'true') await heading.click()
}
async function stage(index) { await page.getByLabel('选择计划阶段').selectOption(String(index)); await page.locator('.stage-title').filter({ hasText: plan.stages[index].title }).waitFor(); await expand() }
async function choose(index, name) {
  if (await taskCard(index).locator('.task-heading button').getAttribute('aria-expanded') !== 'true') await taskCard(index).locator('.task-heading button').click()
  await choice(index, name).click()
}
async function assertProgress(done) { assert.equal(await page.getByRole('progressbar', { name: '任务完成进度' }).getAttribute('aria-valuenow'), String(done)) }
async function savedPage(goalText = goal.goalText) {
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.getByRole('button', { name: '刷新目标列表' }).click()
  await page.locator('.goal-card').filter({ hasText: goalText }).getByRole('button', { name: '查看正式计划' }).click()
  await page.locator('.saved-plan-view #plan').waitFor()
  await expand()
}
async function reconcile() {
  await page.getByRole('button', { name: '重新读取状态' }).click()
  await page.locator('.execution-notice.info').waitFor()
}
async function screenshot(name) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await settle(); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }

try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.getByRole('button', { name: '生成计划', exact: true }).click()
  await page.locator('#plan').waitFor()
  assert.equal(await page.locator('.task-actions').count(), 0, 'Draft tasks are not editable')
  await page.getByRole('button', { name: '确认并启用计划' }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.locator('.approval-complete').waitFor()
  await expand()
  await choice(0, '开始进行').waitFor()
  await assertProgress(0)

  let release
  holdPatch = new Promise(resolve => { release = resolve })
  await choose(0, '标记完成')
  await page.locator('.task-status.saving').waitFor()
  assert.equal(await choice(0, '标记完成').isDisabled(), true)
  await choice(0, '标记完成').dispatchEvent('click')
  await assertProgress(0)
  assert.equal(patchCount(), 1, 'Repeated clicks while saving cannot write twice')
  await stage(1)
  assert.equal(await choice(0, '开始进行').isDisabled(), true)
  release(); holdPatch = null
  await page.locator('.execution-notice.success').waitFor()
  await assertProgress(1)
  assert.equal(await page.locator('.stage-title').innerText(), '验证与交付', 'Saving must not jump back to stage one')
  const request = requests.find(request => request.method === 'PATCH')
  assert.equal(request.path, '/api/tasks/100/status')
  assert.equal(request.body, JSON.stringify({ status: 'DONE' }))
  assert.equal(request.headers.authorization, 'Bearer task-test-only')
  assert.match(request.headers['content-type'], /application\/json/)

  await choose(0, '跳过任务')
  await page.locator('.execution-notice.success').filter({ hasText: '已跳过' }).waitFor()
  await assertProgress(1)
  assert.match(await page.locator('.execution-progress').innerText(), /1 项已跳过，不计入已完成/)
  await choose(0, '开始进行')
  await page.locator('.execution-notice.success').filter({ hasText: '进行中' }).waitFor()
  await choose(0, '设为待开始')
  await page.locator('.execution-notice.success').filter({ hasText: '待开始' }).waitFor()
  const beforeSame = patchCount()
  await choice(0, '待开始').dispatchEvent('click')
  assert.equal(patchCount(), beforeSame, 'Choosing the current state is a local no-op')
  for (const index of [0, 1]) {
    await stage(index)
    for (const taskIndex of [0, 1]) {
      if (plan.stages[index].tasks[taskIndex].status !== 'DONE') {
        await choose(taskIndex, '标记完成')
        await page.locator('.execution-notice.success').filter({ hasText: plan.stages[index].tasks[taskIndex].title }).waitFor()
      }
    }
  }
  await assertProgress(4)
  assert.equal(goal.status, 'ACTIVE', 'Completing tasks does not complete the goal')
  assert.match(await page.locator('.execution-progress').innerText(), /不会自动更改目标状态/)

  await savedPage()
  await assertProgress(4)
  assert.equal(await page.locator('.approve-button').count(), 0)
  await choose(0, '设为待开始')
  await page.locator('.execution-notice.success').waitFor()
  await assertProgress(3)
  await page.locator('.main-nav').getByRole('button', { name: '规划工作台' }).click()
  await page.locator('.session-tools').getByRole('button', { name: /计划与任务/ }).click()
  await page.locator('#plan').waitFor()
  await assertProgress(3)
  await stage(0)
  assert.match(await taskCard(0).locator('.task-status').innerText(), /待开始/)
  await savedPage()

  // Validation errors preserve state and do not block a corrected choice.
  patchStatus = 400
  await choose(0, '开始进行')
  await page.getByRole('alert').filter({ hasText: '请选择合法' }).waitFor()
  assert.match(await taskCard(0).locator('.task-status').innerText(), /待开始/)
  assert.equal(await choice(0, '开始进行').isDisabled(), false)
  patchStatus = 500; commitOnFailure = true
  await choose(0, '标记完成')
  await page.getByRole('alert').filter({ hasText: '无法确认保存结果' }).waitFor()
  await assertProgress(3)
  assert.equal(await choice(0, '标记完成').isDisabled(), true)
  const beforeRead = patchCount()
  patchStatus = 200; commitOnFailure = false
  await reconcile()
  await assertProgress(4)
  assert.equal(patchCount(), beforeRead, 'Recovery reads must not repeat a PATCH')

  patchStatus = 409
  await choose(0, '设为待开始')
  await page.getByRole('alert').filter({ hasText: '状态已变化' }).waitFor()
  assert.equal(await choice(0, '设为待开始').isDisabled(), true)
  await screenshot('task-conflict')
  goal.status = 'COMPLETED'; patchStatus = 200
  await reconcile()
  assert.equal(await page.locator('.task-actions').count(), 0)
  assert.match(await page.locator('.execution-notice.info').innerText(), /仅供查看/)
  goal.status = 'ACTIVE'
  const activeRead = page.waitForResponse(res => res.url().endsWith('/active-plan'))
  await page.getByRole('button', { name: '刷新计划' }).click(); await activeRead
  await expand()
  await choice(0, '设为待开始').waitFor()

  patchStatus = 404
  await choose(0, '设为待开始')
  await page.getByRole('alert').filter({ hasText: '不存在或当前不可操作' }).waitFor()
  readStatus = 404
  await page.getByRole('button', { name: '重新读取状态' }).click()
  await page.getByRole('alert').filter({ hasText: '已无法读取' }).waitFor()
  assert.equal(await choice(0, '设为待开始').isDisabled(), true)
  readStatus = 200; patchStatus = 200
  await reconcile()
  malformedResponse = true
  await choose(0, '设为待开始')
  await page.getByRole('alert').filter({ hasText: '无法确认保存结果' }).waitFor()
  await assertProgress(4)
  malformedResponse = false
  await reconcile()
  await assertProgress(3)

  for (const width of [2560, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Page overflow at ' + width)
    assert.ok(await taskCard(0).locator('.task-actions').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Task controls overflow at ' + width)
    if ([1440, 390].includes(width)) await screenshot('task-actions-' + width)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await choice(0, '开始进行').focus(); await page.keyboard.press('Enter')
  await page.locator('.execution-notice.success').waitFor()
  assert.match(await taskCard(0).locator('.task-status').innerText(), /进行中/)

  // Late responses from a closed page cannot change another goal's snapshot.
  showOtherGoal = true
  holdPatch = new Promise(resolve => { release = resolve })
  await choose(0, '标记完成')
  await page.locator('.task-status.saving').waitFor()
  await savedPage(otherGoal.goalText)
  release(); holdPatch = null
  await settle()
  assert.equal(await page.locator('#plan h2').innerText(), otherPlan.planTitle)
  await assertProgress(0)
  assert.equal(await page.locator('.execution-notice.success').count(), 0)
  await savedPage()
  await assertProgress(4)

  patchStatus = 401
  await choose(0, '设为待开始')
  await page.locator('.auth-form').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), null)
  assert.deepEqual(errors, [])
  assert.equal(requests.filter(request => request.path === '/api/plans/generate').length, 1)
  assert.ok(requests.filter(request => request.method === 'PATCH').every(request => /^\/api\/tasks\/\d+\/status$/.test(request.path)))
  console.log('PASS: task enum/status PATCH, busy guard, authoritative responses, progress, reopen, cross-view sync, 400/401/404/409/500, malformed response, read recovery, stale response guard, keyboard, 320–2560.\nScreenshots: ' + artifacts)
} finally {
  await browser.close()
}
