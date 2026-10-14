import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-polish-'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 }, locale: 'en-GB', timezoneId: 'America/Los_Angeles' })
await context.addInitScript(() => {
  localStorage.setItem('goalpilot.access_token', 'polish-test')
  localStorage.setItem('goalpilot.world-appearance.v1', JSON.stringify({ scene: 'nus', focused: false }))
})
const tasks = ['练薄肌、喝大水', '整理课程笔记与项目演示', '读完这周的书并记录想法', '给下一段旅程留一点时间'].map((title, i) => ({ id: i + 1, title, status: 'TODO', priority: 'MEDIUM', goalId: null, planTaskId: null, description: '', completionCriteria: '', deadline: i === 3 ? null : ['2026-10-15T14:00:00', '2026-10-13T18:00:00', '2027-01-01T00:05:00'][i], completedAt: null, createdAt: '2026-10-14T09:00:00', updatedAt: '2026-10-14T09:00:00' }))
const errors = [], writes = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request(), path = new URL(req.url()).pathname
  let data
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin' }
  else if (path === '/api/goals') data = { items: [], page: 1, size: 9, total: 0, totalPages: 0 }
  else if (path === '/api/tasks' && req.method() === 'GET') data = { items: tasks, page: 1, size: 20, total: tasks.length, totalPages: 1 }
  else if (path === '/api/tasks/1' && req.method() === 'PATCH') {
    writes.push(req.postDataJSON())
    Object.assign(tasks[0], req.postDataJSON(), { updatedAt: '2026-10-14T10:00:00', completedAt: '2026-10-14T10:00:00' })
    data = tasks[0]
  } else { errors.push(req.method() + ' ' + path); return route.fulfill({ status: 500, json: {} }) }
  await route.fulfill({ json: data })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
async function shot(name) {
  await page.waitForTimeout(300)
  for (const image of await page.locator('.world-art:visible').all()) await image.evaluate(img => img.decode())
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' fits the viewport')
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
try {
  await page.goto(root + '/#/new')
  await page.locator('.conversation-island').waitFor()
  assert.equal(await page.locator('.conversation-island .editorial-heading').count(), 1)
  assert.equal(await page.locator('.conversation-island .writing-card').count(), 1)
  const input = page.getByRole('textbox', { name: '我的目标', exact: true })
  await input.fill('每天给自己留半小时，学习、运动，也看看窗外。')
  await input.blur(); await shot('home-nus-1600')
  assert.equal(await page.locator('.editorial-heading').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
  assert.equal(await page.locator('.ambient-landscape').evaluate(el => getComputedStyle(el).opacity), '1')
  for (const [label, key] of [['河岸小城', 'harbor'], ['花园漫步', 'garden'], ['蓝调夜行', 'night-rail'], ['新加坡', 'singapore'], ['NUS 校园', 'nus']]) {
    await page.getByRole('button', { name: '工作室外观', exact: true }).click()
    await page.getByRole('button', { name: label, exact: true }).click(); await page.keyboard.press('Escape')
    assert.match(await input.inputValue(), /留半小时/)
    await shot('home-' + key)
  }
  for (const [width, height] of [[2560, 1440], [800, 900], [390, 844], [320, 440]]) {
    await page.setViewportSize({ width, height }); await shot('home-' + width)
    assert.ok((await page.locator('.writing-card').boundingBox()).y < height * .65)
    assert.ok(await page.locator('.writing-card').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
  }
  await page.setViewportSize({ width: 1600, height: 1050 })
  await page.goto(root + '/#/tasks'); await page.locator('.inbox-task').first().waitFor()
  const first = page.locator('.inbox-task').first(), date = first.locator('time.agenda')
  assert.match(await date.getAttribute('aria-label'), /截止时间：2026年10月15日.*14:00/)
  assert.equal(await date.locator('.agenda-day').innerText(), '15')
  assert.equal(await date.locator('.agenda-time').innerText(), '14:00')
  assert.equal(await page.locator('.task-row-deadline .date-inline-clock').count(), 0)
  assert.equal(await page.locator('.task-row-deadline').getByText('期待完成', { exact: true }).count(), 0)
  const height = (await first.boundingBox()).height
  await first.getByRole('checkbox').click()
  await page.waitForFunction(() => document.querySelector('.inbox-task [role="checkbox"]')?.getAttribute('aria-checked') === 'true')
  assert.equal(await page.locator('.row-notice').count(), 0)
  assert.ok(Math.abs((await first.boundingBox()).height - height) < 1, 'Status changes do not insert a sentence or shift rows')
  assert.deepEqual(writes, [{ status: 'DONE' }])
  for (const width of [2560, 1600, 800, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 }); await shot('agenda-' + width)
    assert.ok(await date.isVisible(), 'Deadlines remain visible on small screens')
    assert.ok(await first.evaluate(el => el.scrollWidth <= el.clientWidth + 1))
    assert.doesNotMatch(await date.innerText(), /\d+\/\d+/)
  }
  await page.setViewportSize({ width: 1600, height: 1050 })
  await first.locator('.task-receipt-title').click(); await page.getByRole('form', { name: '编辑任务资料' }).waitFor()
  assert.ok(await date.isVisible(), 'Opening an inspector does not hide the deadline')
  await shot('agenda-inspector')
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(root + '/#/new'); await shot('home-reduced-motion')
  assert.deepEqual(errors, [])
  console.log('PASS: quiet task completion, readable agenda dates, desktop/mobile/inspector deadlines, unified scenic composer, five themes, preserved drafts and 320–2560. ' + artifacts)
} finally { await browser.close() }
