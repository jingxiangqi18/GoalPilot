<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
  activeRequest: { type: String, default: null },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
})
defineEmits(['reset', 'approve', 'dismiss-error'])

const taskCount = computed(() => props.plan.stages.reduce((sum, stage) => sum + stage.tasks.length, 0))
const planStatusLabels = {
  DRAFT: '草稿',
  ACTIVE: '已启用',
  REJECTED: '已拒绝',
  SUPERSEDED: '已替代',
}
const taskStatusLabels = {
  TODO: '待开始',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
  SKIPPED: '已跳过',
}
const planStatusLabel = computed(() => planStatusLabels[props.plan.status] || props.plan.status || '草稿')
const isDraft = computed(() => props.plan.status === 'DRAFT')
const isActive = computed(() => props.plan.status === 'ACTIVE')
const approvalArmed = ref(false)
const snapshotTimeLabel = computed(() => props.plan.updatedAt ? '最近更新' : '保存时间')
const snapshotTime = computed(() => {
  const value = props.plan.updatedAt || props.plan.createdAt
  if (!value) return '刚刚保存'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚保存'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date)
})

watch(() => props.plan.status, (status) => {
  if (status !== 'DRAFT') approvalArmed.value = false
})

function taskStatusLabel(status) {
  return taskStatusLabels[status] || status || '待开始'
}

function statusClass(status) {
  return String(status || 'TODO').toLowerCase().replaceAll('_', '-')
}
</script>

<template>
  <section id="plan" class="plan-module" :class="{ 'active-plan': isActive }">
    <header class="module-heading">
      <div class="heading-index">03</div>
      <div class="heading-copy">
        <span>PLAN SNAPSHOT · 计划快照</span>
        <h2>{{ plan.planTitle }}</h2>
        <p>计划、阶段与任务均已保存，可按记录编号核对后端数据。</p>
      </div>
      <div class="plan-stats">
        <span class="plan-status" :class="statusClass(plan.status)"><i></i>{{ planStatusLabel }}</span>
        <span><strong>{{ plan.stages.length }}</strong> 个阶段</span>
        <span><strong>{{ taskCount }}</strong> 项任务</span>
      </div>
    </header>

    <article class="snapshot-bar" aria-label="计划保存信息">
      <div>
        <span>计划记录</span>
        <strong>{{ plan.planId ? `#${plan.planId}` : '—' }}</strong>
      </div>
      <div>
        <span>来源分析</span>
        <strong>{{ plan.sourceAnalysisId ? `#${plan.sourceAnalysisId}` : '—' }}</strong>
      </div>
      <div>
        <span>快照版本</span>
        <strong>{{ plan.versionNumber ? `V${plan.versionNumber}` : '待分配' }}</strong>
      </div>
      <div class="saved-at">
        <span>{{ snapshotTimeLabel }}</span>
        <strong>{{ snapshotTime }}</strong>
      </div>
    </article>

    <Transition name="notice-slide">
      <div v-if="errorMessage" class="plan-error" role="alert">
        <span>!</span>
        <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
        <button type="button" aria-label="关闭错误提示" @click="$emit('dismiss-error')">×</button>
      </div>
    </Transition>

    <article class="plan-summary">
      <span>整体思路</span>
      <p>{{ plan.planSummary }}</p>
    </article>

    <ol class="stage-list">
      <li
        v-for="(stage, stageIndex) in plan.stages"
        :key="stage.stageId || `${stageIndex}-${stage.title}`"
        :style="{ '--stage-delay': `${stageIndex * 85}ms` }"
      >
        <div class="stage-number">{{ stageIndex + 1 }}</div>
        <article class="stage-card">
          <header>
            <div>
              <span>阶段 {{ stageIndex + 1 }}<template v-if="stage.stageId"> · 记录 #{{ stage.stageId }}</template></span>
              <h3>{{ stage.title }}</h3>
            </div>
            <span class="time-range">{{ stage.timeRange }}</span>
          </header>

          <div class="stage-objective">
            <strong>阶段目标</strong>
            <p>{{ stage.objective }}</p>
          </div>

          <div class="task-list">
            <article
              v-for="(task, taskIndex) in stage.tasks"
              :key="task.taskId || `${taskIndex}-${task.title}`"
              class="task-card"
              :style="{ '--task-delay': `${stageIndex * 85 + taskIndex * 45 + 140}ms` }"
            >
              <div class="task-number">{{ String(taskIndex + 1).padStart(2, '0') }}</div>
              <div class="task-content">
                <div class="task-heading">
                  <h4>{{ task.title }}</h4>
                  <div class="task-meta">
                    <small v-if="task.taskId">任务记录 #{{ task.taskId }}</small>
                    <span class="task-status" :class="statusClass(task.status)"><i></i>{{ taskStatusLabel(task.status) }}</span>
                  </div>
                </div>
                <p>{{ task.description }}</p>
                <div class="criteria">
                  <span>✓</span>
                  <p><strong>完成标准</strong>{{ task.completionCriteria }}</p>
                </div>
              </div>
            </article>
          </div>
        </article>
      </li>
    </ol>

    <footer class="plan-footer">
      <div class="footer-copy">
        <span class="footer-state" :class="{ active: isActive }">
          <svg v-if="isActive" viewBox="0 0 24 24" fill="none"><path d="m5.5 12.5 4.1 4.1L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <i v-else></i>
        </span>
        <div>
          <strong>{{ isActive ? `正式计划已启用 · V${plan.versionNumber || 1}` : '计划草稿等待确认' }}</strong>
          <p>{{ isActive ? '目标已同步进入进行中状态，可以按这份正式版本开始执行。' : '确认后将分配正式版本号，并把目标同步切换为进行中。' }}</p>
        </div>
      </div>
      <div class="footer-actions">
        <button class="reset-button" type="button" :disabled="!!activeRequest" @click="$emit('reset')">规划其他目标</button>
        <button v-if="isDraft && approvalArmed" class="cancel-button" type="button" :disabled="!!activeRequest" @click="approvalArmed = false">暂不启用</button>
        <button v-if="isDraft" class="approve-button" :class="{ confirming: approvalArmed }" type="button" :disabled="!!activeRequest || !plan.planId" @click="approvalArmed ? $emit('approve') : approvalArmed = true">
          <span v-if="activeRequest === 'approval'" class="spinner"></span>
          <template v-else>{{ approvalArmed ? '确定启用正式版本' : '确认并启用计划' }} <span>→</span></template>
        </button>
        <span v-else class="approval-complete"><i></i>{{ planStatusLabel }}</span>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.plan-module {
  scroll-margin-top: 24px;
  display: grid;
  gap: 20px;
}

.plan-module.active-plan .heading-index { animation: approval-pop .55s cubic-bezier(.2,.85,.25,1.25) both; }
.plan-module.active-plan .snapshot-bar { animation: approved-glow 1.15s ease-out both; }
@keyframes approval-pop { 50% { transform: scale(1.13) rotate(-3deg); } }
@keyframes approved-glow { 35% { border-color: var(--moss-600); box-shadow: 0 0 0 5px rgba(112,134,154,.12), var(--shadow-sm); } }

.module-heading {
  padding-top: 32px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 17px;
  align-items: center;
  border-top: 1px solid var(--line-strong);
}

.heading-index {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border-radius: 12px;
  font-family: var(--serif);
  font-size: 20px;
}

.heading-copy > span {
  color: var(--coral-700);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
}

.heading-copy h2 {
  margin: 4px 0 3px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: clamp(36px, 3.5vw, 48px);
  font-weight: 600;
  line-height: 1.05;
}

.heading-copy p {
  margin: 0;
  color: var(--ink-600);
  font-size: 13px;
}

.plan-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.plan-stats span {
  padding: 9px 12px;
  color: var(--ink-700);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  font-size: 12px;
}

.plan-stats strong {
  margin-right: 3px;
  color: var(--coral-700);
  font-size: 17px;
}

.plan-stats .plan-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--coral-800);
  background: var(--coral-100);
  border-color: var(--coral-300);
  font-weight: 700;
}

.plan-status i,
.task-status i {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.plan-status.active { color: var(--moss-800); background: var(--moss-100); border-color: var(--moss-300); }
.plan-status.active i { animation: status-pulse 1.8s ease-in-out infinite; }
.plan-status.rejected { color: var(--danger); background: var(--danger-soft); border-color: var(--danger-line); }
@keyframes status-pulse { 50% { box-shadow: 0 0 0 5px rgba(112,134,154,.16); } }

.snapshot-bar {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, .65fr)) minmax(190px, 1.35fr);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.snapshot-bar > div {
  min-width: 0;
  padding: 2px 20px;
  border-left: 1px solid var(--line);
}

.snapshot-bar > div:first-child { padding-left: 0; border-left: 0; }
.snapshot-bar > div:last-child { padding-right: 0; }
.snapshot-bar span { display: block; color: var(--ink-500); font-size: 9px; font-weight: 700; letter-spacing: .08em; }
.snapshot-bar strong { display: block; margin-top: 5px; overflow: hidden; color: var(--ink-800); font-size: 12px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }

.plan-error { padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: var(--danger); background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: 11px; }
.plan-error > span { width: 29px; height: 29px; flex: 0 0 auto; display: grid; place-items: center; color: var(--paper); background: var(--danger); border-radius: 9px; font-weight: 800; }
.plan-error strong { font-size: 12px; }
.plan-error p { margin: 3px 0 0; font-size: 11px; }
.plan-error button { margin-left: auto; padding: 3px 6px; color: currentColor; background: transparent; border: 0; font-size: 20px; }
.notice-slide-enter-active, .notice-slide-leave-active { transition: opacity .22s ease, transform .25s ease; }
.notice-slide-enter-from, .notice-slide-leave-to { opacity: 0; transform: translateY(-7px); }

.plan-summary {
  padding: 28px 31px;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 24px;
  color: var(--paper);
  background: var(--coral-600);
  border: 1px solid var(--coral-700);
  border-radius: 15px;
  box-shadow: var(--shadow-sm);
}

.plan-summary > span {
  padding-top: 5px;
  color: rgba(255,255,255,.82);
  font-size: 12px;
  font-weight: 700;
}

.plan-summary p {
  margin: 0;
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.45;
}

.stage-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
  list-style: none;
}

.stage-list > li {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  animation: stage-rise .55s cubic-bezier(.2,.75,.25,1) var(--stage-delay) both;
}

@keyframes stage-rise { from { opacity: 0; transform: translateY(18px); } }

.stage-number {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border: 3px solid var(--moss-200);
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 17px;
  transition: transform .24s ease, background .24s ease;
}

.stage-list > li:hover .stage-number { background: var(--coral-600); transform: translateY(-2px) scale(1.04); }

.stage-card {
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 15px;
  box-shadow: var(--shadow-sm);
  transition: border-color .24s ease, box-shadow .24s ease, transform .24s ease;
}

.stage-list > li:hover .stage-card { border-color: var(--ink-300); box-shadow: var(--shadow-md); transform: translateY(-2px); }

.stage-card > header {
  padding: 23px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--line-strong);
}

.stage-card > header > div > span {
  color: var(--coral-700);
  font-size: 11px;
  font-weight: 700;
}

.stage-card h3 {
  margin: 5px 0 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 27px;
  line-height: 1;
}

.time-range {
  padding: 8px 11px;
  color: var(--moss-800);
  background: var(--moss-100);
  border: 1px solid var(--moss-300);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.stage-objective {
  padding: 18px 26px;
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 16px;
  background: var(--canvas);
  border-bottom: 1px solid var(--line-strong);
}

.stage-objective strong {
  color: var(--ink-600);
  font-size: 12px;
}

.stage-objective p {
  margin: 0;
  color: var(--ink-700);
  font-size: 14px;
  line-height: 1.55;
}

.task-list {
  padding: 4px 26px 12px;
}

.task-card {
  padding: 22px 0;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 13px;
  animation: task-reveal .42s ease var(--task-delay) both;
}

@keyframes task-reveal { from { opacity: 0; transform: translateX(8px); } }

.task-card + .task-card {
  border-top: 1px solid var(--line);
}

.task-number {
  color: var(--coral-700);
  font-family: var(--serif);
  font-size: 15px;
}

.task-content h4 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
}

.task-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.task-meta {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 9px;
}

.task-meta small { color: var(--ink-400); font-size: 9px; font-weight: 700; }

.task-status {
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-600);
  background: var(--canvas-soft);
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.task-status.in-progress { color: var(--coral-800); background: var(--coral-100); border-color: var(--coral-300); }
.task-status.done { color: var(--moss-800); background: var(--moss-100); border-color: var(--moss-300); }
.task-status.skipped { color: var(--ink-500); opacity: .74; }

.task-content > p {
  margin: 8px 0 0;
  color: var(--ink-600);
  font-size: 13px;
  line-height: 1.65;
}

.criteria {
  margin-top: 13px;
  padding: 11px 13px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--moss-800);
  background: var(--moss-100);
  border: 1px solid var(--moss-300);
  border-radius: 8px;
}

.criteria > span {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border-radius: 50%;
  font-size: 11px;
}

.criteria p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.criteria strong {
  margin-right: 8px;
  font-size: 12px;
}

.plan-footer {
  padding: 23px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
}

.footer-copy { display: flex; align-items: center; gap: 13px; }
.footer-copy strong { color: var(--ink); font-family: var(--serif); font-size: 19px; }
.footer-copy p { margin: 3px 0 0; color: var(--ink-600); font-size: 12px; }
.footer-state { width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center; color: var(--coral-800); background: var(--coral-100); border: 1px solid var(--coral-300); border-radius: 12px; }
.footer-state i { width: 8px; height: 8px; background: currentColor; border-radius: 50%; }
.footer-state svg { width: 24px; }
.footer-state.active { color: var(--paper); background: var(--moss-700); border-color: var(--moss-700); animation: approval-pop .55s cubic-bezier(.2,.85,.25,1.25) both; }
.footer-actions { display: flex; align-items: center; gap: 9px; }
.footer-actions button { min-height: 42px; padding: 0 15px; border-radius: 9px; font-size: 12px; font-weight: 650; transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
.footer-actions button:active:not(:disabled) { transform: scale(.97); }
.footer-actions button:disabled { cursor: wait; opacity: .55; }
.reset-button { color: var(--ink-600); background: var(--paper); border: 1px solid var(--line-strong); }
.reset-button:hover:not(:disabled) { color: var(--ink); background: var(--canvas-soft); }
.cancel-button { color: var(--ink-600); background: var(--canvas-soft); border: 1px solid var(--line-strong); animation: action-enter .24s ease both; }
.approve-button { min-width: 150px; color: var(--paper); background: linear-gradient(135deg, var(--moss-700), var(--moss-900)); border: 1px solid var(--moss-900); box-shadow: 0 8px 20px rgba(32,38,51,.13); }
.approve-button:hover:not(:disabled) { box-shadow: 0 11px 25px rgba(32,38,51,.2); transform: translateY(-1px); }
.approve-button.confirming { background: linear-gradient(135deg, var(--coral-600), var(--coral-800)); border-color: var(--coral-800); animation: action-enter .24s ease both; }
@keyframes action-enter { from { opacity: 0; transform: translateX(7px); } }
.approve-button .spinner { width: 15px; height: 15px; display: inline-block; border: 2px solid rgba(255,255,255,.35); border-top-color: var(--paper); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.approval-complete { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; color: var(--moss-800); background: var(--moss-100); border: 1px solid var(--moss-300); border-radius: 9px; font-size: 11px; font-weight: 750; animation: approval-pop .55s cubic-bezier(.2,.85,.25,1.25) both; }
.approval-complete i { width: 7px; height: 7px; background: var(--moss-600); border-radius: 50%; }

@media (max-width: 760px) {
  .module-heading { grid-template-columns: 45px 1fr; }
  .heading-index { width: 42px; height: 42px; }
  .plan-stats { grid-column: 2; }
  .snapshot-bar { grid-template-columns: 1fr 1fr; gap: 14px 0; }
  .snapshot-bar > div:nth-child(3) { padding-left: 0; border-left: 0; }
  .plan-summary { grid-template-columns: 1fr; gap: 8px; }
}

@media (max-width: 560px) {
  .stage-list > li { grid-template-columns: 1fr; }
  .stage-number { width: 38px; height: 38px; }
  .stage-card > header, .plan-footer { align-items: flex-start; flex-direction: column; }
  .snapshot-bar { grid-template-columns: 1fr; }
  .snapshot-bar > div { padding: 10px 0; border-top: 1px solid var(--line); border-left: 0; }
  .snapshot-bar > div:first-child { padding-top: 0; border-top: 0; }
  .snapshot-bar > div:last-child { padding-bottom: 0; }
  .stage-objective { grid-template-columns: 1fr; gap: 6px; }
  .task-card { grid-template-columns: 1fr; }
  .task-heading { align-items: flex-start; flex-direction: column; gap: 9px; }
  .task-meta { flex-wrap: wrap; }
  .footer-actions { width: 100%; flex-direction: column-reverse; }
  .footer-actions button, .approval-complete { width: 100%; justify-content: center; }
}
</style>
