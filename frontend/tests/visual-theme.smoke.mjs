import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-pixel-landscapes-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 }, locale: 'zh-CN' })
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const user = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
const goals = ['ACTIVE', 'READY_TO_PLAN', 'COMPLETED'].map((status, index) => ({ id: index + 1, status, goalText: ['完成一个可以独立部署的 Java 后端项目', '用十二周建立自己的英语学习系统', '让阅读成为生活的一部分'][index], createdAt: '2026-09-03T21:30:00' }))
const requests = [], errors = []
let loginFailure = true, release, hold
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method(), body: request.postData() })
  let data, status = 200
  if (path === '/api/auth/login') {
    if (hold) await hold
    if (loginFailure) { status = 400; data = { message: '账号或密码不正确，请重新输入。' } }
    else data = { accessToken: 'mock-theme-session', user }
  } else if (path === '/api/auth/me') data = user
  else if (path === '/api/goals') data = { items: goals, total: goals.length, page: 1, totalPages: 1 }
  else if (path === '/api/goals/1') data = goals[0]
  else if (path === '/api/goals/1/active-plan') data = { goalId: 1, planId: 10, versionNumber: 1, status: 'ACTIVE', planTitle: '从想法到可交付的项目', planSummary: '先建立基础，再完成主要功能。', createdAt: '2026-09-03T21:30:00', stages: [{ stageId: 1, title: '先让项目运行起来', timeRange: '第 1 至 2 周', objective: '验证一条完整的接口链路。', tasks: [{ taskId: 1, title: '初始化项目', description: '建立项目并连接数据库。', completionCriteria: '本地启动并通过健康检查。', status: 'TODO' }] }] }
  else { status = 500; data = {}; errors.push('Unexpected API ' + path) }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const settle = () => page.waitForTimeout(400)
async function shot(name) { await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function noOverflow(label) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label) }
function contrast(hex1, hex2) {
  const l = hex => {
    const rgb = hex.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
  }
  const a = l(hex1), b = l(hex2)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184')
  await page.locator('.auth-artwork img').evaluate(img => img.decode())
  assert.ok(await page.locator('.auth-artwork img').evaluate(img => img.currentSrc.includes('goalpilot-pixel-city') && img.naturalWidth === 1536 && img.naturalHeight === 1024), 'Login combines the train, river, greenery, people and town')
  assert.equal(await page.locator('.auth-artwork img').evaluate(img => getComputedStyle(img).imageRendering), 'pixelated')
  assert.ok(await page.evaluate(async () => {
    await document.fonts.load('12px Silkscreen')
    return [...document.fonts].some(font => font.family === 'Silkscreen' && font.status === 'loaded')
  }), 'Pixel display font is bundled locally, including when font CDNs are unavailable')
  for (const [width, height] of [[2560, 1440], [1600, 1050], [800, 900], [390, 844], [320, 640]]) {
    await page.setViewportSize({ width, height }); await settle(); await noOverflow('Login overflow ' + width)
    assert.ok(await page.locator('.auth-panel').isVisible())
    await shot('login-' + width)
  }
  const tokens = await page.evaluate(() => Object.fromEntries(['--ink', '--ink-500', '--paper', '--canvas', '--accent', '--accent-deep'].map(name => [name, getComputedStyle(document.documentElement).getPropertyValue(name).trim()])))
  assert.ok(contrast(tokens['--ink'], tokens['--canvas']) >= 7, 'Main text contrast')
  assert.ok(contrast(tokens['--ink-500'], tokens['--paper']) >= 4.5, 'Muted text contrast')
  assert.ok(contrast(tokens['--accent'], '#ffffff') >= 4.5, 'Primary button contrast')
  assert.ok(contrast(tokens['--accent-deep'], '#ffffff') >= 4.5, 'Primary gradient end contrast')
  assert.ok(contrast('#b6c8c2', '#293e46') >= 4.5, 'Sidebar navigation contrast')
  await page.getByRole('button', { name: '创建账户', exact: true }).click()
  await page.locator('input[name="username"]').fill('a')
  await page.locator('input[name="email"]').fill('test@example.com')
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: /创建我的账户/ }).click()
  assert.match(await page.getByRole('alert').innerText(), /3–50/)
  assert.equal(requests.length, 0, 'Invalid registration does not call the API')
  await shot('registration-validation-320')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.locator('input[name="account"]').fill('jakin@example.com')
  await page.locator('input[name="password"]').fill('secret123')
  hold = new Promise(resolve => { release = resolve })
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).click()
  await page.locator('.spinner').waitFor()
  assert.ok(await page.getByRole('button', { name: '创建账户', exact: true }).isDisabled())
  release(); hold = null
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('input[name="account"]').inputValue(), 'jakin@example.com')
  assert.equal(await page.locator('input[name="password"]').inputValue(), 'secret123')
  assert.equal(requests.length, 1)
  loginFailure = false
  await page.getByRole('button', { name: '进入 GoalPilot', exact: true }).click()
  await page.locator('.composer-view').waitFor()
  assert.deepEqual(JSON.parse(requests.filter(r => r.path.endsWith('/login'))[1].body), { account: 'jakin@example.com', password: 'secret123' })
  for (const [width, height] of [[2560, 1440], [1600, 1050], [1320, 900], [1100, 900], [961, 900], [960, 900], [800, 900], [390, 844], [320, 640]]) {
    await page.setViewportSize({ width, height }); await settle(); await noOverflow('Home overflow ' + width)
    await page.locator('.garden-art img').evaluate(img => img.decode())
    await page.locator('.composer-scenery img').evaluate(img => img.decode())
    assert.ok(await page.locator('.composer-scenery img').evaluate(img => img.currentSrc.includes('goalpilot-pixel-riverside') && img.naturalWidth / img.naturalHeight === 3), 'Home uses a panoramic river city, with room for the landscape')
    assert.ok(await page.locator('.garden-art img').evaluate(img => img.currentSrc.includes('goalpilot-pixel-station')), 'Station, trees and people complement the river city panorama')
    assert.ok(await page.locator('.composer-scenery').isVisible(), 'City scene remains visible at ' + width)
    assert.equal(await page.locator('.progress-garden').isVisible(), width > 960, 'Route guide adapts at ' + width)
    const bounds = await page.locator('.writing-card').boundingBox()
    const scenery = await page.locator('.editorial-heading').boundingBox()
    assert.ok(bounds.y >= scenery.y + scenery.height, 'Artwork never covers the composer')
    assert.ok(await page.getByRole('textbox', { name: '我的目标' }).evaluate(el => !getComputedStyle(el).fontFamily.includes('Silkscreen')), 'Chinese prose retains readable sans-serif typography')
    if ([2560, 1600, 390].includes(width)) await shot('home-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1050 })
  await page.locator('.sidebar-scenery img').evaluate(img => img.decode())
  assert.ok(await page.locator('.sidebar-scenery img').evaluate(img => img.currentSrc.includes('goalpilot-pixel-highlands')))
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.goal-card').first().waitFor(); await settle(); await shot('collection-1600')
  await page.locator('.collection-art img').evaluate(img => img.decode())
  assert.ok(await page.locator('.collection-art img').evaluate(img => img.currentSrc.includes('goalpilot-pixel-courtyard')), 'The bookshop garden remains part of the balanced visual theme')
  await page.locator('.goal-card').first().getByRole('button', { name: '进入会话' }).click()
  await page.locator('.question-form').waitFor()
  await page.locator('.welcome-station').evaluate(img => img.decode())
  assert.ok(await page.locator('.welcome-station').evaluate(img => img.currentSrc.includes('goalpilot-pixel-courtyard')), 'Conversation welcome retains the reading garden')
  await page.locator('.session-tools').getByRole('button', { name: /计划与任务/ }).click()
  await page.locator('.task-row').waitFor(); await settle(); await shot('conversation-tools-1600')
  assert.ok(await page.locator('.task-check .check-box').isVisible(), 'Manual task checkbox uses the pixel theme')
  assert.ok(await page.getByRole('progressbar', { name: '任务完成进度' }).getAttribute('aria-valuenow') === '0')
  await page.getByRole('button', { name: '关闭工具面板，返回对话' }).click(); await settle()
  assert.equal(await page.locator('.session-panel').isVisible(), false)
  const question = page.getByRole('textbox', { name: '向 GoalPilot 提问' })
  await question.fill('先保留这条还没有发送的问题')
  await question.focus(); await shot('conversation-focus')
  const focusShadow = await page.locator('.question-form').evaluate(el => getComputedStyle(el).boxShadow)
  await page.locator('.session-tools').getByRole('button', { name: /目标资料/ }).click()
  assert.ok(await page.locator('.session-panel').isVisible())
  await page.keyboard.press('Escape'); await settle()
  assert.equal(await question.inputValue(), '先保留这条还没有发送的问题')
  assert.notEqual(focusShadow, 'none')
  await page.setViewportSize({ width: 320, height: 640 }); await settle()
  assert.ok(await page.locator('.question-form').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight))
  await noOverflow('Conversation overflow at 320 × 640')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.session-tools').getByRole('button', { name: /计划与任务/ }).click(); await settle()
  assert.ok(parseFloat(await page.locator('.session-panel').evaluate(el => getComputedStyle(el).animationDuration)) < .01)
  await shot('tools-mobile-reduced-motion')
  assert.equal(requests.filter(r => !['GET'].includes(r.method)).length, 2, 'Only two explicit login attempts wrote data')
  assert.deepEqual(errors, [])
  console.log('PASS: balanced pixel railway, town and nature scenes, local pixel font and generated art, contrast, readable prose, responsive scene/composer separation, login/register/error/busy guards, manual checklist, focus and reduced motion, 320–2560 layouts. Screenshots: ' + artifacts)
} finally { console.log('Theme artifacts: ' + artifacts); await browser.close() }
