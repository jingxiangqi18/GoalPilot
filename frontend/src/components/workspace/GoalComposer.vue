<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { buildGoalText, goalDetailFields } from '../../utils/goalDraft'
import planeCharm from '../../assets/goalpilot-plane-charm-v1.webp'

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
    <header class="editorial-heading"><div class="welcome-charm" aria-hidden="true"><img :src="planeCharm" alt="" width="72" height="72" /><span>✧</span></div><span class="kicker">你好，{{ userName }}</span><h1>今天，想一起推进什么？</h1><p>从一句想法开始。GoalPilot 帮你理解目标、补充信息，再整理成行动路线。</p></header>
    <form ref="form" class="writing-card" :class="{ 'is-focused': focused }" @submit.prevent="submit" @keydown.ctrl.enter="submitShortcut" @keydown.meta.enter="submitShortcut">
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
      <Transition name="example-confirm"><div v-if="pendingExample" class="example-confirm" role="group" aria-label="确认替换目标描述"><p>要用这个灵感替换当前描述吗？<small>{{ pendingExample }}。补充条件会保留。</small></p><button type="button" @click="pendingExample = null">保留原文</button><button type="button" @click="applyExample(pendingExample)">使用示例</button></div></Transition>
      <div class="example-grid"><button v-for="example in examples" :key="example.tag" type="button" :disabled="loading" @click="chooseExample(example.text)"><span aria-hidden="true">{{ example.icon }}</span><div><small>{{ example.tag }}</small><strong>{{ example.text }}</strong></div><i aria-hidden="true">↗</i></button></div>
    </section>
  </section>
</template>

<style scoped>
.composer-view { font-family: var(--text-cn); }
.editorial-heading { margin-bottom: 32px; text-align: center; }.welcome-charm { position: relative; width: 86px; height: 65px; margin: 0 auto 20px; }.welcome-charm img { object-fit: contain; transform: rotate(-8deg); }.welcome-charm > span { position: absolute; right: -2px; top: 1px; color: #825f93; font-size: 20px; }.kicker { color: #7e638e; font-size: 12px; }.editorial-heading h1 { margin: 13px 0 15px; color: #6b527b; font-size: clamp(25px, 2.4vw, 36px); font-weight: 500; letter-spacing: .015em; }.editorial-heading p { margin: 0; color: #796585; font-size: 13px; line-height: 1.9; }
.writing-card { padding: 23px; border: 1px solid #e0d5e9; border-radius: 24px; background: #fffdfef2; box-shadow: 0 10px 35px #78539208; transition: box-shadow .25s, border-color .25s; }.writing-card.is-focused { border-color: #baa2cc; box-shadow: 0 0 0 3px #ebdff340, 0 8px 32px #7853920a; }.writing-surface textarea { display: block; width: 100%; min-height: 100px; padding: 0; border: 0; outline: none; resize: none; background: transparent; color: #65536f; font-size: 16px; line-height: 1.9; }.writing-surface textarea:focus-visible { outline: none; }.writing-surface textarea::placeholder { color: #7a6588; }
.composer-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; }.composer-actions > div { display: flex; align-items: center; gap: 16px; }.composer-actions > div > span { color: #7a6589; font-size: 10px; font-variant-numeric: tabular-nums; }.details-toggle { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border: 0; border-radius: 9px; background: #f4eef8; color: #7f6290; font-size: 12px; }.details-toggle > span { font-size: 18px; }.details-toggle > small { color: #796585; font-size: 9px; }.analyze-button { min-height: 39px; padding: 0 13px; display: inline-flex; align-items: center; gap: 16px; border: 0; border-radius: 12px; color: white; background: linear-gradient(110deg, #9273a7, #ab89b1); font-size: 12px; }.analyze-button > span { font-size: 22px; }.analyze-button:hover:not(:disabled) { transform: translateY(-2px); }.analyze-button:disabled { color: #7b6489; background: #ede4f3; }
.details-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .25s, opacity .25s; }.details-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.details-inner { overflow: hidden; min-height: 0; }.details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; padding: 17px 0 12px; border-top: 1px solid #efe6f5; }.detail-field label { display: block; margin: 0 0 8px; color: #7d628f; font-size: 12px; }.detail-field input { width: 100%; padding: 10px 11px; color: #80618d; border: 1px solid #e4d8ec; border-radius: 9px; background: #faf6fd; font-size: 12px; }.detail-field input::placeholder { color: #7b6586; }.suggestions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }.suggestions button { padding: 4px 7px; border: 0; border-radius: 8px; color: #816091; background: #f4ecf9; font-size: 10px; }.detail-summary { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }.detail-summary button { max-width: 100%; padding: 5px 9px; border: 0; border-radius: 8px; color: #816091; background: #f6edfa; font-size: 11px; overflow-wrap: anywhere; text-align: left; }
.save-note { margin: 12px 0 25px; color: #7b6487; text-align: center; font-size: 10px; line-height: 1.8; }.example-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }.example-grid button { display: flex; align-items: flex-start; gap: 10px; padding: 16px; border: 0; border-radius: 14px; background: linear-gradient(120deg, #ede5f680, #f7eff850); text-align: left; }.example-grid button > span { color: #7b638e; font-size: 19px; }.example-grid small { display: block; color: #7f6190; font-size: 10px; }.example-grid strong { display: block; margin-top: 7px; color: #7c6489; font-size: 12px; font-weight: 400; line-height: 1.8; }.example-grid i { margin-left: auto; color: #7c638c; font-size: 17px; font-style: normal; }.example-grid button:hover:not(:disabled) { background: #eee1f6; transform: translateY(-3px); }
.example-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 15px; margin-bottom: 14px; border-radius: 12px; background: #efe4f7; color: #816092; font-size: 12px; }.example-confirm p { flex: 1; margin: 0; }.example-confirm small { display: block; margin-top: 6px; color: #816093; line-height: 1.8; }.example-confirm button { padding: 7px 10px; border: 0; border-radius: 8px; background: #fff9; color: #816092; font-size: 11px; }
.length-error { font-size: 12px; color: var(--danger); }.over-limit { color: var(--danger) !important; }.error-banner { display: flex; gap: 10px; padding: 12px 15px; margin: 12px 0; background: #faedf1; border-radius: 10px; color: var(--danger); font-size: 12px; }.error-banner p { margin: 5px 0 0; }.error-banner button { margin-left: auto; border: 0; background: transparent; }
@media(max-width: 620px) { .editorial-heading { margin-bottom: 25px; }.editorial-heading p { font-size: 12px; }.writing-card { padding: 18px; border-radius: 20px; }.details-grid { grid-template-columns: 1fr; }.composer-actions > div { gap: 8px; }.details-toggle { font-size: 11px; }.details-toggle small { display: none; }.analyze-button { gap: 9px; padding-inline: 10px; }.example-grid { grid-template-columns: 1fr; }.example-grid button { padding: 13px 15px; align-items: center; }.example-grid strong { margin-top: 4px; font-size: 11px; } }
</style>
