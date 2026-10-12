<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { buildGoalText, goalDetailFields } from '../../utils/goalDraft'
import AgentSignal from './AgentSignal.vue'

const goalText = defineModel({ type: String, required: true })
const details = defineModel('details', { type: Object, required: true })
const props = defineProps({
  loading: { type: Boolean, default: false },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  userName: { type: String, default: '' },
  currentGoalId: { type: Number, default: null },
  analyzed: { type: Boolean, default: false },
})
const emit = defineEmits(['submit', 'resume', 'dismiss-error'])
const input = ref(null)
const form = ref(null)
const focused = ref(false)
const detailsOpen = ref(Object.values(details.value).some(value => String(value).trim()))
const pendingExample = ref(null)
const examples = [
  { tag: '职业成长', icon: '↗', text: '三个月内完成一个适合找 Java 后端实习的项目' },
  { tag: '学习充电', icon: '✧', text: '今年通过英语六级，每天可以学习一小时' },
  { tag: '健康生活', icon: '◷', text: '开始规律跑步，半年后完成一次半程马拉松' },
]
const count = computed(() => buildGoalText(goalText.value, details.value).length)
const filledFields = computed(() => goalDetailFields.filter(field => details.value[field.key]?.trim()))
const canSubmit = computed(() => Boolean(goalText.value.trim()) && count.value <= 1000 && !props.loading)

async function resizeInput() {
  await nextTick()
  if (!input.value) return
  input.value.style.height = 'auto'
  input.value.style.height = Math.min(300, Math.max(100, input.value.scrollHeight)) + 'px'
}
watch(goalText, resizeInput)
onMounted(resizeInput)

async function focusField(key) {
  if (props.loading) return
  if (key) {
    detailsOpen.value = true
    await nextTick()
    form.value?.querySelector('#goal-' + key)?.focus()
  } else input.value?.focus()
}

function updateDetail(key, value) {
  if (!props.loading) details.value = { ...details.value, [key]: value }
}

async function applyExample(text) {
  if (props.loading) return
  goalText.value = text
  pendingExample.value = null
  await nextTick()
  input.value?.focus()
}

function chooseExample(text) {
  if (props.loading) return
  if (goalText.value.trim() && goalText.value !== text) pendingExample.value = text
  else applyExample(text)
}

function submit() {
  if (canSubmit.value) emit(props.analyzed ? 'resume' : 'submit')
}

function submitShortcut(event) {
  if (event.isComposing) return
  event.preventDefault()
  submit()
}
</script>

<template>
  <section class="composer-view">
    <header class="editorial-heading">
      <span class="kicker"><i aria-hidden="true"></i>你好，{{ userName }}</span>
      <h1>今天，想一起<span>推进什么？</span></h1>
      <p>一个想法，或眼前的一小步。我们从这里聊起。</p>
    </header>
    <form ref="form" class="writing-card agent-input-surface" :class="{ 'is-focused': focused, 'is-working': loading }" @submit.prevent="submit" @keydown.ctrl.enter="submitShortcut" @keydown.meta.enter="submitShortcut">
      <div class="composer-caption"><AgentSignal :active="loading" /><span>和 GoalPilot 聊聊</span><small>YOUR NEXT CHAPTER</small></div>
      <div class="writing-surface"><label class="sr-only" for="goal-input">我的目标</label><textarea ref="input" id="goal-input" v-model="goalText" maxlength="1000" rows="3" :disabled="loading" :aria-invalid="count > 1000" aria-describedby="goal-length-note" placeholder="告诉我你想完成什么，或是正卡在哪一步…" @focus="focused = true" @blur="focused = false"></textarea></div>
      <div id="goal-details" class="details-disclosure" :class="{ open: detailsOpen }" :inert="!detailsOpen" :aria-hidden="!detailsOpen"><div class="details-inner"><div class="details-grid">
        <div v-for="field in goalDetailFields" :key="field.key" class="detail-field"><label :for="'goal-' + field.key">{{ field.label }}</label><input :id="'goal-' + field.key" :value="details[field.key] || ''" :placeholder="field.placeholder" maxlength="180" :disabled="loading" @input="updateDetail(field.key, $event.target.value)" /><div class="suggestions"><button v-for="suggestion in field.suggestions" :key="suggestion" type="button" :disabled="loading" @click="updateDetail(field.key, suggestion)">{{ suggestion }}</button></div></div>
      </div></div></div>
      <div v-if="!detailsOpen && filledFields.length" class="detail-summary"><button v-for="field in filledFields" :key="field.key" type="button" :disabled="loading" @click="focusField(field.key)">{{ field.label }}：{{ details[field.key] }}</button></div>
      <p v-if="count > 1000" class="length-error" role="alert">目标与补充条件合计超出 {{ count - 1000 }} 字，请精简后再提交。</p>
      <div v-if="errorMessage" class="error-banner" role="alert"><div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div><button type="button" aria-label="关闭错误提示" @click="emit('dismiss-error')">×</button></div>
      <footer class="composer-actions"><button type="button" class="details-toggle" :aria-expanded="detailsOpen" aria-controls="goal-details" :disabled="loading" @click="detailsOpen = !detailsOpen"><span>{{ detailsOpen ? '−' : '＋' }}</span> 补充条件 <small>选填</small></button><div><span id="goal-length-note" :class="{ 'over-limit': count > 1000 }">{{ count }} / 1000</span><button class="analyze-button" type="submit" :disabled="!canSubmit">{{ loading ? '正在梳理…' : analyzed ? '继续对话' : '开始梳理' }} <span aria-hidden="true">↑</span></button></div></footer>
    </form>
    <section class="prompt-module" aria-label="目标灵感">
      <div class="prompt-heading"><span>从一个灵感开始</span><i aria-hidden="true"></i></div>
      <Transition name="example-confirm"><div v-if="pendingExample" class="example-confirm" role="group" aria-label="确认替换目标描述"><p>要用这个灵感替换当前描述吗？<small>{{ pendingExample }}。补充条件会保留。</small></p><button type="button" @click="pendingExample = null">保留原文</button><button type="button" @click="applyExample(pendingExample)">使用示例</button></div></Transition>
      <div class="example-grid"><button v-for="example in examples" :key="example.tag" type="button" :disabled="loading" @click="chooseExample(example.text)"><span aria-hidden="true">{{ example.icon }}</span><div><small>{{ example.tag }}</small><strong>{{ example.text }}</strong></div><i aria-hidden="true">↗</i></button></div>
    </section>
  </section>
</template>

<style scoped>
.composer-view { min-width: 0; font-family: var(--text-cn); }
.editorial-heading { margin: 0 0 30px; text-align: center; }
.kicker { display: inline-flex; align-items: center; gap: 9px; color: var(--ink-600); font-size: 13px; }
.kicker i { width: 6px; height: 6px; background: #759675; box-shadow: 0 0 0 4px #75967515; }
.editorial-heading h1 { margin: 16px 0 12px; color: var(--ink); font-size: clamp(26px, 2.4vw, 38px); font-weight: 600; line-height: 1.5; letter-spacing: .015em; }
.editorial-heading h1 span { color: var(--accent); }
.editorial-heading p { margin: 0; color: var(--ink-600); font-size: 13px; line-height: 1.8; }
.writing-card { position: relative; padding: 22px 26px 18px; border: 1px solid #8fa99b; border-radius: 8px; background: #fffef7; box-shadow: 0 10px 36px #304b4010, 4px 4px 0 #c5d1bc70; transition: box-shadow .2s, border-color .2s; }
.writing-card.is-focused { border-color: var(--accent); box-shadow: 0 0 0 3px #bed0b940, 0 12px 40px #304b4014, 4px 4px 0 #acbfa777; }
.composer-caption { display: flex; align-items: center; gap: 8px; margin: 0 0 17px; color: var(--accent-deep); font-size: 12px; font-weight: 500; }
.composer-caption .agent-signal { width: 27px; height: 27px; }
.composer-caption small { margin-left: auto; color: #789084; font: 8px var(--pixel); }
.writing-surface textarea { display: block; width: 100%; min-height: 110px; padding: 4px 0 12px; border: 0; outline: none; resize: none; color: var(--ink); background: transparent; font: 16px/1.9 var(--text-cn); }
.writing-surface textarea:focus-visible { outline: none; }.writing-surface textarea::placeholder { color: #6d8177; }
.composer-actions { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e3e9dc; }
.composer-actions > div { display: flex; align-items: center; gap: 16px; margin-left: auto; }.composer-actions > div > span { color: var(--ink-500); font-size: 10px; font-variant-numeric: tabular-nums; }
.details-toggle { display: flex; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid #dae3d4; border-radius: 4px; background: #f1f4e9; color: var(--accent); font-size: 12px; }.details-toggle > span { font-size: 17px; }.details-toggle > small { font-size: 9px; color: var(--ink-500); }
.analyze-button { min-height: 42px; padding: 0 12px 0 17px; display: inline-flex; align-items: center; gap: 18px; border: 1px solid var(--accent-deep); border-radius: 4px; color: #fffdf1; background: var(--accent-deep); box-shadow: 2px 2px 0 #b2c3ac; font-size: 12px; }.analyze-button > span { font-size: 24px; }.analyze-button:hover:not(:disabled) { transform: translateY(-2px); }.analyze-button:disabled { background: #e5ebdf; border-color: #d2ddca; color: #738271; box-shadow: none; }
.details-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .22s, opacity .22s; }.details-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.details-inner { overflow: hidden; min-height: 0; }.details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; padding: 17px 0 12px; border-top: 1px solid var(--line); }.detail-field label { display: block; margin-bottom: 8px; color: var(--ink-600); font-size: 12px; }.detail-field input { width: 100%; padding: 10px; color: var(--ink); border: 1px solid var(--line); border-radius: 3px; background: var(--paper); font-size: 12px; }.detail-field input::placeholder { color: var(--ink-500); }
.suggestions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }.suggestions button { padding: 4px 7px; border: 0; border-radius: 3px; color: var(--ink-600); background: var(--canvas-soft); font-size: 10px; }.detail-summary { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }.detail-summary button { max-width: 100%; padding: 5px 9px; border: 0; border-radius: 3px; color: var(--ink-600); background: var(--canvas-soft); font-size: 11px; overflow-wrap: anywhere; text-align: left; }
.prompt-module { margin-top: 24px; }
.prompt-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: var(--ink-500); font-size: 10px; }.prompt-heading > i { flex: 1; height: 1px; background: var(--line); }.prompt-heading small { font-size: 9px; }
.example-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }.example-grid button { display: flex; align-items: flex-start; gap: 9px; padding: 12px; border: 1px solid #d7dfce; border-radius: 4px; color: var(--accent); background: #f5f6ecb3; text-align: left; }.example-grid button > span { font-size: 17px; }.example-grid small { display: block; color: var(--ink-600); font-size: 10px; }.example-grid strong { display: block; margin-top: 5px; color: var(--ink-600); font-size: 11px; font-weight: 400; line-height: 1.8; }.example-grid i { margin-left: auto; font-size: 13px; font-style: normal; }.example-grid button:hover:not(:disabled) { background: var(--paper); border-color: #a9bca3; transform: translateY(-2px); }
.example-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 15px; margin-bottom: 14px; background: var(--canvas-soft); color: var(--ink); font-size: 12px; }.example-confirm p { flex: 1; margin: 0; }.example-confirm small { display: block; margin-top: 6px; color: var(--ink-600); line-height: 1.8; }.example-confirm button { padding: 7px 10px; border: 1px solid var(--line); border-radius: 3px; background: var(--paper); color: var(--accent); font-size: 11px; }
.length-error { font-size: 12px; color: var(--danger); }.over-limit { color: var(--danger) !important; }.error-banner { display: flex; gap: 10px; padding: 12px 15px; margin: 12px 0; background: var(--danger-soft); border-radius: 4px; color: var(--danger); font-size: 12px; }.error-banner p { margin: 5px 0 0; }.error-banner button { margin-left: auto; border: 0; background: transparent; }
@media(max-width: 620px) { .editorial-heading { margin-bottom: 24px; }.editorial-heading h1 { font-size: 25px; }.editorial-heading p { font-size: 12px; max-width: 260px; margin-inline: auto; }.writing-card { padding: 17px 16px 14px; }.composer-caption small, .details-toggle small { display: none; }.writing-surface textarea { font-size: 15px; }.composer-actions { gap: 8px; }.composer-actions > div { gap: 9px; }.details-toggle { padding: 7px; font-size: 11px; }.analyze-button { gap: 9px; padding-inline: 10px; }.details-grid, .example-grid { grid-template-columns: 1fr; }.example-grid button { align-items: center; }.example-grid strong { margin-top: 2px; }.prompt-heading small { display: none; } }
@media(prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
</style>
