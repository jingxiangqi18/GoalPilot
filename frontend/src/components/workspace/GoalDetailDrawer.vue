<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import planeArtwork from '../../assets/goalpilot-plane-charm-v1.webp'
import GoalStatusBadge from './GoalStatusBadge.vue'
import DateStamp from './DateStamp.vue'
import { goalPresentation, goalDate, priorityLabel } from '../../utils/goalPresentation'

const props = defineProps({
  goal: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  availableDraftGoalId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'continue', 'generate-plan', 'view-plan', 'ask-assistant'])
const drawer = ref(null)
const previousFocus = document.activeElement
const previousOverflow = document.body.style.overflow
const appRoot = document.querySelector('#app')
const previousInert = appRoot?.inert

const state = computed(() => goalPresentation(props.goal?.status))
const goalLines = computed(() => String(props.goal?.goalText || '').split('\n').filter(line => line.trim()))
const canContinue = computed(() => props.goal?.status === 'DRAFT')
const canGeneratePlan = computed(() => props.goal?.status === 'READY_TO_PLAN')
const missingBoundaries = computed(() => [!props.goal?.successCriteria && '成功标准', !props.goal?.constraintText && '约束条件'].filter(Boolean).join('与'))

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
  if (event.key !== 'Tab') return
  const elements = [...(drawer.value?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || [])]
  const first = elements[0]
  const last = elements.at(-1)
  if (!first) return
  if (event.shiftKey && (document.activeElement === first || !drawer.value.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !drawer.value.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  if (appRoot) appRoot.inert = true
  window.addEventListener('keydown', handleKeydown)
  drawer.value?.querySelector('button')?.focus({ preventScroll: true })
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = previousOverflow
  if (appRoot) appRoot.inert = previousInert
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
})
</script>

<template>
  <div class="drawer-layer" role="dialog" aria-modal="true" aria-label="目标详情">
    <button class="drawer-backdrop" type="button" tabindex="-1" aria-label="关闭目标详情" @click="emit('close')"></button>
    <aside ref="drawer" class="detail-drawer" :aria-busy="loading">
      <header class="drawer-header">
        <div><span class="header-mark" aria-hidden="true">◇</span><span>目标手记<small>GOAL DETAILS</small></span></div>
        <button type="button" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
        </button>
      </header>

      <div v-if="loading" class="detail-loading" role="status"><i></i><i></i><i></i><p>正在取回目标信息…</p></div>
      <div v-else-if="goal" class="detail-scroll">
        <section class="goal-title-block" :class="state.tone">
          <div class="title-topline"><span class="eyebrow">A LITTLE INTENTION</span><GoalStatusBadge :status="goal.status" /></div>
          <div class="title-ornament" aria-hidden="true"><span></span><img :src="planeArtwork" alt="" width="100" height="100" /></div>
          <span class="chapter-label">{{ state.chapter }}</span>
          <h2 :class="{ 'long-title': goalLines[0]?.length > 90 }">{{ goalLines[0] }}</h2>
          <div v-if="goalLines.length > 1" class="goal-description"><p v-for="(line, index) in goalLines.slice(1)" :key="index">{{ line }}</p></div>
          <p class="created-date"><DateStamp :value="goal.createdAt" label="记录于" compact :show-time="false" /></p>
        </section>

        <section class="boundary-section">
          <header class="section-heading"><span class="section-icon" aria-hidden="true">⌘</span><h3>目标边界</h3><small>让期待更具体</small></header>
          <dl class="detail-facts">
            <div><dt>优先级</dt><dd :class="{ muted: !goal.priority }">{{ priorityLabel(goal.priority) }}</dd></div>
            <div><dt>期待完成</dt><dd :class="{ muted: !goal.deadline }">{{ goal.deadline ? goalDate(goal.deadline) : '未设置时间' }}</dd></div>
          </dl>
          <dl v-if="goal.successCriteria || goal.constraintText" class="detail-notes">
            <div v-if="goal.successCriteria"><dt><i aria-hidden="true"></i>成功标准</dt><dd>{{ goal.successCriteria }}</dd></div>
            <div v-if="goal.constraintText"><dt><i aria-hidden="true"></i>约束与条件</dt><dd>{{ goal.constraintText }}</dd></div>
          </dl>
          <p v-if="missingBoundaries" class="missing-note"><span aria-hidden="true">＋</span>{{ missingBoundaries }}尚未记录</p>
        </section>

        <section class="lifecycle-card">
          <header class="section-heading"><span class="section-icon" aria-hidden="true">↗</span><h3>当前进展</h3><small>{{ state.label }}</small></header>
          <ol aria-label="目标规划流程">
            <li v-for="(label, index) in ['记下目标', '分析澄清', '行动规划']" :key="label" :class="{ active: state.step === index, done: state.step > index }" :aria-current="state.step === index ? 'step' : undefined"><i aria-hidden="true">{{ state.step > index ? '✓' : '0' + (index + 1) }}</i><span>{{ label }}</span></li>
          </ol>
          <p>{{ state.hint }}</p>
        </section>
        <button type="button" class="detail-assistant" :disabled="busy" @click="emit('ask-assistant', goal)"><span class="assistant-spark" aria-hidden="true">✧</span><span><strong>询问目标助手</strong><small>了解正式计划、任务与完成标准 · 只读问答</small></span><i aria-hidden="true">↗</i></button>
        <div class="detail-timestamp"><DateStamp :value="goal.updatedAt || goal.createdAt" :label="goal.updatedAt ? '最近更新' : '记录时间'" compact /></div>
        <div class="detail-endnote" aria-hidden="true"><span></span><i>✧</i><small>每一小步，都算数。</small><span></span></div>
      </div>

      <footer v-if="!loading && goal" class="drawer-footer">
        <button type="button" class="ghost-button" @click="emit('close')">返回目标库</button>
        <button v-if="canContinue" type="button" class="continue-button" :disabled="busy" @click="emit('continue', goal)">继续分析目标 <span>↗</span></button>
        <button v-else-if="canGeneratePlan" type="button" class="continue-button" :disabled="busy" @click="emit('generate-plan', goal)">{{ goal.id === availableDraftGoalId ? '查看计划草稿' : '生成计划草稿' }} <span>↗</span></button>
        <button v-else-if="['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(goal.status)" type="button" class="continue-button" @click="emit('view-plan', goal)">查看正式计划 <span>↗</span></button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.drawer-layer { position: fixed; z-index: 80; inset: 0; }
.drawer-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; background: rgba(29,31,44,.35); border: 0; backdrop-filter: blur(7px); }
.drawer-backdrop:active { scale: 1; }
.detail-drawer { position: absolute; top: 16px; right: 16px; bottom: 16px; width: min(584px, calc(100% - 32px)); max-height: 920px; display: flex; flex-direction: column; overflow: hidden; color: var(--ink); background: #fcfcfe; border: 1px solid rgba(255,255,255,.8); border-radius: 24px; box-shadow: 0 24px 100px rgba(28,29,53,.24); font-family: var(--text-cn); }
.drawer-header { min-height: 78px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: white; border-bottom: 1px solid var(--line); }
.drawer-header > div { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; }
.header-mark { display: grid; place-items: center; width: 36px; height: 40px; color: #706fa0; background: linear-gradient(150deg, #e9e6f5, #f9eef2); border: 1px solid #dcd8eb; border-radius: 11px 11px 11px 3px; font-size: 26px; font-weight: 400; }
.drawer-header small { display: block; margin-top: 4px; color: var(--ink-500); font-family: var(--display); font-size: 9px; font-weight: 500; letter-spacing: .13em; }
.drawer-header button { width: 36px; height: 36px; padding: 10px; color: var(--ink-600); background: #f5f5fa; border: 1px solid var(--line); border-radius: 50%; }
.drawer-header button:hover { background: #e9e7f4; transform: rotate(90deg); }
.detail-scroll { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #d8d6e5 transparent; }
.goal-title-block { position: relative; isolation: isolate; overflow: hidden; padding: 26px 28px 24px; background: radial-gradient(ellipse at 100% 15%, #e8e4f5, transparent 65%), linear-gradient(135deg, #f1f1fa, #fbf4f7); border-bottom: 1px solid #e4e1ef; }
.goal-title-block.blue { background: radial-gradient(ellipse at 100% 15%, #ddeaf3, transparent 65%), linear-gradient(135deg, #eff2fb, #f6f8fb); }
.goal-title-block.sage { background: linear-gradient(125deg, #eff6f2, #f2f2fa); }
.title-topline { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.eyebrow { color: #74738c; font-family: var(--display); font-size: 9px; font-weight: 500; letter-spacing: .17em; }
.title-ornament { position: relative; height: 65px; margin: 4px 0 0; pointer-events: none; }
.title-ornament span { position: absolute; width: 160px; height: 49px; top: 3px; right: -3px; border: 1px dashed #c3bddc; border-radius: 50%; transform: rotate(-18deg); }
.title-ornament img { position: absolute; right: 9px; top: -12px; object-fit: contain; transform: rotate(-8deg); filter: drop-shadow(0 8px 10px rgba(95,93,145,.12)); }
.chapter-label { display: block; margin-top: -20px; color: #74708f; font-size: 12px; letter-spacing: .04em; }
.goal-title-block h2 { position: relative; margin: 10px 0 18px; max-width: 100%; font-size: 22px; font-weight: 500; line-height: 1.65; letter-spacing: .01em; overflow-wrap: anywhere; text-wrap: pretty; }
.goal-title-block h2.long-title { font-size: 18px; font-weight: 500; }
.goal-description { padding: 1px 0 8px 14px; margin: -4px 0 10px; border-left: 2px solid #c9c4df; }
.goal-description p { margin: 0 0 7px; color: var(--ink-600); font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.created-date { display: flex; align-items: center; gap: 7px; margin: 0; color: #717183; font-size: 12px; }
.boundary-section { margin: 24px 28px 0; }
.section-heading { display: flex; align-items: center; gap: 9px; }
.section-heading h3 { margin: 0; font-size: 15px; font-weight: 600; }
.section-heading small { margin-left: auto; color: var(--ink-500); font-size: 11px; }
.section-icon { display: grid; place-items: center; width: 25px; height: 25px; color: #73729d; background: #eeedf6; border-radius: 7px; font-size: 16px; }
.detail-facts { margin: 16px 0 0; padding: 16px 0; display: grid; grid-template-columns: 1fr 1.2fr; border-block: 1px solid var(--line); }
.detail-facts > div + div { padding-left: 24px; border-left: 1px solid var(--line); }
.detail-facts dt { margin-bottom: 8px; color: var(--ink-500); font-size: 12px; }
.detail-facts dd { margin: 0; font-size: 14px; font-weight: 500; }
.detail-facts .muted { color: var(--ink-500); font-weight: 400; }
.detail-notes { margin: 18px 0 0; display: grid; gap: 16px; }
.detail-notes dt { display: flex; align-items: center; gap: 7px; color: var(--ink-600); font-size: 12px; font-weight: 500; }
.detail-notes dt i { width: 5px; height: 5px; border-radius: 50%; background: #aaa3c8; }
.detail-notes dd { margin: 8px 0 0 12px; color: var(--ink-700); font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.missing-note { display: flex; align-items: center; gap: 6px; margin: 13px 0 0; color: var(--ink-500); font-size: 12px; line-height: 1.7; }
.missing-note > span { font-size: 16px; color: #8983a9; }
.lifecycle-card { margin: 24px 28px 0; padding: 18px; background: linear-gradient(115deg, #edebf7, #f6f4fa); border: 0; border-radius: 19px 19px 8px 19px; box-shadow: inset 0 1px 0 white; }
.lifecycle-card ol { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); margin: 22px 0 16px; padding: 0; list-style: none; }
.lifecycle-card ol::before { content: ''; position: absolute; top: 14px; left: 16%; right: 16%; height: 1px; background: #d7d4e6; }
.lifecycle-card li { position: relative; display: grid; justify-items: center; gap: 9px; color: var(--ink-500); font-size: 11px; }
.lifecycle-card li i { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 50%; border: 1px solid #d9d6e8; background: #f6f5fb; font-family: var(--display); font-size: 10px; font-style: normal; }
.lifecycle-card li.active { color: #545180; font-weight: 600; }
.lifecycle-card li.active i { color: white; background: linear-gradient(140deg, #928abd, #6d70a5); border-color: transparent; box-shadow: 0 0 0 4px #e5e2f1; }
.lifecycle-card li.done i { color: #726b9c; background: #e8e5f2; border-color: #dad5eb; }
.lifecycle-card > p { margin: 0; padding-top: 13px; color: #6e6d80; border-top: 1px solid #dfddea; font-size: 12px; line-height: 1.8; }
.detail-timestamp { display: flex; padding: 20px 28px 0; }
.detail-assistant { width: calc(100% - 56px); display: flex; align-items: center; gap: 12px; margin: 20px 28px 0; padding: 14px 15px; text-align: left; border: 0; border-radius: 14px 5px 14px 14px; background: linear-gradient(110deg, #eee8f6, #f8eef3); }.detail-assistant:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px #8d709414; }.detail-assistant:disabled { opacity: .5; }.assistant-spark { font-size: 28px; color: #9780a8; }.detail-assistant strong, .detail-assistant small { display: block; }.detail-assistant strong { color: #62516f; font-size: 13px; font-weight: 500; }.detail-assistant small { margin-top: 5px; color: #81718e; font-size: 11px; line-height: 1.7; }.detail-assistant > i { margin-left: auto; color: #9884a7; font-size: 20px; font-style: normal; }
.detail-endnote { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 24px 28px; color: #9287aa; }
.detail-endnote > span { width: 28px; height: 1px; background: #e0dbe8; }
.detail-endnote i { font-size: 18px; font-style: normal; }
.detail-endnote small { font-size: 11px; letter-spacing: .08em; }
.drawer-footer { flex-shrink: 0; margin-top: auto; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line); background: rgba(255,255,255,.97); }
.drawer-footer button { min-height: 44px; padding: 0 17px; border-radius: 12px; font-size: 13px; font-weight: 500; }
.ghost-button { color: var(--ink-600); background: white; border: 1px solid var(--line-strong); }
.continue-button { display: flex; justify-content: space-between; align-items: center; gap: 20px; color: white; background: linear-gradient(120deg, #696897, #7779a9); border: 1px solid #6d6c9d; box-shadow: 0 4px 10px #74709a24; }
.continue-button > span { font-size: 18px; }
.continue-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px #74709a35; }
.continue-button:disabled { opacity: .5; }
.detail-loading { padding: 40px 28px; }
.detail-loading i { height: 16px; margin-bottom: 16px; display: block; background: #eae8f3; border-radius: 10px; animation: pulse 1s ease-in-out infinite alternate; }
.detail-loading i:nth-child(2) { width: 82%; height: 80px; margin-top: 30px; }
.detail-loading i:nth-child(3) { width: 57%; }
.detail-loading p { color: var(--ink-500); font-size: 13px; }
@keyframes pulse { to { opacity: .45; } }
@media (max-width: 620px) {
  .detail-drawer { top: 8px; right: 8px; bottom: 8px; width: calc(100% - 16px); border-radius: 20px; }
  .drawer-header { min-height: 66px; padding-inline: 20px; }
  .goal-title-block { padding: 20px; }
  .goal-title-block h2 { font-size: 20px; }
  .boundary-section { margin: 20px 20px 0; }
  .lifecycle-card { margin: 20px 20px 0; padding: 14px; }
  .drawer-footer { padding: 14px 20px max(14px, env(safe-area-inset-bottom)); gap: 8px; }
  .drawer-footer button { padding-inline: 12px; font-size: 12px; }
  .detail-timestamp { padding-inline: 20px; }
  .detail-assistant { width: calc(100% - 40px); margin-inline: 20px; }
}
</style>
