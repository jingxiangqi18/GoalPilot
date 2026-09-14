<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { buildGoalText, goalDetailFields } from '../../utils/goalDraft'
import ProgressGarden from './ProgressGarden.vue'
import AgentSignal from './AgentSignal.vue'
import PixelScene from './PixelScene.vue'

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
      <PixelScene class="composer-scenery" eager />
      <div class="departure-board"><span class="station-eyebrow">GOALPILOT · A LITTLE WORLD</span><span class="kicker">你好，{{ userName }}</span><h1>下一站，<span>你想去哪里？</span></h1><p>说出一个想法。和 Agent 一起，<br />把它变成可以出发的路线。</p><div class="boarding-line"><span aria-hidden="true">■ ── ■ ── □</span><small>从想法，到行动</small></div></div>
      <span class="scene-caption" aria-hidden="true">RIVERSIDE · 街区与绿意之间</span>
    </header>
    <ProgressGarden />
    <form ref="form" class="writing-card agent-input-surface" :class="{ 'is-focused': focused, 'is-working': loading }" @submit.prevent="submit" @keydown.ctrl.enter="submitShortcut" @keydown.meta.enter="submitShortcut">
      <div class="composer-caption"><AgentSignal :active="loading" /><span>和 GoalPilot 聊聊</span><small>从想法，到行动</small></div>
      <div class="writing-surface"><label class="sr-only" for="goal-input">我的目标</label><textarea ref="input" id="goal-input" v-model="goalText" maxlength="1000" rows="3" :disabled="loading" :aria-invalid="count > 1000" aria-describedby="goal-length-note" placeholder="告诉我你想完成什么，或是正卡在哪一步…" @focus="focused = true" @blur="focused = false"></textarea></div>
      <div id="goal-details" class="details-disclosure" :class="{ open: detailsOpen }" :inert="!detailsOpen" :aria-hidden="!detailsOpen"><div class="details-inner"><div class="details-grid">
        <div v-for="field in goalDetailFields" :key="field.key" class="detail-field"><label :for="'goal-' + field.key">{{ field.label }}</label><input :id="'goal-' + field.key" :value="details[field.key] || ''" :placeholder="field.placeholder" maxlength="180" :disabled="loading" @input="updateDetail(field.key, $event.target.value)" /><div class="suggestions"><button v-for="suggestion in field.suggestions" :key="suggestion" type="button" :disabled="loading" @click="updateDetail(field.key, suggestion)">{{ suggestion }}</button></div></div>
      </div></div></div>
      <div v-if="!detailsOpen && filledFields.length" class="detail-summary"><button v-for="field in filledFields" :key="field.key" type="button" :disabled="loading" @click="focusField(field.key)">{{ field.label }}：{{ details[field.key] }}</button></div>
      <p v-if="count > 1000" class="length-error" role="alert">目标与补充条件合计超出 {{ count - 1000 }} 字，请精简后再提交。</p>
      <div v-if="errorMessage" class="error-banner" role="alert"><div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div><button type="button" aria-label="关闭错误提示" @click="emit('dismiss-error')">×</button></div>
      <footer class="composer-actions"><button type="button" class="details-toggle" :aria-expanded="detailsOpen" aria-controls="goal-details" :disabled="loading" @click="detailsOpen = !detailsOpen"><span>{{ detailsOpen ? '−' : '＋' }}</span> 补充条件 <small>选填</small></button><div><span id="goal-length-note" :class="{ 'over-limit': count > 1000 }">{{ count }} / 1000</span><button class="analyze-button" type="submit" :disabled="!canSubmit">{{ loading ? '正在梳理…' : analyzed ? '继续对话' : '开始梳理' }} <span aria-hidden="true">↑</span></button></div></footer>
    </form>
    <p class="save-note">发送后保存目标并开始 AI 分析；生成的计划需要你确认后才会启用。</p>
    <section class="prompt-module" aria-label="目标灵感">
      <div class="prompt-heading"><span>从一个灵感开始</span><i aria-hidden="true"></i><small>选择后可以自由修改</small></div>
      <Transition name="example-confirm"><div v-if="pendingExample" class="example-confirm" role="group" aria-label="确认替换目标描述"><p>要用这个灵感替换当前描述吗？<small>{{ pendingExample }}。补充条件会保留。</small></p><button type="button" @click="pendingExample = null">保留原文</button><button type="button" @click="applyExample(pendingExample)">使用示例</button></div></Transition>
      <div class="example-grid"><button v-for="example in examples" :key="example.tag" type="button" :disabled="loading" @click="chooseExample(example.text)"><span aria-hidden="true">{{ example.icon }}</span><div><small>{{ example.tag }}</small><strong>{{ example.text }}</strong></div><i aria-hidden="true">↗</i></button></div>
    </section>
  </section>
</template>

<style scoped>
.composer-view { container: composer / inline-size; display: grid; grid-template-columns: minmax(0, 1fr) minmax(270px, .39fr); gap: 0 34px; align-items: start; font-family: var(--text-cn); }.composer-view > :not(.progress-garden) { min-width: 0; grid-column: 1; }.composer-view > .progress-garden { grid-column: 2; grid-row: 1 / 5; align-self: stretch; }
.editorial-heading { margin-bottom: 24px; text-align: left; }.kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--ink-500); font-size: 12px; }.kicker i { font-size: 20px; font-style: normal; color: var(--ink-500); }.editorial-heading h1 { margin: 14px 0 14px; color: var(--ink); font-size: clamp(30px, 2.65vw, 42px); font-weight: 550; line-height: 1.4; letter-spacing: .015em; }.editorial-heading h1 > span { color: #62856a; }.editorial-heading p { margin: 0; color: var(--ink-500); font-size: 13px; line-height: 1.9; }
.prompt-heading { display: flex; align-items: center; gap: 10px; margin: 0 0 13px; color: var(--ink-500); font-size: 11px; }.prompt-heading > i { flex: 1; height: 1px; background: linear-gradient(90deg, var(--accent-soft), transparent); }.prompt-heading small { color: var(--ink-500); font-size: 10px; }
.writing-card { padding: 21px 23px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--agent-input-background); box-shadow: var(--agent-input-shadow); transition: box-shadow .25s, border-color .25s; }.writing-card.is-focused { border-color: var(--line-strong); box-shadow: 0 0 0 3px #dce8d866, 0 8px 32px color-mix(in srgb, var(--shadow-color) 4%, transparent); }.writing-surface textarea { display: block; width: 100%; min-height: 100px; padding: 0; border: 0; outline: none; resize: none; background: transparent; color: var(--ink-700); font-size: 16px; line-height: 1.9; }.writing-surface textarea:focus-visible { outline: none; }.writing-surface textarea::placeholder { color: var(--ink-500); }
.composer-caption { display: flex; align-items: center; gap: 7px; margin: -6px -7px 13px; color: var(--ink-500); font-size: 11px; }.composer-caption small { margin-left: auto; margin-right: 7px; color: var(--ink-500); font-size: 10px; }.composer-caption .agent-signal { width: 29px; height: 29px; }
.composer-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; }.composer-actions > div { display: flex; align-items: center; gap: 16px; }.composer-actions > div > span { color: var(--ink-500); font-size: 10px; font-variant-numeric: tabular-nums; }.details-toggle { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border: 0; border-radius: var(--radius-sm); background: var(--canvas-soft); color: var(--ink-500); font-size: 12px; }.details-toggle > span { font-size: 18px; }.details-toggle > small { color: var(--ink-500); font-size: 9px; }.analyze-button { min-height: 39px; padding: 0 13px; display: inline-flex; align-items: center; gap: 16px; border: 0; border-radius: var(--radius-sm); color: white; background: linear-gradient(120deg, var(--accent), var(--accent-deep)); font-size: 12px; }.analyze-button > span { font-size: 22px; }.analyze-button:hover:not(:disabled) { transform: translateY(-2px); }.analyze-button:disabled { color: var(--ink-500); background: var(--canvas-soft); }
.details-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .25s, opacity .25s; }.details-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.details-inner { overflow: hidden; min-height: 0; }.details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; padding: 17px 0 12px; border-top: 1px solid var(--line); }.detail-field label { display: block; margin: 0 0 8px; color: var(--ink-500); font-size: 12px; }.detail-field input { width: 100%; padding: 10px 11px; color: var(--ink-500); border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--paper); font-size: 12px; }.detail-field input::placeholder { color: var(--ink-500); }.suggestions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }.suggestions button { padding: 4px 7px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 10px; }.detail-summary { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }.detail-summary button { max-width: 100%; padding: 5px 9px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 11px; overflow-wrap: anywhere; text-align: left; }
.save-note { margin: 12px 0 25px; color: var(--ink-500); text-align: center; font-size: 10px; line-height: 1.8; }.example-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }.example-grid button { display: flex; align-items: flex-start; gap: 10px; padding: 16px; border: 0; border-radius: var(--radius-sm); background: linear-gradient(120deg, color-mix(in srgb, var(--canvas-soft) 50%, transparent), color-mix(in srgb, var(--canvas-soft) 31%, transparent)); text-align: left; }.example-grid button > span { color: var(--ink-500); font-size: 19px; }.example-grid small { display: block; color: var(--ink-500); font-size: 10px; }.example-grid strong { display: block; margin-top: 7px; color: var(--ink-500); font-size: 12px; font-weight: 400; line-height: 1.8; }.example-grid i { margin-left: auto; color: var(--ink-500); font-size: 17px; font-style: normal; }.example-grid button:hover:not(:disabled) { background: var(--canvas-soft); transform: translateY(-3px); }
.example-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 15px; margin-bottom: 14px; border-radius: var(--radius-sm); background: var(--canvas-soft); color: var(--ink-500); font-size: 12px; }.example-confirm p { flex: 1; margin: 0; }.example-confirm small { display: block; margin-top: 6px; color: var(--ink-500); line-height: 1.8; }.example-confirm button { padding: 7px 10px; border: 0; border-radius: var(--radius-sm); background: #fff9; color: var(--ink-500); font-size: 11px; }
.length-error { font-size: 12px; color: var(--danger); }.over-limit { color: var(--danger) !important; }.error-banner { display: flex; gap: 10px; padding: 12px 15px; margin: 12px 0; background: #faedf1; border-radius: var(--radius-sm); color: var(--danger); font-size: 12px; }.error-banner p { margin: 5px 0 0; }.error-banner button { margin-left: auto; border: 0; background: transparent; }
.example-grid button { position: relative; background: #eef2e7; border: 1px solid #e5eadf; border-radius: var(--radius-sm); padding: 16px 14px; overflow: hidden; }.example-grid button:nth-child(2) { background: #f5f0e6; border-color: #eae5d9; }.example-grid button:nth-child(3) { background: #edf2ef; border-color: #e0e8e2; }.example-grid button > span { display: grid; place-items: center; flex: 0 0 29px; width: 29px; height: 29px; border-radius: var(--radius-sm); color: var(--accent); background: #fffff9b3; font-size: 18px; }.example-grid strong { color: var(--ink-700); }.example-grid button:hover:not(:disabled) { transform: translateY(-3px); background: #fffdf8; box-shadow: var(--surface-shadow); }.example-grid button:hover i { transform: translate(2px, -2px); }.example-grid i { transition: transform .2s var(--ease-out); }
/* The departure board sets the scene; the conversation remains the main action. */
.composer-view { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, .42fr); gap: 0 24px; }
.composer-view > .editorial-heading { grid-column: 1 / -1; position: relative; display: grid; grid-template-columns: 390px 1fr; margin: 0 0 28px; min-height: 268px; padding: 0; background: var(--paper); border: 1px solid var(--line-strong); box-shadow: 4px 4px 0 #aabeb433; }
.composer-view > .progress-garden { position: relative; grid-column: 2; grid-row: 2; align-self: stretch; }
.composer-scenery { position: absolute; inset: 0 0 0 375px; }
.departure-board { position: relative; z-index: 1; padding: 29px 30px 23px; background: #fffdf2; clip-path: polygon(0 0, 100% 0, 100% 12px, calc(100% - 6px) 12px, calc(100% - 6px) calc(100% - 12px), 100% calc(100% - 12px), 100% 100%, 0 100%); }
.station-eyebrow { display: block; margin-bottom: 20px; color: var(--accent); font: 11px var(--pixel); }
.kicker { font-size: 12px; color: var(--ink-600); }
.editorial-heading h1 { margin: 8px 0 12px; color: var(--ink); font-size: 30px; font-weight: 650; letter-spacing: .01em; line-height: 1.55; }
.editorial-heading h1 > span { color: var(--accent); display: inline; }
.editorial-heading p { font-size: 12px; line-height: 1.85; color: var(--ink-600); }
.boarding-line { display: flex; align-items: center; gap: 16px; padding-top: 20px; font-size: 11px; color: var(--ink-500); }.boarding-line > span { color: var(--warm-accent); letter-spacing: 3px; font-size: 8px; }.boarding-line small { font-size: 10px; }
.scene-caption { position: absolute; right: 14px; bottom: 14px; padding: 8px 10px; background: #263943e8; color: #f5ecd8; font: 9px var(--pixel); }
.writing-card { border-radius: 4px; border-color: var(--line-strong); padding: 20px 22px; }.writing-card.is-focused { border-color: var(--accent); box-shadow: 4px 4px 0 #8aa6a644; }
.composer-caption { margin-bottom: 16px; }.composer-caption .agent-signal { width: 28px; height: 28px; }.composer-caption > span { color: var(--ink); font-weight: 500; }
.composer-actions { padding-top: 12px; border-top: 1px dashed var(--line); }.analyze-button { border-radius: 3px; background: var(--accent-deep); box-shadow: 2px 2px 0 #1c354938; }.analyze-button > span { font-family: var(--display); }.details-toggle, .detail-field input, .suggestions button, .detail-summary button { border-radius: 3px; }
.save-note { margin: 12px 0 22px; text-align: left; font-size: 10px; }
.composer-view > .prompt-module { grid-column: 1 / -1; }
.example-grid button { border-radius: 3px; background: #e8eddf; border-color: #cbd6c3; box-shadow: 2px 2px 0 #a7b6a322; }.example-grid button:nth-child(2) { background: #f1e9d6; border-color: #dcd2b7; }.example-grid button:nth-child(3) { background: #e4ecec; border-color: #c8d7d9; }.example-grid button > span { border-radius: 2px; background: #fffdf3; color: var(--accent); }.example-grid button:hover:not(:disabled) { background: #fffdf3; transform: translateY(-2px); box-shadow: 2px 4px 0 #aabeb444; }
.prompt-heading > i { background: var(--line); }.prompt-heading { margin-bottom: 12px; }
@media(min-width: 1900px) { .composer-view > .editorial-heading { min-height: 300px; grid-template-columns: 420px 1fr; }.composer-scenery { left: 405px; }.departure-board { padding: 32px 34px; }.editorial-heading h1 { font-size: 34px; }.editorial-heading p { font-size: 13px; } }
@media(max-width: 1100px) { .composer-view { gap: 0 18px; grid-template-columns: minmax(0, 1fr) 285px; }.composer-view > .editorial-heading { grid-template-columns: 340px 1fr; }.composer-scenery { left: 325px; }.departure-board { padding: 24px; }.editorial-heading h1 { font-size: 27px; } }
@media(max-width: 960px) { .composer-view { display: block; }.composer-view > .editorial-heading { min-height: 250px; }.writing-card { padding: 20px; } }
@media(max-width: 620px) { .composer-view > .editorial-heading { display: flex; flex-direction: column; padding-top: 140px; margin-bottom: 20px; }.composer-scenery { inset: 0 0 auto; height: 160px; }.departure-board { padding: 21px 20px 18px; clip-path: polygon(0 0, 16px 0, 16px 6px, calc(100% - 16px) 6px, calc(100% - 16px) 0, 100% 0, 100% 100%, 0 100%); }.station-eyebrow { margin-bottom: 12px; font-size: 10px; }.editorial-heading h1 { font-size: 25px; }.editorial-heading h1 > span { display: inline; }.boarding-line { padding-top: 14px; }.scene-caption { display: none; }.writing-card { padding: 17px; border-radius: 3px; }.composer-caption small { display: none; }.save-note { font-size: 10px; }.prompt-heading small { font-size: 9px; }.details-grid, .example-grid { grid-template-columns: 1fr; }.example-grid button { padding: 13px; align-items: center; }.example-grid strong { margin-top: 4px; font-size: 11px; }.composer-actions > div { gap: 7px; }.details-toggle { font-size: 11px; gap: 4px; }.details-toggle small { display: none; }.analyze-button { padding-inline: 9px; gap: 8px; } }
</style>
