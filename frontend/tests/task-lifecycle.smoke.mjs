import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-task-lifecycle-'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'lifecycle-test'))
const tasks = Array.from({ length: 21 }, (_, index) => ({ id: 21 - index, title: '任务 ' + (21 - index), goalId: 1, planTaskId: 901,
  description: '原说明', completionCriteria: '演示通过', status: 'TODO', priority: 'MEDIUM', deadline: null, completedAt: null,
  createdAt: '2026-10-13T08:00:00', updatedAt: '2026-10-13T08:00:00' }))
const goal = { id: 1, goalText: '校园里的新计划', status: 'DRAFT', createdAt: '2026-10-13T08:00:00' }
const requests = [], errors = []
let failure = 0, malformed = false, hold, release, holdRead = false, releaseRead, applyOnFailure = false
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method(), path = url.pathname
  const body = req.postData() ? req.postDataJSON() : null
  requests.push({ method, path, body, authorization: req.headers().authorization })
  let data
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin' }
  else if (path === '/api/goals') data = { items: [goal], page: 1, size: 9, total: 1, totalPages: 1 }
  else if (path === '/api/goals/1') data = goal
  else if (path === '/api/goals/1/active-plan') return route.fulfill({ status: 404, json: { message: '尚无正式计划' } })
  else if (path === '/api/tasks' && method === 'GET') {
    const page = Number(url.searchParams.get('page'))
    data = structuredClone({ items: tasks.slice((page - 1) * 20, page * 20), page, size: 20, total: tasks.length, totalPages: Math.ceil(tasks.length / 20) })
    if (holdRead) { holdRead = false; await new Promise(resolve => { releaseRead = resolve }) }
  } else if (/^\/api\/tasks\/\d+$/.test(path) && ['PATCH', 'DELETE'].includes(method)) {
    if (hold) await hold
    const id = Number(path.split('/').at(-1)), task = tasks.find(item => item.id === id)
    if (applyOnFailure || (!failure && !malformed)) {
      if (method === 'DELETE') tasks.splice(tasks.indexOf(task), 1)
      else {
        if (body.status === 'DONE' && task.status !== 'DONE') task.completedAt = '2026-10-13T10:25:37.123'
        Object.assign(task, body, { updatedAt: '2026-10-13T10:30:00' })
      }
    }
    if (failure === -1) return route.abort('connectionfailed')
    if (failure) return route.fulfill({ status: failure, json: { message: '模拟失败，请核对' } })
    if (method === 'DELETE') return route.fulfill({ status: 204 })
    data = malformed ? { ...task, status: body.status, completedAt: null, updatedAt: '' } : task
  } else { errors.push(method + ' ' + path); return route.fulfill({ status: 500, json: {} }) }
  await route.fulfill({ json: data })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
const row = id => page.locator(`.inbox-task[data-record-id="${id}"]`)
const checkbox = id => row(id).getByRole('checkbox')
const form = () => page.getByRole('form', { name: '编辑任务资料' })
const save = () => form().getByRole('button', { name: '保存修改', exact: true })
const patches = () => requests.filter(r => r.method === 'PATCH')
const deletes = () => requests.filter(r => r.method === 'DELETE')
const open = async id => { await row(id).locator('.task-receipt-title').click(); await form().waitFor() }
async function settle() { await page.waitForTimeout(350) }
async function status(id, value) { await page.waitForFunction(({ id, value }) => document.querySelector(`.inbox-task[data-record-id="${id}"] .receipt-status`)?.textContent.includes(value), { id, value }) }
try {
  await page.goto(root + '/#/tasks'); await open(21)
  const title = form().getByRole('textbox', { name: '修改任务标题' })
  await title.fill('不要丢失这条编辑草稿')
  hold = new Promise(resolve => { release = resolve })
  await checkbox(21).click(); await settle()
  assert.equal(await checkbox(21).getAttribute('aria-checked'), 'false', 'No optimistic completion')
  assert.ok(await checkbox(21).isDisabled()); await checkbox(21).dispatchEvent('click')
  assert.equal(patches().length, 1)
  assert.deepEqual(patches()[0], { method: 'PATCH', path: '/api/tasks/21', body: { status: 'DONE' }, authorization: 'Bearer lifecycle-test' })
  release(); hold = null; await status(21, '已完成')
  assert.equal(await page.getByText(/状态已更新为/).count(), 0, 'A checked task does not add a redundant success sentence')
  assert.equal(await title.inputValue(), '不要丢失这条编辑草稿', 'Quick status does not discard or save other fields')
  assert.equal(tasks[0].title, '任务 21')
  assert.match(await page.locator('.task-inspector').innerText(), /完成时间/)
  assert.match(await page.locator('.task-inspector time').last().getAttribute('aria-label'), /2026年10月13日.*10:25/)
  await checkbox(21).click(); await status(21, '待开始')
  assert.equal(tasks[0].completedAt, '2026-10-13T10:25:37.123', 'Backend preserves the last completion timestamp on reopen')
  assert.match(await page.locator('.task-inspector').innerText(), /上次完成/)
  await form().getByRole('button', { name: '撤销修改' }).click()
  for (const [label, value] of [['进行中', 'IN_PROGRESS'], ['已跳过', 'SKIPPED']]) {
    await form().getByRole('combobox', { name: '编辑任务状态' }).click()
    await page.getByRole('option', { name: label, exact: true }).click()
    assert.notEqual(tasks[0].status, value, 'Selecting a status in the editor is not an implicit save')
    await save().click(); await status(21, label)
    assert.equal(await form().locator('.edit-notice').count(), 0, 'Status-only editor changes stay quiet too')
    assert.deepEqual(patches().at(-1).body, { status: value })
  }
  // Both manual surfaces use Task ids, never the colliding PlanTask status endpoint.
  await page.locator('.task-inspector').getByRole('button', { name: /校园里的新计划/ }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('Agent 草稿保留')
  await page.getByRole('button', { name: '计划与任务', exact: false }).click()
  await page.getByRole('button', { name: '随手任务', exact: true }).click()
  await checkbox(21).click(); await status(21, '已完成')
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click(); await status(21, '已完成')
  assert.equal(requests.filter(r => r.path.endsWith('/status')).length, 0)
  // Filtered completion leaves focus on a visible row, not on the document body.
  await page.getByRole('group', { name: '本页任务状态' }).getByRole('button', { name: /^待开始/ }).click()
  await checkbox(20).focus(); await page.keyboard.press('Space'); await row(20).waitFor({ state: 'detached' })
  assert.ok(await page.evaluate(() => document.activeElement?.matches('.task-receipt-title')))
  await page.getByRole('group', { name: '本页任务状态' }).getByRole('button', { name: /^全部/ }).click()
  await open(21)
  for (const code of [400, 403, 404, 409, 500, -1]) {
    failure = code; await checkbox(21).click(); await form().getByRole('alert').waitFor()
    assert.equal(await checkbox(21).getAttribute('aria-checked'), 'true')
    const count = patches().length
    if (code !== 400) {
      assert.ok(await checkbox(21).isDisabled()); await checkbox(21).dispatchEvent('click'); assert.equal(patches().length, count)
      failure = 0; await form().getByRole('button', { name: '刷新列表核对' }).click(); await settle()
    }
    failure = 0
  }
  malformed = true; await checkbox(21).click(); await form().getByRole('alert').waitFor(); assert.ok(await checkbox(21).isDisabled())
  malformed = false; await form().getByRole('button', { name: '刷新列表核对' }).click(); await settle()
  // An old GET cannot overwrite a successful status receipt.
  holdRead = true; await page.getByRole('button', { name: '刷新任务列表', exact: true }).click(); await settle()
  await form().getByRole('combobox', { name: '编辑任务状态' }).click(); await page.getByRole('option', { name: '进行中', exact: true }).click()
  await save().click(); await status(21, '进行中'); releaseRead(); await settle(); await status(21, '进行中')
  // Delete is explicit, cancellable and uses an empty 204 receipt.
  const remove = page.getByRole('button', { name: '删除任务', exact: true })
  assert.equal(await remove.locator('svg').getAttribute('aria-hidden'), 'true')
  assert.ok((await remove.boundingBox()).height >= 40, 'Deletion keeps a comfortable labeled hit target')
  await remove.hover()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.delete-task .trash-lid')).transform !== 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.delete-task .trash-lid')).transform === 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await remove.click(); const dialog = page.getByRole('dialog', { name: '删除这项任务？' })
  assert.equal(await dialog.locator('.delete-symbol svg').count(), 1)
  assert.ok(await dialog.getByRole('button', { name: '保留任务' }).evaluate(el => el === document.activeElement))
  await page.keyboard.press('Escape'); assert.equal(deletes().length, 0)
  assert.ok(await remove.evaluate(el => el === document.activeElement))
  for (const code of [400, 403, 404, 409, 500, -1]) {
    failure = code; await remove.click(); await dialog.getByRole('button', { name: '确认删除' }).click(); await form().getByRole('alert').waitFor()
    assert.equal(await row(21).count(), 1)
    assert.equal(await remove.isDisabled(), code !== 400)
    const count = deletes().length
    await settle(); assert.equal(deletes().length, count, 'Failed DELETE is never automatically retried')
    failure = 0
    if (code !== 400) { await form().getByRole('button', { name: '刷新列表核对' }).click(); await settle() }
  }
  hold = new Promise(resolve => { release = resolve }); await remove.click(); await dialog.getByRole('button', { name: '确认删除' }).click(); await settle()
  assert.equal(await row(21).count(), 1); assert.ok(await dialog.getByRole('button', { name: '保留任务' }).isDisabled())
  await page.keyboard.press('Escape'); assert.ok(await dialog.isVisible())
  release(); hold = null; await row(21).waitFor({ state: 'detached' }); await settle()
  assert.deepEqual(deletes().at(-1), { method: 'DELETE', path: '/api/tasks/21', body: null, authorization: 'Bearer lifecycle-test' })
  assert.match(await page.locator('.inbox-heading').innerText(), /共 20 项/)
  // Deleting the only item on the last page recovers page 1 using server totals.
  tasks.push({ ...tasks[0], id: 100, title: '最后一页唯一任务' })
  await page.getByRole('button', { name: '刷新任务列表', exact: true }).click(); await settle()
  await page.getByRole('navigation', { name: '全部任务分页' }).getByRole('button', { name: /下一页/ }).click(); await open(100)
  await page.getByRole('button', { name: '删除任务', exact: true }).click(); await dialog.getByRole('button', { name: '确认删除' }).click()
  await row(20).waitFor(); assert.equal(await page.getByRole('navigation', { name: '全部任务分页' }).count(), 0)
  for (const width of [2560, 800, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 1000 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: join(artifacts, 'tasks-' + width + '.png'), fullPage: true })
  }
  await open(20); await page.getByRole('button', { name: '删除任务', exact: true }).click()
  const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 320)
  await page.screenshot({ path: join(artifacts, 'delete-320.png') }); await page.keyboard.press('Escape')
  // A lost response may conceal a completed deletion: keep the row until explicit readback.
  failure = -1; applyOnFailure = true
  await page.getByRole('button', { name: '删除任务', exact: true }).click(); await dialog.getByRole('button', { name: '确认删除' }).click()
  await form().getByRole('alert').waitFor(); assert.equal(await row(20).count(), 1)
  const count = deletes().length
  failure = 0; applyOnFailure = false
  await form().getByRole('button', { name: '刷新列表核对' }).click(); await row(20).waitFor({ state: 'detached' })
  assert.equal(deletes().length, count); assert.match(await page.locator('.inbox-heading').innerText(), /共 19 项/)
  assert.deepEqual(errors, [])
  console.log('PASS: Task PATCH status, completion timestamp, draft preservation, Task/PlanTask separation, errors/old reads, DELETE confirmation/204/last-page recovery, 320–2560. ' + artifacts)
} finally { release?.(); releaseRead?.(); await browser.close() }
