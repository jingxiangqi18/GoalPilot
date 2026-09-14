<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AssistantReply from './AssistantReply.vue'
import AgentSignal from './AgentSignal.vue'

const answers = defineModel('answers', { type: Array, required: true })
const props = defineProps({ goal: Object, result: Object, plan: Object, activeRequest: String, errorMessage: String, errorTitle: String })
const emit = defineEmits(['analyze', 'clarify', 'generate-plan', 'open-plan', 'open-info'])
const activeIndex = ref(0)
const input = ref(null)
const questions = computed(() => props.result?.readiness === 'READY' ? [] : props.result?.clarificationQuestions || [])
const current = computed(() => questions.value[activeIndex.value])
const complete = computed(() => questions.value.length && questions.value.every((question, index) => question.questionId && answers.value[index]?.trim() && answers.value[index].length <= 1000))
const filledCount = computed(() => questions.value.filter((_, index) => answers.value[index]?.trim()).length)
const pendingLabel = computed(() => ({ analysis: '正在理解你的目标…', clarification: '正在根据回答更新分析…', plan: '正在整理阶段与任务…', approval: '正在启用这份计划…', rejection: '正在保存你的选择…' })[props.activeRequest])
watch([() => props.result?.analysisId, () => questions.value.length], () => { activeIndex.value = 0 })
async function select(index) {
  if (props.activeRequest) return
  activeIndex.value = index
  await nextTick()
  input.value?.focus({ preventScroll: true })
}
</script>

<template>
  <section class="planning-conversation" aria-label="目标规划对话">
    <div class="planning-messages" tabindex="0" role="region" aria-label="分析与澄清记录">
      <div class="planning-column">
        <div class="initial-intention"><small>你的目标</small><p>{{ goal.goalText }}</p></div>
        <article class="planning-response">
          <h2><AgentSignal :active="!!pendingLabel" /> GoalPilot <small>目标分析</small></h2>
          <template v-if="result">
            <AssistantReply :text="result.goalSummary" />
            <ul v-if="result.knownInformation?.length" class="known-points"><li v-for="(point, index) in result.knownInformation" :key="index">{{ point }}</li></ul>
            <p class="readiness-copy">{{ result.readiness === 'READY' ? '这些信息已经足够开始规划。你可以生成一份草稿，再决定是否启用。' : '为了让计划更贴近实际，我们再确认下面几个问题。' }}</p>
          </template>
          <p v-else class="readiness-copy">{{ goal.status === 'READY_TO_PLAN' ? '目标信息已经准备好，可以开始整理阶段与任务。' : '目标已经保存。接下来先理解你的方向，再一起补充必要的信息。' }}</p>
          <div v-if="plan" class="plan-artifact"><span class="artifact-icon" aria-hidden="true">☷</span><div><small>{{ plan.status === 'REJECTED' ? '未采用的计划草稿' : '待你确认的计划草稿' }}</small><strong>{{ plan.planTitle }}</strong><p>{{ plan.stages.length }} 个阶段 · 确认后才会正式启用</p></div><button type="button" @click="$emit('open-plan')">打开草稿 ↗</button></div>
          <button v-else-if="result?.readiness === 'READY' || goal.status === 'READY_TO_PLAN'" type="button" class="inline-action" :disabled="!!activeRequest" @click="$emit('generate-plan')">{{ errorMessage ? '重试生成计划' : '生成计划草稿' }} <span>↗</span></button>
          <button v-else-if="!result && !activeRequest" type="button" class="inline-action" @click="$emit('analyze')">{{ errorMessage ? '重新分析目标' : '开始分析目标' }} <span>↗</span></button>
          <div v-if="filledCount" class="answer-review"><h3>已填写的补充 <small>提交前可修改</small></h3><button v-for="(question, index) in questions" v-show="answers[index]?.trim()" :key="question.questionId || index" type="button" :disabled="!!activeRequest" @click="select(index)"><span>{{ question.question }}</span><p>{{ answers[index] }}</p></button></div>
          <p v-if="pendingLabel" class="planning-pending" role="status"><i></i>{{ pendingLabel }}</p>
        </article>
      </div>
    </div>
    <div class="planning-dock">
      <div v-if="errorMessage && !plan" class="planning-error" role="alert"><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <form v-if="current && !plan" class="clarification-composer agent-input-surface" :class="{ 'is-working': !!pendingLabel }" @submit.prevent="complete ? emit('clarify') : select(Math.min(activeIndex + 1, questions.length - 1))">
        <nav class="question-index" aria-label="澄清问题导航"><button v-for="(question, index) in questions" :key="question.questionId || index" type="button" :aria-label="`问题 ${index + 1}：${question.question}`" :aria-current="activeIndex === index ? 'step' : undefined" :class="{ active: activeIndex === index }" :disabled="!!activeRequest" @click="select(index)">{{ answers[index]?.trim() ? '✓' : index + 1 }}</button><span>已填写 {{ filledCount }} 项，共 {{ questions.length }} 项</span></nav>
        <label :for="'clarification-answer-' + activeIndex">{{ current.question }}</label>
        <textarea :id="'clarification-answer-' + activeIndex" ref="input" v-model="answers[activeIndex]" :disabled="!!activeRequest" maxlength="1000" rows="2" placeholder="像聊天一样，说说你的实际情况…"></textarea>
        <footer><button type="button" :disabled="!activeIndex || !!activeRequest" @click="select(activeIndex - 1)">← 上一题</button><small>{{ (answers[activeIndex] || '').length }} / 1000</small><button v-if="activeIndex < questions.length - 1 && !complete" type="button" class="next-question" :disabled="!answers[activeIndex]?.trim() || !!activeRequest" @click="select(activeIndex + 1)">下一题 →</button><button v-else type="button" class="submit-answers" :disabled="!complete || !!activeRequest" @click="$emit('clarify')">{{ activeRequest === 'clarification' ? '正在整理…' : '提交全部回答' }} ↑</button></footer>
      </form>
      <div v-else class="planning-next"><span>✧ {{ plan ? '先看看这份路线，是否符合你的期待。' : '先理解目标，再一起确定下一步。' }}</span><button type="button" @click="$emit('open-info')">目标资料 ☷</button></div>
      <p class="planning-disclaimer">{{ current && !plan ? '全部问题填写后一起提交；分析和计划结果来自后端 AI。' : '生成草稿不会自动启用，计划选择与任务状态由你确认。' }}</p>
    </div>
  </section>
</template>

<style scoped>
.planning-conversation { height: 100%; min-height: 0; display: flex; flex-direction: column; font-family: var(--text-cn); }
.planning-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 28px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.planning-column { max-width: 800px; margin: auto; }.initial-intention { max-width: 88%; width: fit-content; margin: 0 0 30px auto; padding: 15px 21px; border-radius: var(--radius-sm); background: var(--canvas-soft); }.initial-intention small { color: var(--ink-500); font-size: 10px; }.initial-intention p { margin: 5px 0 0; color: var(--ink-700); font-size: 14px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.planning-response h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 20px; color: var(--ink-500); font-family: var(--display); font-size: 13px; font-weight: 500; }.planning-response h2 > span { font-size: 26px; }.planning-response h2 small { font-size: 10px; color: var(--ink-500); }.known-points { margin: 18px 0; padding-left: 21px; color: var(--ink-700); font-size: 13px; line-height: 1.9; }.known-points li { margin-bottom: 7px; padding-left: 4px; }.known-points li::marker { color: var(--ink-500); }
.readiness-copy { color: var(--ink-500); font-size: 13px; line-height: 1.9; }.inline-action { display: flex; gap: 24px; margin-top: 18px; padding: 11px 16px; color: var(--ink-700); background: var(--canvas-soft); border: 0; border-radius: var(--radius-sm); font-size: 13px; }.inline-action:hover:not(:disabled) { transform: translateY(-2px); }.inline-action:disabled { opacity: .5; }
.plan-artifact { display: flex; align-items: center; flex-wrap: wrap; gap: 15px; margin: 22px 0; padding: 20px; border-radius: var(--radius-sm); background: linear-gradient(120deg, var(--canvas-soft), var(--canvas-soft)); }.artifact-icon { font-size: 30px; color: var(--ink-500); }.plan-artifact > div { min-width: 0; flex: 1; }.plan-artifact small { color: var(--ink-500); font-size: 11px; }.plan-artifact strong { display: block; margin-top: 5px; font-size: 15px; font-weight: 500; color: var(--ink-700); overflow-wrap: anywhere; }.plan-artifact p { margin: 7px 0 0; color: var(--ink-500); font-size: 11px; }.plan-artifact button { padding: 9px 12px; border: 0; border-radius: var(--radius-sm); background: #fff8; color: var(--ink-500); font-size: 12px; }
.planning-pending { display: flex; align-items: center; gap: 10px; color: var(--ink-500); font-size: 13px; }.planning-pending i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent-mid); animation: planning-pulse 1s ease-in-out infinite alternate; }
.answer-review { margin-top: 24px; }.answer-review h3 { color: var(--ink-500); font-size: 12px; font-weight: 500; }.answer-review h3 small { margin-left: 9px; color: var(--ink-500); font-size: 10px; }.answer-review button { display: block; width: 100%; margin-bottom: 10px; padding: 12px 16px; text-align: left; border: 0; border-radius: var(--radius-sm); background: color-mix(in srgb, var(--canvas-soft) 56%, transparent); }.answer-review button > span { color: var(--ink-500); font-size: 11px; }.answer-review button > p { margin: 6px 0 0; color: var(--ink-700); font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
.planning-dock { flex-shrink: 0; width: min(100%, 880px); margin: 0 auto; padding: 0 28px 17px; }.clarification-composer { padding: 15px 19px 12px; background: color-mix(in srgb, var(--paper) 95%, transparent); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: 0 8px 26px color-mix(in srgb, var(--shadow-color) 3%, transparent); }.clarification-composer:focus-within { border-color: var(--line-strong); }.question-index { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 13px; }.question-index button { width: 25px; height: 25px; padding: 0; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 10px; }.question-index button.active { color: white; background: var(--accent); }.question-index > span { margin-left: auto; color: var(--ink-500); font-size: 10px; }
.clarification-composer label { display: block; color: var(--ink-700); font-size: 13px; font-weight: 500; line-height: 1.7; }.clarification-composer textarea { display: block; width: 100%; min-height: 60px; max-height: 140px; margin: 10px 0; padding: 0; border: 0; background: transparent; resize: vertical; font-size: 14px; line-height: 1.8; }.clarification-composer textarea:focus { outline: none; }.clarification-composer textarea::placeholder { color: var(--ink-500); }.clarification-composer footer { display: flex; align-items: center; gap: 12px; }.clarification-composer footer small { margin-left: auto; color: var(--ink-500); font-size: 10px; }.clarification-composer footer button { padding: 7px 11px; min-height: 34px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 11px; }.clarification-composer footer .next-question, .clarification-composer footer .submit-answers { color: white; background: var(--accent); }.clarification-composer button:disabled { opacity: .4; }
.planning-next { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding: 17px 20px; border: 1px solid var(--line); border-radius: var(--radius-sm); color: var(--ink-500); background: color-mix(in srgb, var(--paper) 69%, transparent); font-size: 12px; }.planning-next button { padding: 7px 11px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 12px; }.planning-disclaimer { margin: 10px 0 0; text-align: center; font-size: 10px; color: var(--ink-500); line-height: 1.8; }
.planning-error { margin-bottom: 12px; padding: 12px 16px; border-radius: var(--radius-sm); background: #faedf0; color: #995a6c; font-size: 12px; }.planning-error p { margin: 5px 0 0; line-height: 1.8; }
@keyframes planning-pulse { to { opacity: .3; } }
@media(max-width: 620px) { .planning-messages { padding: 22px 18px; }.planning-dock { padding: 0 14px 12px; }.clarification-composer { padding: 13px; }.question-index > span { font-size: 9px; }.initial-intention { max-width: 95%; } }
</style>
