import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Read-only review with a realistic four-stage plan. All API requests are mocked.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-reading-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'reading-test-only'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(12000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()) })
const requests = []
const goal = { id: 13, goalText: '三个月内完成一个适合找 Java 后端实习的项目', status: 'ACTIVE', createdAt: '2026-09-03T20:20:00' }
const titles = ['项目搭建与基础核心模块', '核心业务与内容管理', '互动功能与搜索体验', '优化完善与作品交付']
const taskTitles = [
  ['初始化项目与技术栈集成', '设计数据库与基础数据模型', '实现用户注册与身份认证', '完成文章发布与基础查询'],
  ['完善文章管理', '整理内容分类与标签', '实现评论与权限校验', '补齐核心接口测试'],
  ['实现点赞与收藏', '加入关注与消息通知', '提供内容搜索', '验证多用户互动流程'],
  ['排查性能瓶颈', '统一异常与日志处理', '整理接口文档', '部署项目并准备演示'],
]
const summary = '本计划以三个月为周期，按“基础框架—核心功能—互动功能—优化完善”的顺序推进项目。前期先搭建项目骨架与权限认证，保证文章、用户、评论等核心流程可用；中期完成点赞收藏、关注、私信通知与搜索等扩展功能。后期集中处理缓存性能、异常处理、接口整理与测试文档，最终达到适合 Java 后端实习求职展示的项目完成度。所有管理操作均集成在前台，不设独立管理后台。'
let plan = {
  planId: 77, goalId: 13, versionNumber: 1, status: 'ACTIVE', createdAt: '2026-09-03T21:30:00',
  planTitle: '三个月 Java 后端博客项目开发计划', planSummary: summary,
  stages: titles.map((title, index) => ({
    stageId: 20 + index, title, timeRange: ['第 1 至 2 周', '第 3 至 5 周', '第 6 至 9 周', '第 10 至 12 周'][index],
    objective: ['完成 Spring Boot 项目初始化、数据库设计及用户、认证基础能力，确保项目可运行、可注册登录。', '把核心业务串联成完整流程，保证常见场景与异常场景都能稳定运行。', '完善用户之间的互动体验，让信息能够被检索、收藏和分享。', '交付可独立部署的完整作品，整理能在面试中清晰介绍的技术材料。'][index],
    tasks: taskTitles[index].map((title, taskIndex) => ({
      taskId: 100 + index * 4 + taskIndex, title, status: ['IN_PROGRESS', 'TODO', 'DONE', 'SKIPPED'][taskIndex],
      description: index === 0 && taskIndex === 0 ? '使用 Spring Boot 创建项目，引入 MySQL 驱动、Spring Security、Redis 客户端、MyBatis-Plus 或 Spring Data JPA 等常用依赖。配置数据库与 Redis 连接信息，搭建统一异常处理和统一返回结果。' : '明确这项任务的输入与输出，逐步实现核心逻辑，并记录关键的技术选择。覆盖正常流程和失败场景，保留可复现的验证步骤。',
      completionCriteria: '项目可以本地启动并连接数据库；健康检查接口返回正常；代码已提交到版本库，配置中不包含明文密钥。',
    })),
  })),
}
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), path = new URL(request.url()).pathname
  requests.push({ path, method: request.method() })
  let data, status = 200
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals') data = { items: [goal], total: 1, page: 1, totalPages: 1 }
  else if (path === '/api/goals/13') data = goal
  else if (path === '/api/goals/13/active-plan') data = plan
  else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const settle = () => page.waitForTimeout(450)
const directory = page.locator('.stage-directory button')
const tasks = page.locator('.task-heading button')
async function screenshot(name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await settle()
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
async function assertStage(index) {
  await page.locator('.stage-title').filter({ hasText: titles[index] }).waitFor()
  assert.equal(await page.locator('.stage-card').count(), 1)
  assert.equal(await directory.nth(index).getAttribute('aria-pressed'), 'true')
}
async function refresh() {
  const response = page.waitForResponse(res => res.url().endsWith('/api/goals/13/active-plan'))
  await page.getByRole('button', { name: '刷新计划', exact: true }).click()
  await response
  await page.waitForFunction(() => !document.querySelector('.saved-plan-nav button:last-child').disabled)
  await page.locator('#plan').waitFor()
}

try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' })
  await page.locator('.main-nav').getByRole('button', { name: /我的目标/ }).click()
  await page.getByRole('button', { name: '查看正式计划', exact: true }).click()
  await assertStage(0)
  assert.equal(await directory.count(), 4)
  assert.equal(await tasks.count(), 4)
  assert.equal(await page.locator('.task-disclosure.open').count(), 1)
  assert.match(await page.locator('.date-stamp').getAttribute('aria-label'), /2026年9月3日 · 周四 · 21:30/)
  assert.equal(await page.locator('.date-stamp').getAttribute('datetime'), '2026-09-03T13:30:00.000Z')
  assert.doesNotMatch(await page.locator('#plan').innerText(), /\d{2,4}\/\d{1,2}\/\d{1,2}|#[0-9]+/)
  assert.equal(await page.locator('.snapshot-bar').count(), 0, 'Do not duplicate metadata in an extra row')
  await screenshot('plan-reading-1600')

  await page.getByRole('button', { name: '展开完整思路' }).click()
  assert.equal(await page.locator('.summary-points li').count(), 3)
  const visibleSummary = (await page.locator('.summary-lead').innerText()) + (await page.locator('.summary-points li').allTextContents()).join('')
  assert.equal(visibleSummary, summary, 'The complete original summary must remain available')
  await page.getByRole('button', { name: '收起完整思路' }).click()
  assert.equal(await page.locator('.summary-disclosure').getAttribute('inert'), '')

  // Disclosures are accessible by keyboard and remembered independently per stage.
  await tasks.nth(1).focus()
  await page.keyboard.press('Enter')
  assert.equal(await tasks.nth(1).getAttribute('aria-expanded'), 'true')
  const panelId = await tasks.nth(1).getAttribute('aria-controls')
  assert.equal(await page.locator(`[id="${panelId}"]`).getAttribute('aria-hidden'), 'false')
  await directory.nth(1).click()
  await assertStage(1)
  assert.equal(await tasks.nth(1).getAttribute('aria-expanded'), 'false')
  await directory.nth(0).click()
  await assertStage(0)
  assert.equal(await tasks.nth(1).getAttribute('aria-expanded'), 'true')
  await tasks.nth(1).click()
  await page.getByRole('button', { name: '下一阶段' }).click()
  await assertStage(1)
  await settle()
  assert.equal(await page.locator('.stage-title').evaluate(el => el === document.activeElement), true)
  await directory.nth(3).click()
  await assertStage(3)
  assert.equal(await page.getByRole('button', { name: '下一阶段' }).isDisabled(), true)
  await directory.nth(0).click()
  await assertStage(0)

  for (const width of [2560, 1920, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 900 : 1200 })
    await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Page overflow at ' + width)
    assert.ok(await page.locator('.stage-card').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Stage overflow at ' + width)
    if ([2560, 390].includes(width)) await screenshot('plan-reading-' + width)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: '下一阶段' }).click()
  await assertStage(1)
  await tasks.nth(0).click()
  assert.equal(await tasks.nth(0).getAttribute('aria-expanded'), 'false')
  assert.ok(parseFloat(await tasks.nth(0).evaluate(el => getComputedStyle(el).transitionDuration)) < .01)
  assert.ok(await directory.nth(1).evaluate(el => { const item = el.getBoundingClientRect(), container = el.closest('ol').getBoundingClientRect(); return item.left >= container.left - 1 && item.right <= container.right + 1 }), 'Selected mobile stage stays in view')

  // Empty and long server content must stay honest and usable.
  plan = { ...plan, planId: 78, createdAt: '', stages: [], planSummary: '' }
  await refresh()
  assert.equal(await page.locator('.empty-stages').isVisible(), true)
  assert.equal(await page.locator('.date-unknown').innerText(), '保存时间未记录')
  assert.equal(await page.locator('.stage-pagination').count(), 0)
  plan = { ...plan, planId: 79, updatedAt: '2026-09-07T09:05:00', planTitle: '长标题测试'.repeat(15), planSummary: '只有一段说明。', stages: [{ title: '很长的阶段名称'.repeat(10), timeRange: '自定义时间安排'.repeat(15), tasks: [], objective: '阶段目标'.repeat(30) }] }
  await refresh()
  assert.equal(await page.getByRole('button', { name: '展开完整思路' }).count(), 0)
  assert.equal(await page.locator('.task-empty').innerText(), '这个阶段暂未安排任务。')
  assert.match(await page.locator('.date-stamp').getAttribute('aria-label'), /最近更新：2026年9月7日 · 周一 · 09:05/)
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await settle()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Long content overflow at ' + width)
    assert.ok(await page.locator('.stage-card').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Long stage overflow at ' + width)
  }
  assert.ok(requests.every(request => request.method === 'GET'), 'Reading and switching must not write to the API')
  assert.deepEqual(errors, [])
  console.log('Plan reading checks passed. Screenshots: ' + artifacts)
} finally {
  await browser.close()
}
