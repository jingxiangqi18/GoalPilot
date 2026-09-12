<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { askGoalAssistant } from '../../api/goal'
import AssistantReply from './AssistantReply.vue'
import DateStamp from './DateStamp.vue'

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
  <section class="goal-assistant-view" aria-label="目标对话">
    <div ref="conversation" class="conversation" role="region" aria-label="本次问答记录" tabindex="0">
      <div class="chat-column">
        <div v-if="!entries.length && !busy" class="assistant-welcome">
          <span class="chat-emblem" aria-hidden="true">✧</span>
          <span class="welcome-eyebrow">YOUR GOAL, YOUR CONVERSATION</span>
          <h2 ref="heading" tabindex="-1">我们从这件事聊起。</h2>
          <p class="welcome-goal">{{ goal.goalText }}</p>
          <p>问问计划怎样展开，或聊聊某项任务的完成标准。<br />资料和手动操作，随时可以从右上角打开。</p>
          <div class="welcome-actions">
            <button v-if="['DRAFT', 'NEEDS_CLARIFICATION'].includes(goal.status)" type="button" @click="$emit('analyze')">✦ {{ goal.status === 'DRAFT' ? '开始分析目标' : '重新分析并继续澄清' }} <small>AI 分析流程</small></button>
            <button v-else-if="goal.status === 'READY_TO_PLAN'" type="button" @click="$emit('generate')">↗ 生成计划草稿 <small>手动发起</small></button>
            <button v-else type="button" @click="$emit('open-plan')">☷ 打开计划与任务 <small>手动操作</small></button>
          </div>
        </div>
        <article v-for="(entry, index) in entries" :key="index" :ref="element => { if (index === entries.length - 1 && !busy) latestEntry = element }" class="question-entry">
          <div class="asked-question"><span>你</span><p>{{ entry.question }}</p></div>
          <div class="answer-heading"><strong><span aria-hidden="true">✧</span> GoalPilot</strong><DateStamp :value="entry.receivedAt" label="收到回答" compact /></div>
          <AssistantReply :text="entry.reply" />
        </article>
        <article v-if="busy" ref="latestEntry" class="question-entry pending-entry">
          <div class="asked-question"><span>你</span><p>{{ pendingQuestion }}</p></div>
          <div class="assistant-thinking" role="status"><span aria-hidden="true">✧</span><p>正在准备回答<i></i><i></i><i></i></p><small>涉及计划的问题会查询当前正式版本。</small></div>
        </article>
      </div>
    </div>
    <span class="sr-only" role="status" aria-live="polite">{{ !busy && entries.length ? `已收到第 ${entries.length} 条回答，可在本次问答记录中查看。` : '' }}</span>
    <div class="chat-dock">
      <div v-if="!question.trim() && !busy && !unavailable" class="suggestions" aria-label="提问灵感">
        <button v-for="suggestion in suggestions" :key="suggestion.title" type="button" @click="chooseSuggestion(suggestion.message)"><span aria-hidden="true">{{ suggestion.icon }}</span>{{ suggestion.title }}</button>
      </div>
      <form class="question-form" @submit.prevent="submit">
        <div v-if="error" class="assistant-error" role="alert"><p>{{ error }}</p><button v-if="unavailable" type="button" @click="$emit('open-library')">返回目标库 ↗</button></div>
        <label for="assistant-question" class="sr-only">向 GoalPilot 提问</label>
        <textarea id="assistant-question" ref="input" v-model="question" rows="2" maxlength="2000" :disabled="busy || unavailable" aria-describedby="assistant-question-hint" placeholder="向 GoalPilot 提问，聊聊这个目标…"></textarea>
        <div class="question-actions"><span class="composer-mode"><i aria-hidden="true">✧</i> 计划对话 <small>只读</small></span><div><span class="question-count">{{ question.length }} / 2000</span><button type="submit" :disabled="!validQuestion || busy || unavailable" :aria-label="busy ? '等待回答' : '发送问题'"><span aria-hidden="true">{{ busy ? '◷' : '↑' }}</span></button></div></div>
      </form>
      <p id="assistant-question-hint" class="chat-disclaimer">每次提问独立处理，不携带上文；不会修改计划或任务。<span>本次登录内保留问答，刷新后清空。</span></p>
    </div>
  </section>
</template>

<style scoped>
.goal-assistant-view { height: 100%; min-height: 0; display: flex; flex-direction: column; font-family: var(--text-cn); }
.conversation { flex: 1; min-height: 0; overflow-y: auto; padding: 28px 28px 16px; scrollbar-width: thin; scrollbar-color: #d9d0e4 transparent; overscroll-behavior: contain; }
.chat-column { width: min(100%, 800px); min-height: 100%; margin: 0 auto; display: flex; flex-direction: column; justify-content: flex-start; }
.assistant-welcome { margin-block: auto; padding: 25px 0 40px; }
.chat-emblem { display: grid; place-items: center; width: 51px; height: 51px; margin-bottom: 25px; border-radius: 17px 17px 17px 6px; background: linear-gradient(140deg, #e6ddf0, #f0e2eb); color: #7f6193; font-size: 33px; box-shadow: inset 0 1px 0 #fff; }
.welcome-eyebrow { color: #796587; font-family: var(--display); font-size: 9px; letter-spacing: .13em; }
.assistant-welcome h2 { margin: 11px 0 17px; color: #4d4258; font-size: clamp(24px, 2vw, 32px); line-height: 1.55; font-weight: 500; }.assistant-welcome h2:focus { outline: none; }
.assistant-welcome .welcome-goal { max-width: 680px; max-height: 175px; overflow-y: auto; margin: 0 0 15px; color: #7a6683; font-size: 18px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.assistant-welcome > p { color: #76677d; font-size: 13px; line-height: 1.95; }
.welcome-actions { margin-top: 25px; }.welcome-actions button { padding: 11px 15px; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 10px; border: 0; background: linear-gradient(110deg, #eee8f4, #f4eaf1); border-radius: 10px; color: #776184; font-size: 13px; }.welcome-actions small { color: #7a6587; font-size: 10px; }.welcome-actions button:hover { transform: translateY(-2px); background: #e8ddef; }
.question-entry { padding-bottom: 32px; animation: answer-in .25s var(--ease-out); }.question-entry + .question-entry { margin-top: 4px; }
.asked-question { max-width: 90%; width: fit-content; margin: 0 0 25px auto; padding: 13px 20px; background: #ece6f2; border-radius: 20px 5px 20px 20px; }.asked-question > span { display: none; }.asked-question p { margin: 0; color: #5b4c66; font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.answer-heading { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin: 0 0 17px; }.answer-heading > strong { color: #7a648b; font-family: var(--display); font-size: 12px; font-weight: 500; }.answer-heading strong > span { margin-right: 8px; font-size: 22px; }.answer-heading :deep(.date-stamp) { opacity: .8; }
.assistant-thinking { display: grid; grid-template-columns: 28px 1fr; gap: 7px; align-items: center; color: #7d638b; }.assistant-thinking > span { font-size: 28px; }.assistant-thinking p { margin: 0; font-size: 14px; }.assistant-thinking small { grid-column: 2; color: #786681; font-size: 12px; }.assistant-thinking i { display: inline-block; width: 4px; height: 4px; margin-left: 5px; border-radius: 50%; background: #a88bbc; animation: thinking 1s ease-in-out infinite alternate; }.assistant-thinking i:nth-child(2) { animation-delay: .2s; }.assistant-thinking i:nth-child(3) { animation-delay: .4s; }
.chat-dock { width: min(100%, 880px); flex-shrink: 0; margin: 0 auto; padding: 0 28px 17px; }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 13px; }.suggestions button { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border: 1px solid #e6dfec; border-radius: 20px; color: #796586; background: #faf8fc70; font-size: 11px; }.suggestions button > span { color: #7c648c; font-size: 15px; }.suggestions button:hover { border-color: #c9b8d8; background: #f0e9f6; }
.question-form { padding: 17px 19px 13px; border: 1px solid #e3dbe9; border-radius: 22px; background: #fffdfef2; box-shadow: 0 6px 25px #72578908, 0 1px 2px #72578908; transition: box-shadow .2s, border-color .2s; }.question-form:focus-within { border-color: #bda8cc; box-shadow: 0 0 0 3px #e8dff140, 0 8px 26px #7257890a; }
textarea { display: block; width: 100%; min-height: 60px; max-height: 160px; padding: 0; resize: vertical; border: 0; outline: none; background: transparent; color: #54465f; font-size: 15px; line-height: 1.9; }textarea:focus-visible { outline: none; }textarea::placeholder { color: #786781; }
.question-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; }.composer-mode { display: flex; align-items: center; gap: 7px; color: #7a6489; font-size: 11px; }.composer-mode i { font-size: 19px; font-style: normal; }.composer-mode small { padding: 2px 6px; background: #f1ebf6; border-radius: 4px; color: #786681; font-size: 10px; }.question-actions > div { display: flex; align-items: center; gap: 12px; }.question-count { color: #776682; font-size: 10px; font-variant-numeric: tabular-nums; }.question-actions button { display: grid; place-items: center; width: 35px; height: 35px; padding: 0; color: white; border: 0; border-radius: 50%; background: #877098; font-size: 22px; }.question-actions button:hover:not(:disabled) { transform: translateY(-2px); background: #725983; }.question-actions button:disabled { color: #776683; background: #eae3f0; }
.chat-disclaimer { margin: 11px 0 0; text-align: center; color: #776781; font-size: 10px; line-height: 1.8; }.chat-disclaimer > span { margin-left: 5px; }
.assistant-error { margin-bottom: 15px; padding: 10px 13px; border-radius: 10px; color: #965565; background: #f9ebef; font-size: 12px; line-height: 1.8; }.assistant-error p { margin: 0; }.assistant-error button { margin-top: 5px; padding: 0; border: 0; background: none; color: #874657; font-size: 12px; }
@keyframes thinking { to { opacity: .25; transform: translateY(-3px); } }@keyframes answer-in { from { opacity: 0; transform: translateY(7px); } }
@media(max-width: 620px) { .conversation { padding: 22px 20px 10px; }.assistant-welcome { padding: 15px 0 25px; }.assistant-welcome .welcome-goal { font-size: 16px; max-height: 130px; }.chat-dock { padding: 0 14px 12px; }.question-form { padding: 14px; border-radius: 18px; }.chat-disclaimer { font-size: 9px; }.chat-disclaimer > span { display: block; }.suggestions { gap: 6px; }.suggestions button { padding: 6px 9px; font-size: 10px; }.question-actions .question-count { font-size: 9px; }.answer-heading { flex-direction: column; align-items: flex-start; } }
</style>
