<script setup>
import { computed } from 'vue'
import ClarificationForm from './ClarificationForm.vue'
import DateStamp from './DateStamp.vue'

const answers = defineModel('answers', { type: Array, required: true })
const props = defineProps({
  result: { type: Object, required: true },
  activeRequest: { type: String, default: null },
  historyCount: { type: Number, default: 0 },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  planExists: { type: Boolean, default: false },
})

const emit = defineEmits(['reset', 'clarify', 'generate-plan', 'view-plan', 'dismiss-error'])
const isReady = computed(() => props.result.readiness === 'READY')
const summaryPoints = computed(() => {
  const text = String(props.result.goalSummary || '').trim()
  const points = text.split(/[，,；;。！？!?]+/).map((item) => item.trim()).filter(Boolean)

  if (points.length <= 6) return points.length ? points : ['暂未形成目标概述']
  return [...points.slice(0, 5), points.slice(5).join('，')]
})
const summaryLead = computed(() => summaryPoints.value[0])
const summaryDetails = computed(() => summaryPoints.value.slice(1))
const snapshotLabel = computed(() => {
  if (!props.result.analysisId) return '实时分析'
  const version = props.result.versionNumber ? `V${props.result.versionNumber}` : 'V1'
  return `${version} · 已保存的分析`
})
</script>

<template>
  <section id="analysis" class="analysis-module">
    <header class="module-heading">
      <div class="heading-index"><small>STEP</small><strong>02</strong></div>
      <div class="heading-copy">
        <span>GOAL INSIGHTS · 目标理解</span>
        <h2>目标画像</h2>
        <p>先确认我们理解的是同一件事，再进入计划阶段。</p>
      </div>
      <div class="heading-actions">
        <span class="snapshot-chip"><span class="snapshot-version"><i></i>{{ snapshotLabel }}</span><DateStamp v-if="result.createdAt" :value="result.createdAt" label="" compact /></span>
        <button class="secondary-button" :disabled="!!activeRequest" @click="emit('reset')">分析新目标</button>
      </div>
    </header>

    <div v-if="errorMessage" class="error-banner" role="alert">
      <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <button @click="emit('dismiss-error')">×</button>
    </div>

    <article class="summary-panel panel">
      <div class="summary-topline">
        <span class="summary-label"><i></i><span><strong>目标概述</strong><small>GOAL BRIEF</small></span></span>
        <span class="status" :class="{ ready: isReady }">
          <i></i>{{ isReady ? '信息已充足' : '需要补充信息' }}
        </span>
      </div>
      <div class="summary-layout" :class="{ single: !summaryDetails.length }">
        <div class="summary-lead">
          <span><i></i>核心意图</span>
          <h3>{{ summaryLead }}</h3>
        </div>
        <ol v-if="summaryDetails.length" class="summary-points">
          <li v-for="(item, index) in summaryDetails" :key="`${index}-${item}`">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <p>{{ item }}</p>
          </li>
        </ol>
      </div>
    </article>

    <details class="insight-details" :open="isReady">
      <summary><span>查看已知信息与待补充项</span><small>{{ result.knownInformation.length }} 项已明确 · {{ result.missingInformation.length }} 项待补充</small><i>⌄</i></summary>
    <div class="insight-grid">
      <article class="insight-panel panel known">
        <header>
          <span class="insight-icon">
            <svg viewBox="0 0 20 20" fill="none"><path d="m4 10 3.3 3.3L16 5.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <div><h3>已经明确</h3><p>{{ result.knownInformation.length }} 项已知信息</p></div>
        </header>
        <ul>
          <li v-for="(item, index) in result.knownInformation" :key="item">
            <span class="point-index">{{ String(index + 1).padStart(2, '0') }}</span><p>{{ item }}</p>
          </li>
        </ul>
      </article>

      <article class="insight-panel panel missing">
        <header>
          <span class="insight-icon">?</span>
          <div><h3>{{ isReady ? '没有关键缺口' : '还需要明确' }}</h3><p>{{ result.missingInformation.length }} 项缺失信息</p></div>
        </header>
        <ul v-if="result.missingInformation.length">
          <li v-for="(item, index) in result.missingInformation" :key="item">
            <span class="point-index">{{ String(index + 1).padStart(2, '0') }}</span><p>{{ item }}</p>
          </li>
        </ul>
        <p v-else class="empty-copy">当前信息足以支撑一份合理的初步计划。</p>
      </article>
    </div>

    </details>

    <ClarificationForm
      v-if="result.clarificationQuestions.length"
      v-model:answers="answers"
      :questions="result.clarificationQuestions"
      :snapshot-id="result.analysisId"
      :busy="!!activeRequest"
      :history-count="historyCount"
      @submit="emit('clarify')"
    />

    <article v-else class="ready-panel panel">
      <span class="ready-icon">
        <svg viewBox="0 0 30 30" fill="none"><path d="m7 15 5 5L23 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </span>
      <div>
        <span class="section-tag light">步骤 3 / 3</span>
        <h3>信息已经准备好</h3>
        <p>现在可以根据原始目标和已确认的信息生成结构化行动计划。</p>
      </div>
      <button class="light-button" :disabled="!!activeRequest || !isReady" @click="emit(planExists ? 'view-plan' : 'generate-plan')">
        <span v-if="activeRequest === 'plan'" class="spinner dark"></span>
        <template v-else>{{ planExists ? '查看行动计划' : '生成执行计划' }} <span>→</span></template>
      </button>
    </article>
  </section>
</template>

<style scoped>
.analysis-module {
  scroll-margin-top: 24px;
  display: grid;
  gap: 18px;
  font-family: var(--text-cn);
}

.module-heading {
  padding: 5px 2px 3px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.heading-index {
  width: 46px;
  height: 54px;
  padding: 7px 0 6px;
  display: grid;
  align-content: space-between;
  place-items: center;
  color: var(--paper);
  background: linear-gradient(155deg, var(--coral-500), var(--coral-700));
  border-radius: 13px;
  box-shadow: 0 8px 20px rgba(81,89,141,.16);
}

.heading-index small {
  color: rgba(255,255,255,.68);
  font-family: var(--display);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .12em;
}

.heading-index strong {
  font-family: var(--display);
  font-size: 18px;
  line-height: 1;
}

.heading-copy > span,
.section-tag {
  color: var(--coral-700);
  font-family: var(--display);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .13em;
}

.heading-copy h2 {
  margin: 5px 0 3px;
  color: var(--ink);
  font-family: var(--text-cn);
  font-size: clamp(29px, 2.4vw, 35px);
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -.045em;
}

.heading-copy p,
.ready-panel p {
  margin: 4px 0 0;
  color: var(--ink-600);
  font-size: 12px;
  line-height: 1.65;
}

.secondary-button {
  min-height: 40px;
  padding: 0 15px;
  color: var(--ink-700);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.secondary-button:hover { background: var(--canvas); }
.heading-actions { display: flex; align-items: center; gap: 9px; }
.snapshot-chip { min-width: 0; padding: 10px 13px; display: inline-flex; flex-direction: column; align-items: flex-start; gap: 8px; color: #6b627a; background: linear-gradient(110deg, #f4f1f9, #faf7fb); border: 0; border-radius: 12px; font-size: 11px; font-weight: 500; }
.snapshot-version { display: inline-flex; align-items: center; gap: 8px; }.snapshot-version i { width: 5px; height: 5px; background: #9486b2; border-radius: 50%; box-shadow: 0 0 0 3px #e9e2f3; }

.panel {
  background: var(--paper);
  border: 0;
  border-radius: 20px;
  box-shadow: var(--surface-shadow);
}

.summary-panel { position: relative; overflow: hidden; padding: 0; }
.summary-panel::before { content: ''; position: absolute; z-index: 1; top: 0; bottom: 0; left: 0; width: 4px; background: linear-gradient(180deg, var(--coral-500), var(--rose-500)); }

.summary-topline {
  min-height: 64px;
  padding: 13px 21px 13px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(90deg, var(--canvas-soft), rgba(255,255,255,.96));
  border-bottom: 1px solid var(--line);
}

.summary-label { display: flex; align-items: center; gap: 10px; }
.summary-label > i { width: 30px; height: 30px; display: grid; place-items: center; background: var(--coral-100); border: 1px solid var(--coral-300); border-radius: 9px; }
.summary-label > i::after { content: ''; width: 8px; height: 8px; background: var(--coral-600); border-radius: 2px; transform: rotate(45deg); }
.summary-label strong, .summary-label small { display: block; }
.summary-label strong { color: var(--ink-800); font-size: 12px; font-weight: 600; }
.summary-label small { margin-top: 2px; color: var(--ink-400); font-family: var(--display); font-size: 7px; font-weight: 700; letter-spacing: .13em; }

.summary-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, .92fr);
}

.summary-layout.single { grid-template-columns: 1fr; }

.summary-lead {
  min-height: 155px;
  padding: 22px 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-lead > span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-500);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .08em;
}

.summary-lead > span i { width: 18px; height: 1px; background: var(--coral-500); }

.summary-lead h3 {
  max-width: 760px;
  margin: 14px 0 0;
  color: var(--ink-900);
  font-family: var(--text-cn);
  font-size: clamp(20px, 1.5vw, 23px);
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: -.025em;
}

.summary-points {
  margin: 0;
  padding: 15px 20px;
  display: grid;
  align-content: center;
  background: rgba(248,248,250,.72);
  border-left: 1px solid var(--line);
  list-style: none;
}

.summary-points li {
  min-height: 46px;
  padding: 9px 4px;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
}

.summary-points li + li { border-top: 1px solid var(--line); }
.summary-points li > span { padding-top: 2px; color: var(--coral-600); font-family: var(--display); font-size: 9px; font-weight: 700; }
.summary-points p { margin: 0; color: var(--ink-700); font-size: 13px; font-weight: 400; line-height: 1.65; }

.status {
  padding: 7px 11px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--coral-800);
  background: var(--coral-100);
  border: 1px solid var(--coral-300);
  border-radius: 999px;
  font-size: 11px;
}

.status.ready {
  color: var(--moss-800);
  background: var(--moss-100);
  border-color: var(--moss-300);
}

.status i {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.insight-details { overflow: hidden; border: 1px solid var(--line-strong); border-radius: 14px; background: rgba(255,255,255,.8); }
.insight-details > summary { padding: 15px 18px; display: flex; align-items: center; gap: 12px; list-style: none; cursor: pointer; color: var(--ink-600); font-size: 12px; }
.insight-details > summary::-webkit-details-marker { display: none; }.insight-details summary > small { margin-left: auto; color: var(--ink-500); font-size: 10px; }.insight-details summary > i { font-style: normal; transition: transform .2s; }.insight-details[open] summary > i { transform: rotate(180deg); }.insight-details summary:focus-visible { outline: 2px solid var(--coral-600); outline-offset: -4px; }
.insight-details .insight-grid { padding: 0 14px 14px; gap: 14px; }.insight-details .insight-panel { box-shadow: none; }
@media(max-width: 480px) { .insight-details > summary { flex-wrap: wrap; gap: 6px; }.insight-details summary > small { margin-left: 0; }.insight-details summary > i { margin-left: auto; } }

.insight-panel {
  padding: 19px 21px;
}

.insight-panel.known { background: linear-gradient(145deg, var(--paper), var(--moss-100)); border-color: var(--moss-300); }
.insight-panel.missing { background: linear-gradient(145deg, var(--paper), var(--coral-100)); border-color: var(--coral-300); }

.insight-panel header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 17px;
  border-bottom: 1px solid var(--line-strong);
}

.insight-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-800);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.missing .insight-icon { background: var(--coral-700); }
.insight-icon svg { width: 20px; }
.insight-panel h3 { margin: 0; color: var(--ink); font-family: var(--text-cn); font-size: 16px; font-weight: 600; letter-spacing: -.015em; }
.insight-panel header p { margin: 3px 0 0; color: var(--ink-600); font-size: 12px; }

.insight-panel ul {
  margin: 18px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
  list-style: none;
}

.insight-panel li {
  min-height: 46px;
  padding: 11px 12px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  color: var(--ink-700);
  background: rgba(255,255,255,.72);
  border: 1px solid rgba(213,215,223,.8);
  border-radius: 9px;
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}

.insight-panel li:hover { background: var(--paper); border-color: var(--ink-300); transform: translateX(2px); }
.insight-panel li p { margin: 0; font-size: 13px; font-weight: 400; line-height: 1.65; }
.point-index { padding-top: 2px; color: var(--moss-700); font-family: var(--display); font-size: 9px; font-weight: 700; }
.missing .point-index { color: var(--coral-700); }
.empty-copy { margin: 20px 0 0; color: var(--ink-700); font-size: 14px; line-height: 1.6; }

.light-button {
  min-width: 166px;
  min-height: 45px;
  padding: 0 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.light-button:disabled { cursor: not-allowed; opacity: .48; }

.ready-panel {
  padding: 30px;
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: center;
  gap: 20px;
  color: var(--paper);
  background: var(--moss-800);
  border-color: var(--moss-900);
}

.ready-icon { width: 52px; height: 52px; display: grid; place-items: center; color: var(--moss-900); background: var(--coral-300); border-radius: 50%; }
.ready-icon svg { width: 30px; }
.section-tag.light { color: var(--coral-300); }
.ready-panel h3 { margin: 6px 0 0; font-family: var(--text-cn); font-size: 25px; font-weight: 600; letter-spacing: -.02em; }
.ready-panel p { color: rgba(255,255,255,.77); font-size: 13px; }
.light-button { color: var(--moss-900); background: var(--paper); border: 1px solid var(--paper); }
.light-button:hover:not(:disabled) { background: var(--canvas); }

.error-banner { padding: 15px 18px; display: flex; justify-content: space-between; color: var(--danger); background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: 10px; }
.error-banner strong { font-size: 14px; }
.error-banner p { margin: 4px 0 0; font-size: 13px; }
.error-banner button { color: currentColor; background: none; border: 0; font-size: 21px; }

.spinner { width: 15px; height: 15px; display: inline-block; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
.spinner.dark { border-color: rgba(83,91,83,.25); border-top-color: var(--moss-900); }
@keyframes spin { to { transform: rotate(360deg); } }
.analysis-module { container-type: inline-size; gap: 16px; }
.ready-panel { padding: 22px; background: linear-gradient(110deg, var(--moss-800), #424560); }.ready-panel h3 { font-size: 22px; }
@container (max-width: 950px) { .module-heading { grid-template-columns: 48px 1fr; }.heading-actions { grid-column: 2; flex-wrap: wrap; }.summary-layout { grid-template-columns: 1fr; }.summary-points { border-left: 0; border-top: 1px solid var(--line); }.summary-lead { min-height: auto; } }
@container (max-width: 680px) { .insight-grid { grid-template-columns: 1fr; }.ready-panel { grid-template-columns: 44px 1fr; }.ready-panel .light-button { grid-column: 1 / -1; } }

@media (max-width: 720px) {
  .module-heading { grid-template-columns: 45px 1fr; }
  .heading-index { width: 42px; height: 50px; }
  .heading-actions { grid-column: 1 / -1; flex-wrap: wrap; }
  .summary-layout { grid-template-columns: 1fr; }
  .summary-lead { min-height: auto; }
  .summary-points { border-top: 1px solid var(--line); border-left: 0; }
  .insight-grid { grid-template-columns: 1fr; }
  .ready-panel { grid-template-columns: 45px 1fr; }
  .ready-icon { width: 44px; height: 44px; }
  .ready-panel .light-button { grid-column: 1 / -1; width: 100%; }
}

@media (max-width: 540px) {
  .insight-panel, .ready-panel { padding: 21px; }
  .summary-topline { padding: 12px 16px 12px 20px; }
  .summary-lead { padding: 24px 21px; }
  .summary-points { padding: 12px 17px; }
  .summary-topline { align-items: flex-start; flex-direction: column; }
}
</style>
