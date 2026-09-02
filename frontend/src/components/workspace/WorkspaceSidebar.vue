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
.sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 248px; padding: 24px 16px 18px; display: flex; flex-direction: column; color: #f4f5f8; background: linear-gradient(165deg, #222631 0%, var(--sidebar) 46%, #191b22 100%); border-right: 1px solid rgba(255,255,255,.06); box-shadow: 14px 0 40px rgba(20,22,30,.1); }
.sidebar::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .2; background-image: radial-gradient(rgba(255,255,255,.16) .55px, transparent .55px); background-size: 7px 7px; mask-image: linear-gradient(to bottom, black, transparent 46%); }
.brand { position: relative; width: 100%; padding: 0 5px; display: flex; align-items: center; gap: 11px; color: #fff; text-align: left; background: transparent; border: 0; }
.brand-mark { position: relative; width: 39px; height: 39px; flex: 0 0 auto; display: grid; place-items: center; background: linear-gradient(145deg, #9aa2d6 4%, #7376af 55%, #bb829a 125%); border: 1px solid rgba(255,255,255,.24); border-radius: 13px; box-shadow: inset 0 1px 0 rgba(255,255,255,.24), 0 8px 18px rgba(8,10,17,.24); }
.brand-mark::before, .brand-mark::after, .brand-mark i { content: ''; position: absolute; height: 2px; background: var(--paper); border-radius: 2px; transform-origin: left; }
.brand-mark::before { width: 17px; transform: translate(-7px, 4px) rotate(-30deg); }
.brand-mark::after { width: 12px; transform: translate(4px, -2px) rotate(-58deg); }
.brand-mark i { width: 8px; transform: translate(-10px, 8px) rotate(24deg); }
.brand > span:last-child strong, .brand > span:last-child small { display: block; }
.brand strong { font-family: var(--display); font-size: 19px; font-weight: 700; line-height: 1; letter-spacing: -.025em; }
.brand small { margin-top: 5px; color: #858b99; font-family: var(--display); font-size: 8px; font-style: normal; letter-spacing: .08em; }
.main-nav { position: relative; margin-top: 48px; }
.nav-label { display: block; margin: 0 10px 11px; color: #747b89; font-size: 8px; font-weight: 700; letter-spacing: .18em; }
.main-nav button { position: relative; width: 100%; min-height: 43px; margin-bottom: 4px; padding: 0 11px; display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 10px; color: #aeb3bf; text-align: left; background: transparent; border: 1px solid transparent; border-radius: 10px; font-size: 11px; font-weight: 600; }
.main-nav button:hover { color: #fff; background: rgba(255,255,255,.055); }
.main-nav button.active { color: #fff; background: rgba(255,255,255,.095); border-color: rgba(255,255,255,.08); box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 8px 18px rgba(4,6,12,.12); }
.main-nav button.active i { width: 6px; height: 6px; background: #a8afe0; border-radius: 50%; box-shadow: 0 0 0 4px rgba(168,175,224,.12); }
.main-nav svg { width: 18px; }
.main-nav b { min-width: 23px; padding: 3px 6px; color: #dfe2e9; text-align: center; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.07); border-radius: 999px; font-size: 8px; }
.journey { position: relative; margin-top: 35px; transition: opacity .2s; }
.journey.muted { opacity: .42; }
.journey .nav-label { margin-left: 10px; }
.journey ol { position: relative; margin: 0; padding: 0; list-style: none; }
.journey ol::before { content: ''; position: absolute; top: 22px; bottom: 21px; left: 26px; width: 1px; background: rgba(255,255,255,.1); }
.journey li { position: relative; padding: 9px 10px; display: grid; grid-template-columns: 34px 1fr; align-items: center; gap: 11px; color: #686f7c; }
.step-marker { z-index: 1; width: 33px; height: 33px; display: grid; place-items: center; background: #1d2028; border: 1px solid rgba(255,255,255,.13); border-radius: 10px; font-family: var(--display); font-size: 9px; }
.step-marker svg { width: 14px; }
.journey li.active { color: #f5f6f9; }
.journey li.active .step-marker { color: #fff; background: #6871aa; border-color: #8189bb; box-shadow: 0 0 0 4px rgba(129,137,187,.12); }
.journey li.done { color: #b9bec8; }
.journey li.done .step-marker { color: #fff; background: #4d6378; border-color: #647b91; }
.journey strong, .journey small { display: block; }
.journey strong { font-size: 12px; }
.journey small { margin-top: 4px; color: currentColor; font-size: 9px; }
.sidebar-overview { position: relative; margin-top: 22px; padding: 13px 14px; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.075); border-radius: 12px; }
.sidebar-overview header, .sidebar-overview footer { display: flex; align-items: center; justify-content: space-between; }
.sidebar-overview header span { color: #747b89; font-size: 8px; font-weight: 700; letter-spacing: .15em; }
.sidebar-overview header strong { color: #c9cdd6; font-family: var(--display); font-size: 11px; }
.progress-track { height: 3px; margin: 13px 0 10px; overflow: hidden; background: rgba(255,255,255,.09); border-radius: 999px; }
.progress-track i { height: 100%; display: block; background: linear-gradient(90deg, #6871aa, #a0a7cf); border-radius: inherit; transition: width .35s ease; }
.sidebar-overview footer { color: #7f8693; font-size: 8px; }
.sidebar-overview footer b { color: #cdd1e7; font-size: 9px; }
blockquote { position: relative; margin: auto 0 0; padding: 17px; color: #e3e5eb; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.075); border-radius: 14px 14px 14px 4px; box-shadow: 0 12px 25px rgba(5,7,12,.12); }
blockquote > span { position: absolute; top: -8px; left: 15px; color: #929ad0; font-family: var(--display); font-size: 34px; }
blockquote p { margin: 8px 0 12px; font-family: var(--display); font-size: 15px; font-weight: 600; line-height: 1.4; }
blockquote footer { color: #737a87; font-size: 8px; font-weight: 700; letter-spacing: .12em; }
.user-card { position: relative; margin-top: 16px; padding-top: 15px; display: flex; align-items: center; gap: 9px; border-top: 1px solid rgba(255,255,255,.08); }
.avatar { width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, #7c85bc, #50598d); border-radius: 10px; font-family: var(--display); font-size: 14px; }
.user-copy { min-width: 0; }
.user-copy strong, .user-copy small { max-width: 137px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-copy strong { font-size: 11px; }
.user-copy small { margin-top: 3px; color: #777e8b; font-size: 8px; }
.user-card button { width: 32px; height: 32px; margin-left: auto; padding: 7px; color: #858b97; background: transparent; border: 0; border-radius: 9px; }
.user-card button:hover { color: #fff; background: rgba(255,255,255,.08); }
@media (max-height: 770px) { .main-nav { margin-top: 35px; } .journey { margin-top: 24px; } .sidebar-overview { display: none; } blockquote { display: none; } }
@media (max-width: 1050px) { .sidebar { display: none; } }
</style>
