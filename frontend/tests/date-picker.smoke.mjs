import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chooseDateTime } from './helpers/date-picker.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-calendar-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
// Deliberately use an English browser and a western timezone: neither controls the UI format or API time.
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles', hasTouch: true })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'calendar-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goal = { id: 1, goalText: '记录城市街区与自然之间的风景', status: 'ACTIVE', priority: 'MEDIUM', deadline: null, createdAt: '2026-09-03T21:30:00', updatedAt: '2026-09-03T21:30:00' }
const writes = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  let data
  if (request.method() === 'PATCH' && path === '/api/goals/1') {
    writes.push(request.postDataJSON())
    Object.assign(goal, request.postDataJSON())
    data = goal
  } else if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: [goal], page: 1, size: 9, total: 1, totalPages: 1 }
  else if (path === '/api/goals/1') data = goal
  else { errors.push('Unexpected API ' + path); data = {} }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const trigger = () => page.locator('#edit-goal-deadline')
const calendar = () => page.getByRole('dialog', { name: '选择日期与时间' })
const save = () => page.getByRole('button', { name: '保存修改', exact: true })
const closed = () => calendar().waitFor({ state: 'detached' })
const value = () => trigger().getAttribute('data-value')
const focusedDay = () => page.evaluate(() => document.activeElement?.getAttribute('data-date'))
async function jump(year, month) {
  await calendar().getByRole('button', { name: '切换年月' }).click()
  await calendar().getByRole('textbox', { name: '跳转年份' }).fill(String(year))
  await calendar().getByRole('button', { name: `查看${year}年${month}月`, exact: true }).click()
}
async function screenshot(name) { await page.waitForTimeout(180); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function insideViewport() {
  await page.waitForTimeout(170)
  assert.ok(await calendar().evaluate(el => {
    const rect = el.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1
  }), 'Calendar stays inside the viewport')
  assert.ok(await calendar().evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Calendar content does not overflow horizontally')
}
try {
  await page.goto((process.env.APP_URL || 'http://127.0.0.1:5184') + '/#/goals/1')
  await page.locator('.session-tools').getByRole('button', { name: '目标资料', exact: false }).click()
  await trigger().waitFor()
  assert.equal(await page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]').count(), 0)
  assert.match(await trigger().innerText(), /选择期待完成的日期/)
  assert.ok(await save().isDisabled())
  await trigger().press('Enter')
  await calendar().waitFor()
  assert.equal(await calendar().getByRole('columnheader').allTextContents().then(days => days.join('')), '一二三四五六日')
  assert.ok(await calendar().getByRole('grid').getAttribute('aria-label').then(label => /年\d+月/.test(label)))
  await calendar().getByRole('button', { name: '明天', exact: false }).click()
  await calendar().getByRole('button', { name: '取消', exact: true }).click(); await closed()
  assert.equal(await value(), '', 'Cancel never changes the form value')
  assert.ok(await trigger().evaluate(el => el === document.activeElement))

  await chooseDateTime(page, '2028-02-29T00:05')
  assert.equal(await value(), '2028-02-29T00:05')
  assert.match(await trigger().innerText(), /2028年2月29日/)
  assert.match(await trigger().innerText(), /00:05/)
  assert.equal(writes.length, 0, 'Choosing a date is not an API save')
  await trigger().click(); await screenshot('calendar-1600')
  await insideViewport()
  assert.ok(await calendar().getByRole('button', { name: '暂不设置', exact: true }).isVisible())
  // Keyboard focus changes do not select a date. Enter/Space select it explicitly.
  await calendar().locator('[data-date="2028-02-29"]').focus()
  await page.keyboard.press('ArrowRight'); assert.equal(await focusedDay(), '2028-03-01')
  assert.equal(await value(), '2028-02-29T00:05')
  await page.keyboard.press('Home'); assert.equal(await focusedDay(), '2028-02-28')
  await page.keyboard.press('End'); assert.equal(await focusedDay(), '2028-03-05')
  await page.keyboard.press('PageUp'); assert.equal(await focusedDay(), '2028-02-05')
  await page.keyboard.press('Shift+PageDown'); assert.equal(await focusedDay(), '2029-02-05')
  await page.keyboard.press('Enter')
  assert.match(await calendar().locator('.calendar-footer p').innerText(), /2029年2月5日/)
  await page.keyboard.press('Escape'); await closed()
  assert.equal(await value(), '2028-02-29T00:05')
  assert.ok(await trigger().evaluate(el => el === document.activeElement))
  assert.ok(await page.locator('#goal-tools-panel').evaluate(el => !el.inert), 'Escape closes only the calendar')
  await trigger().click()
  await calendar().getByRole('button', { name: '暂不设置', exact: true }).click(); await closed()
  assert.equal(await value(), '')
  assert.ok(await save().isDisabled(), 'An initially unset deadline may be reverted without an API write')

  await trigger().click(); await jump(2026, 12)
  await calendar().locator('[data-date="2026-12-31"]').click()
  await calendar().getByRole('button', { name: '下个月', exact: true }).click()
  assert.equal(await calendar().getByRole('grid').getAttribute('aria-label'), '2027年1月')
  await calendar().getByRole('button', { name: '上个月', exact: true }).click()
  assert.equal(await calendar().getByRole('grid').getAttribute('aria-label'), '2026年12月')
  await calendar().getByRole('button', { name: '切换年月' }).click()
  await calendar().getByRole('textbox', { name: '跳转年份' }).fill('0')
  assert.ok(await calendar().locator('.month-grid button').first().isDisabled())
  await calendar().getByRole('textbox', { name: '跳转年份' }).fill('1')
  await calendar().getByRole('button', { name: '查看1年1月', exact: true }).click()
  assert.ok(await calendar().getByRole('button', { name: '上个月', exact: true }).isDisabled())
  await jump(9999, 12)
  assert.ok(await calendar().getByRole('button', { name: '下个月', exact: true }).isDisabled())
  await jump(2027, 1)
  await calendar().locator('[data-date="2027-01-01"]').click()
  for (const [hour, minute] of [['24', '00'], ['23', '60'], ['', '05']]) {
    await calendar().getByRole('textbox', { name: '小时', exact: true }).fill(hour)
    await calendar().getByRole('textbox', { name: '分钟', exact: true }).fill(minute)
    assert.ok(await calendar().getByRole('button', { name: '选好时间' }).isDisabled())
  }
  await calendar().getByRole('button', { name: '下午 14:00', exact: true }).click()
  assert.equal(await calendar().getByRole('textbox', { name: '小时', exact: true }).inputValue(), '14')
  await calendar().getByRole('textbox', { name: '小时', exact: true }).fill('00')
  await calendar().getByRole('textbox', { name: '分钟', exact: true }).fill('05')
  await calendar().getByRole('button', { name: '选好时间' }).click(); await closed()
  assert.equal(await value(), '2027-01-01T00:05')
  await save().click()
  await page.getByRole('status').filter({ hasText: '目标资料已保存' }).waitFor()
  assert.deepEqual(writes, [{ deadline: '2027-01-01T00:05:00' }], 'Even in a western timezone, the API receives the chosen local wall-clock value')
  await trigger().click()
  assert.equal(await calendar().getByRole('button', { name: '暂不设置', exact: true }).count(), 0, 'Persisted deadlines cannot be silently cleared')
  await page.locator('.session-title h1').click(); await closed()
  assert.equal(await value(), '2027-01-01T00:05')
  await trigger().click()
  await calendar().getByRole('button', { name: '选好时间' }).focus()
  await page.keyboard.press('Tab'); await closed()
  assert.equal(await value(), '2027-01-01T00:05', 'Tabbing out dismisses without changing the value')
  await trigger().click()
  await calendar().getByRole('button', { name: '关闭日期选择', exact: true }).focus()
  await page.keyboard.press('Shift+Tab'); await closed()
  assert.ok(await trigger().evaluate(el => el === document.activeElement), 'Shift+Tab returns to the date field')

  for (const [width, height] of [[2560, 1440], [390, 760], [320, 640]]) {
    await page.setViewportSize({ width, height })
    await trigger().tap(); await insideViewport()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.doesNotMatch(await calendar().innerText(), /\d{1,4}\/\d{1,2}\/\d{1,4}|January|February|September/)
    if (width === 390) await screenshot('calendar-390')
    // Simulate the reduced usable height when a mobile keyboard opens: keep local input and all actions accessible.
    await calendar().getByRole('textbox', { name: '分钟', exact: true }).fill('37')
    await page.setViewportSize({ width, height: 440 }); await insideViewport()
    assert.equal(await calendar().getByRole('textbox', { name: '分钟', exact: true }).inputValue(), '37')
    await calendar().getByRole('button', { name: '取消', exact: true }).tap(); await closed()
    assert.equal(await value(), '2027-01-01T00:05')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await trigger().click()
  assert.ok(await calendar().evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) < .01))
  await calendar().getByRole('button', { name: '关闭日期选择', exact: true }).click(); await closed()
  assert.deepEqual(errors, [])
  assert.equal(writes.length, 1)
  console.log('Pixel calendar, Chinese dates, keyboard, cancel, local time and responsive checks passed. Screenshots: ' + artifacts)
} catch (error) {
  await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true }).catch(() => {})
  console.error('Calendar artifacts: ' + artifacts)
  throw error
} finally { await browser.close() }
