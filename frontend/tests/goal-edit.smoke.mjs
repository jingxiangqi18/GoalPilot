import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chooseDateTime } from './helpers/date-picker.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const artifacts = await mkdtemp(join(tmpdir(), 'goalpilot-goal-edit-'))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
await context.addInitScript(() => localStorage.setItem('goalpilot.access_token', 'goal-edit-test'))
await context.route('https://fonts.googleapis.com/**', route => route.abort())
await context.route('https://fonts.gstatic.com/**', route => route.abort())
const goals = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'READY_TO_PLAN', 'NEEDS_CLARIFICATION'].map((status, index) => ({
  id: index + 1, goalText: `目标 ${index + 1}：完成一个可以部署的 Java 项目`, status,
  priority: index ? 'MEDIUM' : null, deadline: index ? '2026-12-20T21:30:49.123456' : null,
  successCriteria: '可以独立部署与演示', constraintText: '每周投入六小时', createdAt: '2026-09-03T21:30:00', updatedAt: '2026-09-03T21:30:00',
}))
let patchStatus = 200, readStatus = 200, malformed = false, commitOnFailure = false, abortPatch = false, failAnalysis = false
let hold = null, release
const requests = [], errors = []
await context.route(url => url.pathname.startsWith('/api/'), async route => {
  const request = route.request(), url = new URL(request.url()), path = url.pathname
  const body = request.postData() ? request.postDataJSON() : null
  requests.push({ path, method: request.method(), body, headers: request.headers() })
  let data, status = 200
  if (path === '/api/tasks' && route.request().method() === 'GET') return route.fulfill({ json: { items: [], page: 1, size: 20, total: 0, totalPages: 0 } })
  if (path === '/api/auth/me') data = { id: 1, username: 'Jakin', email: 'jakin@example.com' }
  else if (path === '/api/goals' && request.method() === 'POST') {
    data = { ...goals[0], id: 7, goalText: body.goalText, status: 'DRAFT', priority: null, deadline: null }
    goals.push(data)
  } else if (path === '/api/goals') {
    const page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'))
    const matches = goals.filter(goal => !url.searchParams.get('status') || goal.status === url.searchParams.get('status'))
    data = { items: matches.slice((page - 1) * size, page * size), page, size, total: matches.length, totalPages: Math.ceil(matches.length / size) }
  } else if (/^\/api\/goals\/\d+$/.test(path)) {
    const goal = goals.find(goal => goal.id === Number(path.split('/').at(-1)))
    if (request.method() === 'PATCH') {
      if (hold) await hold
      if (abortPatch) return route.abort('connectionfailed')
      status = patchStatus
      if (status === 200 || commitOnFailure) Object.assign(goal, body, { updatedAt: '2026-09-21T19:45:00' })
      data = status === 200 ? { ...goal, id: malformed ? -1 : goal.id } : { message: status === 400 ? '请检查目标资料后重试。' : '模拟保存异常' }
    } else { status = readStatus; data = status === 200 ? goal : { message: '模拟读取失败' } }
  } else if (path.endsWith('/analyze')) {
    status = failAnalysis ? 502 : 200
    const goal = goals.find(goal => goal.id === Number(path.split('/')[3]))
    if (!failAnalysis) goal.status = 'READY_TO_PLAN'
    data = failAnalysis ? { message: '模拟分析失败' } : { analysisId: 55, goalId: goal.id, readiness: 'READY', goalSummary: goal.goalText, knownInformation: [], missingInformation: [], clarificationQuestions: [] }
  } else if (path === '/api/plans/generate') {
    data = { planId: 90, goalId: body.goalId, status: 'DRAFT', planTitle: '保留这份待确认的计划', planSummary: '先完成基础功能，再验证交付。', createdAt: '2026-09-21T20:00:00', stages: [{ stageId: 91, title: '基础实现', objective: '可以运行', timeRange: '第一周', tasks: [{ taskId: 92, title: '搭建环境', description: '配置项目', completionCriteria: '能够启动', status: 'TODO' }] }] }
  } else { errors.push('Unexpected API ' + path); status = 500; data = {} }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()) })
const appUrl = process.env.APP_URL || 'http://127.0.0.1:5184'
const form = () => page.getByRole('form', { name: '编辑目标资料' })
const save = () => form().getByRole('button', { name: '保存修改', exact: true })
const patchCalls = () => requests.filter(request => request.method === 'PATCH')
const waitSuccess = () => page.getByRole('status').filter({ hasText: '目标资料已保存' }).waitFor()
const infoTab = () => page.locator('.session-tools').getByRole('button', { name: '目标资料', exact: false }).click()
const edit = async () => {
  await form().waitFor()
  assert.equal(await page.getByRole('button', { name: '编辑资料' }).count(), 0, 'The fields are immediately editable, with no edit-mode switch')
}
async function choosePriority(value) {
  await page.getByRole('combobox', { name: '选择目标优先级' }).click()
  await page.getByRole('listbox').getByRole('option').filter({ hasText: { LOW: '低优先级', MEDIUM: '中优先级', HIGH: '高优先级' }[value] }).click()
  assert.equal(await page.locator('#edit-goal-priority').getAttribute('data-value'), value)
}
async function reset() {
  const button = form().getByRole('button', { name: '撤销修改' })
  if (await button.isEnabled()) await button.click()
}
async function open(id) {
  await page.goto(appUrl + '/#/goals/' + id)
  await infoTab(); await page.locator('.goal-info-panel').waitFor()
}
async function reloadLatest() {
  await page.getByRole('button', { name: '重新读取，保留输入' }).click()
  await page.getByRole('status').filter({ hasText: '已读取最新资料' }).waitFor()
}
async function screenshot(name) {
  await page.waitForTimeout(180)
  await page.screenshot({ path: join(artifacts, name + '.png'), fullPage: true })
}
try {
  await open(1)
  await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).fill('保留这个问题，不要自动发送')
  await edit()
  assert.ok(await page.locator('#edit-goal-text').isEditable())
  assert.ok(await save().isDisabled())
  assert.equal(patchCalls().length, 0)
  await page.locator('#edit-goal-text').fill('   ')
  await page.getByText('请填写目标原文。', { exact: true }).waitFor()
  assert.ok(await save().isDisabled())
  await page.locator('#edit-goal-text').fill('  为城市公园设计一个阅读与步行计划  ')
  await choosePriority('HIGH')
  await chooseDateTime(page, '2026-12-25T18:35')
  await page.locator('.session-tools').getByRole('button', { name: 'Agent 对话' }).click()
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '保留这个问题，不要自动发送')
  await infoTab()
  assert.equal(await page.locator('#edit-goal-text').inputValue(), '  为城市公园设计一个阅读与步行计划  ', 'Panel switches retain unsaved edits')
  await screenshot('goal-edit-1600')
  for (const width of [2560, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await page.waitForTimeout(160)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow ' + width)
    assert.ok(await page.locator('.panel-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Editor overflow ' + width)
    if (width === 390) await screenshot('goal-edit-390')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await form().evaluate(el => getComputedStyle(el).animationName), 'none')
  await page.setViewportSize({ width: 1600, height: 1100 })
  hold = new Promise(resolve => { release = resolve })
  await save().click()
  await page.waitForFunction(() => document.querySelector('.goal-edit-form')?.getAttribute('aria-busy') === 'true')
  assert.ok(await page.locator('#edit-goal-text').isDisabled())
  assert.ok(await page.getByRole('button', { name: /开始分析目标/ }).isDisabled())
  await form().dispatchEvent('submit')
  assert.equal(patchCalls().length, 1, 'Pending request cannot be duplicated')
  assert.deepEqual(patchCalls()[0].body, { goalText: '为城市公园设计一个阅读与步行计划', priority: 'HIGH', deadline: '2026-12-25T18:35:00' })
  assert.equal(patchCalls()[0].headers.authorization, 'Bearer goal-edit-test')
  assert.equal(await page.locator('.session-title h1').innerText(), '目标 1：完成一个可以部署的 Java 项目', 'No optimistic text changes')
  release(); hold = null; await waitSuccess()
  assert.equal(await page.locator('.session-title h1').innerText(), goals[0].goalText)
  assert.match(await page.locator('.goal-info-panel').innerText(), /18:35/)
  assert.ok(await form().isVisible(), 'Saving stays on the inline details instead of closing an editor')
  assert.ok(await save().isDisabled())
  assert.equal(await page.getByRole('textbox', { name: '向 GoalPilot 提问' }).inputValue(), '保留这个问题，不要自动发送')
  await page.locator('.recent-goals button').filter({ hasText: goals[0].goalText }).waitFor()
  await page.getByRole('button', { name: '返回目标库', exact: true }).click()
  await page.locator('.goal-card').filter({ hasText: goals[0].goalText }).waitFor()
  assert.equal(requests.filter(request => request.method === 'POST').length, 0, 'Editing never creates a goal, analyzes it, or calls the Agent')
  await page.getByRole('group', { name: '目标状态筛选', exact: true }).getByRole('button', { name: '草稿', exact: true }).click()
  await page.locator('.goal-card').getByRole('button', { name: '进入会话', exact: true }).click()
  await infoTab(); await edit()
  await choosePriority('MEDIUM')
  await save().click(); await waitSuccess()
  await page.getByRole('button', { name: '返回目标库', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '草稿', exact: true }).getAttribute('aria-pressed'), 'true', 'Saving retains the library filter')
  await page.locator('.goal-card').filter({ hasText: goals[0].goalText }).waitFor()
  await page.getByRole('group', { name: '目标状态筛选', exact: true }).getByRole('button', { name: '全部', exact: true }).click()

  // Non-draft goals expose only metadata. Unchanged timestamps keep seconds.
  for (const id of [2, 3, 4, 5, 6]) {
    await open(id); await edit()
    assert.equal(await page.locator('#edit-goal-text').count(), 0)
    await choosePriority('LOW')
    await save().click(); await waitSuccess()
    assert.deepEqual(patchCalls().at(-1).body, { priority: 'LOW' })
    assert.equal(goals[id - 1].deadline, '2026-12-20T21:30:49.123456')
  }
  await open(2); await edit()
  await page.locator('#edit-goal-deadline').click()
  assert.equal(await page.getByRole('button', { name: '暂不设置', exact: true }).count(), 0, 'A persisted deadline cannot be cleared')
  await page.getByRole('textbox', { name: '小时', exact: true }).fill('24')
  assert.ok(await page.getByRole('button', { name: '选好时间' }).isDisabled())
  await page.keyboard.press('Escape')
  await page.locator('.pixel-calendar').waitFor({ state: 'detached' })
  assert.ok(await save().isDisabled())
  await chooseDateTime(page, '2026-12-25T18:35')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('#goal-tools-panel')?.inert)
  await infoTab(); await edit()
  assert.equal(await page.locator('#edit-goal-deadline').getAttribute('data-value'), '2026-12-25T18:35', 'Closing the panel retains unsaved edits')
  const beforeReset = patchCalls().length
  await reset()
  assert.equal(patchCalls().length, beforeReset, 'Reverting local edits never writes to the API')
  assert.equal(await page.locator('#edit-goal-deadline').getAttribute('data-value'), '2026-12-20T21:30')
  await chooseDateTime(page, '2027-01-01T00:05')
  await save().click(); await waitSuccess()
  assert.deepEqual(patchCalls().at(-1).body, { deadline: '2027-01-01T00:05:00' }, 'No UTC shift at midnight')

  // 400 retains input for correction; uncertain writes require a read, not retry.
  await edit(); await choosePriority('HIGH')
  patchStatus = 400
  await save().click(); await page.getByRole('alert').filter({ hasText: '请检查目标资料' }).waitFor()
  assert.equal(await page.locator('#edit-goal-priority').getAttribute('data-value'), 'HIGH')
  assert.ok(await save().isEnabled())
  patchStatus = 500; commitOnFailure = true
  await save().click(); await page.getByRole('alert').filter({ hasText: '无法确认保存结果' }).waitFor()
  assert.ok(await save().isDisabled())
  const beforeRead = patchCalls().length
  readStatus = 500
  await page.getByRole('button', { name: '重新读取，保留输入' }).click()
  await page.getByRole('alert').filter({ hasText: '暂未读取到最新资料' }).waitFor()
  assert.ok(await save().isDisabled())
  patchStatus = 200; readStatus = 200; commitOnFailure = false
  await reloadLatest()
  assert.ok(await save().isDisabled(), 'A committed write needs no repeat after verification')
  assert.equal(patchCalls().length, beforeRead)
  await reset()
  assert.match(await page.locator('.goal-info-panel').innerText(), /高优先级/)

  // 409 changes the editable fields; unsaved text can still be copied.
  await open(1); await edit()
  await page.locator('#edit-goal-text').fill('保留我的新原文')
  await choosePriority('LOW')
  patchStatus = 409
  await save().click(); await page.getByRole('alert').filter({ hasText: '目标状态已变化' }).waitFor()
  assert.ok(await save().isDisabled())
  goals[0].status = 'ACTIVE'; patchStatus = 200
  await reloadLatest()
  assert.equal(await page.locator('#edit-goal-text').count(), 0)
  assert.equal(await page.locator('#edit-goal-priority').getAttribute('data-value'), 'LOW')
  await page.getByText('查看未保存的原文输入', { exact: true }).click()
  assert.match(await page.locator('.retained-text').innerText(), /保留我的新原文/)
  await save().click(); await waitSuccess()
  assert.deepEqual(patchCalls().at(-1).body, { priority: 'LOW' })

  for (const failure of ['network', 'malformed', 403, 404]) {
    await edit(); await choosePriority(goals[0].priority === 'HIGH' ? 'LOW' : 'HIGH')
    abortPatch = failure === 'network'; malformed = failure === 'malformed'; patchStatus = typeof failure === 'number' ? failure : 200
    await save().click(); await page.getByRole('alert').waitFor()
    assert.ok(await save().isDisabled())
    assert.equal(await page.locator('.info-saved').count(), 0)
    abortPatch = false; malformed = false; patchStatus = 200
    await reloadLatest()
    await reset()
  }

  // A late save cannot replace a different goal's title or input.
  await edit(); await choosePriority(goals[0].priority === 'HIGH' ? 'LOW' : 'HIGH')
  hold = new Promise(resolve => { release = resolve })
  await save().click()
  await page.waitForFunction(() => document.querySelector('.goal-edit-form')?.getAttribute('aria-busy') === 'true')
  await page.locator('.recent-goals button').filter({ hasText: goals[1].goalText }).click()
  await page.locator('.session-title h1').filter({ hasText: goals[1].goalText }).waitFor()
  release(); hold = null; await page.waitForTimeout(200)
  assert.equal(await page.locator('.session-title h1').innerText(), goals[1].goalText)
  await infoTab(); await edit()
  assert.equal(await page.locator('#edit-goal-priority').getAttribute('data-value'), goals[1].priority)
  assert.ok(await page.getByRole('combobox', { name: '选择目标优先级' }).isEnabled())

  // Editing a newly created draft after failed analysis must not create it twice.
  await page.goto(appUrl + '/#/new')
  await page.locator('#goal-input').fill('第一次保存的目标原文')
  failAnalysis = true
  await page.getByRole('button', { name: /开始梳理/ }).click()
  await page.getByRole('alert').filter({ hasText: '模拟分析失败' }).waitFor()
  await infoTab(); await edit()
  await page.locator('#edit-goal-text').fill('修改后用于重新分析的原文')
  await save().click(); await waitSuccess()
  failAnalysis = false
  await page.locator('.info-actions').getByRole('button', { name: /分析这个目标/ }).click()
  await page.getByRole('region', { name: '分析与澄清记录' }).getByText('这些信息已经足够开始规划。', { exact: false }).waitFor()
  assert.equal(requests.filter(request => request.path === '/api/goals' && request.method === 'POST').length, 1)
  assert.equal(requests.filter(request => request.path === '/api/goals/7/analyze').length, 2)
  assert.equal(goals[6].goalText, '修改后用于重新分析的原文')
  await page.getByRole('button', { name: /生成计划草稿/ }).click()
  await page.getByRole('heading', { name: '保留这份待确认的计划', exact: true }).waitFor()
  await infoTab(); await edit()
  await choosePriority('HIGH')
  await save().click(); await waitSuccess()
  await page.locator('.info-actions').getByRole('button', { name: /查看计划草稿/ }).click()
  await page.getByRole('heading', { name: '保留这份待确认的计划', exact: true }).waitFor()
  assert.equal(requests.filter(request => request.path === '/api/plans/generate').length, 1, 'Metadata edits preserve the in-memory plan instead of generating again')
  assert.equal(requests.filter(request => request.path === '/api/goals/7/analyze').length, 2, 'Metadata edits do not re-analyze')
  await page.getByRole('button', { name: '确认并启用计划', exact: true }).waitFor()

  await open(2); await edit(); await choosePriority('LOW')
  patchStatus = 401
  await save().click()
  await page.locator('.auth-page').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('goalpilot.access_token')), null)
  assert.deepEqual(errors, [])
  console.log('Goal edit smoke passed. Screenshots: ' + artifacts)
} catch (error) {
  await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true })
  console.error('Failure screenshot: ' + artifacts)
  throw error
} finally { await browser.close() }
