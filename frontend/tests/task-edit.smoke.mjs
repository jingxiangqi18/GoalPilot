import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chooseDateTime } from './helpers/date-picker.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-task-edit-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'task-edit-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = [1, 2].map(id => ({ id, goalText: '目标 ' + id, status: 'ACTIVE', createdAt: '2026-10-11T10:00:00' }))
const tasks = Array.from({ length: 25 }, (_, index) => ({ id: 25 - index, goalId: index % 2 ? 2 : 1, planTaskId: null, title: '保存的任务 ' + (25 - index),
  description: ' 原始说明 ', completionCriteria: '原始标准', priority: 'MEDIUM', deadline: '2028-02-29T00:05:37.123', status: index ? 'TODO' : 'DONE',
  completedAt: index ? null : '2026-10-11T10:00:00', createdAt: '2026-10-11T09:00:00', updatedAt: '2026-10-11T10:00:00' }))
const requests = [], errors = []
let failure = 0, readFailure = 0, malformed = false, abort = false, applyOnFailure = false, patchHold, releasePatch, holdNextRead = false, releaseRead
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method()
  const body = req.postData() ? req.postDataJSON() : null
  requests.push({ path, method, body, authorization: req.headers().authorization })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/auth/login') data = { accessToken: 'second-user', user: { id: 2, username: 'Second', email: 'second@example.com' } }
  else if (path === '/api/goals') data = { items: goals, page: 1, size: 9, total: 2, totalPages: 1 }
  else if (/^\/api\/goals\/\d+$/.test(path)) data = goals.find(goal => goal.id === Number(path.split('/').at(-1)))
  else if (path === '/api/tasks' && method === 'GET') {
    const page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'))
    const source = req.headers().authorization === 'Bearer second-user' ? [] : tasks
    data = structuredClone({ items: source.slice((page - 1) * size, page * size), page, size, total: source.length, totalPages: Math.ceil(source.length / size) })
    if (readFailure) { status = readFailure; data = { message: '模拟读取失败' } }
    if (holdNextRead) { holdNextRead = false; await new Promise(resolve => { releaseRead = resolve }) }
  } else if (/^\/api\/tasks\/\d+$/.test(path) && method === 'PATCH') {
    const task = tasks.find(item => item.id === Number(path.split('/').at(-1)))
    if (patchHold) await patchHold
    if (applyOnFailure || (!failure && !abort && !malformed)) {
      for (const [key, value] of Object.entries(body)) {
        if (key === 'clearDeadline') task.deadline = null
        else task[key] = ['title', 'description', 'completionCriteria'].includes(key) ? value.trim() : value
      }
      task.updatedAt = '2026-10-11T11:45:20'
    }
    if (abort) return route.abort('connectionfailed')
    status = failure || 200
    data = status !== 200 ? { message: '模拟更新失败' } : malformed ? { taskId: task.id, title: body.title, status: 'TODO' } : task
  } else { errors.push('Unexpected API ' + method + ' ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
const desk = () => page.getByRole('region', { name: '同步待办清单' })
const form = () => page.getByRole('form', { name: '编辑任务资料' })
const title = () => form().getByRole('textbox', { name: '修改任务标题' })
const save = () => form().getByRole('button', { name: '保存修改', exact: true })
const row = id => page.locator('.task-receipt-title[data-task-id="' + id + '"]')
const patches = () => requests.filter(request => request.method === 'PATCH')
async function open(id) { await row(id).click(); await form().waitFor() }
async function saved() { await form().getByRole('status').filter({ hasText: '任务修改已保存' }).waitFor() }
async function verify() { await form().getByRole('button', { name: '刷新列表核对' }).click(); await form().getByRole('status').filter({ hasText: '已读取这项任务' }).waitFor() }
async function reset() { await form().getByRole('button', { name: '撤销修改' }).click() }
async function shot(name) { await page.screenshot({ path: join(artifacts, name + '.jpg'), type: 'jpeg', quality: 65, fullPage: true }) }
try {
  await page.goto(root + '/#/tasks'); await open(25)
  await page.locator('.task-inspector .detail-art').evaluate(img => img.decode())
  assert.equal(await page.locator('.task-inspector .detail-art').getAttribute('aria-hidden'), 'true')
  assert.equal(await page.locator('.read-only-note, .receipt-scope').count(), 0)
  assert.ok(await save().isDisabled())
  assert.equal(await title().inputValue(), '保存的任务 25')
  assert.equal(await form().locator('select, input[type="datetime-local"], input[type="date"]').count(), 0)
  assert.equal(await form().getByRole('combobox').count(), 1, 'Task ownership and status are not editable')
  await title().fill('   '); assert.ok(await save().isDisabled()); await reset()
  await title().fill('只是未保存的草稿'); await page.getByRole('button', { name: '关闭任务详情' }).click(); await open(25)
  assert.equal(await title().inputValue(), '只是未保存的草稿')
  await page.locator('.main-nav').getByRole('button', { name: '规划工作台', exact: true }).click()
  await page.locator('#goal-input').fill('Agent 草稿仍然保留')
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click(); await open(25)
  assert.equal(await title().inputValue(), '只是未保存的草稿'); await reset()
  assert.equal(patches().length, 0, 'Opening, editing and reverting never auto-save')

  await title().fill('  更新后的标题  ')
  patchHold = new Promise(resolve => { releasePatch = resolve })
  await save().click(); await page.waitForFunction(() => document.querySelector('.task-edit-form')?.getAttribute('aria-busy') === 'true')
  await form().dispatchEvent('submit'); assert.equal(patches().length, 1)
  assert.deepEqual(patches()[0], { path: '/api/tasks/25', method: 'PATCH', body: { title: '更新后的标题' }, authorization: 'Bearer task-edit-test' })
  assert.match(await row(25).innerText(), /保存的任务 25/, 'No optimistic list update')
  await row(24).click(); await title().fill('另一项的未保存内容')
  releasePatch(); patchHold = null; await page.waitForFunction(() => document.querySelector('[data-task-id="25"]')?.textContent.includes('更新后的标题'))
  assert.equal(await title().inputValue(), '另一项的未保存内容', 'Late success cannot overwrite another task draft')
  await row(25).click(); assert.equal(await title().inputValue(), '更新后的标题')
  assert.equal(tasks[0].deadline, '2028-02-29T00:05:37.123', 'Unchanged seconds survive a title-only update')
  assert.equal(tasks[0].status, 'DONE')

  await form().getByRole('textbox', { name: '修改任务说明' }).fill('  说明\n<script>不执行</script>  ')
  await form().getByRole('textbox', { name: '修改完成标准' }).fill('  新标准  ')
  await form().getByRole('combobox', { name: '编辑任务优先级' }).click(); await page.getByRole('option').filter({ hasText: '高优先级' }).click()
  await chooseDateTime(page, '2028-03-01T00:06', form().getByRole('button', { name: /^编辑任务期待完成时间/ }))
  await save().click(); await saved()
  assert.deepEqual(patches().at(-1).body, { description: '说明\n<script>不执行</script>', completionCriteria: '新标准', priority: 'HIGH', deadline: '2028-03-01T00:06:00' })
  assert.equal(await form().getByRole('textbox', { name: '修改任务说明' }).inputValue(), '说明\n<script>不执行</script>')
  assert.equal(await form().locator('script').count(), 0)
  await form().getByRole('button', { name: /^编辑任务期待完成时间/ }).click()
  await page.getByRole('dialog', { name: '选择日期与时间' }).getByRole('button', { name: '暂不设置', exact: true }).click()
  await form().getByRole('textbox', { name: '修改任务说明' }).fill('')
  await form().getByRole('textbox', { name: '修改完成标准' }).fill('  ')
  assert.match(await form().innerText(), /保存后将清除原定时间/)
  await save().click(); await saved()
  assert.deepEqual(patches().at(-1).body, { description: '', completionCriteria: '', clearDeadline: true })
  assert.equal(tasks[0].deadline, null)

  // An older GET cannot undo a later authoritative PATCH response.
  holdNextRead = true; await desk().getByRole('button', { name: '刷新任务列表' }).click(); await desk().locator('.list-loading').waitFor()
  await title().fill('更新不被旧列表覆盖'); await save().click(); await saved()
  releaseRead(); releaseRead = null; await page.waitForTimeout(150)
  assert.match(await row(25).innerText(), /更新不被旧列表覆盖/)

  for (const cause of [400, 403, 404, 409, 500, 'network', 'malformed']) {
    await title().fill('待保存-' + cause)
    failure = typeof cause === 'number' ? cause : 0; abort = cause === 'network'; malformed = cause === 'malformed'
    await save().click(); await form().getByRole('alert').waitFor()
    assert.equal(await title().inputValue(), '待保存-' + cause)
    const before = patches().length
    if (cause !== 400) { assert.ok(await save().isDisabled()); await form().dispatchEvent('submit'); assert.equal(patches().length, before) }
    failure = 0; abort = false; malformed = false
    if (cause !== 400) {
      if (cause === 500) {
        readFailure = 503; await form().getByRole('button', { name: '刷新列表核对' }).click(); await desk().locator('.list-error').waitFor()
        assert.ok(await save().isDisabled()); readFailure = 0
      }
      await verify()
    }
    await save().click(); await saved()
    assert.equal(patches().length, before + 1)
  }
  applyOnFailure = true; failure = 500
  await title().fill('实际上已经保存'); await save().click(); await form().getByRole('alert').waitFor()
  const beforeVerify = patches().length
  failure = 0; applyOnFailure = false; await verify()
  assert.ok(await save().isDisabled(), 'Readback confirms saved values; no duplicate PATCH')
  assert.equal(patches().length, beforeVerify)

  // The same editable Task remains available alongside the Agent conversation.
  await page.locator('.recent-goals button').filter({ hasText: '目标 1' }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('我的 Agent 问题')
  await page.locator('.chat-manual-tools').getByRole('button', { name: '＋ 记一件事', exact: true }).click()
  await page.getByRole('button', { name: '收起新建任务，保留草稿' }).click()
  await open(25); await title().fill('从目标会话修改'); await save().click(); await saved()
  await page.locator('.session-tools').getByRole('button', { name: /Agent 对话/ }).click()
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '我的 Agent 问题')
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click(); await open(25)
  assert.equal(await title().inputValue(), '从目标会话修改')
  assert.match(await row(25).innerText(), /从目标会话修改/)
  for (const width of [2560, 1600, 1100, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1800 ? 1440 : 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Viewport overflow ' + width)
    assert.ok(await form().evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Edit form overflow ' + width)
    if ([1600, 390].includes(width)) await shot('edit-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.reload(); await open(25); assert.equal(await title().inputValue(), '从目标会话修改')
  await page.getByRole('button', { name: '关闭任务详情' }).click()
  await desk().getByRole('button', { name: '下一页 →' }).click(); await open(5)
  await title().fill('在第二页保存'); await save().click(); await saved()
  assert.match(await desk().getByRole('navigation').innerText(), /第 2 页/, 'Metadata updates never move the current page')

  patchHold = new Promise(resolve => { releasePatch = resolve })
  await title().fill('不能进入另一账户'); await save().click(); await page.waitForFunction(() => document.querySelector('.task-edit-form')?.getAttribute('aria-busy') === 'true')
  await page.locator('.user-card').getByRole('button', { name: '退出登录' }).click(); await page.getByRole('button', { name: '确认退出', exact: true }).click()
  await page.getByRole('textbox', { name: '用户名或邮箱', exact: true }).fill('second@example.com'); await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).click(); await desk().locator('.inbox-empty').waitFor()
  releasePatch(); patchHold = null; await page.waitForTimeout(150)
  assert.equal(await desk().locator('.inbox-task').count(), 0)
  assert.ok(!await page.evaluate(() => Object.values(localStorage).some(value => value.includes('不能进入另一账户'))))

  // A new page restores the first test account via addInitScript; expired PATCH logs out.
  await page.reload(); await open(25)
  failure = 401; await title().fill('登录过期时不能保存'); await save().click()
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), null)
  assert.equal(await form().count(), 0)
  assert.ok(patches().every(r => /^\/api\/tasks\/\d+$/.test(r.path)), 'Never PATCH PlanTask status or invoke AI')
  assert.deepEqual(errors, [])
  console.log('Task edit passed: exact PATCH, clear/trim/local dates, pending/races, per-task drafts, failures/readback, cross-view sync, pages and 320–2560. Artifacts: ' + artifacts)
} catch (error) { await shot('failure').catch(() => {}); console.error('Task edit artifacts: ' + artifacts); throw error }
finally { releasePatch?.(); releaseRead?.(); await browser.close() }
