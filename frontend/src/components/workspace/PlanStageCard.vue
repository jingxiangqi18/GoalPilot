<script setup>
import { useId } from 'vue'

defineProps({
  stage: { type: Object, required: true },
  index: { type: Number, required: true },
  expandedTasks: { type: Array, default: () => [] },
})
defineEmits(['toggle-task'])
const instanceId = useId()
const statusLabels = { TODO: '待开始', IN_PROGRESS: '进行中', DONE: '已完成', SKIPPED: '已跳过' }
const statusClass = status => String(status || 'TODO').toLowerCase().replaceAll('_', '-')
</script>

<template>
  <article class="stage-card">
    <header class="stage-heading">
      <div><span class="stage-kicker">阶段 {{ String(index + 1).padStart(2, '0') }}</span><h3 class="stage-title" tabindex="-1">{{ stage.title }}</h3></div>
      <span v-if="stage.timeRange" class="time-range"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="3"/><path d="M6.5 2.5v4m7-4v4M3 9h14m-10 4h3"/></svg>{{ stage.timeRange }}</span>
    </header>
    <div v-if="stage.objective" class="stage-objective"><span>阶段目标</span><p>{{ stage.objective }}</p></div>
    <div class="tasks-heading"><h4>行动清单 <span>{{ stage.tasks.length }} 项</span></h4><span>点开任务，查看说明与完成标准</span></div>
    <ol class="task-list">
      <li v-for="(task, taskIndex) in stage.tasks" :key="task.taskId || taskIndex" class="task-card" :class="{ 'is-expanded': expandedTasks.includes(taskIndex) }">
        <h4 class="task-heading">
          <button type="button" :aria-expanded="expandedTasks.includes(taskIndex)" :aria-controls="`${instanceId}-task-${taskIndex}`" @click="$emit('toggle-task', taskIndex)">
            <span class="task-number" aria-hidden="true">{{ String(taskIndex + 1).padStart(2, '0') }}</span>
            <span class="task-title">{{ task.title }}</span>
            <span class="task-status" :class="statusClass(task.status)"><i aria-hidden="true"></i>{{ statusLabels[task.status] || (task.status ? '状态待确认' : '待开始') }}</span>
            <svg class="task-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
          </button>
        </h4>
        <div :id="`${instanceId}-task-${taskIndex}`" class="task-disclosure" :class="{ open: expandedTasks.includes(taskIndex) }" :inert="!expandedTasks.includes(taskIndex)" :aria-hidden="!expandedTasks.includes(taskIndex)">
          <div class="task-disclosure-inner"><div class="task-details">
            <div v-if="task.description" class="task-description"><span>要做什么</span><p>{{ task.description }}</p></div>
            <div v-if="task.completionCriteria" class="task-criteria"><span>完成标准</span><p>{{ task.completionCriteria }}</p></div>
            <p v-if="!task.description && !task.completionCriteria" class="task-empty">这项任务暂未提供详细说明。</p>
          </div></div>
        </div>
      </li>
    </ol>
    <p v-if="!stage.tasks.length" class="task-empty">这个阶段暂未安排任务。</p>
  </article>
</template>

<style scoped>
.stage-card { container: stage / inline-size; min-width: 0; overflow: hidden; padding: 26px 28px 12px; background: #fff; border-radius: 22px; box-shadow: var(--surface-shadow); }
.stage-heading { display: flex; align-items: flex-start; gap: 20px; justify-content: space-between; }
.stage-heading > div { min-width: 0; }
.stage-kicker { color: #756b91; font-size: 11px; font-weight: 500; letter-spacing: .05em; }
.stage-title { margin: 7px 0 0; font-family: var(--text-cn); color: #302d3d; font-size: 21px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; text-wrap: pretty; }
.stage-title { scroll-margin-top: 96px; }.stage-title:focus { outline: none; }
.time-range { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; max-width: 40%; margin-top: 4px; padding: 7px 10px; color: #68607d; background: #f2eff7; border-radius: 9px; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.time-range svg { width: 16px; height: 16px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.stage-objective { margin-top: 21px; padding: 13px 17px; background: linear-gradient(100deg, #f4f2f9, #f8f7fb); border-radius: 3px 12px 12px 3px; box-shadow: inset 3px 0 0 #b3a8ce; }
.stage-objective > span { font-size: 11px; color: #766c8b; font-weight: 500; }
.stage-objective p { max-width: 80ch; margin: 5px 0 0; font-size: 13px; line-height: 1.9; color: #504a60; overflow-wrap: anywhere; }
.tasks-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 24px 0 10px; }
.tasks-heading h4 { margin: 0; font-weight: 500; color: #514a62; font-size: 13px; }.tasks-heading h4 > span { color: var(--ink-500); margin-left: 7px; font-size: 11px; font-weight: 400; }
.tasks-heading > span { color: var(--ink-500); font-size: 11px; }
.task-list { list-style: none; padding: 0; margin: 0; }
.task-card { border-top: 1px solid #eeedf3; }
.task-heading { margin: 0; font-weight: 500; }
.task-heading button { width: 100%; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto 18px; align-items: center; gap: 12px; padding: 18px 0; border: 0; text-align: left; background: transparent; border-radius: 9px; }
.task-heading button:hover { background: #f9f8fc; }.task-heading button:active { scale: 1; }
.task-number { display: grid; place-items: center; width: 29px; height: 29px; background: #f6f5f9; color: #8a839c; border-radius: 9px; font-family: var(--display); font-size: 12px; font-weight: 400; font-variant-numeric: tabular-nums; transition: background .2s, color .2s; }
.is-expanded .task-number { background: #ede9f6; color: #746396; }
.task-title { font-family: var(--text-cn); font-size: 15px; line-height: 1.8; color: #393346; overflow-wrap: anywhere; }
.task-status { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; color: #797282; font-size: 10px; font-weight: 400; }.task-status i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }.task-status.done { color: #50796a; }.task-status.in-progress { color: #68619a; }.task-status.skipped { color: #89777e; }
.task-chevron { width: 18px; height: 18px; stroke: #91899f; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transition: transform .25s var(--ease-out); }.is-expanded .task-chevron { transform: rotate(180deg); }
.task-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .3s var(--ease-out), opacity .2s; }.task-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.task-disclosure-inner { min-height: 0; overflow: hidden; }
.task-details { display: grid; gap: 13px; padding: 0 30px 22px 42px; }
.task-details > div > span { color: #84778f; font-size: 11px; font-weight: 500; }
.task-details p { max-width: 82ch; margin: 5px 0 0; color: #61596d; font-family: var(--text-cn); font-size: 14px; line-height: 1.9; overflow-wrap: anywhere; white-space: pre-line; }
.task-criteria { padding: 12px 16px; background: #f1f6f4; border-radius: 12px; }.task-criteria > span { color: #587a6f !important; }.task-criteria p { color: #536d64; }
.task-empty { color: var(--ink-500); font-size: 13px; line-height: 1.8; }
@container stage (min-width: 1050px) {
  .task-details:has(.task-description):has(.task-criteria) { grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); align-items: start; gap: 28px; }
}
@container plan (max-width: 600px) {
  .stage-card { padding: 20px 17px 8px; border-radius: 17px; }.stage-heading { flex-wrap: wrap; gap: 9px; }.stage-title { font-size: 18px; }.time-range { max-width: 100%; margin: 0; padding: 5px 9px; }
  .stage-objective { margin-top: 16px; padding: 12px 14px; }.task-heading button { grid-template-columns: 26px minmax(0, 1fr) 16px; gap: 9px; padding-block: 15px; }.task-number { width: 25px; height: 27px; }.task-title { font-size: 13px; }.task-status { grid-column: 2; grid-row: 2; margin-top: -4px; }.task-chevron { grid-column: 3; grid-row: 1; }.task-details { padding: 0 0 18px 0; }.task-details p { font-size: 12px; }.task-criteria { padding: 10px 13px; }.tasks-heading { margin-top: 20px; }.tasks-heading > span { font-size: 10px; }
}
</style>
