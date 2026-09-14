<script setup>
const props = defineProps({
  currentStep: { type: Number, required: true },
  availableSteps: { type: Array, default: () => [1] },
  goalId: { type: Number, default: null },
  hasUnsavedChanges: { type: Boolean, default: false },
  completedSteps: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
const steps = [
  { id: 1, eyebrow: 'DEFINE', title: '定义目标', hint: '写下方向' },
  { id: 2, eyebrow: 'CLARIFY', title: '分析澄清', hint: '核对信息' },
  { id: 3, eyebrow: 'PLAN', title: '行动计划', hint: '确认版本' },
]

function isAvailable(step) {
  return props.availableSteps.includes(step)
}

function selectStep(step) {
  if (isAvailable(step) && !props.busy) emit('select', step)
}
</script>

<template>
  <nav class="journey-nav" aria-label="目标规划阶段">
    <div class="journey-context">
      <span>GOAL WORKFLOW</span>
      <strong>{{ goalId ? '继续这份目标规划' : '新的规划会话' }}</strong>
      <small v-if="hasUnsavedChanges"><i></i>目标文字已修改，请重新分析</small>
      <small v-else><i></i>当前阶段 {{ String(currentStep).padStart(2, '0') }} / 03</small>
    </div>

    <ol :style="{ '--active-index': currentStep - 1 }">
      <li
        v-for="step in steps"
        :key="step.id"
        :class="{
          active: currentStep === step.id,
          complete: completedSteps.includes(step.id) && currentStep !== step.id,
          locked: !isAvailable(step.id),
        }"
      >
        <button
          type="button"
          :disabled="!isAvailable(step.id) || busy"
          :aria-current="currentStep === step.id ? 'step' : undefined"
          @click="selectStep(step.id)"
        >
          <span class="step-number">
            <svg v-if="completedSteps.includes(step.id) && currentStep !== step.id" viewBox="0 0 20 20" fill="none"><path d="m4.5 10.2 3.4 3.4L15.7 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <template v-else>{{ String(step.id).padStart(2, '0') }}</template>
          </span>
          <span class="step-copy"><small>{{ step.eyebrow }}</small><strong>{{ step.title }}</strong></span>
          <span class="step-hint">{{ step.hint }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.journey-nav {
  position: sticky;
  z-index: 14;
  top: 78px;
  min-height: 76px;
  padding: 10px 12px 10px 18px;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  background: rgba(255,255,255,.88);
  border: 0;
  border-radius: var(--radius-sm);
  box-shadow: var(--surface-shadow);
  backdrop-filter: blur(18px) saturate(1.15);
}

.journey-context { min-width: 0; padding-right: 18px; border-right: 1px solid var(--line); }
.journey-context > span { display: block; color: var(--coral-700); font-family: var(--display); font-size: 8px; font-weight: 700; letter-spacing: .15em; }
.journey-context > strong { margin-top: 5px; display: block; overflow: hidden; color: var(--ink-800); font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.journey-context > small { margin-top: 5px; display: flex; align-items: center; gap: 6px; color: var(--ink-400); font-size: 8px; line-height: 1.35; }
.journey-context > small i { width: 5px; height: 5px; flex: 0 0 auto; background: var(--moss-600); border-radius: 50%; }
.journey-context > small:first-of-type i { background: var(--coral-600); }

.journey-nav ol { position: relative; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); list-style: none; }
.journey-nav ol::before { content: ''; position: absolute; top: 0; bottom: 0; left: calc(var(--active-index) * 100% / 3); width: calc(100% / 3 - 8px); background: linear-gradient(125deg, var(--canvas-soft), var(--canvas-soft)); border: 0; box-shadow: inset 0 1px 0 #fff, 0 3px 9px color-mix(in srgb, var(--shadow-color) 6%, transparent); border-radius: var(--radius-sm); transition: left .38s var(--ease-out); }
.journey-nav li { position: relative; min-width: 0; }
.journey-nav li:not(:last-child)::after { content: ''; position: absolute; z-index: 0; top: 27px; right: -1px; width: 18px; height: 1px; background: var(--line-strong); transform: translateX(50%); }
.journey-nav button { position: relative; z-index: 1; width: calc(100% - 8px); min-height: 58px; padding: 7px 10px; display: grid; grid-template-columns: 35px minmax(0, 1fr) auto; align-items: center; gap: 9px; color: var(--ink-500); text-align: left; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); transition: color .2s ease, background .2s ease, border-color .2s ease, transform .2s ease; }
.journey-nav li:not(.locked) button:hover { color: var(--ink); background: var(--canvas-soft); border-color: var(--line); transform: translateY(-1px); }
.journey-nav button:disabled { cursor: not-allowed; opacity: .44; }
.step-number { width: 34px; height: 34px; display: grid; place-items: center; color: var(--ink-500); background: var(--canvas-soft); border: 1px solid var(--line-strong); border-radius: var(--radius-sm); font-family: var(--display); font-size: 10px; font-weight: 700; transition: transform .24s ease, color .24s ease, background .24s ease; }
.step-number svg { width: 18px; }
.step-copy { min-width: 0; }
.step-copy small, .step-copy strong { display: block; }
.step-copy small { color: var(--ink-400); font-family: var(--display); font-size: 7px; font-weight: 700; letter-spacing: .12em; }
.step-copy strong { margin-top: 3px; color: inherit; font-family: var(--text-cn); font-size: 11px; font-weight: 600; white-space: nowrap; }
.step-hint { color: var(--ink-400); font-size: 8px; white-space: nowrap; }

.journey-nav li.active button { color: var(--ink); background: transparent; border-color: transparent; }
.journey-nav li.active .step-number { color: var(--paper); background: linear-gradient(145deg, var(--coral-500), var(--coral-700)); border-color: transparent; box-shadow: 0 7px 15px rgba(81,89,141,.18); transform: rotate(-3deg); }
.journey-nav li.complete .step-number { color: var(--paper); background: var(--moss-700); border-color: var(--moss-700); }

@media (max-width: 980px) {
  .journey-nav { grid-template-columns: 1fr; gap: 10px; }
  .journey-context { padding: 0 2px 10px; display: flex; align-items: center; gap: 10px; border-right: 0; border-bottom: 1px solid var(--line); }
  .journey-context > strong, .journey-context > small { margin-top: 0; }
  .journey-context > small { margin-left: auto; }
}
.journey-nav { container-type: inline-size; }
@container (max-width: 980px) { .step-hint { display: none; } }

@media (max-width: 620px) {
  .journey-nav { top: 74px; padding: 10px; border-radius: var(--radius-sm); }
  .journey-context > span { display: none; }
  .journey-context > strong { font-size: 10px; }
  .journey-nav button { width: 100%; min-height: 48px; padding: 5px; grid-template-columns: 30px minmax(0, 1fr); gap: 6px; }
  .step-number { width: 29px; height: 29px; border-radius: var(--radius-sm); font-size: 9px; }
  .step-copy small, .step-hint { display: none; }
  .step-copy strong { font-size: 10px; }
  .journey-nav li:not(:last-child)::after { display: none; }
  .journey-nav ol::before { width: calc(100% / 3); }
}

@media (max-width: 410px) {
  .journey-context > small { display: none; }
  .journey-nav button { grid-template-columns: 25px 1fr; gap: 4px; }
  .step-number { width: 24px; height: 26px; }
}
</style>
