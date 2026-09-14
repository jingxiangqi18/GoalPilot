<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import PlanTaskRow from './PlanTaskRow.vue'
import { taskStatusCounts } from '../../utils/planTasks'

const props = defineProps({ stage: { type: Object, required: true }, index: { type: Number, required: true }, expandedTasks: { type: Array, default: () => [] }, editable: Boolean, canAsk: Boolean, pendingTask: Object, busy: Boolean, updatesBlocked: Boolean })
defineEmits(['toggle-task', 'update-task', 'ask-task'])
const filter = ref('all')
const search = ref('')
const card = ref(null)
let lastTaskFocus = null
function rememberFocus(event) {
  lastTaskFocus = event.target.closest('.task-card') ? event.target : null
}
const counts = computed(() => taskStatusCounts(props.stage.tasks))
const filters = computed(() => [
  { key: 'all', label: '全部', count: props.stage.tasks.length },
  { key: 'pending', label: '待办', count: counts.value.TODO + counts.value.IN_PROGRESS + counts.value.UNKNOWN },
  { key: 'done', label: '已完成', count: counts.value.DONE },
  { key: 'skipped', label: '已跳过', count: counts.value.SKIPPED },
])
const visibleTasks = computed(() => props.stage.tasks.map((task, index) => ({ task, index })).filter(({ task }) => {
  const matchesStatus = filter.value === 'all' || (filter.value === 'pending' ? !['DONE', 'SKIPPED'].includes(task.status) : task.status === filter.value.toUpperCase())
  const query = search.value.trim().toLocaleLowerCase()
  return matchesStatus && (!query || [task.title, task.description, task.completionCriteria].some(value => String(value || '').toLocaleLowerCase().includes(query)))
}))
// If saving moves a task out of this filtered list, retain a useful keyboard focus.
watch(visibleTasks, async () => {
  const focused = document.activeElement
  // Disabling the save button may temporarily move focus to body in Chromium.
  const candidate = focused === document.body ? lastTaskFocus : focused
  if (!card.value?.contains(candidate) || !candidate.closest('.task-card')) return
  await nextTick()
  if (!candidate.isConnected && [document.body, candidate].includes(document.activeElement)) {
    card.value?.querySelector('.task-filters [aria-pressed="true"]')?.focus({ preventScroll: true })
  }
})
</script>

<template>
  <article ref="card" class="stage-card" @focusin="rememberFocus">
    <header class="stage-heading"><div><span class="stage-kicker">阶段 {{ String(index + 1).padStart(2, '0') }}</span><h3 class="stage-title" tabindex="-1">{{ stage.title }}</h3></div><span v-if="stage.timeRange" class="time-range"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="3"/><path d="M6.5 2.5v4m7-4v4M3 9h14"/></svg>{{ stage.timeRange }}</span></header>
    <p v-if="stage.objective" class="stage-objective"><span>阶段目标</span>{{ stage.objective }}</p>
    <div class="tasks-heading"><h4>行动清单 <span>{{ stage.tasks.length }} 项</span></h4><span>{{ editable ? '勾选完成 · 点开查看详情' : '点开查看说明与完成标准' }}</span></div>
    <div class="task-search"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input v-model="search" type="search" aria-label="搜索当前阶段任务" placeholder="查找这份清单里的任务" maxlength="200" /><button v-if="search" type="button" aria-label="清除任务搜索" @click="search = ''">×</button></div>
    <div class="task-filters" role="group" aria-label="筛选当前阶段任务"><button v-for="item in filters" :key="item.key" type="button" :aria-pressed="filter === item.key" @click="filter = item.key">{{ item.label }}<span>{{ item.count }}</span></button></div>
    <ol class="task-list" aria-label="当前阶段行动清单">
      <PlanTaskRow v-for="{ task, index: taskIndex } in visibleTasks" :key="task.taskId || taskIndex" :task="task" :expanded="expandedTasks.includes(taskIndex)" :editable="editable" :can-ask="canAsk" :pending-task="pendingTask" :busy="busy" :updates-blocked="updatesBlocked" @toggle="$emit('toggle-task', taskIndex)" @update-task="$emit('update-task', $event)" @ask-task="$emit('ask-task', { taskTitle: task.title, stageTitle: stage.title })" />
    </ol>
    <div v-if="!visibleTasks.length" class="task-empty" role="status"><span aria-hidden="true">{{ filter === 'done' && !search.trim() ? '✓' : '☷' }}</span><p>{{ search.trim() ? '当前筛选下，没有找到匹配的任务。' : !stage.tasks.length ? '这个阶段暂未安排任务。' : filter === 'pending' ? '这个阶段没有待办任务了。' : filter === 'done' ? '还没有已完成的任务，迈出第一步吧。' : '这个阶段没有已跳过的任务。' }}</p><button v-if="stage.tasks.length" type="button" @click="filter = 'all'; search = ''">查看全部任务</button></div>
    <p v-else-if="search.trim()" class="search-result-count" role="status">找到 {{ visibleTasks.length }} 项任务 · 仅搜索当前阶段</p>
  </article>
</template>

<style scoped>
.stage-card { container: stage / inline-size; min-width: 0; padding: 20px 18px 8px; overflow: hidden; border-radius: var(--radius-sm); background: #fff; box-shadow: 0 1px 2px color-mix(in srgb, var(--shadow-color) 3%, transparent), 0 5px 18px color-mix(in srgb, var(--shadow-color) 2%, transparent); }
.stage-heading { display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px; }.stage-heading > div { min-width: 0; flex: 1; }.stage-kicker { color: var(--ink-500); font-size: 10px; font-weight: 500; letter-spacing: .04em; }.stage-title { margin: 6px 0 0; color: var(--ink); font-size: 18px; font-weight: 600; line-height: 1.65; overflow-wrap: anywhere; scroll-margin-top: 25px; }.stage-title:focus { outline: none; }
.time-range { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 9px; background: var(--canvas-soft); color: var(--ink-500); font-size: 11px; line-height: 1.7; border-radius: var(--radius-sm); overflow-wrap: anywhere; }.time-range svg { width: 15px; height: 15px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.3; }
.stage-objective { margin: 12px 0 0; font-size: 12px; line-height: 1.85; color: var(--ink-500); overflow-wrap: anywhere; }.stage-objective span { color: var(--ink-500); margin-right: 10px; font-size: 11px; }
.tasks-heading { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: 7px; margin: 20px 0 12px; }.tasks-heading h4 { margin: 0; color: var(--ink-700); font-size: 13px; font-weight: 500; }.tasks-heading h4 span { margin-left: 6px; color: var(--ink-500); font-size: 11px; font-weight: 400; }.tasks-heading > span { color: var(--ink-500); font-size: 10px; }
.task-filters { display: flex; flex-wrap: wrap; gap: 5px; padding-bottom: 9px; border-bottom: 1px solid var(--line); }.task-filters button { display: inline-flex; align-items: center; gap: 7px; padding: 7px 11px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: transparent; font-size: 11px; }.task-filters button:hover { background: var(--paper); }.task-filters button[aria-pressed="true"] { color: var(--ink-700); background: var(--canvas-soft); }.task-filters span { font-family: var(--display); font-size: 11px; font-variant-numeric: tabular-nums; }.task-list { margin: 0; padding: 0; list-style: none; }
.task-empty { padding: 28px 5px; text-align: center; color: var(--ink-500); font-size: 12px; }.task-empty > span { display: grid; place-items: center; margin: auto; width: 34px; height: 34px; border-radius: 50%; background: var(--canvas-soft); font-size: 19px; }.task-empty p { line-height: 1.8; }.task-empty button { border: 0; background: transparent; color: var(--ink-500); font-size: 11px; text-decoration: underline; text-underline-offset: 4px; }
.task-search { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; padding: 0 10px; min-height: 34px; border: 1px solid transparent; background: color-mix(in srgb, var(--canvas-soft) 44%, transparent); border-radius: var(--radius-sm); color: var(--ink-500); transition: border-color .2s, background .2s; }.task-search:focus-within { border-color: var(--line); background: var(--paper); }.task-search svg { width: 16px; height: 16px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.3; }.task-search input { min-width: 0; flex: 1; width: 100%; padding: 7px 0; border: 0; background: transparent; color: var(--ink-700); font-size: 11px; }.task-search input::placeholder { color: var(--ink-500); }.task-search input:focus-visible { outline: none; }.task-search input::-webkit-search-cancel-button { display: none; }.task-search button { border: 0; padding: 0; width: 22px; height: 25px; color: var(--ink-500); background: transparent; font-size: 18px; }.search-result-count { margin: 10px 0; font-size: 10px; color: var(--ink-500); }
.stage-card { background: #fdfefb; border: 1px solid #e7ece1; box-shadow: 0 3px 10px #25463803; }.stage-heading { padding-bottom: 12px; border-bottom: 1px solid #e6ecdf; }.task-search { background: #eef3e8; }.task-search input::placeholder { color: var(--ink-500); }.task-filters button[aria-pressed="true"] { background: #e1ebd9; color: #30553d; }
@container plan (max-width: 600px) { .stage-card { padding: 17px 14px 6px; }.stage-title { font-size: 16px; }.stage-heading { display: block; }.time-range { margin-top: 8px; }.task-filters { gap: 2px; }.task-filters button { gap: 5px; padding: 7px 8px; }.stage-objective { font-size: 11px; }.tasks-heading { margin-top: 16px; } }
</style>
