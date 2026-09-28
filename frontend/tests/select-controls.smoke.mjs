import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-selects-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN', hasTouch: true })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'select-controls-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goal = { id: 1, goalText: '让城市与自然之间的周末，有更多值得记录的风景', status: 'ACTIVE', priority: 'MEDIUM', deadline: '2026-12-20T18:30:00', createdAt: '2026-09-03T21:30:00' }
const plan = {
  planId: 2, goalId: 1, status: 'ACTIVE', planTitle: '从城市街区到山间步道', createdAt: goal.createdAt,
  stages: Array.from({ length: 12 }, (_, index) => ({
    stageId: index + 3, title: ['发现身边的城市街区', '走进河流与公园', '记录建筑与日常生活', '整理旅途中的照片与文字'][index % 4] + ` · 路线 ${index + 1}`,
    timeRange: `第 ${index + 1} 周`, objective: '保持好奇，记录每一小步。',
    tasks: [{ taskId: index + 20, title: '制定一份行动清单', description: '记录出发时间与安排', completionCriteria: '可以出发', status: index < 3 ? 'DONE' : 'TODO' }],
  })),
}
const requests = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method() })
  let data
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: [goal], page: 1, size: 9, total: 1, totalPages: 1 }
  else if (path === '/api/goals/1') data = goal
  else if (path === '/api/goals/1/active-plan') data = plan
  else { errors.push('Unexpected API ' + path); data = {} }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const priority = () => page.getByRole('combobox', { name: '选择目标优先级' })
const stage = () => page.getByRole('combobox', { name: '选择计划阶段' })
const list = () => page.getByRole('listbox')
const closed = () => page.locator('.pixel-select-popover').waitFor({ state: 'detached' })
const activeOption = () => page.evaluate(() => document.getElementById(document.activeElement?.getAttribute('aria-activedescendant'))?.textContent)
async function screenshot(name) { await page.waitForTimeout(180); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function insideViewport() {
  assert.ok(await page.locator('.pixel-select-popover').evaluate(el => {
    const rect = el.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1
  }), 'Open menu stays inside the viewport')
}
try {
  await page.goto((process.env.APP_URL || 'http://127.0.0.1:5184') + '/#/goals/1')
  await page.locator('.session-tools').getByRole('button', { name: '目标资料', exact: false }).click()
  await priority().waitFor()
  assert.equal(await page.locator('select').count(), 0)
  assert.equal(await page.getByRole('button', { name: '编辑资料' }).count(), 0)
  await priority().focus(); await page.keyboard.press('ArrowDown')
  assert.equal(await priority().getAttribute('aria-expanded'), 'true')
  assert.equal(await list().getByRole('option').first().getAttribute('aria-disabled'), 'true')
  await page.keyboard.press('Home')
  assert.match(await activeOption(), /低优先级/)
  assert.equal(await priority().getAttribute('data-value'), 'MEDIUM', 'Moving focus does not commit an option')
  await page.keyboard.press('Escape'); await closed()
  assert.ok(await page.locator('#goal-tools-panel').isVisible(), 'Escape closes only the menu')
  assert.equal(await priority().evaluate(el => el === document.activeElement), true)
  await priority().press('Enter'); await page.keyboard.press('End'); await page.keyboard.press('Enter')
  await closed()
  assert.equal(await priority().getAttribute('data-value'), 'HIGH')
  await page.getByRole('button', { name: '撤销修改' }).click()
  assert.equal(await priority().getAttribute('data-value'), 'MEDIUM')
  // An already-started option click must survive a queued layout/scroll-anchor event.
  await priority().click()
  await list().getByRole('option').filter({ hasText: '低优先级' }).hover()
  await page.mouse.down()
  await priority().evaluate(el => { el.style.transform = 'translateY(2px)'; document.dispatchEvent(new Event('scroll')) })
  await page.mouse.up(); await closed()
  assert.equal(await priority().getAttribute('data-value'), 'LOW', 'Scroll anchoring must not discard an option click in progress')
  await priority().evaluate(el => { el.style.transform = '' })
  await page.getByRole('button', { name: '撤销修改' }).click()
  await priority().click(); await insideViewport(); await screenshot('priority-menu-1600')
  await page.keyboard.press('Tab'); await closed()
  assert.equal(await page.locator('#edit-goal-deadline').evaluate(el => el === document.activeElement), true, 'Tab leaves the combobox in normal document order')
  await priority().click()
  await page.locator('.panel-heading h2').click(); await closed()
  await priority().click()
  await page.locator('.session-tools').getByRole('button', { name: '计划与任务', exact: false }).click()
  await closed(); await stage().waitFor()
  await stage().press('Enter')
  assert.equal(await list().getByRole('option').count(), 12)
  assert.match(await list().getByRole('option').first().innerText(), /1 已完成/)
  await insideViewport(); await screenshot('stage-menu-1600')
  await page.keyboard.press('End')
  assert.match(await activeOption(), /路线 12/)
  assert.ok(await list().evaluate(el => el.scrollTop > 0), 'Keyboard navigation scrolls only the long option list')
  await page.keyboard.press('Enter'); await closed()
  await page.locator('.stage-title').filter({ hasText: '路线 12' }).waitFor()
  assert.equal(await stage().getAttribute('data-value'), '11')
  await stage().press('Home'); await page.keyboard.press(' '); await closed()
  await page.locator('.stage-title').filter({ hasText: '路线 1' }).waitFor()
  assert.equal(await stage().getAttribute('data-value'), '0')

  for (const width of [2560, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 760 : 1200 })
    await stage().tap(); await insideViewport()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (width === 390) await screenshot('stage-menu-390')
    // Touch selection, including long lists in a narrow panel.
    await list().getByRole('option').nth(2).tap(); await closed()
    await page.locator('.stage-title').filter({ hasText: '路线 3' }).waitFor()
    await stage().click(); await page.keyboard.press('Escape'); await closed()
  }
  await stage().click()
  await page.setViewportSize({ width: 1600, height: 1100 }); await closed()
  await stage().click()
  await page.locator('.panel-scroll').evaluate(el => el.scrollBy(0, 60)); await closed()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stage().click()
  assert.ok(parseFloat(await page.locator('.pixel-select-popover').evaluate(el => getComputedStyle(el).transitionDuration)) < .01)
  await list().evaluate(el => el.scrollTop = 120)
  assert.equal(await stage().getAttribute('aria-expanded'), 'true', 'Scrolling options does not dismiss their own menu')
  await page.locator('.session-tools').getByRole('button', { name: 'Agent 对话' }).click(); await closed()
  assert.equal(requests.some(request => request.method !== 'GET'), false, 'Selecting stages and editing without saving must never mutate the backend')
  assert.deepEqual(errors, [])
  console.log('Select controls passed: inline editing, keyboard, cancellation, touch, clipping, long lists, reduced motion. Screenshots: ' + artifacts)
} catch (error) {
  await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true })
  console.error('Failure screenshot: ' + artifacts)
  throw error
} finally { await browser.close() }
