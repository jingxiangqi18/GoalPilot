import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-task-query-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'task-query-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goal = { id: 1, goalText: '记录城市与公园之间的风景', status: 'ACTIVE', createdAt: '2026-09-03T21:30:00' }
let tasks = Array.from({ length: 45 }, (_, i) => ({ id: 45 - i, title: '历史任务 ' + (45 - i), goalId: i >= 20 ? 1 : null, planTaskId: null,
  status: ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'][i % 4], priority: i % 3 ? 'MEDIUM' : 'HIGH', description: '后端保存的任务说明', completionCriteria: '完成一次记录',
  deadline: '2028-02-29T00:05:00', createdAt: '2026-09-28T09:00:00', updatedAt: '2026-09-28T09:00:00' }))
const requests = [], errors = []
let failure = 0, malformed = false, abort = false, holdNextRead = false, lateReadStatus = 200, release, sequence = 100
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method()
  requests.push({ path, method, query: Object.fromEntries(url.searchParams), authorization: request.headers().authorization })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/auth/login') data = { accessToken: 'second-user', user: { id: 2, username: 'Second', email: 'second@example.com' } }
  else if (path === '/api/goals') data = { items: [goal], page: 1, size: 9, total: 1, totalPages: 1 }
  else if (path === '/api/goals/1') data = goal
  else if (path === '/api/tasks' && method === 'GET') {
    const page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'))
    const records = request.headers().authorization === 'Bearer second-user' ? [] : tasks
    data = structuredClone({ items: records.slice((page - 1) * size, page * size), page, size, total: records.length, totalPages: Math.ceil(records.length / size) })
    if (malformed) data.page = 99
    if (failure) { status = failure; data = { message: '模拟任务列表读取失败' } }
    if (abort) return route.abort('connectionfailed')
    if (holdNextRead) { holdNextRead = false; status = lateReadStatus; await new Promise(resolve => { release = resolve }) }
  } else if (path === '/api/tasks' && method === 'POST') {
    data = { id: ++sequence, goalId: null, planTaskId: null, status: 'TODO', description: null, completionCriteria: null, deadline: null, completedAt: null,
      ...request.postDataJSON(), createdAt: '2026-09-28T10:00:00', updatedAt: '2026-09-28T10:00:00' }
    tasks.unshift(data); status = 201
  } else { status = 500; data = {}; errors.push('Unexpected API ' + method + ' ' + path) }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
const desk = () => page.getByRole('region', { name: '同步待办清单' })
const form = () => page.getByRole('form', { name: '新建待办任务' })
const reads = () => requests.filter(r => r.path === '/api/tasks' && r.method === 'GET')
const posts = () => requests.filter(r => r.path === '/api/tasks' && r.method === 'POST')
const row = title => desk().locator('.inbox-task').filter({ has: page.getByText(title, { exact: true }) })
async function settled() { await desk().waitFor(); await page.waitForFunction(() => document.querySelector('.task-desk [aria-busy]')?.getAttribute('aria-busy') === 'false' && !document.querySelector('.list-loading')) }
async function refresh() { await desk().getByRole('button', { name: '刷新任务列表', exact: true }).click(); await settled() }
async function turn(direction) { await desk().getByRole('navigation', { name: '全部任务分页' }).getByRole('button', { name: direction }).click(); await settled() }
async function save(title) { await desk().getByRole('button', { name: '＋ 记一件事', exact: true }).click(); await form().getByRole('textbox', { name: '任务标题', exact: true }).fill(title); await form().getByRole('button', { name: '保存任务', exact: true }).click(); await desk().getByRole('status').filter({ hasText: title }).waitFor(); await settled() }
async function shot(name) { await page.screenshot({ path: join(artifacts, name + '.jpg'), type: 'jpeg', quality: 65, fullPage: true }) }
try {
  await page.goto(root + '/#/new')
  await page.getByRole('textbox', { name: '我的目标', exact: true }).fill('对话想法不能被任务刷新覆盖')
  assert.equal(reads().length, 0, 'The Agent workspace does not fetch a hidden ToDo list')
  await page.locator('.main-nav').getByRole('button', { name: '待办清单', exact: false }).click()
  await row('历史任务 45').waitFor()
  assert.equal(await page.locator('.composer-view').count(), 0)
  assert.match(await page.locator('.main-nav button[aria-current="page"]').innerText(), /待办清单/)
  await desk().getByRole('button', { name: '＋ 记一件事', exact: true }).click()
  await form().getByRole('textbox', { name: '任务标题', exact: true }).fill('切换页面时保留的待办草稿')
  await page.goBack(); await page.getByRole('textbox', { name: '我的目标', exact: true }).waitFor()
  assert.equal(await page.getByRole('textbox', { name: '我的目标', exact: true }).inputValue(), '对话想法不能被任务刷新覆盖')
  assert.equal(await desk().count(), 0)
  await page.goForward(); await row('历史任务 45').waitFor()
  assert.equal(await form().getByRole('textbox', { name: '任务标题', exact: true }).inputValue(), '切换页面时保留的待办草稿')
  await form().getByRole('button', { name: '收起新建任务，保留草稿' }).click()
  assert.match(page.url(), /#\/tasks$/)
  assert.equal(await page.locator('.composer-view').count(), 0)
  // A directly opened route must work as well as sidebar navigation.
  const readsBeforeReload = reads().length
  await page.goto(root + '/#/tasks'); await row('历史任务 45').waitFor(); await settled()
  assert.ok(reads().length <= readsBeforeReload + 1, 'Load only one page, not the entire archive')
  assert.deepEqual(reads()[0].query, { page: '1', size: '20' })
  assert.equal(reads()[0].authorization, 'Bearer task-query-test')
  assert.equal(await desk().locator('.inbox-task').count(), 20)
  assert.match(await desk().locator('.inbox-heading').innerText(), /共 45 项/)
  assert.equal(await desk().getByRole('checkbox').count(), 0, 'Historical Tasks remain read-only')
  assert.match(await row('历史任务 43').innerText(), /已完成/)
  await row('历史任务 45').getByRole('button').first().click()
  assert.match(await page.getByRole('complementary', { name: '任务详情' }).innerText(), /2028年/)
  assert.match(await page.getByRole('complementary', { name: '任务详情' }).innerText(), /00:05/)
  assert.doesNotMatch(await page.getByRole('complementary', { name: '任务详情' }).innerText(), /保存时间/)
  await page.getByRole('button', { name: '关闭任务详情' }).click()
  assert.ok(await row('历史任务 45').getByRole('button').evaluate(el => el === document.activeElement), 'Closing details returns focus to the selected row')
  const beforeSearch = reads().length
  await desk().getByRole('searchbox', { name: '搜索本页任务' }).fill('历史任务 25')
  await desk().getByText('本页没有匹配的任务。', { exact: false }).waitFor()
  assert.equal(reads().length, beforeSearch, 'Keyword search is explicitly page-local')
  await turn('下一页 →'); await row('历史任务 25').waitFor()
  assert.equal(await desk().getByRole('searchbox').inputValue(), '')
  assert.deepEqual(reads().at(-1).query, { page: '2', size: '20' })
  await save('从第二页添加的新任务'); await row('从第二页添加的新任务').waitFor()
  assert.deepEqual(reads().at(-1).query, { page: '1', size: '20' })
  assert.match(await desk().locator('.inbox-heading').innerText(), /共 46 项/)
  assert.equal(await page.getByRole('textbox', { name: '我的目标', exact: true }).count(), 0, 'Manual creation never shows the Agent composer')

  const beforeGoal = reads().length
  await page.locator('.recent-goals button').filter({ hasText: goal.goalText }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('目标会话草稿')
  assert.equal(reads().length, beforeGoal, 'Do not prefetch hidden task tools')
  await page.locator('.chat-manual-tools').getByRole('button', { name: '＋ 记一件事', exact: true }).click(); await settled()
  await form().getByRole('button', { name: '收起新建任务，保留草稿' }).click()
  assert.match(await desk().innerText(), /不代表该目标的全部任务/)
  assert.equal(await desk().locator('.inbox-task').count(), 0)
  assert.match(await desk().innerText(), /这一页没有关联当前目标的任务/)
  await turn('下一页 →'); await row('历史任务 25').waitFor()
  assert.equal(await desk().locator('.inbox-task').count(), 19)
  assert.deepEqual(reads().at(-1).query, { page: '2', size: '20' }, 'Never send unsupported goal/status/search filters')
  await desk().getByRole('button', { name: '查看全部任务 →' }).click(); await row('从第二页添加的新任务').waitFor()
  assert.match(await desk().getByRole('navigation').innerText(), /第 1 页/, 'Page positions stay separate across views')

  failure = 503
  await save('已保存但列表暂时离线'); await desk().locator('.list-error').waitFor()
  assert.match(await desk().locator('.list-error').innerText(), /保留上次读取/)
  assert.match(await desk().locator('.task-notice').innerText(), /已保存但列表暂时离线.*已保存/)
  const countAfterSave = posts().length
  failure = 0
  await desk().getByRole('button', { name: '重试读取任务' }).click(); await row('已保存但列表暂时离线').waitFor()
  assert.equal(posts().length, countAfterSave, 'Retry is a GET, never another POST')
  malformed = true; await refresh(); await desk().locator('.list-error').waitFor()
  assert.match(await desk().locator('.list-error').innerText(), /分页信息不完整/)
  assert.ok(await row('已保存但列表暂时离线').isVisible(), 'Keep the last valid snapshot')
  malformed = false; await refresh()
  abort = true; await refresh(); await desk().locator('.list-error').waitFor(); abort = false; await refresh()

  holdNextRead = true
  await desk().getByRole('button', { name: '刷新任务列表' }).click(); await desk().locator('.list-loading').waitFor()
  await save('不会被迟到响应抹掉'); await row('不会被迟到响应抹掉').waitFor()
  release(); release = null; await page.waitForTimeout(150)
  assert.ok(await row('不会被迟到响应抹掉').isVisible())
  assert.match(await desk().locator('.inbox-heading').innerText(), /共 48 项/)
  for (const width of [2560, 1600, 390, 320]) {
    await page.setViewportSize({ width, height: width > 2000 ? 1440 : 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow ' + width)
    assert.ok(await desk().getByRole('navigation').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Pagination overflow ' + width)
    if ([1600, 390].includes(width)) await shot('tasks-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.reload(); await row('不会被迟到响应抹掉').waitFor(); await settled()
  await turn('下一页 →'); await turn('下一页 →')
  assert.match(await desk().getByRole('navigation').innerText(), /第 3 页/)
  tasks = tasks.slice(0, 4)
  await refresh(); await row('不会被迟到响应抹掉').waitFor()
  assert.deepEqual(reads().slice(-2).map(r => r.query.page), ['3', '1'], 'Recover a removed last page once')
  assert.equal(await desk().locator('.inbox-task').count(), 4)
  tasks = []; await refresh()
  assert.match(await desk().locator('.inbox-empty').innerText(), /还没有任务/)
  assert.equal(await desk().getByRole('navigation').count(), 0)
  failure = 500; await page.reload(); await desk().locator('.list-error').waitFor()
  assert.equal(await desk().locator('.inbox-empty').count(), 0, 'A failed first load is not an empty inbox')
  failure = 0; await desk().getByRole('button', { name: '重试读取任务' }).click(); await desk().locator('.inbox-empty').waitFor()

  await save('第一位用户的私密任务')
  lateReadStatus = 401
  holdNextRead = true; await desk().getByRole('button', { name: '刷新任务列表' }).click(); await desk().locator('.list-loading').waitFor()
  await page.locator('.user-card').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('button', { name: '确认退出', exact: true }).click()
  await page.getByRole('textbox', { name: '用户名或邮箱', exact: true }).fill('second@example.com')
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).click(); await desk().locator('.inbox-empty').waitFor()
  release(); release = null; await page.waitForTimeout(150)
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), 'second-user', 'An old 401 cannot log out the newer account')
  assert.equal(await desk().locator('.inbox-task').count(), 0, 'A late private list cannot leak into another account')
  assert.ok(!await page.evaluate(() => Object.values(localStorage).some(value => value.includes('私密任务'))))
  failure = 401; await desk().getByRole('button', { name: '刷新任务列表' }).click()
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), null)
  assert.ok(reads().every(r => Object.keys(r.query).sort().join(',') === 'page,size'))
  assert.equal(requests.filter(r => r.method === 'PATCH').length, 0)
  assert.deepEqual(errors, [])
  console.log('Task query passed: history, pagination, truthful scopes, create refresh, read errors, page recovery, late reads, account isolation, dates and responsive layout. Artifacts: ' + artifacts)
} catch (error) { await shot('failure').catch(() => {}); console.error('Task query artifacts: ' + artifacts); throw error }
finally { release?.(); await browser.close() }
