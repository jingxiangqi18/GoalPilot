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
  input.value.style.height = Math.min(300, Math.max(140, input.value.scrollHeight)) + 'px'
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
      <span class="kicker">YOUR PLANNING SPACE</span>
      <h1>你好，{{ userName }}<span>，今天想开始什么？</span></h1>
      <p>一个想法就够了。我们一起把它整理成可以开始的下一步。</p>
    </header>

    <div class="composer-layout">
      <form ref="form" class="writing-card" :class="{ 'is-focused': focused }" @submit.prevent="submit" @keydown.ctrl.enter="submitShortcut" @keydown.meta.enter="submitShortcut">
        <header class="writing-header"><span class="writing-mark" aria-hidden="true">↗</span><div><h2>{{ currentGoalId ? '继续梳理这个目标' : '先说说，你想做的事' }}</h2><p>自由描述，不用写成一份完美的计划。</p></div><span class="draft-label">{{ analyzed ? '已分析' : '目标草稿' }}</span></header>

        <div class="writing-surface">
          <label for="goal-input">我的目标 <span>必填</span></label>
          <textarea ref="input" id="goal-input" v-model="goalText" maxlength="1000" rows="4" :disabled="loading" :aria-invalid="count > 1000" aria-describedby="goal-length-note" placeholder="比如，我想做一个拿得出手的项目，&#10;但还不确定应该从哪里开始……" @focus="focused = true" @blur="focused = false"></textarea>
          <div class="writing-baseline"><span><i :class="{ filled: goalText.trim() }"></i>{{ focused ? '慢慢写，想到什么都可以补充' : '先写方向，细节可以稍后完善' }}</span><span id="goal-length-note" :class="{ 'over-limit': count > 1000 }">{{ count }} / 1000 <small>含补充条件</small></span></div>
        </div>

        <div class="details-toggle-row"><button type="button" class="details-toggle" :aria-expanded="detailsOpen" aria-controls="goal-details" :disabled="loading" @click="detailsOpen = !detailsOpen"><span>{{ detailsOpen ? '−' : '＋' }}</span> 给目标加一点边界 <small>选填</small></button><span>{{ filledFields.length ? filledFields.length + ' 项已填写' : '不确定也可以先留空' }}</span></div>
        <div id="goal-details" class="details-disclosure" :class="{ open: detailsOpen }" :inert="!detailsOpen" :aria-hidden="!detailsOpen">
          <div class="details-inner"><div class="details-grid">
            <div v-for="(field, index) in goalDetailFields" :key="field.key" class="detail-field">
              <label :for="'goal-' + field.key"><span>0{{ index + 1 }}</span>{{ field.label }}</label>
              <div class="detail-input"><input :id="'goal-' + field.key" :value="details[field.key] || ''" :placeholder="field.placeholder" maxlength="180" :disabled="loading" @input="updateDetail(field.key, $event.target.value)" /><button v-if="details[field.key]" type="button" :aria-label="'清空' + field.label" :disabled="loading" @click="updateDetail(field.key, '')">×</button></div>
              <div v-if="field.suggestions.length" class="suggestions"><button v-for="suggestion in field.suggestions" :key="suggestion" type="button" :disabled="loading" @click="updateDetail(field.key, suggestion)">{{ suggestion }}</button></div>
              <p v-else class="field-note">用一个能观察到的结果来描述。</p>
            </div>
          </div></div>
        </div>
        <div v-if="!detailsOpen && filledFields.length" class="detail-summary"><button v-for="field in filledFields" :key="field.key" type="button" :disabled="loading" @click="focusField(field.key)">{{ field.label }}：{{ details[field.key] }} <span>↗</span></button></div>

        <p v-if="count > 1000" class="length-error" role="alert">目标与补充条件合计超出 {{ count - 1000 }} 字，请精简后再提交。</p>
        <div v-if="errorMessage" class="error-banner" role="alert"><div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div><button type="button" aria-label="关闭错误提示" @click="emit('dismiss-error')">×</button></div>
        <footer class="composer-actions"><span class="save-note">{{ analyzed ? '已保存的画像可以随时回看' : '提交后保存到你的目标库' }}</span><button class="analyze-button" type="submit" :disabled="!canSubmit"><template v-if="loading"><span class="spinner"></span> 正在梳理…</template><template v-else>{{ analyzed ? '返回目标画像' : '保存并分析' }}<span>↗</span></template></button></footer>
      </form>

      <aside class="writing-companion" aria-label="写作小提示">
        <div class="companion-art" aria-hidden="true"><span class="mini-orbit"></span><img :src="planeCharm" alt="" width="128" height="128" decoding="async" /><i>✦</i></div>
        <span class="kicker">A SMALL NUDGE</span><h3>不用想清楚一切，<br />先给想法一个起点。</h3><p>卡住的时候，试着回答其中一个问题。</p>
        <ol>
          <li><button type="button" :disabled="loading" @click="focusField()"><span>01</span><div><strong>我想改变什么？</strong><small>一句话，说出最在意的方向。</small></div><i>↗</i></button></li>
          <li><button type="button" :disabled="loading" @click="focusField('timeBudget')"><span>02</span><div><strong>我能腾出多少时间？</strong><small>让计划贴近自己的生活节奏。</small></div><i>↗</i></button></li>
          <li><button type="button" :disabled="loading" @click="focusField('success')"><span>03</span><div><strong>怎样才算有进展？</strong><small>找到一个可以看见的小成果。</small></div><i>↗</i></button></li>
        </ol>
        <footer><span>✦</span> 想法可以不完整，但值得被认真对待。</footer>
      </aside>
    </div>

    <section class="prompt-module" aria-label="目标灵感">
      <header><span class="kicker">BORROW AN IDEA</span><h2>或者，从这些灵感开始</h2></header>
      <Transition name="example-confirm"><div v-if="pendingExample" class="example-confirm" role="group" aria-label="确认替换目标描述"><p>要使用这个示例替换当前描述吗？<small>{{ pendingExample }}。已填写的补充条件会保留。</small></p><button type="button" :disabled="loading" @click="pendingExample = null">保留原文</button><button type="button" :disabled="loading" @click="applyExample(pendingExample)">使用示例</button></div></Transition>
      <div class="example-grid">
        <button v-for="example in examples" :key="example.tag" type="button" :disabled="loading" @click="chooseExample(example.text)">
          <svg class="note-flourish" viewBox="0 0 130 90" fill="none" aria-hidden="true"><path d="M4 77C33 84 25 20 67 28s-6 54-25 28S77 2 126 12M24 88C57 73 71 83 93 59" /></svg>
          <span class="example-topline"><span class="example-symbol" aria-hidden="true">{{ example.icon }}</span><small>{{ example.tag }}</small><span class="example-arrow" aria-hidden="true">↗</span></span>
          <strong>{{ example.text }}</strong>
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.composer-view { container-type: inline-size; display: grid; gap: 22px; }
.kicker { color: var(--coral-700); font-size: 10px; font-weight: 600; letter-spacing: .13em; }
.editorial-heading h1 { margin: 9px 0; font-size: clamp(25px, 2vw, 32px); font-weight: 600; line-height: 1.5; letter-spacing: -.03em; }
.editorial-heading h1 > span { color: var(--ink-600); font-weight: 400; }.editorial-heading > p { margin: 0; color: var(--ink-500); font-size: 13px; line-height: 1.8; }
.composer-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; align-items: start; }
.writing-card { container-type: inline-size; position: relative; min-width: 0; overflow: hidden; border: 0; border-radius: 24px; background: var(--paper); box-shadow: var(--surface-shadow); transition: box-shadow .3s; }
.writing-card::before { content: ''; position: absolute; top: 0; left: 24px; width: 110px; height: 2px; background: linear-gradient(90deg, #a39bc5, #dbc6da, transparent); pointer-events: none; }
.writing-card.is-focused { box-shadow: 0 0 0 3px #8189bb0a, var(--surface-shadow-hover); }
.writing-header { display: flex; align-items: center; gap: 12px; padding: 22px 24px 18px; }
.writing-mark { flex: 0 0 auto; width: 38px; height: 38px; display: grid; place-items: center; color: var(--coral-700); background: linear-gradient(135deg, #ededf9, #f8edf2); border: 1px solid #e4deec; border-radius: 12px; font-size: 22px; }
.writing-header h2 { margin: 0; font-size: 17px; font-weight: 600; }.writing-header p { margin: 5px 0 0; color: var(--ink-500); font-size: 12px; }
.draft-label { margin-left: auto; padding: 5px 8px; color: var(--ink-500); background: var(--canvas-soft); border: 1px solid var(--line); border-radius: 6px; font-size: 10px; white-space: nowrap; }
.writing-surface { margin: 0 24px; padding: 17px 18px 12px; background: linear-gradient(135deg, #f2f2f9, #f8f6fa); border: 0; border-radius: 17px; box-shadow: inset 0 2px 5px #67608005; transition: background .25s, box-shadow .25s; }
.writing-surface:focus-within { background: #faf9fe; box-shadow: inset 0 0 0 1px #b8b2d1, 0 0 0 3px #b8b2d115; }
.writing-surface > label { display: block; color: var(--ink-600); font-size: 12px; font-weight: 500; }.writing-surface label > span { margin-left: 6px; color: var(--ink-500); font-size: 10px; font-weight: 400; }
.writing-surface textarea { display: block; width: 100%; min-height: 140px; margin-top: 12px; padding: 0; border: 0; outline: none; resize: none; background: transparent; color: var(--ink); font-size: 16px; line-height: 1.9; font-weight: 400; }
.writing-surface textarea::placeholder { color: #8b8f9f; }.writing-surface textarea:focus-visible { outline: none; }
.writing-baseline { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--ink-500); font-size: 10px; }
.writing-baseline > span:first-child { display: flex; align-items: center; gap: 6px; }.writing-baseline i { width: 5px; height: 5px; border-radius: 50%; background: #b7bdce; transition: background .2s; }.writing-baseline .filled { background: var(--moss-600); }.writing-baseline small { font-size: 9px; margin-left: 4px; }.over-limit { color: var(--danger); }
.details-toggle-row { padding: 17px 24px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }.details-toggle-row > span { color: var(--ink-500); font-size: 10px; }
.details-toggle { padding: 0; display: flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--coral-700); font-size: 12px; font-weight: 500; }.details-toggle > span { font-size: 17px; }.details-toggle > small { margin-left: 3px; color: var(--ink-500); font-size: 10px; }
.details-disclosure { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .3s var(--ease-out), opacity .2s; }.details-disclosure.open { grid-template-rows: 1fr; opacity: 1; }.details-inner { min-height: 0; overflow: hidden; }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 2px 24px 20px; }.detail-field:last-child { grid-column: 1 / -1; }.detail-field { min-width: 0; }.detail-field > label { display: block; margin-bottom: 9px; font-size: 12px; font-weight: 500; }.detail-field label > span { margin-right: 8px; color: var(--coral-500); font-size: 10px; }
.detail-input { display: flex; align-items: center; border: 1px solid var(--line-strong); border-radius: 9px; background: #fafafd; transition: border-color .2s, box-shadow .2s; }.detail-input:focus-within { border-color: var(--coral-500); box-shadow: 0 0 0 3px #8189bb12; background: #fff; }.detail-input input { width: 100%; min-width: 0; height: 42px; padding: 10px 12px; background: transparent; border: 0; outline: none; font-size: 13px; }.detail-input input:focus-visible { outline: none; }.detail-input input::placeholder { color: #8b8f9f; }.detail-input button { padding: 8px 12px; border: 0; background: transparent; color: var(--ink-500); }
.suggestions { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px; }.suggestions button { padding: 5px 9px; border: 0; border-radius: 999px; background: #f1f0f7; color: #6d6482; font-size: 10px; }.suggestions button:hover:not(:disabled) { color: var(--coral-700); background: #e6e2f2; transform: translateY(-1px); }.field-note { margin: 8px 0 0; font-size: 10px; color: var(--ink-500); }
.detail-summary { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 24px 16px; }.detail-summary button { max-width: 100%; padding: 6px 9px; background: var(--coral-100); border: 0; border-radius: 999px; color: var(--coral-700); font-size: 11px; overflow-wrap: anywhere; text-align: left; }
.composer-actions { padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: linear-gradient(110deg, #fafafd, #f4f2f9); border-top: 0; }.save-note { color: var(--ink-600); font-size: 11px; }
.analyze-button { min-height: 44px; min-width: 152px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 20px; background: linear-gradient(125deg, #626b9f, #7774a5); border: 1px solid #666c9e; border-radius: 11px; color: white; font-size: 13px; font-weight: 500; box-shadow: 0 6px 14px #6871aa24; }.analyze-button > span:last-child { font-size: 18px; }.analyze-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 18px #6871aa35; }.analyze-button:disabled { color: var(--ink-500); background: #eaeaf0; border-color: #dddfe8; box-shadow: none; }.spinner { width: 15px; height: 15px; border: 2px solid #c4c8de; border-top-color: var(--coral-700); border-radius: 50%; animation: spin .8s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
.writing-companion { position: relative; padding: 8px 6px 0; }.companion-art { position: relative; height: 116px; display: grid; place-items: center; }.companion-art > img { position: relative; width: 128px; height: 128px; object-fit: contain; filter: drop-shadow(0 8px 10px #77749820); transition: transform .6s var(--ease-out); }.writing-companion:hover .companion-art > img { transform: translate(4px, -5px) rotate(3deg); }.mini-orbit { position: absolute; width: 146px; height: 55px; border: 1px dashed #c5bdd7; border-radius: 50%; transform: rotate(-15deg); }.companion-art > i { position: absolute; right: 32px; top: 16px; color: var(--rose-500); font-size: 16px; font-style: normal; }.writing-companion h3 { margin: 11px 0 9px; color: var(--ink-700); font-size: 19px; font-weight: 500; line-height: 1.6; }.writing-companion > p { color: var(--ink-500); font-size: 12px; line-height: 1.7; }
.writing-companion ol { list-style: none; margin: 18px 0; padding: 0; }.writing-companion li + li { border-top: 1px solid #dcdde7; }.writing-companion li button { width: 100%; padding: 15px 2px; display: flex; align-items: center; gap: 10px; color: var(--ink-600); background: none; border: 0; text-align: left; }.writing-companion li button:hover { color: var(--coral-700); transform: translateX(3px); }.writing-companion li button > span { align-self: flex-start; padding-top: 3px; color: var(--coral-500); font-size: 10px; }.writing-companion strong { display: block; font-size: 12px; font-weight: 500; }.writing-companion small { display: block; margin-top: 5px; font-size: 11px; color: var(--ink-500); }.writing-companion li i { margin-left: auto; font-style: normal; }.writing-companion footer { padding-top: 14px; border-top: 1px solid #dcdde7; color: var(--ink-500); font-size: 10px; line-height: 1.8; }.writing-companion footer span { color: var(--rose-500); margin-right: 5px; }
.prompt-module { display: grid; gap: 16px; }
.prompt-module header { display: flex; align-items: center; gap: 12px; }
.prompt-module h2 { margin: 0; color: var(--ink-600); font-size: 13px; font-weight: 400; }
.example-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.example-grid button { --note-ink: #71628f; --note-start: #eeebf8; --note-end: #f7f5fc; position: relative; isolation: isolate; overflow: hidden; min-width: 0; padding: 18px 20px 21px; display: flex; flex-direction: column; gap: 13px; text-align: left; background: linear-gradient(125deg, var(--note-start), var(--note-end)); border: 0; border-radius: 20px 20px 20px 7px; box-shadow: inset 0 1px 0 #ffffffc9, 0 5px 16px #4f435809; transition: transform .3s var(--ease-out), box-shadow .3s; }
.example-grid button:nth-child(2) { --note-ink: #8c6077; --note-start: #f4e9ef; --note-end: #fcf6f7; }
.example-grid button:nth-child(3) { --note-ink: #4f7482; --note-start: #e8f0f3; --note-end: #f4f8f8; }
.example-grid button::after { content: ''; position: absolute; bottom: 0; left: 20px; width: 70px; height: 2px; opacity: .35; background: linear-gradient(90deg, var(--note-ink), transparent); transition: width .35s var(--ease-out); }
.example-topline { display: flex; align-items: center; gap: 9px; width: 100%; }
.example-symbol { display: grid; place-items: center; width: 29px; height: 29px; color: var(--note-ink); background: #ffffffad; border-radius: 50% 50% 50% 7px; font-size: 18px; box-shadow: 0 3px 8px #4e3c7010; transition: transform .3s var(--ease-out); }
.example-topline small { color: var(--note-ink); font-size: 11px; font-weight: 500; letter-spacing: .025em; }
.example-arrow { margin-left: auto; display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; color: var(--note-ink); background: #ffffff7d; font-size: 16px; transition: transform .3s var(--ease-out), background .3s; }
.example-grid strong { position: relative; display: block; padding-right: 10px; color: #484453; font-size: 13px; font-weight: 400; line-height: 1.8; text-wrap: pretty; }
.note-flourish { position: absolute; z-index: -1; right: 13px; top: 7px; width: 105px; height: 72px; color: var(--note-ink); opacity: .13; stroke: currentColor; stroke-width: 1; pointer-events: none; transition: transform .45s var(--ease-out), opacity .3s; }
.example-grid button:focus-visible { outline: 2px solid var(--note-ink); outline-offset: 3px; }
.example-grid button:disabled { opacity: .55; }
@media (hover: hover) {
  .example-grid button:hover:not(:disabled) { transform: translateY(-4px); box-shadow: inset 0 1px 0 #fff, 0 12px 23px #4f435815; }
  .example-grid button:hover:not(:disabled)::after { width: 120px; }
  .example-grid button:hover:not(:disabled) .example-arrow { background: #fff; transform: translate(2px, -2px); }
  .example-grid button:hover:not(:disabled) .example-symbol { transform: rotate(-8deg); }
  .example-grid button:hover:not(:disabled) .note-flourish { transform: rotate(-7deg) translateX(-4px); opacity: .2; }
}

.example-confirm { padding: 14px 16px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--coral-300); border-radius: 12px; background: var(--coral-100); }.example-confirm p { flex: 1; margin: 0; font-size: 12px; }.example-confirm small { display: block; margin-top: 6px; color: var(--ink-500); line-height: 1.7; }.example-confirm button { padding: 8px 12px; border: 1px solid var(--coral-300); border-radius: 8px; background: white; font-size: 11px; white-space: nowrap; }.example-confirm button:last-child { color: white; background: var(--coral-700); }.example-confirm-enter-active, .example-confirm-leave-active { transition: opacity .2s, transform .2s; }.example-confirm-enter-from, .example-confirm-leave-to { opacity: 0; transform: translateY(-5px); }
.length-error { margin: 0; padding: 0 24px 16px; font-size: 12px; color: var(--danger); }.error-banner { margin: 0 24px 16px; padding: 14px; display: flex; align-items: flex-start; gap: 12px; background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: 10px; color: var(--danger); }.error-banner strong { font-size: 12px; }.error-banner p { margin: 5px 0 0; font-size: 12px; line-height: 1.7; }.error-banner button { margin-left: auto; border: 0; background: none; font-size: 20px; }
@container(max-width: 1000px) { .composer-layout { grid-template-columns: minmax(0,1fr) 225px; }.writing-companion { padding-inline: 0; }.writing-header, .composer-actions { padding-inline: 18px; }.writing-surface { margin-inline: 18px; }.details-toggle-row { padding-inline: 18px; }.details-grid { padding-inline: 18px; }.example-grid button { padding: 16px; gap: 10px; }.draft-label { display: none; } }
@container(max-width: 460px) { .details-grid { grid-template-columns: 1fr; } }
.companion-art { height: 100px; }.companion-art > img { width: 116px; height: 116px; }.writing-companion ol { margin: 14px 0; }.writing-companion li button { padding-block: 12px; }
@container(max-width: 700px) { .composer-layout { grid-template-columns: 1fr; }.writing-companion { padding: 18px; background: linear-gradient(125deg, #eeedf7, #f7f1f6); border: 0; border-radius: 20px 20px 8px 20px; box-shadow: var(--surface-shadow); }.companion-art { float: right; width: 120px; height: 100px; }.writing-companion ol, .writing-companion footer { display: none; }.writing-companion h3 { font-size: 17px; }.writing-companion > p { margin-bottom: 0; }.example-grid { grid-template-columns: 1fr; }.example-symbol { display: grid; }.example-confirm { flex-wrap: wrap; }.example-confirm p { flex-basis: 100%; } }
@media(max-width: 480px) { .editorial-heading h1 > span { display: block; font-size: 21px; }.writing-header h2 { font-size: 16px; }.writing-header p { font-size: 11px; }.writing-surface { padding-inline: 13px; }.details-toggle-row > span { display: none; }.composer-actions { align-items: stretch; flex-direction: column; gap: 12px; }.prompt-module header { align-items: flex-start; flex-direction: column; gap: 6px; }.writing-baseline small { display: none; }.example-grid strong { font-size: 13px; } }
</style>
