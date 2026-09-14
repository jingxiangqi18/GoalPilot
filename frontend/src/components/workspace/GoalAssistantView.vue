<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { askGoalAssistant } from '../../api/goal'
import AssistantReply from './AssistantReply.vue'
import DateStamp from './DateStamp.vue'
import AgentSignal from './AgentSignal.vue'
import courtyardArtwork from '../../assets/goalpilot-pixel-courtyard-v1.webp'

const props = defineProps({
  goal: { type: Object, required: true },
  session: { type: Object, default: () => ({ question: '', entries: [] }) },
})
defineEmits(['open-library', 'open-plan', 'analyze', 'generate'])

const question = computed({ get: () => props.session.question, set: value => { props.session.question = value } })
const entries = computed(() => props.session.entries)
const pendingQuestion = ref('')
const busy = ref(false)
const error = ref('')
const unavailable = ref(false)
const heading = ref(null)
const input = ref(null)
const conversation = ref(null)
const latestEntry = ref(null)
let requestNumber = 0
const validQuestion = computed(() => question.value.trim().length > 0 && question.value.length <= 2000)
const suggestions = [
  { icon: '↗', title: '看清整体安排', detail: '阶段与主要任务', message: '请概述当前正式计划，按阶段列出主要任务和时间安排。' },
  { icon: '◷', title: '查看任务进展', detail: '进行中、已完成与已跳过', message: '当前正式计划中，哪些任务正在进行，哪些已完成，哪些已跳过？请分别列出，不要把已跳过算作已完成。' },
  { icon: '✓', title: '确认完成标准', detail: '第一阶段的交付要求', message: '当前正式计划第一阶段有哪些任务？请逐项说明完成标准。' },
]

const taskSuggestion = computed(() => props.session.taskSuggestion)
async function useTaskSuggestion() {
  if (!taskSuggestion.value || busy.value || unavailable.value) return
  question.value = taskSuggestion.value.message
  props.session.taskSuggestion = null
  await nextTick()
  input.value?.focus({ preventScroll: true })
}
watch(taskSuggestion, suggestion => {
  if (suggestion && !question.value.trim() && !busy.value && !unavailable.value) useTaskSuggestion()
}, { immediate: true })

async function chooseSuggestion(message) {
  if (busy.value || unavailable.value) return
  // Suggestions are drafts, never automatic model requests or silent overwrites.
  if (question.value.trim()) return
  question.value = message
  await nextTick()
  input.value?.focus({ preventScroll: true })
}

async function revealLatest() {
  await nextTick()
  const container = conversation.value
  const entry = latestEntry.value
  if (!container || !entry) return
  const anchor = entry.querySelector(busy.value ? '.assistant-thinking' : '.answer-heading') || entry
  const offset = anchor.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 20
  container.scrollTo({ top: offset, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

async function submit() {
  if (!validQuestion.value || busy.value || unavailable.value) return
  const request = ++requestNumber
  const goalId = props.goal.id
  const message = question.value.trim()
  busy.value = true
  pendingQuestion.value = message
  error.value = ''
  revealLatest()
  try {
    const reply = await askGoalAssistant(goalId, message)
    if (request !== requestNumber) return
    entries.value.push({ question: message, reply, receivedAt: new Date().toISOString() })
    question.value = ''
  } catch (cause) {
    if (request !== requestNumber) return
    unavailable.value = cause?.status === 403 || cause?.status === 404
    error.value = unavailable.value
      ? '这个目标已不存在或暂时无法访问，请返回目标库确认。'
      : cause?.status === 502
        ? '助手暂时无法回答，请稍后重新提问。这不代表当前目标没有正式计划。'
        : cause instanceof Error ? cause.message : '提问未完成，请稍后重试。'
  } finally {
    if (request === requestNumber) {
      busy.value = false
      pendingQuestion.value = ''
      revealLatest()
      // Do not pull focus away if the user is reading or navigating elsewhere.
      await nextTick()
      if (document.activeElement?.closest('.question-form')) input.value?.focus({ preventScroll: true })
    }
  }
}

watch(() => props.goal.id, () => {
  requestNumber++
  pendingQuestion.value = ''
  busy.value = false
  error.value = ''
  unavailable.value = false
})
onMounted(() => heading.value?.focus({ preventScroll: true }))
// An answer to a page that was left must never appear under a different goal.
onBeforeUnmount(() => { requestNumber++ })
</script>

<template>
  <section class="goal-assistant-view" :class="{ 'is-thinking': busy }" aria-label="目标对话">
    <div ref="conversation" class="conversation" role="region" aria-label="本次问答记录" tabindex="0">
      <div class="chat-column">
        <div v-if="!entries.length && !busy" class="assistant-welcome">
          <div class="welcome-signal"><AgentSignal /><div><span class="welcome-eyebrow">GOALPILOT · THINKING SPACE</span><span class="agent-caption">方向在对话里，进展在每一步里。</span></div><img class="welcome-station" :src="courtyardArtwork" alt="" width="512" height="439" aria-hidden="true" /></div>
          <h2 ref="heading" tabindex="-1">我们从这件事聊起。</h2>
          <div class="welcome-context"><span>正在关注的目标</span><p class="welcome-goal">{{ goal.goalText }}</p></div>
          <p>聊聊下一步怎么做，或一起确认任务的完成标准。<br />需要直接记录进展时，打开右侧的任务清单。</p>
          <div class="welcome-actions">
            <button v-if="['DRAFT', 'NEEDS_CLARIFICATION'].includes(goal.status)" type="button" @click="$emit('analyze')">✦ {{ goal.status === 'DRAFT' ? '开始分析目标' : '重新分析并继续澄清' }} <small>AI 分析流程</small></button>
            <button v-else-if="goal.status === 'READY_TO_PLAN'" type="button" @click="$emit('generate')">↗ 生成计划草稿 <small>手动发起</small></button>
            <button v-else type="button" @click="$emit('open-plan')">☷ 打开计划与任务 <small>手动操作</small></button>
          </div>
        </div>
        <article v-for="(entry, index) in entries" :key="index" :ref="element => { if (index === entries.length - 1 && !busy) latestEntry = element }" class="question-entry">
          <div class="asked-question"><span>你</span><p>{{ entry.question }}</p></div>
          <div class="answer-heading"><strong><AgentSignal /> GoalPilot <small>AGENT</small></strong><DateStamp :value="entry.receivedAt" label="收到回答" compact /></div>
          <AssistantReply :text="entry.reply" />
        </article>
        <article v-if="busy" ref="latestEntry" class="question-entry pending-entry">
          <div class="asked-question"><span>你</span><p>{{ pendingQuestion }}</p></div>
          <div class="assistant-thinking" role="status"><AgentSignal active /><p>正在准备回答<i></i><i></i><i></i></p><small>涉及计划的问题会查询当前正式版本。</small></div>
        </article>
      </div>
    </div>
    <span class="sr-only" role="status" aria-live="polite">{{ !busy && entries.length ? `已收到第 ${entries.length} 条回答，可在本次问答记录中查看。` : '' }}</span>
    <div class="chat-dock">
      <div v-if="!question.trim() && !busy && !unavailable" class="suggestions" aria-label="提问灵感">
        <button v-for="suggestion in suggestions" :key="suggestion.title" type="button" @click="chooseSuggestion(suggestion.message)"><span aria-hidden="true">{{ suggestion.icon }}</span>{{ suggestion.title }}</button>
      </div>
      <form class="question-form agent-input-surface" :class="{ 'is-working': busy }" @submit.prevent="submit">
        <div v-if="taskSuggestion" class="task-handoff" role="group" aria-label="来自任务清单的问题"><div><span>来自任务清单 · 原输入已保留</span><p>{{ taskSuggestion.title }}</p></div><button type="button" :disabled="busy || unavailable" @click="useTaskSuggestion">使用任务问题</button><button type="button" class="handoff-dismiss" aria-label="保留原输入，忽略任务问题" @click="session.taskSuggestion = null">×</button></div>
        <div v-if="error" class="assistant-error" role="alert"><p>{{ error }}</p><button v-if="unavailable" type="button" @click="$emit('open-library')">返回目标库 ↗</button></div>
        <label for="assistant-question" class="sr-only">向 GoalPilot 提问</label>
        <textarea id="assistant-question" ref="input" v-model="question" rows="2" maxlength="2000" :disabled="busy || unavailable" aria-describedby="assistant-question-hint" placeholder="向 GoalPilot 提问，聊聊这个目标…"></textarea>
        <div class="question-actions"><span class="composer-mode"><AgentSignal :active="busy" /> Agent 对话 <small>只读</small></span><div><span class="question-count">{{ question.length }} / 2000</span><button type="submit" :disabled="!validQuestion || busy || unavailable" :aria-label="busy ? '等待回答' : '发送问题'"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g v-if="busy"><circle cx="12" cy="12" r="7"/><path d="M12 8v4l3 2"/></g><path v-else d="M12 19V5m-6 6 6-6 6 6"/></svg></button></div></div>
      </form>
      <p id="assistant-question-hint" class="chat-disclaimer">每次提问独立处理，不携带上文；不会修改计划或任务。<span>本次登录内保留问答，刷新后清空。</span></p>
    </div>
  </section>
</template>

<style scoped>
.goal-assistant-view { height: 100%; min-height: 0; display: flex; flex-direction: column; font-family: var(--text-cn); background: radial-gradient(ellipse at 55% 28%, color-mix(in srgb, var(--canvas-soft) 24%, transparent), transparent 66%); }
.conversation { flex: 1; min-height: 0; overflow-y: auto; padding: 28px 28px 16px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; overscroll-behavior: contain; }
.chat-column { width: min(100%, 800px); min-height: 100%; margin: 0 auto; display: flex; flex-direction: column; justify-content: flex-start; }
.assistant-welcome { margin-block: auto; padding: 18px 0 30px; }
.welcome-signal { display: flex; position: relative; align-items: center; gap: 13px; margin: 0 0 24px -13px; }.welcome-signal > div { position: relative; z-index: 1; }.agent-caption { display: block; margin-top: 8px; color: var(--ink-500); font-size: 11px; }.welcome-trajectory { position: absolute; right: 0; width: 190px; height: 85px; stroke: var(--line-strong); stroke-width: .8; opacity: .27; pointer-events: none; }.welcome-trajectory circle { fill: var(--paper); }.welcome-context { position: relative; margin-bottom: 19px; padding: 15px 18px; border-radius: var(--radius-sm); background: linear-gradient(110deg, color-mix(in srgb, var(--canvas-soft) 50%, transparent), color-mix(in srgb, var(--paper) 50%, transparent)); box-shadow: inset 2px 0 0 var(--shadow-color); }.welcome-context > span { display: block; margin-bottom: 7px; color: var(--ink-500); font-size: 10px; letter-spacing: .04em; }
.welcome-eyebrow { color: var(--ink-500); font-family: var(--display); font-size: 9px; letter-spacing: .13em; }
.assistant-welcome h2 { margin: 11px 0 17px; color: var(--ink-700); font-size: clamp(24px, 2vw, 32px); line-height: 1.55; font-weight: 500; }.assistant-welcome h2:focus { outline: none; }
.assistant-welcome .welcome-goal { max-width: 680px; max-height: 150px; overflow-y: auto; margin: 0; color: var(--ink-700); font-size: 15px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.assistant-welcome > p { color: var(--ink-700); font-size: 13px; line-height: 1.95; }
.welcome-actions { margin-top: 25px; }.welcome-actions button { padding: 11px 15px; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 10px; border: 0; background: linear-gradient(110deg, var(--canvas-soft), var(--canvas-soft)); border-radius: var(--radius-sm); color: var(--ink-700); font-size: 13px; }.welcome-actions small { color: var(--ink-500); font-size: 10px; }.welcome-actions button:hover { transform: translateY(-2px); background: var(--accent-soft); }
.question-entry { padding-bottom: 32px; animation: answer-in .25s var(--ease-out); }.question-entry + .question-entry { margin-top: 4px; }
.asked-question { max-width: 90%; width: fit-content; margin: 0 0 25px auto; padding: 13px 20px; background: var(--canvas-soft); border-radius: var(--radius-sm); }.asked-question > span { display: none; }.asked-question p { margin: 0; color: var(--ink-700); font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.answer-heading { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin: 0 0 17px; }.answer-heading > strong { display: flex; align-items: center; gap: 7px; color: var(--ink-700); font-family: var(--display); font-size: 13px; font-weight: 600; }.answer-heading strong > small { margin-left: 3px; color: var(--ink-500); font-size: 8px; letter-spacing: .1em; font-weight: 500; }.answer-heading :deep(.date-stamp) { opacity: .8; }
.assistant-thinking { display: grid; grid-template-columns: 28px 1fr; gap: 7px; align-items: center; color: var(--ink-500); }.assistant-thinking > span { font-size: 28px; }.assistant-thinking p { margin: 0; font-size: 14px; }.assistant-thinking small { grid-column: 2; color: var(--ink-500); font-size: 12px; }.assistant-thinking i { display: inline-block; width: 4px; height: 4px; margin-left: 5px; border-radius: 50%; background: var(--accent-mid); animation: thinking 1s ease-in-out infinite alternate; }.assistant-thinking i:nth-child(2) { animation-delay: .2s; }.assistant-thinking i:nth-child(3) { animation-delay: .4s; }
.chat-dock { width: min(100%, 880px); flex-shrink: 0; margin: 0 auto; padding: 0 28px 17px; }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 13px; }.suggestions button { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); color: var(--ink-500); background: color-mix(in srgb, var(--paper) 44%, transparent); font-size: 11px; }.suggestions button > span { color: var(--ink-500); font-size: 15px; }.suggestions button:hover { border-color: var(--line); background: var(--canvas-soft); }
.question-form { padding: 18px 20px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--agent-input-background); box-shadow: var(--agent-input-shadow); transition: box-shadow .2s, border-color .2s; }.question-form:focus-within { border-color: var(--line-strong); box-shadow: 0 0 0 3px color-mix(in srgb, var(--shadow-color) 25%, transparent), 0 8px 26px color-mix(in srgb, var(--shadow-color) 4%, transparent); }
textarea { display: block; width: 100%; min-height: 60px; max-height: 160px; padding: 0; resize: vertical; border: 0; outline: none; background: transparent; color: var(--ink-700); font-size: 15px; line-height: 1.9; }textarea:focus-visible { outline: none; }textarea::placeholder { color: var(--ink-500); }
.question-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; }.composer-mode { display: flex; align-items: center; gap: 7px; color: var(--ink-500); font-size: 11px; }.composer-mode i { font-size: 19px; font-style: normal; }.composer-mode small { padding: 2px 6px; background: var(--canvas-soft); border-radius: 4px; color: var(--ink-500); font-size: 10px; }.question-actions > div { display: flex; align-items: center; gap: 12px; }.question-count { color: var(--ink-500); font-size: 10px; font-variant-numeric: tabular-nums; }.question-actions button { display: grid; place-items: center; width: 35px; height: 35px; padding: 0; color: white; border: 0; border-radius: 50%; background: var(--accent); font-size: 22px; }.question-actions button:hover:not(:disabled) { transform: translateY(-2px); background: var(--accent); }.question-actions button:disabled { color: var(--ink-500); background: var(--canvas-soft); }
.chat-disclaimer { margin: 11px 0 0; text-align: center; color: var(--ink-500); font-size: 10px; line-height: 1.8; }.chat-disclaimer > span { margin-left: 5px; }
.assistant-error { margin-bottom: 15px; padding: 10px 13px; border-radius: var(--radius-sm); color: #965565; background: #f9ebef; font-size: 12px; line-height: 1.8; }.assistant-error p { margin: 0; }.assistant-error button { margin-top: 5px; padding: 0; border: 0; background: none; color: #874657; font-size: 12px; }
.question-actions button svg { width: 21px; height: 21px; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }.question-actions .agent-signal { width: 25px; height: 25px; }.question-actions button { background: linear-gradient(145deg, var(--accent-mid), var(--accent)); box-shadow: 0 3px 7px color-mix(in srgb, var(--shadow-color) 15%, transparent); border-radius: var(--radius-sm); width: 38px; height: 38px; }.question-actions button:disabled { box-shadow: none; }
.task-handoff { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: -3px -4px 14px; padding: 10px 12px; border-radius: var(--radius-sm); background: linear-gradient(110deg, var(--canvas-soft), #edf3f1); }.task-handoff > div { min-width: 0; flex: 1; }.task-handoff > div > span { font-size: 10px; color: var(--ink-500); }.task-handoff p { margin: 5px 0 0; max-height: 48px; overflow-y: auto; color: var(--ink-700); font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }.task-handoff button { min-height: 30px; padding: 5px 9px; border: 0; border-radius: var(--radius-sm); color: var(--ink-700); background: #fffc; font-size: 11px; }.task-handoff .handoff-dismiss { width: 26px; padding: 0; font-size: 19px; background: transparent; }.task-handoff button:disabled { opacity: .45; }
.assistant-welcome { animation: welcome-arrive .4s var(--ease-out) both; }.welcome-context { box-shadow: inset 2px 0 0 #91ab8f; background: linear-gradient(110deg, #edf3e9bb, #fafbf6aa); }.welcome-actions button { border: 1px solid #d7e2d0; color: var(--accent); background: #edf2e4; }.welcome-actions button:hover { background: #e1eccc; }.question-form:focus-within { box-shadow: 0 0 0 3px #dce8d85c, var(--agent-input-shadow); }.question-actions button:not(:disabled) { background: linear-gradient(140deg, #427a65, #264e42); }.asked-question { background: #e9efdf; border: 1px solid #dde5d1; }.answer-heading > strong { color: var(--accent-deep); }.task-handoff { border: 1px solid #d8e2cc; background: linear-gradient(110deg, #edf3e2, #f5efdf); }
@keyframes welcome-arrive { from { opacity: 0; transform: translateY(7px); } }
@media(max-width: 1500px) { .welcome-trajectory { width: 115px; opacity: .2; } }
@media(max-width: 620px) { .welcome-signal { margin-bottom: 15px; gap: 7px; }.welcome-signal > .agent-signal { width: 85px; height: 85px; }.welcome-trajectory { display: none; }.welcome-context { padding: 12px 14px; }.assistant-welcome .welcome-goal { font-size: 13px; }.agent-caption { font-size: 10px; } }
@keyframes thinking { to { opacity: .25; transform: translateY(-3px); } }@keyframes answer-in { from { opacity: 0; transform: translateY(7px); } }
@media(max-width: 620px) { .conversation { padding: 22px 20px 10px; }.assistant-welcome { padding: 15px 0 25px; }.assistant-welcome .welcome-goal { font-size: 13px; max-height: 130px; }.chat-dock { padding: 0 14px 12px; }.question-form { padding: 14px; border-radius: var(--radius-sm); }.chat-disclaimer { font-size: 9px; }.chat-disclaimer > span { display: block; }.suggestions { gap: 6px; }.suggestions button { padding: 6px 9px; font-size: 10px; }.question-actions .question-count { font-size: 9px; }.answer-heading { flex-direction: column; align-items: flex-start; } }
</style>
