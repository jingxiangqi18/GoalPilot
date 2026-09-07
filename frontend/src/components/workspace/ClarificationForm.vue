<script setup>
import { computed, ref, watch } from 'vue'

const answers = defineModel('answers', { type: Array, required: true })
const props = defineProps({
  questions: { type: Array, required: true },
  snapshotId: { type: Number, default: null },
  busy: { type: Boolean, default: false },
  historyCount: { type: Number, default: 0 },
})
const emit = defineEmits(['submit'])
const activeIndex = ref(0)
const current = computed(() => props.questions[activeIndex.value])
const answered = index => Boolean(String(answers.value[index] || '').trim())
const answeredCount = computed(() => props.questions.filter((_, index) => answered(index)).length)
const allAnswered = computed(() => props.questions.length > 0 && props.questions.every((question, index) => question.questionId && answered(index)))
const progress = computed(() => props.questions.length ? answeredCount.value / props.questions.length * 100 : 0)
watch(() => [props.snapshotId, props.questions.map(question => question.questionId || question.question).join('|')], () => {
  const firstUnanswered = props.questions.findIndex((_, index) => !answered(index))
  activeIndex.value = Math.max(firstUnanswered, 0)
})

function select(index) {
  if (!props.busy && index >= 0 && index < props.questions.length) activeIndex.value = index
}
function focusAnswer(element) {
  element.querySelector('textarea')?.focus({ preventScroll: true })
}
function submitShortcut(event) {
  if (event.isComposing || props.busy) return
  event.preventDefault()
  if (allAnswered.value) emit('submit')
  else if (answered(activeIndex.value)) select(props.questions.findIndex((_, index) => !answered(index)))
}
</script>

<template>
  <section class="clarification-form" aria-label="补充关键信息">
    <header><div><span class="eyebrow">LET'S MAKE IT CLEAR</span><h3>一次只想一个问题。</h3><p>回答会暂存在当前会话，全部完成后一起提交。</p></div><div class="answer-progress"><strong>{{ answeredCount }}<span> / {{ questions.length }}</span></strong><small>已回答</small></div></header>
    <div class="completion-track" role="progressbar" aria-label="回答进度" :aria-valuenow="answeredCount" :aria-valuemax="questions.length" aria-valuemin="0"><i :style="{ width: progress + '%' }"></i></div>
    <div class="question-workspace">
      <nav class="question-index" aria-label="澄清问题导航">
        <button v-for="(question, index) in questions" :key="question.questionId || index" type="button" :class="{ active: activeIndex === index, answered: answered(index) }" :aria-current="activeIndex === index ? 'step' : undefined" :aria-label="'问题 ' + (index + 1) + '：' + question.question + (answered(index) ? '，已回答' : '，未回答')" :disabled="busy" @click="select(index)">
          <span class="question-marker">{{ answered(index) ? '✓' : String(index + 1).padStart(2, '0') }}</span><span class="question-nav-copy"><strong>{{ question.question }}</strong><small>{{ answered(index) ? '已填写 · 可继续修改' : '等待你的回答' }}</small></span><i>›</i>
        </button>
        <p v-if="historyCount" class="history-note">本次会话已保存 {{ historyCount }} 项回答</p>
      </nav>
      <div class="question-focus">
        <Transition name="question-turn" mode="out-in" @after-enter="focusAnswer">
          <div v-if="current" :key="String(snapshotId) + '-' + activeIndex" class="question-sheet" @keydown.ctrl.enter="submitShortcut" @keydown.meta.enter="submitShortcut">
            <span class="question-eyebrow">问题 {{ activeIndex + 1 }} <i></i> {{ activeIndex + 1 === questions.length ? '最后一个问题' : '按你的实际情况填写' }}</span>
            <label :for="'clarification-answer-' + activeIndex">{{ current.question }}</label>
            <div class="answer-surface"><textarea :id="'clarification-answer-' + activeIndex" v-model="answers[activeIndex]" :disabled="busy" maxlength="1000" rows="4" placeholder="不用组织得很正式，写下你的真实情况就好……"></textarea><span>{{ String(answers[activeIndex] || '').length }} / 1000</span></div>
            <p class="answer-note"><span>✦</span> 不确定的地方也可以说明，我们会据此调整计划。</p>
          </div>
        </Transition>
      </div>
    </div>
    <footer><span>{{ allAnswered ? '回答已经齐了，可以提交啦。' : '可以点击左侧问题，随时回看和修改。' }}</span><div><button type="button" class="previous-question" :disabled="activeIndex === 0 || busy" @click="select(activeIndex - 1)">← 上一题</button><button v-if="activeIndex < questions.length - 1 && !allAnswered" type="button" class="next-question" :disabled="!answered(activeIndex) || busy" @click="select(activeIndex + 1)">下一题 →</button><button v-else type="button" class="submit-answers" :disabled="!allAnswered || busy" @click="emit('submit')">{{ busy ? '正在更新画像…' : '提交全部回答' }} <span v-if="!busy">↗</span></button></div></footer>
  </section>
</template>

<style scoped>
.clarification-form { container-type: inline-size; overflow: hidden; background: var(--paper); border: 0; border-radius: 22px; box-shadow: var(--surface-shadow); }
.clarification-form > header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 23px 24px 20px; }
.eyebrow { color: var(--coral-700); font-size: 9px; letter-spacing: .12em; font-weight: 600; }.clarification-form h3 { margin: 8px 0 7px; font-size: 23px; font-weight: 500; }.clarification-form header p { margin: 0; font-size: 12px; line-height: 1.7; color: var(--ink-500); }
.answer-progress { text-align: right; white-space: nowrap; }.answer-progress strong { color: var(--coral-700); font-size: 26px; font-weight: 500; }.answer-progress strong > span { color: var(--ink-400); font-size: 15px; }.answer-progress small { display: block; margin-top: 5px; font-size: 10px; color: var(--ink-500); }
.completion-track { height: 3px; background: #eeedf4; }.completion-track i { display: block; height: 100%; background: linear-gradient(90deg, var(--coral-500), var(--rose-500)); transition: width .4s var(--ease-out); }
.question-workspace { display: grid; grid-template-columns: minmax(200px, .7fr) minmax(0, 1.5fr); }
.question-index { padding: 18px 14px; border-right: 1px solid var(--line); background: linear-gradient(160deg, #f7f7fc, #faf8fb); }
.question-index > button { width: 100%; padding: 12px; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; border-radius: 11px; background: none; text-align: left; transition: border-color .25s, background .25s, box-shadow .25s; }.question-index > button + button { margin-top: 6px; }.question-index > button:hover { background: white; }.question-index > button.active { background: white; border-color: #d9d9e9; box-shadow: 0 4px 14px #33395406; }
.question-marker { flex: 0 0 auto; align-self: flex-start; width: 28px; height: 28px; display: grid; place-items: center; color: var(--ink-500); background: #e9eaf2; border-radius: 8px; font-size: 10px; transition: background .25s; }.active .question-marker { background: var(--coral-600); color: white; }.answered .question-marker { background: var(--moss-700); color: white; }
.question-nav-copy { min-width: 0; }.question-index strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; line-height: 1.7; font-weight: 500; color: var(--ink-600); }.question-index small { display: block; margin-top: 5px; font-size: 10px; color: var(--ink-500); }.question-index i { margin-left: auto; color: var(--coral-500); font-size: 19px; font-style: normal; }.history-note { margin: 18px 12px 0; color: var(--ink-500); font-size: 10px; line-height: 1.7; }
.question-focus { min-width: 0; padding: 24px; }.question-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--ink-500); }.question-eyebrow i { width: 3px; height: 3px; border-radius: 50%; background: var(--rose-500); }
.question-sheet > label { display: block; margin: 12px 0 18px; color: var(--ink); font-size: 19px; font-weight: 500; line-height: 1.7; }
.answer-surface { padding: 14px; display: grid; border: 0; border-radius: 16px; background: #f3f2f9; box-shadow: inset 0 2px 5px #67608005; transition: box-shadow .25s, background .25s; }.answer-surface:focus-within { background: #faf9fe; box-shadow: inset 0 0 0 1px #b8b2d1, 0 0 0 3px #b8b2d115; }.answer-surface textarea { width: 100%; min-height: 130px; max-height: 320px; padding: 0; resize: vertical; border: 0; outline: none; background: transparent; font-size: 15px; line-height: 1.9; }.answer-surface textarea::placeholder { color: #8d91a0; }.answer-surface textarea:focus-visible { outline: none; }.answer-surface > span { padding-top: 8px; text-align: right; color: var(--ink-500); font-size: 10px; }
.answer-note { margin: 12px 0 0; color: var(--ink-500); font-size: 11px; line-height: 1.8; }.answer-note span { margin-right: 5px; color: var(--rose-500); }
.clarification-form > footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--line); }.clarification-form footer > span { color: var(--ink-500); font-size: 11px; }.clarification-form footer > div { margin-left: auto; display: flex; gap: 8px; }.clarification-form footer button { min-height: 40px; padding: 0 14px; border: 1px solid var(--line-strong); border-radius: 9px; background: white; font-size: 12px; }.clarification-form .next-question, .clarification-form .submit-answers { background: var(--coral-700); border-color: var(--coral-700); color: white; }.clarification-form button:disabled { opacity: .45; }
.question-turn-enter-active { transition: opacity .2s, transform .25s var(--ease-out); }.question-turn-leave-active { transition: opacity .12s, transform .15s; }.question-turn-enter-from { opacity: 0; transform: translateX(10px); }.question-turn-leave-to { opacity: 0; transform: translateX(-6px); }
@container(max-width: 660px) { .question-workspace { grid-template-columns: 1fr; }.question-index { display: flex; flex-wrap: wrap; gap: 6px; border-right: 0; border-bottom: 1px solid var(--line); padding: 10px 14px; }.question-index > button { flex: 1; width: auto; padding: 7px; justify-content: center; }.question-index > button + button { margin-top: 0; }.question-nav-copy, .question-index i { display: none; }.history-note { width: 100%; margin: 3px 0; }.question-focus { padding: 20px; }.question-index button::after { content: '问题'; font-size: 11px; color: var(--ink-500); } }
@media(max-width: 480px) { .clarification-form > header { padding: 18px; }.clarification-form h3 { font-size: 20px; }.clarification-form > footer { padding: 16px 18px; }.clarification-form footer > div { width: 100%; }.clarification-form footer button { flex: 1; padding: 0 10px; }.question-sheet > label { font-size: 17px; }.answer-surface textarea { font-size: 16px; } }
</style>
