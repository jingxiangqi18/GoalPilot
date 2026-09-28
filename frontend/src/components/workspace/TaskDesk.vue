<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import TaskCreateForm from './TaskCreateForm.vue'
import TaskDetails from './TaskDetails.vue'
import SavedPlanView from './SavedPlanView.vue'
import DateStamp from './DateStamp.vue'
import stationArtwork from '../../assets/goalpilot-pixel-station-v1.webp'

const props = defineProps({ state: { type: Object, required: true }, goals: { type: Array, default: () => [] }, goal: Object, standalone: Boolean, active: { type: Boolean, default: true }, goalsLoading: Boolean, goalsError: String })
const emit = defineEmits(['load', 'submit', 'library', 'inbox', 'workspace', 'open-goal', 'updated', 'ask-assistant', 'retry-goals'])
const mode = ref('inbox'), search = ref(''), expanded = ref(null), selectedPlanGoal = ref(null)
const createForm = ref(null), heading = ref(null), taskList = ref(null)
const list = computed(() => props.state.list)
const selectedTask = computed(() => list.value.items.find(task => task.id === expanded.value))
const scopedTasks = computed(() => list.value.items.filter(task => !props.goal || task.goalId === props.goal.id))
const shownTasks = computed(() => scopedTasks.value.filter(task => [task.title, task.description, task.completionCriteria].some(text => String(text || '').toLowerCase().includes(search.value.trim().toLowerCase()))))
const priorityLabels = { LOW: '低优先级', MEDIUM: '中优先级', HIGH: '高优先级' }
const statusLabels = { TODO: '待开始', IN_PROGRESS: '进行中', DONE: '已完成', SKIPPED: '已跳过' }
function goalLabel(id) { return props.goal?.id === id ? props.goal.goalText : props.goals.find(goal => goal.id === id)?.goalText || '关联目标' }
async function startTask() { mode.value = 'inbox'; props.state.open = true; if (props.standalone) props.state.detailsOpen = true; await nextTick(); createForm.value?.focusTitle() }
async function focusDesk(scroll = true) { await nextTick(); heading.value?.focus({ preventScroll: true }); if (scroll) heading.value?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }
function selectTask(task) { expanded.value = expanded.value === task.id ? null : task.id; if (props.standalone) props.state.open = false }
async function closeDetails() { const id = expanded.value; expanded.value = null; await nextTick(); taskList.value?.querySelector(`[data-task-id="${id}"]`)?.focus({ preventScroll: true }) }
function askFromPlan(context) { emit('ask-assistant', { goalId: selectedPlanGoal.value.id, context }) }
function changePage(page) { search.value = ''; expanded.value = null; emit('load', page) }
watch([() => props.active, mode, () => list.value.stale], () => {
  if (props.active && mode.value === 'inbox' && list.value.stale) emit('load', list.value.requestedPage)
}, { immediate: true })
watch(() => list.value.items, () => {
  if (!list.value.items.some(task => task.id === expanded.value)) expanded.value = null
})
watch(() => list.value.page, async () => {
  search.value = ''; expanded.value = null
  await nextTick()
  taskList.value?.scrollTo({ top: 0, behavior: 'instant' })
})
defineExpose({ focusDesk, startTask })
</script>

<template>
  <section class="task-desk" :class="{ 'task-page': standalone }" aria-label="同步待办清单">
    <header class="desk-heading"><div><span class="desk-eyebrow">{{ standalone ? 'TASKS · 手动管理' : 'TODO · 每一步都算数' }}</span><component :is="standalone ? 'h1' : 'h2'" ref="heading" tabindex="-1">{{ standalone ? '待办清单' : goal ? '这个目标的小事' : '对话之外，随手记下' }}</component><p>{{ standalone ? '把具体的事记下来，在清单中查看、在行动中推进。' : goal ? '临时想到的事，也可以与目标同行。' : '目标需要方向，小事也值得被记住。' }}</p></div><button v-if="standalone" type="button" class="back-to-workspace" @click="emit('workspace')">✧ 回到工作台</button><img class="desk-art" :src="stationArtwork" alt="" aria-hidden="true" width="72" height="72" /></header>
    <div v-if="!goal" class="desk-tabs" role="group" aria-label="待办查看方式"><button type="button" :aria-pressed="mode === 'inbox'" @click="mode = 'inbox'">我的任务 <small v-if="list.loaded">{{ list.total }}</small></button><button type="button" :aria-pressed="mode === 'plans'" @click="mode = 'plans'">目标计划</button></div>
    <div v-show="mode === 'inbox'" :inert="mode !== 'inbox'" class="inbox-content">
      <div class="inbox-heading"><span>{{ goal ? '本页关联任务' : '任务收件箱' }}<small v-if="list.loaded">{{ goal ? scopedTasks.length + ' 项' : '共 ' + list.total + ' 项' }}</small></span><button type="button" :disabled="state.pending" @click="startTask">{{ state.pending ? '保存中…' : '＋ 记一件事' }}</button></div>
      <p v-if="state.notice" class="task-notice" role="status">✓ {{ state.notice }}</p>
      <p v-if="!state.open && (state.error || state.draft.title)" class="draft-reminder"><span>{{ state.error ? '有一条任务需要核对保存结果' : '有一条未保存的任务草稿' }}</span><button type="button" @click="startTask">继续填写 ↗</button></p>
      <div class="inbox-layout" :class="{ 'has-inspector': standalone && (state.open || selectedTask) }">
      <div v-show="state.open" class="task-editor"><TaskCreateForm ref="createForm" :state="state" :goals="goals" :goal="goal" :active="active && mode === 'inbox' && state.open" @submit="emit('submit')" @close="state.open = false" /></div>
      <TaskDetails v-if="standalone && selectedTask && !state.open" :task="selectedTask" :goal-title="goalLabel(selectedTask.goalId)" @close="closeDetails" @open-goal="emit('open-goal', $event)" />
      <div class="task-results">
      <button v-if="goal" class="scope-link" type="button" @click="emit('inbox')">查看全部任务 →</button>
      <div class="list-toolbar"><span>{{ goal ? '从全部任务分页中筛选当前目标' : '最近创建在前 · 每页 20 项' }}</span><button type="button" :disabled="list.loading" @click="emit('load', list.page)">刷新任务列表</button></div>
      <p v-if="goal" class="page-scope-note">仅展示全部任务第 {{ list.page }} 页中关联本目标的记录，不代表该目标的全部任务。</p>
      <div v-if="list.error" class="list-error" role="alert"><p>{{ list.error }}</p><small v-if="list.loaded">以下保留上次读取的第 {{ list.page }} 页内容。</small><button type="button" @click="emit('load', list.requestedPage)">重试读取任务</button></div>
      <p v-if="list.loading" class="list-loading" role="status">正在读取第 {{ list.requestedPage }} 页…</p>
      <div :aria-busy="list.loading">
      <label v-if="list.loaded && list.total" class="task-search"><span aria-hidden="true">⌕</span><input v-model="search" type="search" aria-label="搜索本页任务" placeholder="搜索本页任务" /></label>
      <div v-if="list.loaded && !list.total && !list.loading && !list.error && !state.open" class="inbox-empty"><span class="empty-check" aria-hidden="true">□<i>＋</i></span><h3>不必把每件事都变成一个目标</h3><p>还没有任务。记录一次预约、一份资料，或下一步要完成的小事。</p><button type="button" @click="startTask">记下第一件事 ↗</button></div>
      <p v-else-if="list.loaded && list.total && !scopedTasks.length && !list.loading" class="search-empty">{{ goal ? '这一页没有关联当前目标的任务，可以翻阅其他页或查看全部任务。' : '这一页暂时没有任务，请刷新列表。' }}</p>
      <p v-else-if="scopedTasks.length && !shownTasks.length" class="search-empty">本页没有匹配的任务。<button type="button" @click="search = ''">清除搜索</button></p>
      <ul v-if="shownTasks.length" ref="taskList" class="receipt-list" aria-label="已保存的任务">
        <li v-for="task in shownTasks" :key="task.id" class="inbox-task" :class="{ 'is-done': task.status === 'DONE', 'is-selected': standalone && expanded === task.id && !state.open }">
          <button type="button" class="task-receipt-title" :data-task-id="task.id" :aria-expanded="expanded === task.id && (!standalone || !state.open)" :aria-controls="standalone && expanded === task.id && !state.open ? 'selected-task-details' : undefined" @click="selectTask(task)"><span class="receipt-mark" aria-hidden="true">{{ task.status === 'DONE' ? '✓' : task.status === 'IN_PROGRESS' ? '◷' : task.status === 'SKIPPED' ? '−' : '□' }}</span><span><strong>{{ task.title }}</strong><small>{{ task.goalId ? '关联目标' : '独立任务' }}<i>·</i><b :class="{ important: task.priority === 'HIGH' }">{{ priorityLabels[task.priority] }}</b></small></span><span v-if="standalone" class="task-row-deadline"><DateStamp v-if="task.deadline" :value="task.deadline" label="期待完成" compact /><span v-else>未设置时间</span></span><span class="receipt-status">{{ statusLabels[task.status] }}<i aria-hidden="true">{{ expanded === task.id && (!standalone || !state.open) ? '−' : '＋' }}</i></span></button>
          <div v-if="!standalone && expanded === task.id" class="receipt-details"><dl><template v-if="task.description"><dt>任务说明</dt><dd>{{ task.description }}</dd></template><template v-if="task.completionCriteria"><dt>完成标准</dt><dd>{{ task.completionCriteria }}</dd></template></dl><DateStamp v-if="task.deadline" :value="task.deadline" label="期待完成" compact /><span v-else class="unscheduled">未设置期待完成时间</span><button v-if="task.goalId" class="task-goal-link" type="button" @click="emit('open-goal', task.goalId)">↗ {{ goalLabel(task.goalId) }}</button><p>已保存至后端 · 该类任务暂未接入状态修改</p></div>
        </li>
      </ul>
      </div>
      <nav v-if="list.loaded && list.totalPages > 1" class="task-pagination" aria-label="全部任务分页"><button type="button" :disabled="list.loading || list.page <= 1" @click="changePage(list.page - 1)">← 上一页</button><span>第 {{ list.page }} 页 · 共 {{ list.totalPages }} 页<small>{{ goal ? '全部任务 ' + list.total + ' 项' : '共 ' + list.total + ' 项' }}</small></span><button type="button" :disabled="list.loading || list.page >= list.totalPages" @click="changePage(list.page + 1)">下一页 →</button></nav>
      <div class="receipt-scope"><span aria-hidden="true">◈</span><p>任务已与账户同步，刷新后可继续查看。此处支持新建和查看；勾选完成仍仅用于「目标计划」中的计划任务。</p></div>
      </div>
      </div>
    </div>
    <div v-if="mode === 'plans'" class="desk-plans">
      <template v-if="!selectedPlanGoal">
        <div class="plans-intro"><strong>从一个目标展开行动清单</strong><p>勾选完成、查看阶段，或把具体任务带回对话。</p></div>
        <p v-if="goalsLoading" role="status">正在读取最近目标…</p><div v-else-if="goalsError" class="goals-error" role="alert"><p>{{ goalsError }}</p><button type="button" @click="emit('retry-goals')">重试读取目标</button></div>
        <div v-else class="plan-goal-list"><button v-for="item in goals" :key="item.id" type="button" @click="selectedPlanGoal = item"><span aria-hidden="true">☷</span><span><strong>{{ item.goalText }}</strong><small>{{ item.status === 'ACTIVE' ? '查看正式计划与任务' : '检查是否已有正式计划' }}</small></span><i aria-hidden="true">↗</i></button><p v-if="!goals.length">还没有目标，先聊聊你想完成的事。</p></div>
        <button class="scope-link" type="button" @click="emit('library')">从目标库选择其他目标 →</button>
      </template>
      <template v-else><button class="scope-link" type="button" @click="selectedPlanGoal = null">← 切换目标</button><div class="desk-plan-scroll"><SavedPlanView :key="selectedPlanGoal.id" :goal="selectedPlanGoal" embedded @back="emit('open-goal', selectedPlanGoal.id)" @updated="emit('updated', $event)" @ask-assistant="askFromPlan" /></div></template>
    </div>
  </section>
</template>

<style scoped>
.task-desk { min-width: 0; padding: 20px; border: 1px solid var(--line-strong); border-radius: 4px; background: var(--paper); box-shadow: 4px 4px 0 #c8d2bf66; color: var(--ink); font-family: var(--text-cn); }
.desk-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 19px; }.desk-heading > div { min-width: 0; flex: 1; }.desk-eyebrow { color: var(--accent); font-size: 9px; letter-spacing: .08em; }.desk-heading h2 { margin: 8px 0 7px; font-size: 18px; font-weight: 600; line-height: 1.5; outline: none; }.desk-heading p { margin: 0; font-size: 11px; color: var(--ink-500); line-height: 1.8; }.desk-art { width: 74px; height: 74px; object-fit: contain; image-rendering: pixelated; }
button { cursor: pointer; font-family: inherit; color: var(--accent-deep); border: 1px solid var(--line); border-radius: 2px; background: var(--paper); }button:hover:not(:disabled) { background: var(--canvas-soft); }button:disabled { opacity: .5; cursor: not-allowed; }
.desk-tabs { display: flex; padding: 4px; margin-bottom: 18px; gap: 5px; background: #e9eedf; border: 1px solid #cdd8c6; }.desk-tabs button { flex: 1; padding: 8px; font-size: 12px; background: transparent; border-color: transparent; }.desk-tabs button[aria-pressed="true"] { background: var(--paper); box-shadow: 2px 2px 0 #c2cfb8; border-color: #bdceb4; }.desk-tabs small { margin-left: 8px; font: 10px var(--pixel); }
.inbox-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 17px 0; font-size: 12px; }.inbox-heading small { margin-left: 8px; font-size: 10px; color: var(--ink-500); }.inbox-heading button { padding: 7px 9px; font-size: 11px; }
.inbox-empty { padding: 24px 10px 28px; text-align: center; background: linear-gradient(160deg, #f2f4e9, #faf8ef); border: 1px dashed var(--line-strong); }.empty-check { position: relative; display: inline-grid; place-items: center; width: 44px; height: 44px; font-size: 39px; color: #759181; background: #e3ead7; box-shadow: 3px 3px 0 #bccdb4; }.empty-check i { position: absolute; right: -5px; bottom: -2px; padding: 0 2px; background: var(--paper); color: var(--accent); font: normal 17px var(--text-cn); }.inbox-empty h3 { margin: 19px 0 8px; font-size: 13px; font-weight: 500; }.inbox-empty p { margin: 0 auto 18px; max-width: 240px; font-size: 11px; line-height: 1.9; color: var(--ink-500); }.inbox-empty button { padding: 8px 12px; font-size: 11px; }
.receipt-scope { display: flex; gap: 9px; margin-top: 18px; padding-top: 12px; border-top: 1px dashed var(--line); color: var(--ink-500); }.receipt-scope p { flex: 1; margin: 0; font-size: 10px; line-height: 1.9; }.task-notice { overflow-wrap: anywhere; padding: 11px; background: #e6eee2; color: #3a6250; font-size: 12px; line-height: 1.8; }
.draft-reminder { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; color: var(--ink-500); background: #f4eedb; font-size: 11px; line-height: 1.8; }.draft-reminder button { background: transparent; border: 0; margin-left: auto; }.scope-link { margin: 8px 0 14px; padding: 0; border: 0; font-size: 11px; }
.task-search { display: flex; gap: 10px; align-items: center; padding: 9px; margin: 15px 0 5px; background: #eef2e7; }.task-search input { min-width: 0; width: 100%; border: 0; outline: none; color: var(--ink); background: transparent; font: inherit; font-size: 12px; }.task-search:focus-within { outline: 2px solid var(--accent); }
.receipt-list { list-style: none; margin: 0; padding: 0; max-height: 490px; overflow-y: auto; scrollbar-width: thin; }.inbox-task { border-bottom: 1px solid var(--line); }.task-receipt-title { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 15px 0; border: 0; text-align: left; }.receipt-mark { color: #849a85; flex: 0 0 18px; font-size: 23px; line-height: 1; }.task-receipt-title > span:nth-child(2) { flex: 1; min-width: 0; }.task-receipt-title strong { display: block; color: var(--ink); font-size: 13px; line-height: 1.7; font-weight: 500; overflow-wrap: anywhere; }.task-receipt-title small { display: block; margin-top: 6px; color: var(--ink-500); font-size: 10px; }.task-receipt-title small i { padding: 0 7px; font-style: normal; }.task-receipt-title b { font-weight: 400; }.task-receipt-title b.important { color: #936230; }.receipt-status { flex: 0 0 auto; display: flex; gap: 8px; color: var(--ink-500); font-size: 10px; padding-top: 5px; }.receipt-status i { font-style: normal; }
.receipt-details { padding: 0 0 14px 28px; }.receipt-details dl { margin: 0; }.receipt-details dt { color: var(--ink-500); font-size: 10px; margin: 12px 0 5px; }.receipt-details dd { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.85; }.receipt-details p { color: var(--ink-500); font-size: 10px; line-height: 1.8; }.task-goal-link { display: block; margin-top: 12px; padding: 7px; max-width: 100%; overflow-wrap: anywhere; text-align: left; font-size: 11px; line-height: 1.7; }.unscheduled, .search-empty { font-size: 11px; color: var(--ink-500); }.search-empty button { margin: 8px; font-size: 11px; }
.plans-intro strong { font-size: 13px; font-weight: 500; }.plans-intro p, .goals-error p, .plan-goal-list > p { font-size: 11px; line-height: 1.8; color: var(--ink-500); }.plan-goal-list { margin-top: 18px; }.plan-goal-list button { display: flex; width: 100%; align-items: center; gap: 12px; padding: 13px 0; text-align: left; border: 0; border-bottom: 1px solid var(--line); }.plan-goal-list button > span:first-child { display: grid; place-items: center; width: 29px; height: 32px; flex-shrink: 0; background: #e7edde; }.plan-goal-list button > span:nth-child(2) { min-width: 0; flex: 1; }.plan-goal-list strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 500; }.plan-goal-list small { display: block; color: var(--ink-500); font-size: 10px; margin-top: 6px; }.plan-goal-list i { font-style: normal; }
.desk-plan-scroll { max-height: 620px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: 1px 4px 6px 1px; }.desk-plan-scroll :deep(.module-heading) { flex-wrap: wrap; }.desk-plan-scroll :deep(.module-heading h2) { font-size: 17px; }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0; color: var(--ink-500); font-size: 10px; line-height: 1.7; }.list-toolbar button { flex-shrink: 0; padding: 6px 8px; font-size: 10px; }
.page-scope-note { font-size: 10px; color: var(--ink-500); line-height: 1.8; margin: 0 0 12px; }.list-loading { font-size: 12px; color: var(--accent); padding: 12px; background: var(--canvas-soft); }
.list-error { margin: 12px 0; padding: 12px; color: #80512e; background: #f6efdc; border-left: 3px solid #b38954; font-size: 12px; line-height: 1.8; }.list-error p { margin: 0 0 6px; }.list-error small { display: block; }.list-error button { margin-top: 8px; padding: 5px 8px; font-size: 11px; }
.task-pagination { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 0 0; font-size: 11px; }.task-pagination > span { text-align: center; color: var(--accent-deep); line-height: 1.8; }.task-pagination small { display: block; font-size: 10px; color: var(--ink-500); }.task-pagination button { padding: 7px; font-size: 11px; white-space: nowrap; }
.is-done .receipt-mark { color: #4c7553; }.is-done .task-receipt-title strong { color: var(--ink-500); text-decoration: line-through; text-decoration-thickness: 1px; }
.task-editor, .task-results, .inbox-layout { min-width: 0; }.task-editor { margin-bottom: 18px; }
.task-page { padding: clamp(18px, 2.5vw, 36px); min-height: calc(100dvh - 145px); animation: task-page-enter .24s ease-out both; }.task-page .desk-heading { margin-bottom: 28px; padding-bottom: 22px; border-bottom: 1px dashed var(--line-strong); }.task-page .desk-heading h1 { margin: 10px 0; font-size: clamp(24px, 2.3vw, 34px); font-weight: 600; line-height: 1.4; outline: none; }.task-page .desk-heading p { font-size: 13px; }.back-to-workspace { padding: 9px 13px; font-size: 12px; white-space: nowrap; }
.task-page .desk-tabs { max-width: 440px; margin-bottom: 24px; }.task-page .inbox-heading { margin: 0 0 18px; font-size: 15px; }.task-page .inbox-heading button { padding: 10px 16px; color: var(--paper); background: var(--accent-deep); border-color: var(--accent-deep); font-size: 13px; box-shadow: 2px 2px 0 #b7c7b3; }
.task-page .inbox-layout.has-inspector { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, .52fr); gap: 24px; align-items: start; }.task-page .task-results { grid-column: 1; grid-row: 1; }.task-page .task-editor, .task-page :deep(.task-inspector) { grid-column: 2; grid-row: 1; }.task-page .task-editor { margin: 0; }
.task-page .list-toolbar { margin-top: 0; }.task-page .task-search { margin: 0 0 12px; padding: 12px; }.task-page .receipt-list { max-height: min(58dvh, 680px); padding-right: 5px; }.task-page .task-receipt-title { align-items: center; padding: 16px 12px; gap: 14px; }.task-page .task-receipt-title strong { font-size: 14px; }.task-page .is-selected { background: #eaf0e4; box-shadow: inset 3px 0 0 var(--accent); }.task-page .receipt-status { padding-top: 0; min-width: 65px; justify-content: space-between; }
.task-row-deadline { max-width: 230px; margin-inline: auto 18px; color: var(--ink-500); font-size: 11px; }.has-inspector .task-row-deadline { display: none; }.task-page .inbox-empty { padding: 65px 20px; }.task-page .inbox-empty p { max-width: none; }.task-page .inbox-empty h3 { font-size: 17px; }.task-page .desk-plan-scroll { max-height: none; overflow: visible; }.task-page .plan-goal-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 15px 30px; }
@keyframes task-page-enter { from { opacity: 0; transform: translateY(5px); } }
@media(max-width: 1100px) { .task-page .inbox-layout.has-inspector { grid-template-columns: minmax(0, 1fr); }.task-page .task-editor, .task-page :deep(.task-inspector) { grid-column: 1; grid-row: 1; }.task-page .has-inspector .task-results { grid-row: 2; }.task-row-deadline { display: none; } }
@media(max-width: 620px) { .task-page .desk-heading { flex-wrap: wrap; gap: 10px; }.task-page .desk-heading > div { flex-basis: calc(100% - 70px); }.task-page .back-to-workspace { order: 3; }.task-page .receipt-list { max-height: 58dvh; }.task-page .inbox-heading { font-size: 13px; }.task-page .inbox-heading button { padding: 8px 10px; font-size: 11px; }.task-page .task-receipt-title { padding-inline: 4px; gap: 9px; } }
@media(prefers-reduced-motion: reduce) { .task-page { animation: none; } }
@media(max-width: 620px) { .task-desk { padding: 15px; }.desk-heading h2 { font-size: 16px; }.desk-art { width: 58px; height: 58px; }.desk-plan-scroll { max-height: 70dvh; } }
</style>
