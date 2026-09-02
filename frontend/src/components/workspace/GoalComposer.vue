<script setup>
import { computed, nextTick } from 'vue'

const goalText = defineModel({ type: String, required: true })
const props = defineProps({
  loading: { type: Boolean, default: false },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  userName: { type: String, default: '' },
  currentGoalId: { type: Number, default: null },
  analyzed: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'dismiss-error'])
const examples = [
  { index: '01', tag: '职业', text: '三个月内完成一个适合找 Java 后端实习的项目' },
  { index: '02', tag: '学习', text: '今年通过英语六级，每天可以学习一小时' },
  { index: '03', tag: '健康', text: '开始规律跑步，半年后完成一次半程马拉松' },
]
const writingHints = [
  { label: '时间范围', text: '希望在______内完成。' },
  { label: '成功标准', text: '做到______就算完成。' },
  { label: '可投入时间', text: '我每周可以投入______。' },
]
const count = computed(() => goalText.value.length)
const canSubmit = computed(() => goalText.value.trim() && count.value <= 1000 && !props.loading && !props.analyzed)

async function chooseExample(text) {
  goalText.value = text
  await nextTick()
  document.querySelector('#goal-input')?.focus()
}

async function appendHint(text) {
  const current = goalText.value.trimEnd()
  const nextValue = `${current}${current ? '\n' : ''}${text}`
  if (nextValue.length > 1000) return
  goalText.value = nextValue
  await nextTick()
  document.querySelector('#goal-input')?.focus()
}
</script>

<template>
  <section class="composer-view">
    <header class="editorial-heading reveal-item">
      <div>
        <span class="kicker"><i></i> PLANNING DESK · 规划工作台</span>
        <h1><span>你好，{{ userName }}</span><em>把想法变成清晰的下一步。</em></h1>
      </div>
      <div class="heading-note">
        <span>01 / 03</span>
        <p>不必一次想得完美。<br />先写下现在最真实的想法。</p>
      </div>
    </header>

    <div class="composer-layout reveal-item">
      <article class="writing-card">
        <header>
          <div>
            <span class="spark-icon">✦</span>
            <div><span>YOUR NEXT CHAPTER</span><h2>{{ currentGoalId ? `继续目标 #${currentGoalId}` : '写下一个新目标' }}</h2></div>
          </div>
          <span class="counter" :class="{ warning: count > 900 }">{{ String(count).padStart(3, '0') }} / 1000</span>
        </header>

        <div class="writing-area">
          <label class="sr-only" for="goal-input">描述你的目标</label>
          <textarea
            id="goal-input"
            v-model="goalText"
            maxlength="1000"
            rows="8"
            placeholder="我想要……"
            @keydown.ctrl.enter="emit('submit')"
            @keydown.meta.enter="emit('submit')"
          ></textarea>
          <div class="writing-hints">
            <span>快速补充</span>
            <button v-for="hint in writingHints" :key="hint.label" type="button" @click="appendHint(hint.text)">＋ {{ hint.label }}</button>
          </div>
        </div>

        <footer>
          <div class="save-explainer">
            <svg viewBox="0 0 20 20" fill="none"><path d="M10 3.2 4.3 5.4v4.3c0 3.4 2.4 6.2 5.7 7.1 3.3-.9 5.7-3.7 5.7-7.1V5.4L10 3.2Z" stroke="currentColor" stroke-width="1.5" /><path d="m7.5 10 1.6 1.6 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          <span>{{ analyzed ? '分析快照已经安全保存' : currentGoalId ? '将继续使用已保存的目标记录' : '提交后自动保存到你的目标库' }}</span>
          </div>
          <button class="analyze-button" type="button" :disabled="!canSubmit" @click="emit('submit')">
            <span v-if="loading" class="spinner"></span>
            <template v-else><span>{{ analyzed ? '分析已保存' : currentGoalId ? '继续分析' : '保存并分析' }}</span><i>{{ analyzed ? '✓' : '↗' }}</i></template>
          </button>
        </footer>
      </article>

      <aside class="focus-card" aria-label="目标梳理流程概览">
        <header><span><i></i> FOCUS SESSION</span><b>01</b></header>
        <div class="focus-visual">
          <span class="orbit orbit-one"></span>
          <span class="orbit orbit-two"></span>
          <span class="focus-core">GOAL<i></i></span>
          <small class="orbit-label label-a">想法</small>
          <small class="orbit-label label-b">边界</small>
          <small class="orbit-label label-c">行动</small>
        </div>
        <div class="focus-copy">
          <span>FROM NOISE TO CLARITY</span>
          <h3>先写下方向，<br />清晰会随之发生。</h3>
          <p>GoalPilot 会保存目标、识别缺口，并整理成可执行的路线。</p>
        </div>
        <footer><span>理解</span><i></i><span>澄清</span><i></i><span>规划</span></footer>
      </aside>
    </div>

    <div v-if="errorMessage" class="error-banner" role="alert">
      <span>!</span><div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <button type="button" aria-label="关闭错误提示" @click="emit('dismiss-error')">×</button>
    </div>

    <section class="prompt-module reveal-item">
      <header><span>NEED A STARTING POINT?</span><p>选择一个方向，再按你的真实情况修改。</p></header>
      <div class="example-grid">
        <button v-for="example in examples" :key="example.tag" type="button" @click="chooseExample(example.text)">
          <span class="example-index">{{ example.index }}</span>
          <span class="example-copy"><small>{{ example.tag }}</small><strong>{{ example.text }}</strong></span>
          <i>↗</i>
        </button>
      </div>
    </section>

    <section class="flow-strip reveal-item" aria-label="GoalPilot 工作流程">
      <span class="flow-title">HOW IT FLOWS</span>
      <ol>
        <li class="active"><i>1</i><span><strong>理解</strong><small>提取目标边界</small></span></li>
        <li><i>2</i><span><strong>澄清</strong><small>只问关键信息</small></span></li>
        <li><i>3</i><span><strong>规划</strong><small>生成行动路线</small></span></li>
      </ol>
      <p>Ctrl / ⌘ + Enter<br /><em>quick submit</em></p>
    </section>
  </section>
</template>

<style scoped>
.composer-view { display: grid; gap: 18px; }
.editorial-heading { min-height: 98px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 36px; }
.kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--coral-700); font-size: 9px; font-weight: 700; letter-spacing: .15em; }
.kicker i { width: 7px; height: 7px; display: block; background: var(--coral-500); border-radius: 2px; box-shadow: 0 0 0 4px var(--coral-100); transform: rotate(45deg); }
.editorial-heading h1 { margin: 11px 0 0; color: var(--ink); font-family: var(--display); font-size: clamp(34px, 3.5vw, 49px); font-weight: 650; line-height: 1.08; letter-spacing: -.04em; }
.editorial-heading h1 > span, .editorial-heading h1 > em { display: block; }
.editorial-heading h1 em { color: var(--coral-700); background: linear-gradient(92deg, #596399 0%, #7c72a4 48%, #bd7e97 100%); background-clip: text; -webkit-background-clip: text; font-style: normal; font-weight: 600; -webkit-text-fill-color: transparent; }
.heading-note { min-width: 190px; padding: 11px 0 3px 18px; border-left: 1px solid var(--line-strong); }
.heading-note span { color: var(--moss-700); font-size: 12px; font-weight: 700; }
.heading-note p { margin: 8px 0 0; color: var(--ink-500); font-size: 11px; line-height: 1.65; }
.composer-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(290px, .66fr); gap: 16px; }
.writing-card, .focus-card, .prompt-module, .flow-strip { border: 1px solid var(--line-strong); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
.writing-card { min-height: 438px; padding: 24px; display: flex; flex-direction: column; background: rgba(255,255,255,.96); }
.writing-card > header { padding-bottom: 17px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--line); }
.writing-card > header > div { display: flex; align-items: center; gap: 13px; }
.spark-icon { width: 40px; height: 40px; display: grid; place-items: center; color: var(--paper); background: linear-gradient(145deg, #8790c6 5%, #7a73ad 52%, #bd829b 100%); border-radius: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 8px 18px rgba(105,96,148,.18); font-size: 14px; }
.writing-card > header div div > span { color: var(--ink-400); font-size: 9px; font-weight: 750; letter-spacing: .15em; }
.writing-card h2 { margin: 5px 0 0; color: var(--ink); font-size: 17px; }
.counter { color: var(--ink-400); font-family: var(--display); font-size: 12px; font-weight: 650; }
.counter.warning { color: var(--coral-700); }
.writing-area { position: relative; margin-top: 17px; flex: 1; display: flex; flex-direction: column; }
.writing-area textarea { width: 100%; min-height: 205px; padding: 18px; flex: 1; resize: none; color: var(--ink); background: #fafafd; border: 1px solid var(--line-strong); border-radius: 14px; outline: none; font-size: 16px; font-weight: 500; line-height: 1.75; transition: border-color .2s, box-shadow .2s, background .2s; }
.writing-area textarea::placeholder { color: var(--ink-300); }
.writing-area textarea:focus { background: #fff; border-color: var(--coral-500); box-shadow: 0 0 0 4px rgba(104,113,170,.1); }
.writing-hints { margin-top: 9px; display: flex; align-items: center; gap: 6px; }
.writing-hints > span { margin-right: 2px; color: var(--ink-400); font-size: 9px; font-weight: 700; letter-spacing: .08em; }
.writing-hints button { min-height: 27px; padding: 0 9px; color: var(--ink-600); background: transparent; border: 1px solid var(--line); border-radius: 999px; font-size: 9px; font-weight: 600; }
.writing-hints button:hover { color: var(--coral-800); background: var(--coral-100); border-color: var(--coral-300); }
.writing-card > footer { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.save-explainer { display: flex; align-items: center; gap: 8px; color: var(--ink-500); font-size: 10px; }
.save-explainer svg { width: 18px; color: var(--moss-700); }
.analyze-button { min-width: 158px; min-height: 47px; padding: 0 7px 0 18px; display: inline-flex; align-items: center; justify-content: space-between; gap: 17px; color: var(--paper); background: var(--ink); border: 1px solid var(--ink); border-radius: 12px; font-size: 11px; font-weight: 700; transition: transform .2s, background .2s, box-shadow .2s; }
.analyze-button i { width: 31px; height: 31px; display: grid; place-items: center; color: #fff; background: var(--coral-600); border-radius: 9px; font-style: normal; font-size: 14px; }
.analyze-button:hover:not(:disabled) { background: var(--moss-800); box-shadow: 0 9px 20px rgba(29,31,39,.15); transform: translateY(-2px); }
.analyze-button:disabled { cursor: not-allowed; color: var(--ink-500); background: var(--canvas); border-color: var(--line-strong); }
.analyze-button:disabled i { opacity: .5; }
.spinner { width: 17px; height: 17px; margin: auto; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.focus-card { position: relative; min-height: 438px; padding: 20px; overflow: hidden; color: #f6f7fa; background: radial-gradient(circle at 83% 13%, rgba(204,132,158,.28), transparent 25%), radial-gradient(circle at 69% 38%, rgba(126,136,190,.32), transparent 31%), linear-gradient(155deg, #293041 0%, #1d2029 60%, #181a21 100%); border-color: rgba(255,255,255,.06); box-shadow: 0 20px 50px rgba(25,27,36,.16); }
.focus-card::before { content: ''; position: absolute; inset: 0; opacity: .16; background-image: radial-gradient(rgba(255,255,255,.38) .6px, transparent .6px); background-size: 8px 8px; mask-image: linear-gradient(to bottom, black, transparent 55%); }
.focus-card > header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; color: #aeb4c2; font-size: 8px; font-weight: 700; letter-spacing: .15em; }
.focus-card > header span { display: flex; align-items: center; gap: 7px; }
.focus-card > header i { width: 6px; height: 6px; background: #aeb5e3; border-radius: 50%; box-shadow: 0 0 0 4px rgba(174,181,227,.11); }
.focus-card > header b { color: #737b8d; font-size: 9px; }
.focus-visual { position: relative; z-index: 1; height: 176px; margin: 8px auto 3px; display: grid; place-items: center; }
.focus-visual::before { content: ''; position: absolute; width: 120px; height: 120px; background: rgba(114,123,177,.12); border-radius: 50%; filter: blur(18px); }
.orbit { position: absolute; border: 1px solid rgba(215,219,238,.17); border-radius: 50%; }
.orbit-one { width: 150px; height: 92px; transform: rotate(24deg); animation: orbit-drift 10s ease-in-out infinite alternate; }
.orbit-two { width: 92px; height: 150px; border-style: dashed; transform: rotate(48deg); animation: orbit-drift 12s ease-in-out infinite alternate-reverse; }
.focus-core { position: relative; width: 71px; height: 71px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, rgba(145,154,209,.92), rgba(80,89,141,.9)); border: 1px solid rgba(255,255,255,.26); border-radius: 23px; box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 18px 35px rgba(4,6,14,.25); font-size: 10px; font-weight: 700; letter-spacing: .12em; transform: rotate(-5deg); }
.focus-core i { position: absolute; right: 9px; bottom: 9px; width: 5px; height: 5px; background: #dfe2f5; border-radius: 50%; }
.orbit-label { position: absolute; color: #858c9b; font-size: 8px; letter-spacing: .08em; }
.label-a { top: 34px; left: 17px; }.label-b { top: 78px; right: 12px; }.label-c { bottom: 17px; left: 43px; }
@keyframes orbit-drift { to { transform: rotate(75deg) scale(1.05); } }
.focus-copy { position: relative; z-index: 2; margin-top: 2px; }
.focus-copy > span { color: #929ad0; font-size: 8px; font-weight: 700; letter-spacing: .15em; }
.focus-copy h3 { margin: 8px 0 9px; font-size: 21px; font-weight: 600; line-height: 1.28; letter-spacing: -.02em; }
.focus-copy p { margin: 0; color: #949baa; font-size: 10px; line-height: 1.65; }
.focus-card > footer { position: absolute; z-index: 2; right: 20px; bottom: 18px; left: 20px; padding-top: 13px; display: flex; align-items: center; color: #858c9b; border-top: 1px solid rgba(255,255,255,.09); font-size: 8px; }
.focus-card > footer i { height: 1px; margin: 0 8px; flex: 1; background: rgba(255,255,255,.12); }
.error-banner { padding: 15px 17px; display: flex; align-items: center; gap: 12px; color: var(--danger); background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: var(--radius-sm); }
.error-banner > span { width: 29px; height: 29px; flex: 0 0 auto; display: grid; place-items: center; color: white; background: var(--danger); border-radius: 50%; font-weight: 800; }
.error-banner strong { font-size: 13px; }.error-banner p { margin: 3px 0 0; font-size: 11px; }.error-banner button { margin-left: auto; color: currentColor; background: none; border: 0; font-size: 20px; }
.prompt-module { padding: 17px 18px; display: grid; grid-template-columns: 165px minmax(0, 1fr); align-items: center; gap: 17px; background: var(--paper); }
.prompt-module > header > span { color: var(--coral-700); font-size: 9px; font-weight: 750; letter-spacing: .13em; }
.prompt-module > header p { margin: 7px 0 0; color: var(--ink-500); font-size: 10px; line-height: 1.5; }
.example-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.example-grid button { min-width: 0; min-height: 66px; padding: 10px 11px; display: grid; grid-template-columns: 22px 1fr auto; align-items: center; gap: 8px; color: var(--ink); text-align: left; background: var(--canvas-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); transition: transform .2s, background .2s, border-color .2s; }
.example-grid button:hover { z-index: 1; background: linear-gradient(135deg, var(--coral-100), var(--rose-100)); border-color: var(--rose-300); transform: translateY(-3px) rotate(-.35deg); }
.example-index { color: var(--ink-400); font-family: var(--display); font-size: 11px; }
.example-copy { min-width: 0; }
.example-copy small, .example-copy strong { display: block; }
.example-copy small { color: var(--coral-700); font-size: 9px; font-weight: 750; }
.example-copy strong { margin-top: 4px; overflow: hidden; font-size: 10px; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.example-grid i { color: var(--ink-400); font-style: normal; }
.flow-strip { min-height: 76px; padding: 13px 20px; display: grid; grid-template-columns: 112px minmax(0, 1fr) 125px; align-items: center; gap: 18px; color: var(--paper); background: radial-gradient(circle at 76% 0%, rgba(195,125,151,.2), transparent 28%), linear-gradient(135deg, #293042, #1d2028); border-color: rgba(255,255,255,.03); }
.flow-title { color: rgba(255,255,255,.54); font-size: 9px; font-weight: 750; letter-spacing: .14em; }
.flow-strip ol { position: relative; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); list-style: none; }
.flow-strip ol::before { content: ''; position: absolute; top: 16px; right: 13%; left: 13%; height: 1px; background: rgba(255,255,255,.2); }
.flow-strip li { z-index: 1; display: flex; align-items: center; justify-content: center; gap: 9px; }
.flow-strip li > i { width: 31px; height: 31px; display: grid; place-items: center; color: rgba(255,255,255,.65); background: var(--moss-900); border: 1px solid rgba(255,255,255,.25); border-radius: 50%; font-family: var(--display); font-size: 11px; font-style: normal; }
.flow-strip li.active > i { color: var(--ink); background: var(--coral-400); border-color: var(--coral-400); }
.flow-strip li strong, .flow-strip li small { display: block; }
.flow-strip li strong { font-size: 10px; }.flow-strip li small { margin-top: 3px; color: rgba(255,255,255,.45); font-size: 8px; }
.flow-strip > p { margin: 0; color: rgba(255,255,255,.58); text-align: right; font-family: var(--display); font-size: 10px; line-height: 1.4; }.flow-strip > p em { color: var(--coral-300); }
@media (min-width: 1700px) { .composer-layout { grid-template-columns: minmax(0, 2fr) minmax(340px, .7fr); } }
@media (max-width: 1280px) { .heading-note { display: none; }.composer-layout { grid-template-columns: minmax(0, 1.6fr) minmax(245px, .65fr); } }
@media (max-width: 940px) { .composer-layout { grid-template-columns: 1fr; }.focus-card { min-height: 380px; }.prompt-module { grid-template-columns: 1fr; }.example-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .editorial-heading { min-height: auto; grid-template-columns: 1fr; gap: 15px; }.writing-card { min-height: auto; padding: 18px; }.writing-area textarea { min-height: 190px; resize: vertical; font-size: 16px; }.writing-hints { padding-bottom: 2px; overflow-x: auto; }.writing-hints > span, .writing-hints button { flex: 0 0 auto; }.writing-card > footer { align-items: stretch; flex-direction: column; }.analyze-button { width: 100%; }.flow-strip { grid-template-columns: 1fr; }.flow-title, .flow-strip > p { display: none; } }
@media (max-width: 470px) { .editorial-heading h1 { font-size: 32px; }.writing-card > header { align-items: flex-start; flex-direction: column-reverse; }.focus-card { min-height: 365px; }.flow-strip li { gap: 5px; }.flow-strip li small { display: none; } }
</style>
