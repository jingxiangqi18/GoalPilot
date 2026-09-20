<script setup>
import { computed } from 'vue'
import { taskProgress, taskStatusCounts } from '../../utils/planTasks'

const props = defineProps({ tasks: { type: Array, required: true }, editable: Boolean, compact: Boolean })
const progress = computed(() => taskProgress(props.tasks))
const counts = computed(() => taskStatusCounts(props.tasks))
</script>

<template>
  <section class="execution-progress" :class="{ compact }" aria-label="计划进度概览">
    <div v-if="!compact" class="progress-topline">
      <div><span class="progress-label">整体进度</span><p><strong>{{ progress.done }}</strong><span>项已完成 <i>·</i> 共 {{ progress.total }} 项</span></p></div>
      <span class="progress-percent">{{ progress.percent }}<small>%</small></span>
    </div>
    <div class="execution-track" role="progressbar" aria-label="任务完成进度" :aria-valuenow="progress.done" :aria-valuemax="progress.total || 1" :aria-valuemin="0" :aria-valuetext="`已完成 ${progress.done} 项，共 ${progress.total} 项`"><i :style="{ width: progress.percent + '%' }"></i></div>
    <div v-if="!compact" class="progress-legend"><span><i class="todo"></i>待开始 <b>{{ counts.TODO }}</b></span><span><i class="doing"></i>进行中 <b>{{ counts.IN_PROGRESS }}</b></span><span><i class="done"></i>已完成 <b>{{ counts.DONE }}</b></span><span v-if="counts.SKIPPED"><i class="skipped"></i>已跳过 <b>{{ counts.SKIPPED }}</b></span><span v-if="counts.UNKNOWN">待确认 <b>{{ counts.UNKNOWN }}</b></span></div>
    <p v-if="!editable" class="progress-note">目标当前不在进行中，任务仅供查看。</p>
    <p v-else-if="progress.done === progress.total && progress.total" class="progress-note">全部任务已完成，不会自动更改目标状态。</p>
    <p v-else-if="progress.skipped" class="progress-note">{{ progress.skipped }} 项已跳过，不计入已完成。</p>
  </section>
</template>

<style scoped>
:global(#app .execution-progress.compact) { padding: 0; border: 0; background: transparent; box-shadow: none; }
.compact .execution-track { margin: 0; height: 4px; }
.compact .progress-note { margin-top: 6px; font-size: 10px; }
.execution-progress { padding: 14px 18px; border-radius: var(--radius-sm); background: linear-gradient(115deg, var(--canvas-soft), #edf4f0); }
.progress-topline { display: flex; justify-content: space-between; align-items: center; gap: 16px; }.progress-label { color: var(--ink-700); font-size: 11px; font-weight: 500; }.progress-topline p { display: flex; align-items: baseline; gap: 10px; margin: 5px 0 0; }.progress-topline strong { color: var(--ink-700); font-family: var(--display); font-size: 29px; line-height: 1.2; font-weight: 600; font-variant-numeric: tabular-nums; }.progress-topline p > span { color: var(--ink-700); font-size: 12px; }.progress-topline i { margin: 0 5px; font-style: normal; color: var(--ink-500); }
.progress-percent { color: #59766a; font-size: 26px; font-family: var(--display); font-weight: 500; font-variant-numeric: tabular-nums; }.progress-percent small { margin-left: 2px; font-size: 13px; }
.progress-topline > div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px 12px; }.progress-topline p { margin: 0; }.progress-topline strong { font-size: 26px; }
.execution-track { height: 6px; margin: 13px 0 12px; overflow: hidden; background: var(--accent-soft); border-radius: var(--radius-sm); }.execution-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-mid), #789f8d); transition: width .35s var(--ease-out); }
.progress-legend { display: flex; flex-wrap: wrap; gap: 9px 20px; }.progress-legend > span { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); font-size: 11px; }.progress-legend b { color: var(--ink-700); font-family: var(--display); font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; }.progress-legend i { width: 6px; height: 6px; border-radius: 50%; }.todo { background: var(--accent-mid); }.doing { background: var(--accent); }.done { background: #6f9684; }.skipped { background: #b3969e; }.progress-note { margin: 10px 0 0; font-size: 11px; color: var(--ink-700); line-height: 1.7; }
@container plan (max-width: 420px) { .execution-progress { padding: 15px; }.progress-legend { gap: 8px 13px; }.progress-topline strong { font-size: 25px; }.progress-topline p { gap: 7px; }.progress-topline p > span { font-size: 11px; } }
</style>
