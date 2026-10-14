import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// All APIs, including AI generation and plan decisions, are mocked.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-draft-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'draft-query-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = [
  { id: 21, goalText: '完成作品集', status: 'READY_TO_PLAN' },
  { id: 22, goalText: '规律阅读', status: 'ACTIVE' },
  { id: 23, goalText: '学习摄影', status: 'READY_TO_PLAN' },
].map(goal => ({ ...goal, createdAt: '2026-10-14T09:00:00' }))
const snapshot = (goalId, planId = 71) => ({
  planId, goalId, sourceAnalysisId: 61, versionNumber: null, status: 'DRAFT', planTitle: `已保存的路线 ${goalId}`,
  planSummary: '从基础开始，逐步交付一个完整成果。', createdAt: '2026-10-14T09:30:00',
  stages: [{ stageId: 81, sortOrder: 1, title: '搭建基础', objective: '完成最小版本', timeRange: '第一周', tasks: [{ taskId: 91, sortOrder: 1, title: '整理素材', description: '选择可以使用的素材。', completionCriteria: '完成素材目录', status: 'TODO' }] }],
})
const drafts = new Map([[21, snapshot(21)]])
let readStatus = 200, malformed = false, generationMode = 'normal', approvalStatus = 200, nextGate = null
const calls = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), url = new URL(request.url()), path = url.pathname
  const method = request.method(), body = request.postDataJSON()
  calls.push({ path, method, query: Object.fromEntries(url.searchParams), body })
  const send = (data, status = 200) => route.fulfill({ status, json: data })
  if (path === '/api/auth/me') return send({ id: 1, username: 'Jakin', email: 'jakin@example.com' })
  if (path === '/api/goals') return send({ items: goals, page: 1, size: 9, total: 3, totalPages: 1 })
  if (path === '/api/tasks') return send({ items: [], page: 1, size: 20, total: 0, totalPages: 0 })
  if (/^\/api\/goals\/\d+$/.test(path)) return send(goals.find(goal => goal.id === Number(path.split('/').at(-1))))
  if (path.endsWith('/active-plan')) return send({ ...snapshot(Number(path.split('/')[3])), status: 'ACTIVE', versionNumber: 1 })
  if (path === '/api/plans') {
    assert.equal(method, 'GET')
    assert.equal(request.headers().authorization, 'Bearer draft-query-test')
    assert.deepEqual(Object.keys(Object.fromEntries(url.searchParams)).sort(), ['goalId', 'page', 'size', 'status'])
    assert.equal(url.searchParams.get('status'), 'DRAFT')
    assert.equal(url.searchParams.get('page'), '1')
    assert.equal(url.searchParams.get('size'), '1')
    const draft = drafts.get(Number(url.searchParams.get('goalId')))
    const data = { items: draft ? [structuredClone(draft)] : [], page: 1, size: 1, total: draft ? 1 : 0, totalPages: draft ? 1 : 0 }
    if (malformed) data.items = [{ ...snapshot(99), status: 'ACTIVE' }]
    const gate = nextGate; nextGate = null
    if (gate) await gate
    return send(readStatus === 200 ? data : { message: '模拟草稿读取失败' }, readStatus)
  }
  if (path === '/api/plans/generate') {
    assert.deepEqual(Object.keys(body), ['goalId'])
    const draft = snapshot(body.goalId, 700 + body.goalId)
    drafts.set(body.goalId, draft)
    if (generationMode === 'conflict') return send({ message: '当前目标已经存在计划草稿' }, 409)
    if (generationMode === 'lost') return route.abort('connectionfailed')
    return send(draft, 201)
  }
  if (path.endsWith('/reject') || path.endsWith('/approve')) {
    const draft = [...drafts.values()].find(plan => plan.planId === Number(path.split('/')[3]))
    assert.ok(draft, 'Decision targets the recovered plan ID')
    assert.equal(method, 'POST')
    assert.equal(body, null)
    const goal = goals.find(goal => goal.id === draft.goalId)
    drafts.delete(goal.id)
    if (path.endsWith('/reject')) return route.fulfill({ status: 204 })
    goal.status = 'ACTIVE'
    return send(approvalStatus === 200 ? { planStatus: 'ACTIVE', goalStatus: 'ACTIVE', versionNumber: 1 } : { message: '计划状态已变化' }, approvalStatus)
  }
  errors.push('Unexpected API ' + method + ' ' + path)
  return send({}, 500)
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const app = process.env.APP_URL || 'http://127.0.0.1:5184'
const generated = () => calls.filter(call => call.path === '/api/plans/generate').length
const writes = () => calls.filter(call => call.method !== 'GET').length
const tools = () => page.locator('.session-tools').getByRole('button', { name: '计划与任务', exact: false }).click()
const closeTools = () => page.getByRole('button', { name: '关闭工具面板，返回对话' }).click()
const readError = () => page.locator('.planning-dock').getByRole('alert').filter({ hasText: '草稿读取失败' })
const retry = () => page.locator('.planning-dock').getByRole('button', { name: '重新读取草稿' }).click()
async function open(id) {
  const target = `${app}/#/goals/${id}`
  if (page.url() === target) await page.reload()
  else await page.goto(target)
  await page.locator('.goal-session').waitFor()
}
async function openDraft() { await page.getByRole('button', { name: '打开草稿 ↗' }).click(); await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor() }
try {
  await open(21)
  await openDraft()
  assert.equal(generated(), 0)
  assert.equal(writes(), 0, 'Opening a saved draft is read-only')
  assert.equal(await page.locator('.saved-plan-view').count(), 0, 'Drafts do not use the active-plan endpoint')
  assert.equal(await page.locator('button.task-check').count(), 0, 'Draft tasks cannot be marked complete')
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(artifacts, 'restored-draft.png') })
  await page.reload(); await openDraft()
  assert.equal(generated(), 0, 'Refresh restores the server draft without generation')

  await page.getByRole('button', { name: '不采用这版', exact: true }).click()
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  await page.getByRole('button', { name: '重新生成草稿', exact: false }).waitFor()
  assert.equal(generated(), 0, 'Rejecting a restored draft never regenerates automatically')
  await page.reload(); await tools()
  await page.getByRole('heading', { name: '还没有计划草稿' }).waitFor()
  assert.equal(generated(), 0)
  await page.locator('.draft-empty').getByRole('button', { name: '生成计划草稿', exact: false }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(generated(), 1)

  // Query failures and malformed snapshots must not fall through to POST.
  readStatus = 500
  await open(21); await readError().waitFor(); await retry(); await readError().waitFor()
  assert.equal(generated(), 1)
  readStatus = 200; malformed = true
  await retry(); await readError().waitFor()
  assert.equal(generated(), 1)
  malformed = false
  await retry(); await openDraft()
  assert.equal(generated(), 1)
  readStatus = 404
  await page.getByRole('button', { name: '刷新草稿', exact: true }).click()
  await page.locator('.draft-query-error').waitFor()
  assert.equal(await page.getByRole('button', { name: '确认并启用计划', exact: false }).count(), 0)
  assert.equal(generated(), 1, '404 means inaccessible, not a verified empty result')
  readStatus = 200
  await page.getByRole('button', { name: '刷新草稿', exact: true }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()

  // A late read cannot replace a different goal or launch generation after navigation.
  let release
  nextGate = new Promise(resolve => { release = resolve })
  const beforeReads = calls.filter(call => call.path === '/api/plans').length
  await page.evaluate(() => { location.hash = '#/goals/23' })
  await page.waitForFunction(() => !!document.querySelector('.session-loading'))
  while (calls.filter(call => call.path === '/api/plans').length === beforeReads) await page.waitForTimeout(20)
  await page.evaluate(() => { location.hash = '#/goals/22' })
  await page.locator('.session-title h1').filter({ hasText: '规律阅读' }).waitFor()
  release(); await page.waitForTimeout(100)
  assert.equal(await page.locator('.plan-artifact').count(), 0)
  await open(23)
  nextGate = new Promise(resolve => { release = resolve })
  await page.getByRole('button', { name: '生成计划草稿', exact: false }).click()
  await page.getByText('正在读取计划草稿…', { exact: true }).waitFor()
  await page.evaluate(() => { location.hash = '#/goals/22' })
  await page.locator('.session-title h1').filter({ hasText: '规律阅读' }).waitFor()
  release(); await page.waitForTimeout(100)
  assert.equal(generated(), 1, 'Navigating away during the preflight read must cancel generation')

  // Another tab saved the draft between our empty query and POST.
  generationMode = 'conflict'
  await open(23)
  await page.getByRole('button', { name: '生成计划草稿', exact: false }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(generated(), 2, '409 recovers the draft with GET, not a second POST')
  await page.getByRole('button', { name: '不采用这版', exact: true }).click()
  await page.getByRole('button', { name: '确定不采用', exact: true }).click()
  generationMode = 'lost'
  await page.getByRole('button', { name: '重新生成草稿', exact: false }).click()
  await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  assert.equal(generated(), 3, 'A lost creation response recovers the saved plan')

  // Approval conflicts can recover into the official plan, never a stale draft.
  approvalStatus = 409
  await page.getByRole('button', { name: '确认并启用计划', exact: false }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.getByRole('alert').filter({ hasText: '这版草稿的状态已变化' }).waitFor()
  await page.getByRole('button', { name: '刷新草稿', exact: true }).click()
  await page.locator('.saved-plan-view .plan-status').filter({ hasText: '已启用' }).waitFor()
  assert.equal(generated(), 3)
  assert.equal(await page.getByRole('button', { name: '确认并启用计划', exact: false }).count(), 0)
  await closeTools()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).waitFor()
  for (const width of [320, 390, 768, 1600, 2560]) {
    await page.setViewportSize({ width, height: 1000 })
    await open(21); await tools()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `No overflow at ${width}`)
    await page.getByRole('button', { name: '不采用这版', exact: true }).waitFor()
  }
  approvalStatus = 200
  await page.getByRole('button', { name: '确认并启用计划', exact: false }).click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.locator('.approval-complete').waitFor()
  assert.equal(generated(), 3, 'Approving a recovered draft does not regenerate')
  readStatus = 401; goals[2].status = 'READY_TO_PLAN'
  await page.goto(`${app}/#/goals/23`)
  await page.waitForFunction(() => localStorage.getItem('goalpilot.access_token') === null)
  await page.locator('.workspace-shell').waitFor({ state: 'detached' })
  assert.equal(generated(), 3, 'Unauthorized reads cannot trigger a write')
  assert.deepEqual(errors, [])
  console.log('PASS: Draft query contract/auth; reload recovery; empty vs failed/malformed reads; reject/manual regeneration; stale navigation; 409/lost-response recovery; active-plan transition; responsive 320–2560. Artifacts:', artifacts)
} catch (error) {
  console.log('Page:', (await page.locator('body').innerText()).slice(-5000))
  console.log('Recent calls:', calls.slice(-10), 'Errors:', errors)
  throw error
} finally { await browser.close() }
