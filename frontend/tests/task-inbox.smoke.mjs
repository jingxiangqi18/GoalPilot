import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chooseDateTime } from './helpers/date-picker.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-inbox-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'inbox-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = [1, 2].map(id => ({ id, goalText: id === 1 ? '记录城市与公园之间的风景' : '完成一个可以展示的 Java 项目', status: id === 1 ? 'ACTIVE' : 'DRAFT', createdAt: '2026-09-03T21:30:00' }))
const plan = { planId: 8, goalId: 1, status: 'ACTIVE', planTitle: '从街区走向公园', createdAt: goals[0].createdAt, stages: [{ stageId: 9, title: '发现身边的风景', objective: '走完一段新的路线', timeRange: '第一周', tasks: [{ taskId: 1, title: '记录河流与街区', description: '整理沿途的照片', completionCriteria: '完成一篇记录', status: 'TODO' }] }] }
const requests = [], errors = []
let status = 201, malformed = false, abort = false, hold = null, release, sequence = 0
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  const body = request.postData() ? request.postDataJSON() : null
  requests.push({ path, method: request.method(), body, authorization: request.headers().authorization })
  let data, code = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/auth/login') data = { accessToken: 'second-user', user: { id: 2, username: 'Second', email: 'second@example.com' } }
  else if (path === '/api/goals') data = { items: goals, page: 1, size: 9, total: 2, totalPages: 1 }
  else if (/^\/api\/goals\/\d+$/.test(path)) data = goals.find(goal => goal.id === Number(path.split('/').at(-1)))
  else if (path === '/api/goals/1/active-plan') data = plan
  else if (path.endsWith('/active-plan')) { code = 404; data = { message: '无正式计划' } }
  else if (path.endsWith('/assistant')) data = { reply: '请按任务的完成标准推进。' }
  else if (path === '/api/tasks' && request.method() === 'POST') {
    if (hold) await hold
    if (abort) return route.abort('connectionfailed')
    code = status
    data = code === 201 ? { id: ++sequence, goalId: null, planTaskId: null, description: null, completionCriteria: null, deadline: null, completedAt: null, ...body, status: 'TODO', createdAt: '2026-09-24T12:00:00', updatedAt: '2026-09-24T12:00:00' } : { message: '模拟任务保存失败' }
    if (malformed) data = { taskId: sequence, title: body.title, status: 'TODO' }
  } else if (path === '/api/tasks/1/status' && request.method() === 'PATCH') { plan.stages[0].tasks[0].status = body.status; data = plan.stages[0].tasks[0] }
  else { errors.push('Unexpected API ' + request.method() + ' ' + path); code = 500; data = {} }
  await route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
const desk = () => page.getByRole('region', { name: '同步待办清单' })
const form = () => page.getByRole('form', { name: '新建待办任务' })
const create = () => form().getByRole('button', { name: /保存任务|确认重新提交/ })
const posts = () => requests.filter(request => request.path === '/api/tasks' && request.method === 'POST')
const receipt = title => page.locator('.inbox-task').filter({ hasText: title })
async function start(title) { await desk().getByRole('button', { name: '＋ 记一件事', exact: true }).click(); await form().getByRole('textbox', { name: '任务标题', exact: true }).fill(title) }
async function inbox() { await page.locator('.main-nav').getByRole('button', { name: '待办清单', exact: false }).click(); await desk().waitFor() }
async function saved(title) { await receipt(title).waitFor(); await page.waitForFunction(() => !document.querySelector('.task-create-form')?.checkVisibility()) }
async function shot(name) { await page.waitForTimeout(220); await page.screenshot({ path: join(artifacts, name + '.jpg'), type: 'jpeg', quality: 65, fullPage: true }) }
try {
  await page.goto(root + '/#/new')
  await desk().waitFor()
  await page.getByRole('textbox', { name: '我的目标', exact: true }).fill('这是一段尚未提交的目标描述')
  await start('   '); assert.ok(await create().isDisabled())
  await form().getByRole('textbox', { name: '任务标题', exact: true }).fill('  整理演示视频  ')
  hold = new Promise(resolve => { release = resolve })
  await create().click(); await page.waitForFunction(() => document.querySelector('.task-create-form')?.getAttribute('aria-busy') === 'true')
  await form().dispatchEvent('submit')
  assert.equal(posts().length, 1)
  assert.deepEqual(posts()[0].body, { title: '整理演示视频', priority: 'MEDIUM' })
  assert.equal(posts()[0].authorization, 'Bearer inbox-test')
  assert.equal(await receipt('整理演示视频').count(), 0, 'No optimistic receipt before the server confirms')
  release(); hold = null; await saved('整理演示视频')
  assert.equal(await page.getByRole('textbox', { name: '我的目标', exact: true }).inputValue(), '这是一段尚未提交的目标描述')
  assert.equal(await desk().getByRole('checkbox').count(), 0, 'A new Task must never expose PlanTask completion controls')
  await start('预约一段公园步行')
  await form().getByRole('button', { name: /补充.*说明/ }).click()
  await form().getByRole('combobox', { name: '任务关联目标' }).click()
  await page.getByRole('option').filter({ hasText: goals[0].goalText }).click()
  assert.equal(await form().getByRole('combobox', { name: '任务关联目标' }).getAttribute('data-value'), '1', 'Selecting a goal commits the association')
  await form().getByRole('combobox', { name: '任务优先级' }).click()
  await page.getByRole('option').filter({ hasText: '高优先级' }).click()
  assert.equal(await form().getByRole('combobox', { name: '任务优先级' }).getAttribute('data-value'), 'HIGH', 'Selecting a priority commits it')
  await form().getByRole('textbox', { name: '任务说明', exact: true }).fill('携带相机\n<script>不执行</script>')
  await form().getByRole('textbox', { name: '任务完成标准', exact: true }).fill('完成一次记录')
  await chooseDateTime(page, '2028-02-29T00:05', form().getByRole('button', { name: '任务期待完成时间', exact: true }))
  await shot('task-form-1600')
  await create().click(); await saved('预约一段公园步行')
  assert.deepEqual(posts().at(-1).body, { title: '预约一段公园步行', priority: 'HIGH', goalId: 1, deadline: '2028-02-29T00:05:00', description: '携带相机\n<script>不执行</script>', completionCriteria: '完成一次记录' })
  await receipt('预约一段公园步行').getByRole('button').first().click()
  assert.match(await receipt('预约一段公园步行').innerText(), /2028年/)
  assert.equal(await receipt('预约一段公园步行').locator('script').count(), 0)
  await shot('inbox-and-agent-1600')

  // PlanTask ID 1 and Task ID 1 deliberately collide. Only the former may be patched.
  await desk().getByRole('button', { name: '目标计划', exact: true }).click()
  await desk().locator('.plan-goal-list button').first().click()
  await page.locator('#plan').waitFor()
  await desk().getByRole('checkbox').first().click()
  await page.waitForFunction(() => document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') === '1')
  assert.deepEqual(requests.filter(request => request.method === 'PATCH').map(request => request.body), [{ status: 'DONE' }])
  await desk().getByRole('button', { name: /本次新建/ }).click()
  assert.match(await receipt('整理演示视频').innerText(), /待开始/)
  await desk().getByRole('button', { name: '目标计划', exact: true }).click()
  await page.locator('#plan').waitFor()
  await desk().getByRole('button', { name: /向 Agent 询问/ }).first().click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).waitFor()
  assert.match(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), /记录河流与街区/)
  assert.equal(requests.filter(request => request.path.endsWith('/assistant')).length, 0, 'Task handoff prepares a question without sending it')
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('保留我正在输入的问题')
  await page.locator('.chat-manual-tools').getByRole('button', { name: '＋ 记一件事', exact: true }).click()
  await form().getByRole('textbox', { name: '任务标题', exact: true }).fill('关联目标的临时小事')
  await page.locator('.session-tools').getByRole('button', { name: /Agent 对话/ }).click()
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '保留我正在输入的问题')
  await page.locator('.chat-manual-tools').getByRole('button', { name: '＋ 记一件事', exact: true }).click()
  assert.equal(await form().getByRole('textbox', { name: '任务标题', exact: true }).inputValue(), '关联目标的临时小事')
  hold = new Promise(resolve => { release = resolve })
  await create().click(); await page.waitForFunction(() => document.querySelector('.task-create-form')?.getAttribute('aria-busy') === 'true')
  await page.locator('.recent-goals button').filter({ hasText: goals[1].goalText }).click()
  await page.locator('.session-title h1').filter({ hasText: goals[1].goalText }).waitFor()
  release(); hold = null; await page.waitForTimeout(150)
  assert.equal(posts().at(-1).body.goalId, 1)
  assert.match(await page.locator('.session-title h1').innerText(), /Java/)
  await inbox(); await receipt('关联目标的临时小事').waitFor()

  for (const failure of [400, 403, 404, 500, 'network', 'malformed']) {
    await start('保留输入-' + failure)
    status = typeof failure === 'number' ? failure : 201; abort = failure === 'network'; malformed = failure === 'malformed'
    await create().click(); await form().getByRole('alert').waitFor()
    assert.equal(await form().getByRole('textbox', { name: '任务标题', exact: true }).inputValue(), '保留输入-' + failure)
    const uncertain = failure === 500 || typeof failure === 'string'
    assert.equal(await create().isDisabled(), uncertain)
    if (uncertain) {
      const count = posts().length; await form().dispatchEvent('submit'); assert.equal(posts().length, count)
      await form().getByRole('checkbox', { name: '已核对未保存，允许重新提交' }).check()
    }
    status = 201; abort = false; malformed = false
    await create().click(); await saved('保留输入-' + failure)
  }
  for (const width of [2560, 1600, 1100, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1800 ? 1440 : 960 })
    await start('窄屏草稿')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Viewport overflow ' + width)
    assert.ok(await form().evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Task form overflow ' + width)
    assert.equal(await page.locator('input[type="datetime-local"], select').count(), 0)
    if (width === 390) await shot('inbox-390')
    await form().getByRole('button', { name: '收起新建任务，保留草稿' }).click()
  }
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.reload(); await desk().waitFor()
  assert.equal(await page.locator('.inbox-task').count(), 0, 'A create-only API cannot restore history; never claim an empty server list')
  assert.match(await desk().innerText(), /后端记录仍在/)
  await start('不应泄露给另一账户')
  hold = new Promise(resolve => { release = resolve })
  await create().click(); await page.waitForFunction(() => document.querySelector('.task-create-form')?.getAttribute('aria-busy') === 'true')
  await page.locator('.user-card').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('button', { name: '确认退出', exact: true }).click()
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).waitFor()
  release(); hold = null
  await page.getByRole('textbox', { name: '用户名或邮箱', exact: true }).fill('second@example.com')
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).click(); await desk().waitFor()
  assert.equal(await page.locator('.inbox-task').count(), 0)
  assert.ok(!await page.evaluate(() => Object.values(localStorage).some(value => value.includes('不应泄露'))))
  await start('过期登录任务'); status = 401
  await create().click(); await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('Task inbox passed: create contract, Agent/ToDo dual view, ID isolation, local deadline, uncertain writes, draft retention, logout and 320–2560. Artifacts: ' + artifacts)
} catch (error) { await shot('failure').catch(() => {}); console.error('Task inbox artifacts: ' + artifacts); throw error }
finally { release?.(); await browser.close() }
