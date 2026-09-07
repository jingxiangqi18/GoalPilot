import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Requires a local Playwright installation; every API call is mocked.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-smoke-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'smoke-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const requests = []
let queryStatus = 200
let failClarification = false
const items = [
  { id: 11, goalText: '做一个可以展示的 Java 项目', status: 'DRAFT' },
  { id: 12, goalText: '建立自己的阅读系统', status: 'READY_TO_PLAN' },
  { id: 13, goalText: '规律跑步，完成一次半程马拉松', status: 'ACTIVE' },
].map(goal => ({ ...goal, createdAt: '2026-09-05T10:00:00', priority: 'MEDIUM' }))
const analysis = {
  analysisId: 91, goalId: 42, versionNumber: 1, createdAt: '2026-09-05T10:00:00',
  goalSummary: '完成一个 Java 后端项目，方向为 Agent 服务，使用 Spring Boot 与 MySQL。',
  knownInformation: ['已有一定 Java 基础', '期望产出可部署的项目'], missingInformation: ['时间投入', '项目展示方式'],
  readiness: 'NEEDS_CLARIFICATION',
  clarificationQuestions: [{ questionId: 101, question: '每周可以投入多少小时？' }, { questionId: 102, question: '最终希望怎样展示项目？' }],
}
const plan = {
  planId: 77, goalId: 42, sourceAnalysisId: 92, versionNumber: 1, status: 'DRAFT', createdAt: '2026-09-05T10:00:00',
  planTitle: '从想法到作品：项目实践路线', planSummary: '先明确项目边界，再实现核心功能，最后完成验证与部署。',
  stages: ['明确方向与搭建基础', '实现与验证核心功能'].map((title, index) => ({
    stageId: 20 + index, title, timeRange: index ? '第 3—6 周' : '第 1—2 周', objective: '完成可以独立验证的阶段成果。',
    tasks: [{ taskId: 30 + index, title: '阶段任务 ' + (index + 1), description: '整理方案，逐步实现并记录过程。', completionCriteria: '能够独立运行，并通过测试。', status: index ? 'TODO' : 'DONE' }],
  })),
}
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const req = route.request()
  const path = new URL(req.url()).pathname
  requests.push({ path, method: req.method(), body: req.postDataJSON() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path.endsWith('/active-plan')) {
    status = queryStatus
    data = status === 200 ? { ...plan, goalId: 13, versionNumber: 3, status: 'ACTIVE' } : { message: status === 404 ? '当前没有正式计划' : '正式计划状态异常' }
  }
  else if (path === '/api/goals' && req.method() === 'GET') data = { items, page: 1, total: items.length, totalPages: 1 }
  else if (path === '/api/goals' && req.method() === 'POST') data = { id: 42, ...req.postDataJSON() }
  else if (path.endsWith('/analyze')) { await new Promise(resolve => setTimeout(resolve, 250)); data = analysis }
  else if (path.endsWith('/clarifications')) {
    if (failClarification) { status = 502; data = { message: '模拟补充信息提交失败' }; failClarification = false }
    else data = { ...analysis, analysisId: 92, readiness: 'READY', clarificationQuestions: [], missingInformation: [] }
  }
  else if (path === '/api/plans/generate') data = plan
  else if (path === '/api/plans/77/approve') data = { planStatus: 'ACTIVE', goalStatus: 'ACTIVE', versionNumber: 1 }
  else if (path.startsWith('/api/goals/')) data = items.find(goal => goal.id === Number(path.split('/').at(-1)))
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})

const settle = () => page.waitForTimeout(450)
async function snapshot(name) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await settle(); await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true }) }
async function noOverflow(label) {
  const sizes = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  assert.ok(sizes[0] <= sizes[1] + 1, label + ' overflow: ' + sizes)
}
async function stage(index) { await page.locator('.journey-nav li').nth(index - 1).getByRole('button').click(); await settle() }
const description = '完成一个可以实际部署的 Java 项目'
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('#goal-input').waitFor()
  if (process.env.CHARM_OUTPUT) {
    const encoded = await page.locator('.companion-art img').evaluate(async image => {
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 384; canvas.height = 384
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, 384, 384)
      if (ctx.getImageData(0, 0, 1, 1).data[3] !== 0) throw new Error('Charm is not transparent')
      return canvas.toDataURL('image/webp', .88).split(',')[1]
    })
    await writeFile(process.env.CHARM_OUTPUT, Buffer.from(encoded, 'base64'))
  }
  await snapshot('composer-1600')
  assert.doesNotMatch(await page.locator('.composer-actions').innerText(), /Enter|Ctrl|快速继续/)
  assert.equal(await page.locator('.example-grid button').first().evaluate(el => getComputedStyle(el).borderTopWidth), '0px')
  await page.locator('.example-grid button').first().hover()
  await settle()
  await page.locator('.prompt-module').screenshot({ path: join(artifacts, 'inspiration-hover.png') })
  await page.locator('#goal-input').fill(description)
  await page.locator('.details-toggle').click()
  await page.locator('#goal-deadline').fill('三个月内')
  await page.locator('#goal-timeBudget').fill('每周 5 小时')
  await page.locator('#goal-success').fill('可以独立部署')
  await snapshot('composer-details-1600')
  await page.locator('.example-grid button').first().click()
  assert.equal(await page.locator('#goal-input').inputValue(), description)
  await page.getByRole('button', { name: '保留原文' }).click()
  await page.locator('.example-grid button').first().click()
  await page.getByRole('button', { name: '使用示例', exact: true }).click()
  assert.match(await page.locator('#goal-input').inputValue(), /Java 后端实习/)
  assert.equal(await page.locator('#goal-deadline').inputValue(), '三个月内')
  await page.locator('#goal-input').fill('目'.repeat(995))
  assert.equal(await page.locator('.analyze-button').isDisabled(), true)
  await page.getByRole('alert').filter({ hasText: '合计超出' }).waitFor()
  await page.locator('#goal-input').fill(description)
  for (const width of [2560, 1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow('composer ' + width)
    if (width === 390) await snapshot('composer-390')
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  // The visual shortcut hint is removed, but the keyboard action is unchanged.
  await page.locator('#goal-input').press('Control+Enter')
  await page.locator('#analysis').waitFor()
  const create = requests.find(request => request.path === '/api/goals' && request.method === 'POST')
  assert.deepEqual(create.body, { goalText: description + '\n期待完成时间：三个月内\n可投入的时间：每周 5 小时\n怎样算完成：可以独立部署' })
  await page.locator('.answer-surface textarea').fill('每周 10 小时')
  await page.getByRole('button', { name: '下一题' }).click()
  await page.locator('#clarification-answer-1').waitFor()
  await page.locator('.answer-surface textarea').fill('演示视频与部署文档')
  await page.getByRole('button', { name: '上一题' }).click()
  await page.locator('#clarification-answer-0').waitFor()
  assert.equal(await page.locator('.answer-surface textarea').inputValue(), '每周 10 小时')
  await snapshot('questions-1600')
  assert.doesNotMatch(await page.locator('body').innerText(), /#[0-9]+/)
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await noOverflow('questions ' + width)
    if (width === 390) await snapshot('questions-390')
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await stage(1)
  assert.equal(await page.locator('#goal-deadline').inputValue(), '三个月内')
  await page.getByRole('button', { name: '返回目标画像' }).click()
  await page.locator('#analysis').waitFor()
  assert.equal(await page.locator('.answer-surface textarea').inputValue(), '每周 10 小时')
  failClarification = true
  await page.getByRole('button', { name: '提交全部回答' }).click()
  await page.getByRole('alert').filter({ hasText: '模拟补充信息提交失败' }).waitFor()
  assert.equal(await page.locator('.answer-surface textarea').inputValue(), '每周 10 小时')
  await page.getByRole('button', { name: '提交全部回答' }).click()
  const clarification = requests.find(request => request.path.endsWith('/clarifications'))
  assert.deepEqual(clarification.body.answers, [{ questionId: 101, answer: '每周 10 小时' }, { questionId: 102, answer: '演示视频与部署文档' }])
  await page.locator('.light-button').click()
  await page.locator('#plan').waitFor()
  await page.locator('.approve-button').click()
  await page.getByRole('button', { name: '确定启用正式版本' }).click()
  await page.locator('.approval-complete').waitFor()
  await page.getByRole('button', { name: '规划其他目标' }).click()
  await page.locator('#goal-input').waitFor()
  await page.locator('#goal-input').fill('这是尚未提交的另一个目标')
  await page.locator('.details-toggle').click()
  await page.locator('#goal-deadline').fill('下个月')
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  queryStatus = 500
  await page.getByRole('button', { name: '查看正式计划' }).click()
  await page.getByRole('heading', { name: '正式计划读取失败' }).waitFor()
  queryStatus = 404
  await page.getByRole('button', { name: '重新读取' }).click()
  await page.getByRole('heading', { name: '暂时没有可读取的正式计划' }).waitFor()
  queryStatus = 200
  await page.getByRole('button', { name: '重新读取' }).click()
  await page.locator('.saved-plan-view #plan').waitFor()
  assert.equal(await page.locator('.saved-plan-view .approve-button').count(), 0)
  assert.match(await page.locator('.saved-plan-view').innerText(), /正式计划已启用 · V3/)
  assert.match(await page.locator('.saved-plan-view').innerText(), /已完成/)
  await snapshot('saved-plan-1600')
  assert.doesNotMatch(await page.locator('body').innerText(), /#[0-9]+/)
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await noOverflow('saved plan ' + width)
  }
  assert.ok(requests.filter(request => request.path.endsWith('/active-plan')).every(request => request.method === 'GET'))
  assert.equal(requests.filter(request => request.path === '/api/plans/generate').length, 1)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.locator('.main-nav').getByRole('button', { name: '规划工作台' }).click()
  await page.locator('#goal-input').waitFor()
  assert.equal(await page.locator('#goal-input').inputValue(), '这是尚未提交的另一个目标')
  assert.equal(await page.locator('#goal-deadline').inputValue(), '下个月')
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.locator('.card-open').nth(2).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: '查看正式计划' }).click()
  await page.locator('.saved-plan-view #plan').waitFor()
  assert.equal(await page.evaluate(() => document.querySelector('#app').inert), false)
  assert.doesNotMatch(await page.locator('.saved-plan-view').innerText(), /任务记录\s*#|来源分析\s*#|计划记录\s*#/)

  // Archive: two cards must fill the row even on a 27-inch display.
  items.splice(0, items.length,
    { id: 12, goalText: '三个月内完成一个适合找 Java 后端实习的项目', status: 'READY_TO_PLAN', createdAt: '2026-09-03T20:20:00', updatedAt: '2026-09-03T20:24:00' },
    { id: 13, goalText: '规律跑步，完成一次半程马拉松', status: 'ACTIVE', createdAt: '2026-09-05T10:00:00', priority: 'MEDIUM' },
  )
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.getByRole('button', { name: '刷新目标列表' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.goal-card').length === 2)
  for (const width of [2560, 1600, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await settle(); await noOverflow('archive ' + width)
    if (width >= 1280) {
      const layout = await page.locator('.goal-grid').evaluate(grid => ({
        grid: grid.getBoundingClientRect().right,
        last: grid.lastElementChild.getBoundingClientRect().right,
        padding: parseFloat(getComputedStyle(grid).paddingRight),
      }))
      assert.ok(Math.abs(layout.grid - layout.last - layout.padding) < 2, 'Sparse archive leaves empty grid columns')
    }
    if ([2560, 1600, 390].includes(width)) await snapshot('archive-' + width)
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.getByRole('searchbox', { name: '搜索本页目标' }).fill('不会匹配的文字')
  await page.getByRole('heading', { name: '暂时没有匹配的目标' }).waitFor()
  await page.getByRole('button', { name: /清除筛选/ }).click()
  await page.getByRole('group', { name: '本页目标状态筛选' }).getByRole('button', { name: '待规划', exact: true }).click()
  await settle()
  assert.equal(await page.locator('.card-open').count(), 1)
  await page.getByRole('group', { name: '本页目标状态筛选' }).getByRole('button', { name: '全部', exact: true }).click()
  await settle()
  const detailTrigger = page.locator('.card-open').first()
  await detailTrigger.click()
  const dialog = page.getByRole('dialog', { name: '目标详情' })
  await dialog.getByRole('heading', { name: items[0].goalText }).waitFor()
  assert.doesNotMatch(await dialog.innerText(), /记录 ID|#[0-9]+|READY_TO_PLAN/)
  assert.match(await dialog.innerText(), /成功标准与约束条件尚未记录/)
  await snapshot('detail-ready-1600')
  await dialog.getByRole('button', { name: '关闭', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  assert.equal(await dialog.getByRole('button', { name: '生成计划草稿' }).evaluate(button => button === document.activeElement), true)
  await page.keyboard.press('Tab')
  assert.equal(await dialog.getByRole('button', { name: '关闭', exact: true }).evaluate(button => button === document.activeElement), true)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 }); await settle(); await noOverflow('drawer ' + width)
    assert.ok(await page.locator('.detail-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
    assert.ok(await page.locator('.drawer-footer').evaluate(el => el.getBoundingClientRect().bottom <= window.innerHeight))
    if (width === 390) await snapshot('detail-ready-390')
  }
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
  assert.equal(await detailTrigger.evaluate(el => document.activeElement === el), true)
  assert.equal(await page.evaluate(() => document.querySelector('#app').inert), false)

  // Long content and populated boundaries remain readable inside the scroll area.
  const originalText = items[0].goalText
  items[0].goalText = '这是一个需要完整保留而不能省略的长期学习目标。'.repeat(35) + '\n可投入的时间：每周五小时'
  items[0].successCriteria = '完成部署与测试，保留可复现的项目说明。\n整理阶段成果。'
  items[0].constraintText = '兼顾课程学习，每周固定投入五小时。'
  await detailTrigger.click()
  await dialog.getByRole('heading', { name: '目标边界' }).waitFor()
  assert.match(await dialog.innerText(), /可投入的时间：每周五小时/)
  assert.match(await dialog.innerText(), /兼顾课程学习/)
  assert.ok(await page.locator('.detail-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
  await snapshot('detail-long-320')
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
  items[0].goalText = originalText
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.main-nav').getByRole('button', { name: '规划工作台' }).click()
  await page.locator('#goal-input').waitFor()
  assert.ok(parseFloat(await page.locator('.companion-art img').evaluate(image => getComputedStyle(image).transitionDuration)) < .001)
  assert.deepEqual(errors, [])
  console.log('PASS: structured input; question navigation/preservation/retry; generation/approval; saved plan GET with 404/500/retry; draft preservation; archive search/filter/adaptive cards; hidden internal IDs; drawer focus/Escape/long text; responsive 320–2560; reduced motion.')
  console.log('Screenshots:', artifacts)
} catch (error) {
  console.log('Page content:', (await page.locator('body').innerText()).slice(-3500))
  console.log('Browser errors:', errors)
  throw error
} finally { await browser.close() }
