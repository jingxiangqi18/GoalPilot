import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-collection-account-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'collection-account-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = Array.from({ length: 24 }, (_, index) => ({ id: index + 1, goalText: `目标 ${index + 1}：一步一步完成项目`, status: index < 9 ? 'DRAFT' : index < 20 ? 'ACTIVE' : index < 22 ? 'COMPLETED' : index === 22 ? 'NEEDS_CLARIFICATION' : 'READY_TO_PLAN', createdAt: '2026-09-03T21:30:00' }))
const requests = [], errors = []
let failure = 0, mismatchedPage = false, heldStatus, hold, release
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), url = new URL(request.url()), path = url.pathname
  requests.push({ path, method: request.method(), query: Object.fromEntries(url.searchParams), headers: request.headers() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') {
    const filter = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'))
    const matches = goals.filter(goal => !filter || goal.status === filter)
    data = { items: matches.slice((page - 1) * size, page * size), page, size, total: matches.length, totalPages: Math.ceil(matches.length / size) }
    if (mismatchedPage) data = { ...data, page: size, size: page }
    if (failure) { status = failure; data = { message: '模拟目标读取失败' } }
    if (filter === heldStatus && hold) await hold
  } else if (/^\/api\/goals\/\d+$/.test(path)) data = goals.find(goal => goal.id === Number(path.split('/').at(-1)))
  else { status = 500; data = {}; errors.push('Unexpected API ' + path) }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const filter = label => page.getByRole('group', { name: '目标状态筛选', exact: true }).getByRole('button', { name: label, exact: true }).click()
const listCalls = () => requests.filter(request => request.path === '/api/goals')
const count = async expected => { await page.waitForFunction(n => document.querySelectorAll('.goal-card:not(.skeleton-card)').length === n && !document.querySelector('.skeleton-card'), expected) }
const token = () => page.evaluate(() => localStorage.getItem('goalpilot.access_token'))
const screenshot = async name => { await page.waitForTimeout(200); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: !name.startsWith('logout-') }) }
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184')
  await page.locator('.recent-goal').first().waitFor()
  const recent = await page.locator('.recent-goals button span').allTextContents()
  await page.locator('#goal-input').fill('未提交的想法要保留')
  await page.getByRole('button', { name: '账户菜单', exact: true }).click()
  await page.locator('.account-popover').waitFor()
  assert.equal(await token(), 'collection-account-test', 'Opening the account menu never logs out')
  assert.match(await page.locator('.account-popover').innerText(), /jakin@example.com/)
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button', { name: '账户菜单' }).evaluate(el => el === document.activeElement), true)
  await page.locator('.user-card').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('dialog', { name: '要退出当前账户吗？' }).waitFor()
  assert.equal(await page.getByRole('button', { name: '继续使用' }).evaluate(el => el === document.activeElement), true)
  assert.equal(await token(), 'collection-account-test')
  await screenshot('logout-confirm-1600')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('dialog[open]'))
  assert.equal(await page.locator('#goal-input').inputValue(), '未提交的想法要保留')
  assert.equal(await page.locator('.user-card button').evaluate(el => el === document.activeElement), true)

  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await count(9)
  await page.getByRole('button', { name: '下一页 →' }).click(); await count(9)
  await page.waitForFunction(() => document.querySelector('.pagination span')?.textContent.includes('第 2 页'))
  await filter('进行中'); await count(9)
  assert.deepEqual(listCalls().at(-1).query, { page: '1', size: '9', status: 'ACTIVE' })
  assert.match(await page.locator('.collection-stats').innerText(), /进行中目标\s*11/)
  assert.equal(await page.locator('.main-nav small').innerText(), '24')
  assert.deepEqual(await page.locator('.recent-goals button span').allTextContents(), recent, 'Filtered pages never replace global recent goals')
  await page.getByRole('button', { name: '下一页 →' }).click(); await count(2)
  assert.deepEqual(listCalls().at(-1).query, { page: '2', size: '9', status: 'ACTIVE' })
  await page.getByRole('button', { name: '刷新目标列表' }).click(); await count(2)
  assert.equal(listCalls().at(-1).query.page, '2')
  goals[19].status = 'COMPLETED'; goals[18].status = 'COMPLETED'
  await page.getByRole('button', { name: '刷新目标列表' }).click(); await count(9)
  assert.equal(listCalls().at(-1).query.page, '1', 'A page removed by status changes falls back within the same filter')
  goals[19].status = 'ACTIVE'; goals[18].status = 'ACTIVE'
  const beforeSearch = listCalls().length
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('完全不匹配')
  await page.getByRole('button', { name: '清除搜索 →' }).waitFor()
  assert.equal(listCalls().length, beforeSearch, 'Keyword search remains explicitly page-local')
  await filter('已归档'); await page.getByText('暂时没有已归档的目标', { exact: true }).waitFor()
  assert.equal(await page.getByRole('searchbox').inputValue(), '')
  await page.getByRole('button', { name: '清除筛选，查看全部目标 →' }).click(); await count(9)
  assert.deepEqual(listCalls().at(-1).query, { page: '1', size: '9' }, 'ALL is never sent as a backend status')
  for (const [label, status] of [['草稿', 'DRAFT'], ['待补充', 'NEEDS_CLARIFICATION'], ['待规划', 'READY_TO_PLAN'], ['已完成', 'COMPLETED']]) {
    await filter(label)
    await page.waitForFunction(() => document.querySelector('.archive-module')?.getAttribute('aria-busy') === 'false')
    assert.equal(listCalls().at(-1).query.status, status)
  }
  failure = 500
  await filter('进行中'); await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('.goal-card').count(), 0, 'Errors never show the previous filter as the new result')
  failure = 0
  await page.getByRole('button', { name: '重试', exact: true }).click(); await count(9)
  heldStatus = 'ACTIVE'; hold = new Promise(resolve => { release = resolve })
  await page.getByRole('button', { name: '刷新目标列表' }).click()
  await filter('已完成'); await count(2)
  release(); hold = null; await page.waitForTimeout(200)
  assert.equal(await page.locator('.goal-card').count(), 2, 'A late prior filter cannot replace the latest result')
  assert.equal(await page.getByRole('button', { name: '已完成', exact: true }).getAttribute('aria-pressed'), 'true')
  mismatchedPage = true
  await filter('进行中'); await page.getByRole('alert').filter({ hasText: '分页信息与请求不一致' }).waitFor()
  mismatchedPage = false
  await page.getByRole('button', { name: '重试', exact: true }).click(); await count(9)
  await page.locator('.goal-card').first().getByRole('button', { name: '进入会话' }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('这段对话草稿也要保留')
  await page.getByRole('button', { name: '账户菜单' }).click()
  await page.locator('.account-popover').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('button', { name: '继续使用' }).click()
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '这段对话草稿也要保留')
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click(); await count(9)
  assert.equal(await page.getByRole('button', { name: '进行中', exact: true }).getAttribute('aria-pressed'), 'true')
  for (const width of [2560, 1600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await page.waitForTimeout(200)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Collection overflow ' + width)
    if ([1600, 390].includes(width)) await screenshot('filtered-collection-' + width)
  }
  await page.getByRole('button', { name: '账户菜单' }).click()
  await page.locator('.account-popover').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('dialog').waitFor()
  assert.ok(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().left >= 0 && el.getBoundingClientRect().right <= innerWidth))
  await page.keyboard.press('Shift+Tab')
  assert.ok(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), 'Native dialog traps keyboard focus')
  await page.getByRole('button', { name: '继续使用' }).click()
  assert.equal(await token(), 'collection-account-test')
  await page.getByRole('button', { name: '账户菜单' }).click()
  await page.locator('.account-popover').getByRole('button', { name: '退出登录' }).click()
  await screenshot('logout-confirm-320')
  await page.getByRole('button', { name: '确认退出' }).click()
  await page.locator('.auth-page').waitFor()
  assert.equal(await token(), null)
  // Authentication expiry is not a voluntary logout and must bypass confirmation.
  await page.reload()
  await page.locator('.workspace-shell').waitFor()
  await page.getByRole('button', { name: '账户菜单' }).click()
  await page.locator('.account-popover').getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('dialog').waitFor()
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('goalpilot:unauthorized')))
  await page.locator('.auth-page').waitFor()
  assert.equal(await page.locator('dialog[open]').count(), 0)
  assert.equal(await token(), null)
  assert.ok(requests.every(request => request.method === 'GET'), 'Filtering, reading and local logout never write business data')
  assert.ok(listCalls().every(request => request.headers.authorization === 'Bearer collection-account-test'))
  assert.deepEqual(errors, [])
  console.log('PASS: server status filters, scoped pagination/refresh, empty/search/error/race guards, recent goal isolation, account menu and confirmed logout, draft preservation, keyboard and 320–2560. Screenshots: ' + artifacts)
} finally { await browser.close() }
