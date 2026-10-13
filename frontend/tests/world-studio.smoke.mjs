import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-world-studio-'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'world-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = ['ACTIVE', 'READY_TO_PLAN', 'DRAFT'].map((status, index) => ({ id: index + 1, status, goalText: ['完成一个能独立交付的 Java 项目', '建立一个属于自己的阅读系统', '在城市与自然之间，养成规律跑步的习惯'][index], createdAt: '2026-10-12T09:20:00' }))
const tasks = Array.from({ length: 23 }, (_, index) => ({ id: index + 1, title: ['整理接口文档与测试用例', '阅读一章书并记录笔记', '完成今天的慢跑'][index % 3] + ' ' + (index + 1), status: ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'][index % 4], priority: 'MEDIUM', createdAt: '2026-10-12T09:20:00', goalId: index % 2 ? 1 : null }))
const requests = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), url = new URL(request.url())
  requests.push({ method: request.method(), path: url.pathname, query: url.search })
  let data
  if (url.pathname === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (url.pathname === '/api/goals') data = { items: goals, page: 1, size: 9, total: goals.length, totalPages: 1 }
  else if (/^\/api\/goals\/\d+$/.test(url.pathname)) data = goals.find(goal => goal.id === Number(url.pathname.split('/').at(-1)))
  else if (url.pathname === '/api/tasks') {
    const page = Number(url.searchParams.get('page') || 1)
    data = { items: tasks.slice((page - 1) * 20, page * 20), page, size: 20, total: tasks.length, totalPages: 2 }
  } else { errors.push('Unexpected request: ' + url.pathname); return route.fulfill({ status: 500, json: {} }) }
  await route.fulfill({ json: data })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const root = process.env.APP_URL || 'http://127.0.0.1:5184'
const settle = () => page.waitForTimeout(300)
const shot = name => page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
const noOverflow = async name => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name)
try {
  await page.goto(root + '/#/new')
  const draft = page.getByRole('textbox', { name: '我的目标', exact: true })
  await draft.fill('保留我的目标草稿，不因为换风景而消失')
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('button', { name: '蓝调夜行' }).click()
  assert.equal(await page.locator('.workspace-shell').getAttribute('data-scenery'), 'night-rail')
  assert.match(await draft.inputValue(), /保留我的目标/)
  await page.getByRole('checkbox', { name: '专注模式' }).check({ force: true })
  assert.equal(await page.locator('.workspace-scenery').isVisible(), false)
  await page.keyboard.press('Escape')
  assert.ok(await page.getByRole('button', { name: '工作室外观', exact: true }).evaluate(el => el === document.activeElement))
  await page.reload(); await draft.waitFor()
  assert.equal(await page.locator('.workspace-shell').getAttribute('data-scenery'), 'night-rail')
  assert.equal(await page.locator('.workspace-scenery').isVisible(), false, 'Focus preference survives reload')
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('checkbox', { name: '专注模式' }).uncheck({ force: true })
  await page.getByRole('button', { name: '河岸小城' }).click()
  await page.keyboard.press('Escape')
  for (const [width, height] of [[2560, 1440], [1600, 1000], [1100, 900], [800, 900], [390, 844], [320, 640]]) {
    await page.setViewportSize({ width, height }); await settle(); await noOverflow('Home ' + width)
    const input = await page.locator('.writing-card').boundingBox()
    assert.ok(input.y < height * .65, 'Composer remains the primary action')
    for (const edge of await page.locator('.world-edge:visible').all()) {
      const rect = await edge.boundingBox()
      assert.ok(rect.x + rect.width <= input.x || rect.x >= input.x + input.width || rect.y + rect.height <= input.y || rect.y >= input.y + input.height, 'No scenery over composer')
    }
    await page.getByRole('button', { name: '工作室外观', exact: true }).click()
    const panel = await page.getByRole('region', { name: '工作室外观设置' }).boundingBox()
    assert.ok(panel.x >= 0 && panel.x + panel.width <= width && panel.y + panel.height <= height)
    await page.keyboard.press('Escape')
    await shot('home-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.goal-card').first().waitFor(); await settle(); await shot('goal-gallery')
  await page.getByRole('button', { name: '列表视图', exact: true }).click()
  assert.ok(await page.locator('.library-view').evaluate(el => el.classList.contains('list-view')))
  assert.equal(await page.locator('.goal-card').count(), 3)
  await shot('goal-list')
  for (const width of [800, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await settle(); await noOverflow('Library list ' + width)
    await shot('goal-list-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click()
  await page.locator('.inbox-task').first().waitFor()
  const readCount = requests.length
  await page.getByRole('group', { name: '本页任务状态' }).getByRole('button', { name: /已完成/ }).click()
  assert.equal(await page.locator('.inbox-task').count(), 5)
  assert.equal(requests.length, readCount, 'Page-local filters are local, not invented API parameters')
  const rowHeight = (await page.locator('.task-receipt-title').first().boundingBox()).height
  await page.getByRole('button', { name: '紧凑任务列表', exact: true }).click()
  assert.ok((await page.locator('.task-receipt-title').first().boundingBox()).height < rowHeight)
  await page.getByRole('button', { name: '下一页 →', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.inbox-task').length === 3)
  assert.equal(await page.getByRole('group', { name: '本页任务状态' }).getByRole('button', { name: /全部/ }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('group', { name: '本页任务状态' }).getByRole('button', { name: /已跳过/ }).click()
  assert.equal(await page.locator('.inbox-task').count(), 0)
  await page.getByRole('button', { name: '重置筛选', exact: true }).click()
  assert.equal(await page.locator('.inbox-task').count(), 3)
  await page.locator('.task-receipt-title').first().click()
  const edit = page.getByRole('textbox', { name: '修改任务标题' })
  await edit.fill('这个草稿需要保留')
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('button', { name: '花园漫步' }).click()
  await page.keyboard.press('Escape')
  assert.equal(await edit.inputValue(), '这个草稿需要保留')
  for (const width of [2560, 1600, 800, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 }); await settle(); await noOverflow('Task desk ' + width)
    await shot('task-desk-' + width)
  }
  assert.equal(requests.filter(r => r.method !== 'GET').length, 0, 'Visual changes never save or send Agent messages')
  assert.deepEqual(errors, [])
  console.log('PASS: 8-asset pixel studio, scenes/focus/storage/Escape, composer dominance, gallery/list, page-local status filters/density/page reset, draft preservation, 320–2560. Screenshots: ' + artifacts)
} finally { console.log('World studio artifacts: ' + artifacts); await browser.close() }
