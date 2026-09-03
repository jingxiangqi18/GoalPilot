<script setup>
import { computed } from 'vue'
import gradientArtwork from '../../assets/goalpilot-gradient-v2.jpg'

const props = defineProps({
  date: { type: Date, required: true },
  activeStep: { type: Number, required: true },
  goalTotal: { type: Number, default: 0 },
  currentGoalId: { type: Number, default: null },
  readiness: { type: String, default: '' },
  planStatus: { type: String, default: '' },
})

const dayNumber = computed(() => String(props.date.getDate()).padStart(2, '0'))
const monthLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { month: 'long' }).format(props.date))
const weekdayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(props.date))
const yearLabel = computed(() => props.date.getFullYear())
const progress = computed(() => Math.round((props.activeStep / 3) * 100))
const phase = computed(() => {
  if (props.planStatus === 'ACTIVE') return '正式计划已启用，开始行动'
  if (props.planStatus === 'DRAFT') return '计划草稿待确认'
  if (props.readiness === 'READY') return '信息已充足，可以开始规划'
  if (props.activeStep === 2) return '正在补全目标的关键边界'
  if (props.activeStep === 3) return '路线已经清晰，准备行动'
  return '从一句真实的目标描述开始'
})
</script>

<template>
  <aside class="today-panel">
    <div class="today-artwork">
      <img :src="gradientArtwork" alt="柔和的淡紫、杏色与雾蓝渐变丝带" />
      <div class="artwork-shade"></div>
      <header><span><i></i>TODAY</span><b>{{ yearLabel }}</b></header>
      <div class="date-lockup">
        <strong>{{ dayNumber }}</strong>
        <span><b>{{ weekdayLabel }}</b><small>{{ monthLabel }}</small></span>
      </div>
      <p>把今天的注意力，<br />留给真正重要的方向。</p>
    </div>

    <section class="session-card" :class="{ 'is-active': planStatus === 'ACTIVE' }">
      <header><span>CURRENT SESSION</span><b>{{ activeStep }} / 3</b></header>
      <div class="session-progress">
        <div class="progress-ring" :style="{ '--progress': `${progress * 3.6}deg` }">
          <span><strong>{{ progress }}</strong><small>%</small></span>
        </div>
        <div><strong>{{ phase }}</strong><p>{{ currentGoalId ? `目标记录 #${currentGoalId}` : '尚未创建目标记录' }}</p></div>
      </div>
      <ol>
        <li :class="{ active: activeStep >= 1 }"><i></i><span>理解</span></li>
        <li :class="{ active: activeStep >= 2 }"><i></i><span>澄清</span></li>
        <li :class="{ active: activeStep >= 3 }"><i></i><span>规划</span></li>
      </ol>
    </section>

    <section class="today-metrics">
      <article><span>目标档案</span><strong>{{ goalTotal }}</strong><small>GOALS</small></article>
      <article><span>今日节奏</span><strong>01</strong><small>FOCUS</small></article>
    </section>

    <blockquote>
      <span>DAILY NOTE</span>
      <p>不必一次完成所有事，先让下一步足够清楚。</p>
    </blockquote>
  </aside>
</template>

<style scoped>
@property --progress {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.today-panel { position: sticky; top: 86px; display: grid; gap: 13px; align-self: start; }
.today-artwork { position: relative; height: 310px; padding: 20px; overflow: hidden; color: #fff; background: #252936; border: 1px solid rgba(255,255,255,.12); border-radius: 24px; box-shadow: 0 22px 50px rgba(35,37,49,.16); }
.today-artwork > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 42% center; filter: saturate(.82) contrast(.94); transform: scale(1.02); transition: transform 1.2s cubic-bezier(.2,.75,.25,1); }
.today-artwork:hover > img { transform: scale(1.065); }
.artwork-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(22,24,33,.24), rgba(25,27,37,.06) 46%, rgba(24,26,35,.76)); }
.today-artwork header { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; color: rgba(255,255,255,.74); font-size: 8px; font-weight: 700; letter-spacing: .16em; }
.today-artwork header span { display: flex; align-items: center; gap: 7px; }
.today-artwork header i { width: 6px; height: 6px; background: #f0b9a7; border-radius: 50%; box-shadow: 0 0 0 4px rgba(240,185,167,.16); }
.today-artwork header b { font-size: 9px; }
.date-lockup { position: relative; z-index: 1; margin-top: 27px; display: flex; align-items: center; gap: 15px; }
.date-lockup > strong { font-size: 82px; font-weight: 650; line-height: .85; letter-spacing: -.08em; text-shadow: 0 8px 28px rgba(32,28,39,.18); }
.date-lockup > span { padding-left: 15px; border-left: 1px solid rgba(255,255,255,.3); }
.date-lockup b, .date-lockup small { display: block; }
.date-lockup b { font-size: 18px; }.date-lockup small { margin-top: 5px; color: rgba(255,255,255,.7); font-size: 10px; }
.today-artwork > p { position: absolute; z-index: 1; right: 20px; bottom: 20px; left: 20px; margin: 0; font-size: 19px; font-weight: 600; line-height: 1.35; letter-spacing: -.02em; }
.session-card { padding: 18px; background: rgba(255,255,255,.92); border: 1px solid var(--line-strong); border-radius: 18px; box-shadow: var(--shadow-sm); backdrop-filter: blur(12px); }
.session-card.is-active { border-color: var(--moss-300); box-shadow: 0 10px 28px rgba(77,99,120,.12); animation: session-ready .6s cubic-bezier(.2,.75,.25,1) both; }
@keyframes session-ready { from { opacity: .75; transform: translateY(6px); } }
.session-card > header { display: flex; align-items: center; justify-content: space-between; color: var(--ink-400); font-size: 8px; font-weight: 700; letter-spacing: .14em; }
.session-card > header b { color: var(--coral-700); font-size: 9px; }
.session-progress { margin-top: 17px; display: grid; grid-template-columns: 63px 1fr; align-items: center; gap: 13px; }
.progress-ring { width: 61px; height: 61px; padding: 6px; display: grid; place-items: center; background: conic-gradient(var(--coral-500) var(--progress), var(--coral-100) 0); border-radius: 50%; transition: --progress .7s cubic-bezier(.2,.75,.25,1); }
.progress-ring > span { width: 49px; height: 49px; display: grid; grid-auto-flow: column; place-content: center; align-items: baseline; color: var(--ink); background: #fff; border-radius: 50%; }
.progress-ring strong { font-size: 17px; }.progress-ring small { color: var(--ink-400); font-size: 8px; }
.session-progress > div:last-child > strong { display: block; color: var(--ink); font-size: 11px; line-height: 1.5; }
.session-progress p { margin: 5px 0 0; color: var(--ink-400); font-size: 8px; }
.session-card ol { position: relative; margin: 17px 0 0; padding: 14px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); list-style: none; }
.session-card li { display: flex; align-items: center; justify-content: center; gap: 5px; color: var(--ink-400); font-size: 8px; }
.session-card li i { width: 6px; height: 6px; background: var(--line-strong); border-radius: 50%; }
.session-card li.active { color: var(--ink-700); font-weight: 700; }.session-card li.active i { background: var(--coral-500); box-shadow: 0 0 0 3px var(--coral-100); }
.today-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.today-metrics article { min-height: 96px; padding: 15px; background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(244,241,248,.9)); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-sm); }
.today-metrics span, .today-metrics small { display: block; color: var(--ink-400); font-size: 8px; font-weight: 700; letter-spacing: .08em; }
.today-metrics strong { margin: 10px 0 4px; display: block; color: var(--ink); font-size: 25px; line-height: 1; }
.today-metrics small { color: var(--coral-600); font-size: 7px; }
.today-panel blockquote { margin: 0; padding: 17px; color: #e8e9ef; background: linear-gradient(145deg, #303444, #242732); border: 1px solid rgba(255,255,255,.07); border-radius: 17px; box-shadow: var(--shadow-sm); }
.today-panel blockquote span { color: #a8aed3; font-size: 7px; font-weight: 700; letter-spacing: .16em; }
.today-panel blockquote p { margin: 10px 0 0; font-size: 11px; line-height: 1.65; }
</style>
