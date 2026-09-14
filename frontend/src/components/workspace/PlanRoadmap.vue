<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import DateStamp from './DateStamp.vue'
import PlanStageCard from './PlanStageCard.vue'
import PlanDecisionPanel from './PlanDecisionPanel.vue'
import TaskProgressOverview from './TaskProgressOverview.vue'
import { taskProgress } from '../../utils/planTasks'

const props = defineProps({
  plan: { type: Object, required: true },
  activeRequest: { type: String, default: null },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  readOnly: { type: Boolean, default: false }, // Plan decisions only; task edits have their own status checks.
  actionBlocked: { type: Boolean, default: false },
  goalStatus: { type: String, default: '' },
  pendingTask: { type: Object, default: null },
  taskBusy: { type: Boolean, default: false },
  taskFeedback: { type: Object, default: null },
  taskUpdatesBlocked: { type: Boolean, default: false },
})
defineEmits(['reset', 'approve', 'reject', 'regenerate', 'open-library', 'dismiss-error', 'update-task', 'refresh-tasks', 'ask-assistant'])

const instanceId = useId()
const taskCount = computed(() => props.plan.stages.reduce((sum, stage) => sum + stage.tasks.length, 0))
const allTasks = computed(() => props.plan.stages.flatMap(stage => stage.tasks))
const editableTasks = computed(() => props.plan.status === 'ACTIVE' && props.goalStatus === 'ACTIVE')
const planStatusLabels = { DRAFT: '草稿', ACTIVE: '已启用', REJECTED: '未采用', SUPERSEDED: '已替代' }
const planStatusLabel = computed(() => props.actionBlocked ? '状态待核对' : planStatusLabels[props.plan.status] || '状态待确认')
const snapshotTimeLabel = computed(() => props.plan.updatedAt ? '最近更新' : '保存时间')
// Split only at sentence boundaries, preserving the original wording and punctuation.
const summaryPoints = computed(() => String(props.plan.planSummary || '').trim().split(/(?<=[。！？])\s*|\n+/u).map(text => text.trim()).filter(Boolean))
const summaryOpen = ref(false)
const selectedStage = ref(0)
const expandedTasks = ref({})
const currentStage = computed(() => props.plan.stages[selectedStage.value])
const stageDirectory = ref(null)
const stageContent = ref(null)
let focusAfterSwitch = false

watch([() => props.plan.planId, () => props.plan.stages.length], () => {
  selectedStage.value = 0
  expandedTasks.value = {}
  summaryOpen.value = false
  focusAfterSwitch = false
}, { immediate: true })

function openTasks(index) {
  return expandedTasks.value[index] ?? (props.plan.status !== 'ACTIVE' && props.plan.stages[index]?.tasks.length ? [0] : [])
}

function toggleTask(index) {
  const current = openTasks(selectedStage.value)
  expandedTasks.value[selectedStage.value] = current.includes(index) ? current.filter(item => item !== index) : [...current, index]
}

async function selectStage(index, focusContent = false) {
  if (index < 0 || index >= props.plan.stages.length || index === selectedStage.value) return
  focusAfterSwitch = focusContent
  selectedStage.value = index
  await nextTick()
  // Keep the selected mobile directory card in view without moving the page vertically.
  const directory = stageDirectory.value
  const button = directory?.querySelector('[aria-pressed="true"]')
  if (directory && button && directory.scrollWidth > directory.clientWidth) {
    const bounds = directory.getBoundingClientRect()
    const item = button.getBoundingClientRect()
    const delta = item.left < bounds.left ? item.left - bounds.left : item.right > bounds.right ? item.right - bounds.right : 0
    directory.scrollBy({ left: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
}

function focusStageHeading() {
  if (!focusAfterSwitch) return
  focusAfterSwitch = false
  const heading = stageContent.value?.querySelector('.stage-title')
  if (!heading) return
  heading.focus({ preventScroll: true })
  const bounds = heading.getBoundingClientRect()
  if (bounds.top < 96 || bounds.bottom > window.innerHeight - 24) {
    heading.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
}
</script>

<template>
  <section id="plan" class="plan-module">
    <header class="module-heading">
      <div class="heading-copy">
        <div class="plan-eyebrow"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18c5 0 4-12 9-12h5m-4-4 4 4-4 4" /><circle cx="5" cy="18" r="2.5" /></svg><span>行动计划</span><i></i><span class="plan-status" :class="{ active: plan.status === 'ACTIVE', rejected: plan.status === 'REJECTED', blocked: actionBlocked }">{{ planStatusLabel }}</span><span v-if="plan.versionNumber" class="plan-version">V{{ plan.versionNumber }}</span></div>
        <h2>{{ plan.planTitle }}</h2>
        <p>看清路线，一次专注一个阶段。</p>
      </div>
      <DateStamp :value="plan.updatedAt || plan.createdAt" :label="snapshotTimeLabel" compact />
    </header>

    <div v-if="taskFeedback" class="execution-notice" :class="taskFeedback.kind" :role="taskFeedback.kind === 'error' ? 'alert' : 'status'">
      <span aria-hidden="true">{{ taskFeedback.kind === 'success' ? '✓' : taskFeedback.kind === 'error' ? '!' : '↻' }}</span>
      <p>{{ taskFeedback.message }}</p>
      <div v-if="taskFeedback.kind === 'error'"><button type="button" :disabled="taskBusy || !!activeRequest" @click="$emit('refresh-tasks')">{{ taskBusy ? '正在读取…' : '重新读取状态' }}</button><button type="button" :disabled="taskBusy" @click="$emit('open-library')">返回目标库</button></div>
    </div>
    <span v-if="pendingTask" class="sr-only" role="status">正在保存任务状态，请稍候。</span>

    <TaskProgressOverview v-if="plan.status === 'ACTIVE'" :tasks="allTasks" :editable="editableTasks" />

    <div v-if="currentStage" class="roadmap-workspace">
      <nav class="stage-directory" aria-label="计划阶段目录">
        <header><h3>阶段目录</h3><span>{{ plan.stages.length }} 个阶段 · {{ taskCount }} 项任务</span></header>
        <ol ref="stageDirectory">
          <li v-for="(stage, index) in plan.stages" :key="stage.stageId || index" :class="{ selected: selectedStage === index }">
            <button type="button" :aria-pressed="selectedStage === index" :aria-controls="instanceId + '-stage'" @click="selectStage(index)">
              <span class="directory-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="directory-copy"><strong>{{ stage.title }}</strong><small><span class="directory-time">{{ stage.timeRange || '时间待安排' }}</span><i aria-hidden="true">·</i><span>{{ plan.status === 'ACTIVE' ? `${taskProgress(stage.tasks).done} 已完成 · ${stage.tasks.length} 项` : `${stage.tasks.length} 项任务` }}</span></small></span>
              <span class="directory-arrow" aria-hidden="true">↗</span>
              <span v-if="plan.status === 'ACTIVE'" class="directory-progress" aria-hidden="true"><i :style="{ width: taskProgress(stage.tasks).percent + '%' }"></i></span>
            </button>
          </li>
        </ol>
        <div class="directory-note" aria-hidden="true"><span>一步一步，让想法落地。</span><svg viewBox="0 0 76 26" fill="none"><path d="M3 22c14-1 16-20 29-17s-7 26-8 13S56 14 70 4m-9 0h9v9" /></svg></div>
      </nav>
      <div :id="instanceId + '-stage'" ref="stageContent" class="stage-content">
        <Transition name="stage-focus" mode="out-in" @after-enter="focusStageHeading">
          <PlanStageCard :key="selectedStage" :stage="currentStage" :index="selectedStage" :expanded-tasks="openTasks(selectedStage)" :editable="editableTasks" :can-ask="plan.status === 'ACTIVE'" :pending-task="pendingTask" :busy="taskBusy || !!activeRequest" :updates-blocked="taskUpdatesBlocked || actionBlocked" @ask-task="$emit('ask-assistant', $event)" @toggle-task="toggleTask" @update-task="$emit('update-task', $event)" />
        </Transition>
        <div v-if="plan.stages.length > 1" class="stage-pagination">
          <button type="button" :disabled="selectedStage === 0" @click="selectStage(selectedStage - 1, true)"><span aria-hidden="true">←</span> 上一阶段</button>
          <span aria-live="polite" aria-atomic="true">正在查看第 <strong>{{ selectedStage + 1 }}</strong> 阶段<span class="sr-only">：{{ currentStage.title }}</span></span>
          <button type="button" :disabled="selectedStage === plan.stages.length - 1" @click="selectStage(selectedStage + 1, true)">下一阶段 <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
    <p v-else class="empty-stages">这份计划暂未包含阶段安排。</p>

    <article class="plan-summary" aria-label="整体思路">
      <span class="summary-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M7 22V8a3 3 0 0 1 3-3h11v17H10a3 3 0 0 0 0 6m-3-6a3 3 0 0 1 3-3h11M11 9h6m-6 4h4" /></svg></span>
      <div class="summary-content">
        <h3>整体思路</h3>
        <p class="summary-lead">{{ summaryPoints[0] || '这份计划暂未提供整体说明，可以直接查看上方的阶段路线。' }}</p>
        <div :id="instanceId + '-summary'" class="summary-disclosure" :class="{ open: summaryOpen }" :inert="!summaryOpen" :aria-hidden="!summaryOpen"><div><ul class="summary-points"><li v-for="(point, index) in summaryPoints.slice(1)" :key="index">{{ point }}</li></ul></div></div>
        <button v-if="summaryPoints.length > 1" type="button" class="summary-toggle" :aria-expanded="summaryOpen" :aria-controls="instanceId + '-summary'" @click="summaryOpen = !summaryOpen">{{ summaryOpen ? '收起完整思路' : '展开完整思路' }}<svg :class="{ open: summaryOpen }" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>
        <button v-if="plan.status === 'ACTIVE'" type="button" class="plan-assistant-button" :disabled="taskBusy || !!activeRequest" @click="$emit('ask-assistant')"><span aria-hidden="true">✧</span> 询问目标助手 <small>只读问答</small><span aria-hidden="true">↗</span></button>
      </div>
      <svg class="summary-ornament" viewBox="0 0 100 64" fill="none" aria-hidden="true"><path d="M5 51c29 0 10-39 39-39s-2 35-14 17S62 4 90 13M63 53c7-12 16-14 30-11" /><circle cx="5" cy="51" r="3" /><path d="M81 24v8m-4-4h8" /></svg>
    </article>

    <PlanDecisionPanel
      :plan="plan"
      :active-request="activeRequest"
      :read-only="readOnly"
      :action-blocked="actionBlocked"
      @approve="$emit('approve')"
      @reject="$emit('reject')"
      @regenerate="$emit('regenerate')"
      @reset="$emit('reset')"
      @open-library="$emit('open-library')"
    >
      <template #notice>
        <Transition name="notice-slide">
          <div v-if="errorMessage" class="plan-error" role="alert">
            <span>!</span>
            <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
            <button type="button" aria-label="关闭错误提示" @click="$emit('dismiss-error')">×</button>
          </div>
        </Transition>
      </template>
    </PlanDecisionPanel>
  </section>
</template>

<style scoped>
.plan-module { container: plan / inline-size; scroll-margin-top: 24px; display: grid; gap: 17px; font-family: var(--text-cn); }
.plan-assistant-button { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 15px; padding: 8px 12px; color: var(--ink-700); background: linear-gradient(110deg, var(--canvas-soft), var(--canvas-soft)); border: 0; border-radius: var(--radius-sm); font-size: 12px; }.plan-assistant-button > span { font-size: 17px; }.plan-assistant-button small { padding-left: 5px; color: var(--ink-500); font-size: 10px; }.plan-assistant-button:hover:not(:disabled) { transform: translateX(3px); box-shadow: 0 3px 10px color-mix(in srgb, var(--shadow-color) 8%, transparent); }.plan-assistant-button:disabled { opacity: .5; }
.module-heading { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding: 7px 5px 0; }
.heading-copy { min-width: 0; }
.plan-eyebrow { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; color: var(--ink-500); font-size: 12px; }
.plan-eyebrow > svg { width: 24px; height: 24px; stroke: var(--accent); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.plan-eyebrow > i { width: 3px; height: 3px; background: var(--accent-pale); border-radius: 50%; margin-inline: 2px; }
.plan-status { color: var(--ink-500); }.plan-status.active { color: #52756c; }.plan-status.rejected { color: #92717f; }.plan-status.blocked { color: var(--danger); }
.plan-version { font-family: var(--display); font-size: 11px; color: var(--ink-500); padding: 2px 7px; background: color-mix(in srgb, var(--canvas-soft) 50%, transparent); border-radius: 5px; }
.heading-copy h2 { margin: 10px 0 7px; max-width: 40ch; font-family: var(--text-cn); font-size: clamp(24px, 1.7vw, 32px); font-weight: 600; color: var(--ink); line-height: 1.55; letter-spacing: .015em; overflow-wrap: anywhere; text-wrap: pretty; }
.heading-copy > p { margin: 0; color: var(--ink-500); font-size: 12px; line-height: 1.8; }
.plan-summary { position: relative; overflow: hidden; display: flex; align-items: flex-start; gap: 15px; padding: 21px 90px 21px 23px; background: linear-gradient(115deg, var(--canvas-soft), var(--canvas-soft) 65%, var(--canvas-soft)); border-radius: var(--radius-sm); }
.summary-mark { flex: 0 0 35px; height: 38px; display: grid; place-items: center; color: var(--ink-500); background: #ffffff85; border-radius: var(--radius-sm); transform: rotate(-4deg); }
.summary-mark svg { width: 25px; height: 25px; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.summary-content { min-width: 0; position: relative; z-index: 1; }
.summary-content h3 { margin: 0 0 6px; font-size: 12px; font-weight: 500; color: var(--ink-700); }
.summary-lead { max-width: 92ch; margin: 0; font-size: 14px; color: var(--ink-700); line-height: 1.95; overflow-wrap: anywhere; }
.summary-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .28s var(--ease-out), opacity .2s; }.summary-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.summary-disclosure > div { min-height: 0; overflow: hidden; }
.summary-points { display: grid; gap: 9px; margin: 12px 0 2px; padding-left: 16px; max-width: 92ch; color: var(--ink-700); font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }.summary-points li::marker { color: var(--ink-500); font-size: 10px; }.summary-points li { padding-left: 4px; }
.summary-toggle { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; padding: 4px 0; border: 0; border-radius: 4px; background: transparent; color: var(--ink-500); font-size: 11px; }.summary-toggle:hover { color: var(--ink-700); }.summary-toggle svg { width: 15px; height: 15px; stroke: currentColor; stroke-width: 1.4; transition: transform .25s; }.summary-toggle svg.open { transform: rotate(180deg); }
.summary-ornament { position: absolute; right: 15px; top: 22px; width: 74px; height: 50px; stroke: var(--line-strong); stroke-width: 1.1; opacity: .45; pointer-events: none; }
.roadmap-workspace { display: grid; grid-template-columns: minmax(235px, .28fr) minmax(0, 1fr); align-items: start; gap: 24px; }
.stage-directory { min-width: 0; padding: 9px 0; }
.stage-directory > header { padding: 0 12px 16px; display: grid; gap: 6px; }
.stage-directory h3 { margin: 0; color: var(--ink-700); font-size: 14px; font-weight: 600; }.stage-directory header > span { color: var(--ink-500); font-size: 11px; }
.stage-directory ol { position: relative; list-style: none; padding: 0; margin: 0; display: grid; gap: 7px; }
.stage-directory li { position: relative; min-width: 0; }.stage-directory li:not(:last-child)::after { content: ''; position: absolute; top: 54px; bottom: -14px; left: 29px; width: 1px; background: var(--accent-soft); }
.stage-directory button { position: relative; z-index: 1; width: 100%; display: grid; grid-template-columns: 33px minmax(0, 1fr) 12px; align-items: start; gap: 11px; text-align: left; padding: 16px 12px; border: 0; border-radius: var(--radius-sm); background: transparent; }.stage-directory button:hover { background: #ffffff85; }.stage-directory button:active { scale: 1; }
.stage-directory .selected button { background: linear-gradient(100deg, #fff, var(--paper)); box-shadow: 0 4px 18px color-mix(in srgb, var(--shadow-color) 4%, transparent); }
.directory-number { width: 33px; height: 33px; display: grid; place-items: center; color: var(--ink-500); background: var(--canvas-soft); border-radius: var(--radius-sm); font-family: var(--display); font-size: 12px; font-variant-numeric: tabular-nums; transition: color .2s, background .2s; }.selected .directory-number { color: white; background: linear-gradient(140deg, var(--accent), var(--accent-deep)); box-shadow: 0 4px 8px color-mix(in srgb, var(--shadow-color) 15%, transparent); }
.directory-copy { min-width: 0; }.directory-copy strong { display: block; font-size: 13px; line-height: 1.75; font-weight: 500; color: var(--ink-500); overflow-wrap: anywhere; }.selected .directory-copy strong { color: var(--ink-700); }
.directory-copy small { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-top: 7px; font-size: 10px; color: var(--ink-500); line-height: 1.65; overflow-wrap: anywhere; }.directory-copy small i { color: var(--ink-500); font-style: normal; }
.directory-arrow { padding-top: 5px; font-size: 14px; color: var(--ink-500); opacity: 0; }.selected .directory-arrow { opacity: 1; }
.directory-progress { grid-column: 2 / -1; height: 3px; background: var(--accent-soft); border-radius: 3px; overflow: hidden; }.directory-progress i { display: block; height: 100%; background: #92ad9f; transition: width .3s var(--ease-out); }
.directory-note { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 23px 12px 0; color: var(--ink-500); font-size: 11px; }.directory-note svg { width: 66px; height: 27px; flex-shrink: 0; stroke: var(--line-strong); stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
.stage-content { min-width: 0; }
.execution-notice { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 13px 17px; border-radius: var(--radius-sm); color: #5b7069; background: #eaf2ef; font-size: 12px; }.execution-notice.error { background: var(--danger-soft); color: var(--danger); }.execution-notice.info { background: var(--canvas-soft); color: var(--ink-700); }
.execution-notice > span { display: grid; place-items: center; width: 23px; height: 23px; background: #ffffff80; border-radius: 50%; }.execution-notice p { flex: 1; min-width: min(100%, 180px); margin: 0; line-height: 1.8; overflow-wrap: anywhere; }.execution-notice > div { display: flex; flex-wrap: wrap; gap: 8px; }.execution-notice button { padding: 7px 10px; border: 0; border-radius: var(--radius-sm); color: inherit; background: #ffffffaa; font-size: 11px; }.execution-notice button:disabled { opacity: .55; }
.stage-pagination { display: flex; justify-content: space-between; align-items: center; gap: 9px; margin-top: 13px; }
.stage-pagination > span { font-size: 11px; color: var(--ink-500); }.stage-pagination > span strong { color: var(--ink-500); font-family: var(--display); font-weight: 500; margin-inline: 3px; }
.stage-pagination button { min-height: 36px; padding: 7px 9px; display: inline-flex; align-items: center; gap: 9px; color: var(--ink-500); background: transparent; border: 0; border-radius: var(--radius-sm); font-size: 12px; }.stage-pagination button:hover:not(:disabled) { background: var(--canvas-soft); }.stage-pagination button:disabled { opacity: .38; }
.empty-stages { padding: 24px; margin: 0; border-radius: var(--radius-sm); background: #fff; color: var(--ink-500); font-size: 13px; }
.stage-focus-enter-active, .stage-focus-leave-active { transition: opacity .15s ease, transform .18s var(--ease-out); }.stage-focus-enter-from { opacity: 0; transform: translateY(7px); }.stage-focus-leave-to { opacity: 0; transform: translateY(-4px); }
.plan-error { display: flex; align-items: flex-start; gap: 12px; padding: 15px; border-radius: var(--radius-sm); background: var(--danger-soft); color: var(--danger); font-size: 12px; }.plan-error > span { display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; background: #a3485512; }.plan-error > div { min-width: 0; flex: 1; }.plan-error strong { font-weight: 600; }.plan-error p { margin: 5px 0 0; line-height: 1.8; overflow-wrap: anywhere; }.plan-error button { border: 0; background: transparent; color: var(--danger); font-size: 20px; }
.notice-slide-enter-active, .notice-slide-leave-active { transition: opacity .2s, transform .2s; }.notice-slide-enter-from, .notice-slide-leave-to { opacity: 0; transform: translateY(-5px); }
@container plan (max-width: 850px) {
  .roadmap-workspace { grid-template-columns: minmax(0, 1fr); gap: 15px; }.stage-directory { padding: 0; }.stage-directory > header { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; padding: 0 4px 12px; gap: 8px; }
  .stage-directory ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 0; }
  .stage-directory li:not(:last-child)::after, .directory-note { display: none; }
  .stage-directory button { height: 100%; padding: 11px; gap: 7px; grid-template-columns: 26px minmax(0, 1fr); background: color-mix(in srgb, var(--canvas-soft) 38%, transparent); }.directory-copy strong { font-size: 11px; line-height: 1.6; }.directory-copy small { margin-top: 4px; font-size: 10px; }.directory-copy small i, .directory-arrow { display: none; }.directory-number { width: 26px; height: 27px; border-radius: var(--radius-sm); font-size: 11px; }.directory-progress { grid-column: 2; }.stage-directory .selected button { background: var(--canvas-soft); box-shadow: inset 0 0 0 1px var(--shadow-color); }.selected .directory-number { background: var(--accent); box-shadow: none; }
}
@container plan (max-width: 600px) {
  .module-heading { flex-wrap: wrap; gap: 17px; padding-inline: 0; }.heading-copy { flex-basis: 100%; }.heading-copy h2 { margin-top: 8px; font-size: 23px; }.heading-copy > p { font-size: 11px; }
  .plan-summary { gap: 10px; padding: 17px 15px; border-radius: var(--radius-sm); }.summary-mark { flex-basis: 28px; height: 32px; }.summary-mark svg { width: 22px; height: 22px; }.summary-lead { font-size: 13px; }.summary-points { font-size: 12px; }.summary-ornament { display: none; }
  .stage-pagination { gap: 4px; }.stage-pagination button { font-size: 11px; padding: 7px 3px; gap: 4px; }.stage-pagination > span { font-size: 10px; }
}
@container plan (max-width: 600px) { .directory-copy .directory-time { display: none; }.directory-copy strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }.stage-directory button { padding: 9px; }.directory-progress { display: none; } }
@container plan (max-width: 360px) { .stage-directory button { gap: 6px; grid-template-columns: 21px minmax(0, 1fr); padding: 8px; }.directory-number { width: 21px; height: 24px; font-size: 10px; }.directory-copy strong { font-size: 10px; }.directory-copy small { font-size: 9px; gap: 3px; } }
</style>
