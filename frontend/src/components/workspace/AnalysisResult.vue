<script setup>
import { computed } from 'vue'

const answers = defineModel('answers', { type: Array, required: true })
const props = defineProps({
  result: { type: Object, required: true },
  activeRequest: { type: String, default: null },
  historyCount: { type: Number, default: 0 },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  planExists: { type: Boolean, default: false },
})

const emit = defineEmits(['reset', 'clarify', 'generate-plan', 'dismiss-error'])
const isReady = computed(() => props.result.readiness === 'READY')
const answeredCount = computed(() => answers.value.filter((answer) => answer.trim()).length)
</script>

<template>
  <section id="analysis" class="analysis-module">
    <header class="module-heading">
      <div class="heading-index">02</div>
      <div class="heading-copy">
        <span>分析结果</span>
        <h2>目标画像</h2>
        <p>先确认我们理解的是同一件事，再进入计划阶段。</p>
      </div>
      <button class="secondary-button" @click="emit('reset')">分析新目标</button>
    </header>

    <div v-if="errorMessage" class="error-banner" role="alert">
      <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <button @click="emit('dismiss-error')">×</button>
    </div>

    <article class="summary-panel panel">
      <div class="summary-topline">
        <span>目标概述</span>
        <span class="status" :class="{ ready: isReady }">
          <i></i>{{ isReady ? '信息已充足' : '需要补充信息' }}
        </span>
      </div>
      <p>{{ result.goalSummary }}</p>
    </article>

    <div class="insight-grid">
      <article class="insight-panel panel known">
        <header>
          <span class="insight-icon">
            <svg viewBox="0 0 20 20" fill="none"><path d="m4 10 3.3 3.3L16 5.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <div><h3>已经明确</h3><p>{{ result.knownInformation.length }} 项已知信息</p></div>
        </header>
        <ul><li v-for="item in result.knownInformation" :key="item">{{ item }}</li></ul>
      </article>

      <article class="insight-panel panel missing">
        <header>
          <span class="insight-icon">?</span>
          <div><h3>{{ isReady ? '没有关键缺口' : '还需要明确' }}</h3><p>{{ result.missingInformation.length }} 项缺失信息</p></div>
        </header>
        <ul v-if="result.missingInformation.length">
          <li v-for="item in result.missingInformation" :key="item">{{ item }}</li>
        </ul>
        <p v-else class="empty-copy">当前信息足以支撑一份合理的初步计划。</p>
      </article>
    </div>

    <article v-if="result.clarificationQuestions.length" class="clarify-panel panel">
      <header>
        <div>
          <span class="section-tag">步骤 2 / 3</span>
          <h3>补充关键信息</h3>
          <p>只需回答会明显影响计划方向的问题。</p>
        </div>
        <span v-if="historyCount" class="history-badge">已累计 {{ historyCount }} 项回答</span>
      </header>

      <div class="question-list">
        <label v-for="(question, index) in result.clarificationQuestions" :key="question">
          <span class="question-number">{{ index + 1 }}</span>
          <span class="question-body">
            <strong>{{ question }}</strong>
            <textarea v-model="answers[index]" rows="3" maxlength="1000" placeholder="在这里写下你的回答……"></textarea>
          </span>
        </label>
      </div>

      <footer>
        <span>已回答 {{ answeredCount }} / {{ result.clarificationQuestions.length }}</span>
        <button class="primary-button" :disabled="answeredCount === 0 || !!activeRequest" @click="emit('clarify')">
          <span v-if="activeRequest === 'clarification'" class="spinner"></span>
          <template v-else>提交并重新分析 <span>→</span></template>
        </button>
      </footer>
    </article>

    <article v-else class="ready-panel panel">
      <span class="ready-icon">
        <svg viewBox="0 0 30 30" fill="none"><path d="m7 15 5 5L23 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </span>
      <div>
        <span class="section-tag light">步骤 3 / 3</span>
        <h3>信息已经准备好</h3>
        <p>现在可以根据原始目标和已确认的信息生成结构化行动计划。</p>
      </div>
      <button class="light-button" :disabled="!!activeRequest" @click="emit('generate-plan')">
        <span v-if="activeRequest === 'plan'" class="spinner dark"></span>
        <template v-else>{{ planExists ? '重新生成计划' : '生成执行计划' }} <span>→</span></template>
      </button>
    </article>
  </section>
</template>

<style scoped>
.analysis-module {
  scroll-margin-top: 24px;
  display: grid;
  gap: 20px;
}

.module-heading {
  padding-top: 32px;
  display: grid;
  grid-template-columns: 54px 1fr auto;
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
  background: var(--coral-600);
  border-radius: 12px;
  font-family: var(--serif);
  font-size: 20px;
}

.heading-copy > span,
.section-tag {
  color: var(--coral-700);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.heading-copy h2 {
  margin: 3px 0 2px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 42px;
  line-height: 1;
}

.heading-copy p,
.clarify-panel header p,
.ready-panel p {
  margin: 4px 0 0;
  color: var(--ink-600);
  font-size: 13px;
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

.panel {
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 15px;
  box-shadow: var(--shadow-sm);
}

.summary-panel {
  padding: 27px 30px 30px;
  border-left: 4px solid var(--coral-500);
}

.summary-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--ink-600);
  font-size: 12px;
  font-weight: 700;
}

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

.summary-panel > p {
  max-width: 1040px;
  margin: 20px 0 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: clamp(24px, 2.4vw, 34px);
  font-weight: 600;
  line-height: 1.35;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.insight-panel {
  min-height: 230px;
  padding: 25px 27px;
}

.insight-panel.known { background: var(--moss-100); border-color: var(--moss-300); }
.insight-panel.missing { background: var(--coral-100); border-color: var(--coral-300); }

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
.insight-panel h3 { margin: 0; color: var(--ink); font-size: 16px; }
.insight-panel header p { margin: 3px 0 0; color: var(--ink-600); font-size: 12px; }

.insight-panel ul {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.insight-panel li {
  position: relative;
  margin: 11px 0;
  padding-left: 18px;
  color: var(--ink-700);
  font-size: 14px;
  line-height: 1.55;
}

.insight-panel li::before {
  content: '';
  position: absolute;
  top: 0.65em;
  left: 0;
  width: 6px;
  height: 6px;
  background: var(--moss-700);
  border-radius: 50%;
}

.missing li::before { background: var(--coral-700); }
.empty-copy { margin: 20px 0 0; color: var(--ink-700); font-size: 14px; line-height: 1.6; }

.clarify-panel { padding: 29px 30px; }
.clarify-panel > header { display: flex; justify-content: space-between; gap: 24px; }
.clarify-panel h3 { margin: 7px 0 0; color: var(--ink); font-size: 23px; }
.history-badge { height: fit-content; padding: 7px 10px; color: var(--moss-800); background: var(--moss-100); border: 1px solid var(--moss-300); border-radius: 999px; font-size: 11px; font-weight: 600; }

.question-list {
  margin-top: 23px;
  display: grid;
  gap: 12px;
}

.question-list label {
  padding: 18px;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 13px;
  background: var(--canvas-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.question-number {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--coral-600);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.question-body strong { display: block; color: var(--ink); font-size: 15px; line-height: 1.5; }
.question-body textarea { width: 100%; min-height: 76px; margin-top: 12px; padding: 13px 14px; resize: vertical; color: var(--ink); background: var(--paper); border: 1px solid var(--line-strong); border-radius: 8px; outline: none; font-size: 14px; line-height: 1.55; }
.question-body textarea:focus { border-color: var(--moss-700); box-shadow: 0 0 0 3px rgba(107,118,107,.12); }

.clarify-panel footer { margin-top: 20px; padding-top: 19px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--line); }
.clarify-panel footer > span { color: var(--ink-600); font-size: 12px; }

.primary-button,
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

.primary-button { color: var(--paper); background: var(--moss-800); border: 1px solid var(--moss-900); }
.primary-button:hover:not(:disabled) { background: var(--moss-900); }
.primary-button:disabled, .light-button:disabled { cursor: not-allowed; opacity: .48; }

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
.ready-panel h3 { margin: 6px 0 0; font-family: var(--serif); font-size: 27px; }
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

@media (max-width: 720px) {
  .module-heading { grid-template-columns: 45px 1fr; }
  .heading-index { width: 42px; height: 42px; }
  .secondary-button { grid-column: 2; justify-self: start; }
  .insight-grid { grid-template-columns: 1fr; }
  .ready-panel { grid-template-columns: 45px 1fr; }
  .ready-icon { width: 44px; height: 44px; }
  .ready-panel .light-button { grid-column: 1 / -1; width: 100%; }
}

@media (max-width: 540px) {
  .summary-panel, .insight-panel, .clarify-panel, .ready-panel { padding: 21px; }
  .summary-topline, .clarify-panel > header, .clarify-panel footer { align-items: flex-start; flex-direction: column; }
  .question-list label { grid-template-columns: 1fr; }
  .clarify-panel footer { gap: 13px; }
  .clarify-panel footer .primary-button { width: 100%; }
}
</style>
