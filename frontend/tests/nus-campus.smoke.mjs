import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-nus-campus-'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'nus-test'))
const goals = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, goalText: ['完成校园项目', '养成阅读习惯', '每周坚持跑步'][i], status: 'DRAFT', createdAt: '2026-10-13T09:00:00' }))
const writes = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request(), path = new URL(req.url()).pathname
  if (req.method() !== 'GET') writes.push(path)
  if (path === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'Jakin' } })
  if (path === '/api/goals') return route.fulfill({ json: { items: goals, page: 1, size: 9, total: 3, totalPages: 1 } })
  if (path === '/api/goals/1') return route.fulfill({ json: goals[0] })
  if (path === '/api/tasks') return route.fulfill({ json: { items: [], page: 1, size: 20, total: 0, totalPages: 0 } })
  errors.push(path); await route.fulfill({ status: 500, json: {} })
})
const page = await context.newPage()
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
async function scene(label) {
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('button', { name: label, exact: true }).click(); await page.keyboard.press('Escape')
  await page.waitForFunction(() => [...document.querySelectorAll('.world-art')].every(image => image.dataset.art === image.dataset.displayedArt))
}
async function shot(name) {
  await page.waitForTimeout(400)
  for (const image of await page.locator('.world-art:visible').all()) await image.evaluate(img => img.decode())
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow: ' + name)
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
try {
  await page.goto(root + '/#/new')
  const draft = page.getByRole('textbox', { name: '我的目标', exact: true })
  await draft.fill('这段想法不会因为切换校园主题而消失')
  await scene('NUS 校园')
  assert.equal(await page.locator('html').getAttribute('data-scenery'), 'nus')
  assert.equal(await page.locator('.ambient-landscape').getAttribute('data-art'), 'nus-campus')
  assert.equal(await page.locator('.ambient-landscape').getAttribute('height'), '1024')
  assert.equal(await page.locator('.world-edge:visible').count(), 0, 'Do not double-stack vignettes over the campus atlas')
  await scene('新加坡'); await scene('NUS 校园'); assert.match(await draft.inputValue(), /不会因为/)
  await shot('campus-home-1600')
  for (const [width, height] of [[2560, 1440], [800, 900], [390, 844], [320, 440]]) {
    await page.setViewportSize({ width, height }); await shot('campus-home-' + width)
    assert.ok((await page.locator('.writing-card').boundingBox()).y < height * .65)
    const image = await page.locator('.ambient-landscape').boundingBox(); assert.ok(Math.abs(image.width / image.height - 1.5) < .01)
    await page.getByRole('button', { name: '工作室外观', exact: true }).click()
    const bounds = await page.locator('.appearance-panel').boundingBox()
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height)
    await page.getByRole('button', { name: 'NUS 校园', exact: true }).click(); await page.keyboard.press('Escape')
  }
  await page.setViewportSize({ width: 1600, height: 1050 })
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click()
  assert.equal(await page.locator('.desk-landscape').getAttribute('data-art'), 'nus-green'); await shot('campus-tasks')
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  assert.equal(await page.locator('.library-landscape').getAttribute('data-art'), 'nus-commons'); await shot('campus-goals')
  const covers = await page.locator('.goal-cover').evaluateAll(images => images.map(image => image.dataset.art))
  assert.ok(covers.every(key => key.startsWith('nus-'))); assert.equal(new Set(covers).size, 3)
  await page.locator('.goal-card').first().getByRole('button', { name: '进入会话', exact: true }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('聊聊学习计划')
  assert.equal(await page.locator('.welcome-station').getAttribute('data-art'), 'nus-study'); await shot('campus-chat')
  await scene('蓝调夜行'); await scene('NUS 校园')
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '聊聊学习计划')
  await page.reload(); assert.equal(await page.locator('html').getAttribute('data-scenery'), 'nus')
  await page.locator('.main-nav').getByRole('button', { name: /规划工作台/ }).click()
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('checkbox', { name: '专注模式' }).check({ force: true }); await page.keyboard.press('Escape')
  assert.equal(await page.locator('.workspace-scenery').isVisible(), false)
  assert.deepEqual(writes, []); assert.deepEqual(errors, [])
  console.log('PASS: NUS native-ratio artwork, five-theme picker, page-specific scenes, stable covers, draft/reload/focus preservation, 320–2560. ' + artifacts)
} finally { await browser.close() }
