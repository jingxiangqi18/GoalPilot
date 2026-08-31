<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  activeStep: { type: Number, required: true },
  activeView: { type: String, required: true },
  goalTotal: { type: Number, default: 0 },
})

const emit = defineEmits(['logout', 'navigate'])
const userInitial = computed(() => props.user.username?.charAt(0).toUpperCase() || 'G')
const steps = [
  { number: 1, label: '写下目标', hint: '从自然描述开始' },
  { number: 2, label: '补充信息', hint: '校准边界与条件' },
  { number: 3, label: '形成路线', hint: '得到阶段化计划' },
]
</script>

<template>
  <aside class="sidebar">
    <button class="brand" type="button" @click="emit('navigate', 'create')">
      <span class="brand-mark"><i></i></span>
      <span><strong>GoalPilot</strong><small>thoughts into motion</small></span>
    </button>

    <nav class="main-nav" aria-label="工作区导航">
      <span class="nav-label">WORKSPACE</span>
      <button type="button" :class="{ active: activeView === 'create' }" @click="emit('navigate', 'create')">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span>规划工作台</span><i></i>
      </button>
      <button type="button" :class="{ active: activeView === 'library' }" @click="emit('navigate', 'library')">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V5.5ZM20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span>我的目标</span><b>{{ goalTotal }}</b>
      </button>
    </nav>

    <section class="journey" :class="{ muted: activeView !== 'create' }">
      <span class="nav-label">CURRENT JOURNEY</span>
      <ol>
        <li v-for="step in steps" :key="step.number" :class="{ active: activeStep === step.number, done: activeStep > step.number }">
          <span class="step-marker">
            <svg v-if="activeStep > step.number" viewBox="0 0 16 16" fill="none"><path d="m3.5 8 2.8 2.8 6.2-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <template v-else>{{ String(step.number).padStart(2, '0') }}</template>
          </span>
          <span><strong>{{ step.label }}</strong><small>{{ step.hint }}</small></span>
        </li>
      </ol>
    </section>

    <section class="sidebar-overview" aria-label="目标概览">
      <header><span>OVERVIEW</span><strong>{{ goalTotal }} goals</strong></header>
      <div class="progress-track"><i :style="{ width: `${(activeStep / 3) * 100}%` }"></i></div>
      <footer><span>当前旅程</span><b>{{ activeStep }} / 3</b></footer>
    </section>

    <blockquote>
      <span>“</span>
      <p>方向比速度重要，持续比完美可靠。</p>
      <footer>— TODAY'S NOTE</footer>
    </blockquote>

    <div class="user-card">
      <span class="avatar">{{ userInitial }}</span>
      <span class="user-copy"><strong>{{ user.username }}</strong><small>{{ user.email }}</small></span>
      <button type="button" title="退出登录" aria-label="退出登录" @click="emit('logout')">
        <svg viewBox="0 0 20 20" fill="none"><path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M13 6l4 4-4 4M8 10h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 258px; padding: 27px 20px 20px; display: flex; flex-direction: column; color: var(--ink); background: var(--sidebar); border-right: 1px solid var(--line-strong); box-shadow: 10px 0 30px rgba(45, 47, 43, .045); }
.sidebar::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18; background-image: radial-gradient(rgba(71,75,69,.22) .55px, transparent .55px); background-size: 5px 5px; mask-image: linear-gradient(to bottom, black, transparent 62%); }
.brand { position: relative; width: 100%; padding: 0; display: flex; align-items: center; gap: 12px; color: var(--ink); text-align: left; background: transparent; border: 0; }
.brand-mark { position: relative; width: 41px; height: 41px; flex: 0 0 auto; display: grid; place-items: center; background: var(--coral-600); border-radius: 50% 50% 50% 10%; transform: rotate(-8deg); }
.brand-mark::before, .brand-mark::after, .brand-mark i { content: ''; position: absolute; height: 2px; background: var(--paper); border-radius: 2px; transform-origin: left; }
.brand-mark::before { width: 17px; transform: translate(-7px, 4px) rotate(-30deg); }
.brand-mark::after { width: 12px; transform: translate(4px, -2px) rotate(-58deg); }
.brand-mark i { width: 8px; transform: translate(-10px, 8px) rotate(24deg); }
.brand > span:last-child strong, .brand > span:last-child small { display: block; }
.brand strong { font-family: var(--editorial); font-size: 26px; font-weight: 650; line-height: .9; }
.brand small { margin-top: 6px; color: var(--ink-500); font-family: var(--editorial); font-size: 10px; font-style: italic; letter-spacing: .05em; }
.main-nav { position: relative; margin-top: 58px; }
.nav-label { display: block; margin: 0 10px 12px; color: var(--ink-400); font-size: 9px; font-weight: 750; letter-spacing: .18em; }
.main-nav button { position: relative; width: 100%; min-height: 45px; margin-bottom: 5px; padding: 0 11px; display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 10px; color: var(--ink-600); text-align: left; background: transparent; border: 1px solid transparent; border-radius: 10px; font-size: 12px; font-weight: 600; }
.main-nav button:hover { color: var(--ink); background: rgba(252,251,248,.55); }
.main-nav button.active { color: var(--ink); background: var(--paper); border-color: var(--line-strong); box-shadow: 0 5px 16px rgba(45,47,43,.045); }
.main-nav button.active i { width: 5px; height: 5px; background: var(--coral-600); border-radius: 50%; box-shadow: 0 0 0 4px var(--coral-100); }
.main-nav svg { width: 18px; }
.main-nav b { min-width: 23px; padding: 3px 6px; color: var(--paper); text-align: center; background: var(--moss-800); border-radius: 999px; font-size: 9px; }
.journey { position: relative; margin-top: 41px; transition: opacity .2s; }
.journey.muted { opacity: .42; }
.journey .nav-label { margin-left: 10px; }
.journey ol { position: relative; margin: 0; padding: 0; list-style: none; }
.journey ol::before { content: ''; position: absolute; top: 22px; bottom: 21px; left: 26px; width: 1px; background: var(--line-strong); }
.journey li { position: relative; padding: 10px; display: grid; grid-template-columns: 34px 1fr; align-items: center; gap: 12px; color: var(--ink-400); }
.step-marker { z-index: 1; width: 33px; height: 33px; display: grid; place-items: center; background: var(--sidebar); border: 1px solid var(--line-strong); border-radius: 50%; font-family: var(--display); font-size: 10px; }
.step-marker svg { width: 14px; }
.journey li.active { color: var(--ink); }
.journey li.active .step-marker { color: var(--ink); background: var(--coral-300); border-color: var(--coral-400); box-shadow: 0 0 0 5px var(--coral-100); }
.journey li.done { color: var(--ink-700); }
.journey li.done .step-marker { color: var(--paper); background: var(--moss-700); border-color: var(--moss-700); }
.journey strong, .journey small { display: block; }
.journey strong { font-size: 12px; }
.journey small { margin-top: 4px; color: currentColor; font-size: 9px; }
.sidebar-overview { position: relative; margin-top: 25px; padding: 14px 15px; background: rgba(252,251,248,.42); border: 1px solid var(--line); border-radius: 12px; }
.sidebar-overview header, .sidebar-overview footer { display: flex; align-items: center; justify-content: space-between; }
.sidebar-overview header span { color: var(--ink-400); font-size: 8px; font-weight: 750; letter-spacing: .15em; }
.sidebar-overview header strong { color: var(--ink-700); font-family: var(--editorial); font-size: 13px; }
.progress-track { height: 4px; margin: 13px 0 10px; overflow: hidden; background: var(--line); border-radius: 999px; }
.progress-track i { height: 100%; display: block; background: var(--coral-500); border-radius: inherit; transition: width .35s ease; }
.sidebar-overview footer { color: var(--ink-500); font-size: 8px; }
.sidebar-overview footer b { color: var(--moss-800); font-size: 9px; }
blockquote { position: relative; margin: auto 0 0; padding: 18px; color: var(--ink); background: rgba(252,251,248,.78); border: 1px solid var(--line); border-radius: 14px 14px 14px 3px; box-shadow: 0 12px 25px rgba(45,47,43,.045); }
blockquote > span { position: absolute; top: -8px; left: 15px; color: var(--coral-500); font-family: var(--display); font-size: 37px; }
blockquote p { margin: 8px 0 12px; font-family: var(--display); font-size: 15px; font-weight: 600; line-height: 1.4; }
blockquote footer { color: var(--ink-400); font-size: 8px; font-weight: 750; letter-spacing: .12em; }
.user-card { position: relative; margin-top: 17px; padding-top: 16px; display: flex; align-items: center; gap: 9px; border-top: 1px solid var(--line-strong); }
.avatar { width: 36px; height: 36px; flex: 0 0 auto; display: grid; place-items: center; color: var(--paper); background: var(--coral-600); border-radius: 50%; font-family: var(--display); font-size: 17px; }
.user-copy { min-width: 0; }
.user-copy strong, .user-copy small { max-width: 137px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-copy strong { font-size: 11px; }
.user-copy small { margin-top: 3px; color: var(--ink-500); font-size: 8px; }
.user-card button { width: 32px; height: 32px; margin-left: auto; padding: 7px; color: var(--ink-500); background: transparent; border: 0; border-radius: 50%; }
.user-card button:hover { color: var(--ink); background: var(--paper); }
@media (max-height: 770px) { .main-nav { margin-top: 35px; } .journey { margin-top: 24px; } .sidebar-overview { display: none; } blockquote { display: none; } }
@media (max-width: 1050px) { .sidebar { display: none; } }
</style>
