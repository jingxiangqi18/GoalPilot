import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-cityscape-'))
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
async function shot(name) {
  await settle()
  for (const img of await page.locator('.world-art:visible').all()) await img.evaluate(image => image.decode())
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
const noOverflow = async name => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name)
async function assertFullScenery(target = page) {
  const framing = await target.locator('.ambient-landscape').evaluate(async image => {
    await image.decode()
    await Promise.all(image.getAnimations().map(animation => animation.finished.catch(() => {})))
    const rect = image.getBoundingClientRect(), style = getComputedStyle(image)
    return { ratio: rect.width / rect.height, original: image.naturalWidth / image.naturalHeight,
      opacity: style.opacity, fit: style.objectFit, mask: style.maskImage, filter: style.filter }
  })
  assert.ok(Math.abs(framing.ratio - framing.original) < .01, 'Home scenery preserves its native aspect ratio, including the 3:2 city atlas')
  assert.equal(framing.opacity, '1', 'Do not wash out the whole illustration')
  assert.equal(framing.fit, 'contain', 'Do not crop the skyline and foreground into a shallow strip')
  assert.equal(framing.filter, 'none')
  assert.match(framing.mask, /86%/, 'Only the last 14% of the scene fades into the canvas')
}
try {
  await page.goto(root + '/#/new')
  const draft = page.getByRole('textbox', { name: '我的目标', exact: true })
  await draft.fill('先保留这个想法，再换一座城市')
  async function selectScene(label) {
    const trigger = page.getByRole('button', { name: '工作室外观', exact: true })
    if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click()
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => [...document.querySelectorAll('.world-art')].every(image => image.dataset.art === image.dataset.displayedArt))
  }
  const mapping = [['河岸小城', 'harbor'], ['花园漫步', 'garden'], ['蓝调夜行', 'night-rail'], ['新加坡', 'singapore']]
  const backgrounds = []
  for (const [label, scene] of mapping) {
    await selectScene(label)
    const expected = scene === 'singapore' ? 'singapore-atlas' : scene
    assert.equal(await page.locator('.ambient-landscape').getAttribute('data-art'), expected)
    assert.equal(await page.locator('.sidebar-scenery').getAttribute('data-art'), expected)
    assert.ok((await page.locator('.recent-cover').evaluateAll(images => images.map(image => image.dataset.art))).every(key => scene === 'singapore' ? key.startsWith('singapore-') : key === scene))
    assert.equal(await page.locator('html').getAttribute('data-scenery'), scene)
    backgrounds.push(await page.locator('.sidebar').evaluate(el => getComputedStyle(el).backgroundImage))
    assert.match(await draft.inputValue(), /保留这个想法/)
    await assertFullScenery()
    await shot(scene + '-home-1600')
  }
  assert.equal(new Set(backgrounds).size, 4, 'Every theme changes the sidebar palette, not only the thumbnail')
  for (const image of await page.locator('.workspace-scenery .world-art').all()) {
    await image.evaluate(img => img.decode())
    assert.match(await image.getAttribute('data-art'), /^singapore-/)
  }
  await shot('singapore-home-1600')
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await shot('city-picker')
  // The complete preference is shared with another open tab.
  const other = await context.newPage()
  await other.goto(root + '/#/new')
  await other.getByRole('textbox', { name: '我的目标', exact: true }).fill('另一个标签的草稿')
  await page.getByRole('button', { name: '蓝调夜行', exact: true }).click()
  await other.waitForFunction(() => document.documentElement.dataset.scenery === 'night-rail')
  assert.equal(await other.getByRole('textbox', { name: '我的目标', exact: true }).inputValue(), '另一个标签的草稿')
  await other.close()
  for (const label of ['河岸小城', '新加坡', '花园漫步', '新加坡']) await page.getByRole('button', { name: label, exact: true }).click()
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('.ambient-landscape').dataset.displayedArt === 'singapore-atlas')
  assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('goalpilot.world-appearance.v1'))).scene, 'singapore')
  await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click()
  await page.locator('.inbox-task').first().waitFor()
  const seen = []
  for (const [label, scene] of mapping) {
    await selectScene(label)
    const expected = scene === 'singapore' ? 'singapore-gardens' : scene
    assert.equal(await page.locator('.desk-landscape').getAttribute('data-art'), expected)
    seen.push(await page.locator('.desk-landscape').getAttribute('src'))
  }
  assert.equal(new Set(seen).size, 4, 'Regression: river and garden no longer share the same ToDo picture')
  assert.equal(await page.locator('.desk-heading .back-to-workspace').count(), 0)
  assert.ok(await page.evaluate(() => {
    const back = document.querySelector('.back-to-workspace').getBoundingClientRect()
    const landscape = document.querySelector('.desk-heading').getBoundingClientRect()
    return back.bottom <= landscape.top
  }), 'Return action is above and outside the gradient artwork')
  await page.locator('.task-receipt-title').first().click()
  const edit = page.getByRole('textbox', { name: '修改任务标题' })
  await edit.fill('主题切换不得提交或丢弃资料')
  await selectScene('蓝调夜行')
  await selectScene('新加坡')
  assert.equal(await edit.inputValue(), '主题切换不得提交或丢弃资料')
  await shot('singapore-todo-1600')
  await page.getByRole('button', { name: '回到工作台', exact: true }).click()
  assert.match(await draft.inputValue(), /保留这个想法/)
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.goal-card').first().waitFor()
  assert.equal(await page.locator('.library-landscape').getAttribute('data-art'), 'singapore-quays')
  const secondCover = await page.locator('.goal-cover').nth(1).getAttribute('src')
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('阅读系统')
  await page.waitForFunction(() => document.querySelectorAll('.goal-card').length === 1)
  assert.equal(await page.locator('.goal-cover').first().getAttribute('src'), secondCover, 'Filtering does not reassign the goal cover')
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('')
  await page.waitForFunction(() => document.querySelectorAll('.goal-card').length === 3)
  await shot('singapore-library-1600')
  await page.locator('.goal-card').last().getByRole('button', { name: '进入会话', exact: true }).click()
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('这条问题还没有发送')
  assert.equal(await page.locator('.welcome-station').getAttribute('data-art'), 'singapore-shophouse')
  await selectScene('花园漫步'); await selectScene('新加坡')
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '这条问题还没有发送')
  await shot('singapore-conversation')
  await page.locator('.main-nav').getByRole('button', { name: /规划工作台/ }).click()
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  await page.getByRole('checkbox', { name: '专注模式' }).check({ force: true })
  assert.equal(await page.locator('.workspace-scenery').isVisible(), false)
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('data-scenery'), 'singapore')
  await page.getByRole('button', { name: '工作室外观', exact: true }).click()
  assert.equal(await page.getByRole('checkbox', { name: '专注模式' }).isChecked(), true)
  await page.getByRole('checkbox', { name: '专注模式' }).uncheck({ force: true })
  await page.keyboard.press('Escape')
  for (const [width, height] of [[2560, 1440], [800, 900], [390, 844], [320, 640], [320, 440]]) {
    await page.setViewportSize({ width, height }); await settle(); await noOverflow('City home ' + width)
    await assertFullScenery()
    assert.ok((await page.locator('.writing-card').boundingBox()).y < height * .65, 'Even on a short phone the composer is in the first viewport')
    await shot('singapore-home-' + width + '-' + height)
    await page.getByRole('button', { name: '工作室外观', exact: true }).click()
    const panel = await page.locator('.appearance-panel').boundingBox()
    assert.ok(panel.x >= 0 && panel.x + panel.width <= width && panel.y + panel.height <= height)
    await page.getByRole('button', { name: '新加坡', exact: true }).click()
    await page.keyboard.press('Escape')
    if (width > 800) await page.locator('.main-nav').getByRole('button', { name: /待办清单/ }).click()
    else await page.locator('.mobile-nav').getByRole('button', { name: '待办', exact: true }).click()
    await page.locator('.desk-landscape').waitFor(); await noOverflow('City ToDo ' + width)
    if (width <= 620) {
      assert.ok(await page.evaluate(() => {
        const art = document.querySelector('.desk-landscape').getBoundingClientRect()
        const title = document.querySelector('.desk-heading-copy').getBoundingClientRect()
        return art.bottom <= title.top
      }), 'On phones, text sits below the clear artwork instead of requiring a full-image wash')
    }
    await shot('singapore-todo-' + width + '-' + height)
    await page.getByRole('button', { name: '回到工作台', exact: true }).click()
  }
  // Simulate a slow image response instead of relying only on cached switches.
  const race = await context.newPage()
  let releaseGarden, releaseAtlas
  const gardenGate = new Promise(resolve => { releaseGarden = resolve })
  const atlasGate = new Promise(resolve => { releaseAtlas = resolve })
  await race.addInitScript(() => localStorage.setItem('goalpilot.world-appearance.v1', JSON.stringify({ scene: 'harbor', focused: false })))
  let heldImages = 0
  await race.route('**/goalpilot-world-garden-v1-*', async route => { heldImages++; await gardenGate; await route.continue() })
  // Register before opening the picker, which also loads the city thumbnail.
  await race.route('**/goalpilot-world-singapore-atlas-v1-*', async route => { await atlasGate; await route.continue() })
  try {
    await race.goto(root + '/#/new')
    await race.locator('.ambient-landscape').evaluate(image => image.decode())
    await race.getByRole('button', { name: '工作室外观', exact: true }).click()
    await race.getByRole('button', { name: '花园漫步', exact: true }).click()
    await race.waitForFunction(() => document.querySelector('.ambient-landscape').dataset.art === 'garden')
    assert.ok(heldImages > 0)
    assert.equal(await race.locator('.ambient-landscape').getAttribute('data-displayed-art'), 'harbor', 'A loading theme retains the last complete image')
    await race.getByRole('button', { name: '蓝调夜行', exact: true }).click()
    await race.waitForFunction(() => document.querySelector('.ambient-landscape').dataset.displayedArt === 'night-rail')
    releaseGarden()
    await race.waitForTimeout(350)
    assert.equal(await race.locator('.ambient-landscape').getAttribute('data-displayed-art'), 'night-rail', 'Late garden decode cannot replace the latest night selection')
    // Switching between 3:1 and 3:2 sources must not stretch the previous frame.
    try {
      await race.getByRole('button', { name: '新加坡', exact: true }).click()
      await race.waitForFunction(() => document.querySelector('.ambient-landscape').dataset.art === 'singapore-atlas')
      assert.equal(await race.locator('.ambient-landscape').getAttribute('height'), '512', 'Keep the old dimensions until the new source is decoded')
      releaseAtlas()
      await race.waitForFunction(() => document.querySelector('.ambient-landscape').dataset.displayedArt === 'singapore-atlas')
      assert.equal(await race.locator('.ambient-landscape').getAttribute('height'), '1024')
      await assertFullScenery(race)
    } finally { releaseAtlas() }
  } finally { releaseGarden(); releaseAtlas(); await race.close() }
  assert.equal(requests.filter(request => request.method !== 'GET').length, 0)
  assert.deepEqual(errors, [])
  console.log('PASS: four themes, native-ratio full-color scenery, localized masks, short-phone composer, slow-image aspect transitions, stable covers, cross-tab/reload/focus, preserved drafts and 320–2560 layouts. Artifacts: ' + artifacts)
} finally { console.log('City artifacts: ' + artifacts); await browser.close() }
