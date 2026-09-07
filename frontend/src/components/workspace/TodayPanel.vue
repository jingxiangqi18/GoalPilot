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
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})
defineEmits(['open-goal', 'open-library'])
const dayNumber = computed(() => String(props.date.getDate()).padStart(2, '0'))
const monthLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(props.date))
const weekdayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(props.date))
const week = computed(() => {
  const monday = new Date(props.date)
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7)
  return ['一', '二', '三', '四', '五', '六', '日'].map((label, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return { label, day: date.getDate(), current: date.toDateString() === props.date.toDateString() }
  })
})
const phase = computed(() => {
  if (props.planStatus === 'ACTIVE') return '正式计划已启用，可以开始行动'
  if (props.planStatus === 'DRAFT') return '路线已生成，确认后就能出发'
  if (props.planStatus === 'REJECTED') return '这版草稿未采用，目标仍在，可以重新规划'
  if (props.readiness === 'READY') return '信息已充足，可以开始规划'
  if (props.readiness) return '补全关键信息，让路线更准确'
  return '写下你的方向，让想法有处安放'
})
const statusLabels = { DRAFT: '待分析', NEEDS_CLARIFICATION: '待补充', READY_TO_PLAN: '待规划', ACTIVE: '进行中', COMPLETED: '已完成', ARCHIVED: '已归档' }
</script>

<template>
  <aside class="today-panel" aria-label="今日与目标速览">
    <section class="date-card" aria-label="本周日历">
      <div class="today-artwork">
        <img :src="gradientArtwork" alt="" decoding="async" />
        <header><span><i></i>TODAY'S FOCUS</span><b>✦</b></header>
        <div class="date-lockup"><strong>{{ dayNumber }}</strong><span><b>{{ weekdayLabel }}</b><small>{{ monthLabel }}</small></span></div>
        <p>给重要的事，一点专注的时间。</p>
      </div>
      <ol class="week-strip">
        <li v-for="day in week" :key="day.label" :class="{ current: day.current }" :aria-current="day.current ? 'date' : undefined">
          <span>{{ day.label }}</span><strong>{{ day.day }}</strong><i></i>
        </li>
      </ol>
    </section>
    <section class="session-card" :class="{ 'is-active': planStatus === 'ACTIVE' }">
      <header><span>正在规划</span><small>{{ currentGoalId ? '目标已保存' : '新会话' }}</small></header>
      <p>{{ phase }}</p>
      <ol class="session-steps" aria-label="当前浏览阶段">
        <li v-for="(label, index) in ['定义', '澄清', '规划']" :key="label" :class="{ current: activeStep === index + 1 }"><i></i>{{ label }}</li>
      </ol>
    </section>
    <section class="recent-card" :aria-busy="loading">
      <header><h2>目标速览 <span>{{ goalTotal }}</span></h2><button type="button" @click="$emit('open-library')">全部 ↗</button></header>
      <div v-if="loading" class="recent-placeholder" role="status">正在载入目标…</div>
      <div v-else-if="errorMessage" class="recent-placeholder">暂时无法加载目标<button type="button" @click="$emit('open-library')">前往目标库重试 →</button></div>
      <ul v-else-if="items.length">
        <li v-for="(goal, index) in items.slice(0, 3)" :key="goal.id">
          <button type="button" @click="$emit('open-goal', goal.id)">
            <span class="goal-symbol" :class="'symbol-' + index">{{ ['↗', '✧', '◷'][index] }}</span>
            <span class="recent-copy"><strong>{{ goal.goalText }}</strong><small>{{ statusLabels[goal.status] || goal.status || '已保存' }}</small></span>
            <span class="recent-arrow">→</span>
          </button>
        </li>
      </ul>
      <div v-else class="recent-placeholder"><span class="empty-spark" aria-hidden="true">✧</span><strong>给第一个目标留个位置</strong><p>提交左侧的想法，它就会出现在这里。</p></div>
    </section>
    <p class="daily-note"><span>✦</span> 方向比速度重要，持续比完美可靠。</p>
  </aside>
</template>

<style scoped>
.today-panel { display: grid; gap: 14px; align-self: start; min-width: 0; }
.date-card, .session-card, .recent-card { overflow: hidden; background: rgba(255,255,255,.92); border: 0; border-radius: 21px; box-shadow: var(--surface-shadow); }
.today-artwork { position: relative; padding: 19px; overflow: hidden; color: #fff; background: #252936; }
.today-artwork > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 42% center; filter: brightness(.68) saturate(.7); transition: transform 1s var(--ease-out); }
.date-card:hover img { transform: scale(1.04); }
.today-artwork header, .date-lockup, .today-artwork p { position: relative; }
.today-artwork header { display: flex; align-items: center; justify-content: space-between; color: #e0dae5; font-size: 9px; font-weight: 600; letter-spacing: .13em; }
.today-artwork header span { display: flex; align-items: center; gap: 8px; }
.today-artwork header i { width: 5px; height: 5px; background: #f0b9a7; border-radius: 50%; box-shadow: 0 0 0 4px #f0b9a724; }
.date-lockup { margin-top: 24px; display: flex; align-items: center; gap: 18px; }
.date-lockup > strong { font-size: 60px; font-weight: 600; line-height: 1; letter-spacing: -.06em; }
.date-lockup > span { padding-left: 16px; border-left: 1px solid #ffffff45; }
.date-lockup b, .date-lockup small { display: block; }
.date-lockup b { font-size: 19px; font-weight: 500; }.date-lockup small { margin-top: 6px; color: #e0dae5; font-size: 11px; }
.today-artwork > p { margin: 19px 0 0; color: #eee8f0; font-size: 12px; }
.week-strip { margin: 0; padding: 13px 10px 10px; display: grid; grid-template-columns: repeat(7, 1fr); list-style: none; }
.week-strip li { display: grid; justify-items: center; gap: 7px; color: var(--ink-600); font-size: 11px; }
.week-strip strong { width: 29px; height: 29px; display: grid; place-items: center; border-radius: 10px; font-size: 12px; font-weight: 500; }
.week-strip i { width: 3px; height: 3px; border-radius: 50%; }.week-strip .current { color: var(--coral-700); }.week-strip .current strong { color: white; background: linear-gradient(145deg, var(--coral-500), var(--coral-700)); box-shadow: 0 4px 9px #6871aa24; }.week-strip .current i { background: var(--rose-500); }
.session-card { padding: 17px 18px; }.session-card.is-active { background: linear-gradient(130deg, #fff, #eef4f6); }
.session-card header, .recent-card header { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.session-card header > span { font-size: 12px; font-weight: 600; }.session-card small { color: var(--ink-500); font-size: 10px; }
.session-card p { margin: 11px 0 15px; color: var(--ink-600); font-size: 12px; line-height: 1.7; }
.session-steps { margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; list-style: none; }
.session-steps li { display: grid; gap: 7px; color: var(--ink-500); font-size: 10px; }.session-steps i { height: 3px; background: var(--line); border-radius: 3px; transition: background .3s; }.session-steps .current { color: var(--coral-700); }.session-steps .current i { background: linear-gradient(90deg, var(--coral-500), var(--rose-500)); }
.recent-card { padding: 17px 16px 8px; }.recent-card h2 { margin: 0; font-size: 13px; font-weight: 600; }.recent-card h2 > span { padding: 3px 6px; margin-left: 4px; color: var(--coral-700); background: var(--coral-100); border-radius: 5px; font-size: 10px; }
.recent-card header button { padding: 5px; border: 0; background: transparent; color: var(--ink-600); font-size: 11px; }.recent-card button:hover { color: var(--coral-700); }
.recent-card ul { padding: 0; margin: 12px 0 0; list-style: none; }.recent-card li + li { margin-top: 3px; }
.recent-card li > button { width: 100%; padding: 13px 2px; display: grid; grid-template-columns: 34px minmax(0,1fr) 12px; align-items: center; gap: 10px; border: 0; border-radius: 8px; background: transparent; text-align: left; transition: background .2s; }.recent-card li > button:hover { background: var(--canvas-soft); }
.goal-symbol { height: 34px; display: grid; place-items: center; background: var(--coral-100); border-radius: 10px; color: var(--coral-700); font-size: 19px; }.symbol-1 { color: #9c697e; background: var(--rose-100); }.symbol-2 { color: var(--moss-700); background: var(--moss-100); }
.recent-copy { min-width: 0; }.recent-copy strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; line-height: 1.6; font-weight: 500; }.recent-copy small { display: block; margin-top: 5px; font-size: 10px; color: var(--ink-500); }.recent-arrow { color: var(--ink-400); transition: transform .25s; }.recent-card li > button:hover .recent-arrow { transform: translateX(3px); }
.recent-placeholder { padding: 23px 8px; color: var(--ink-500); font-size: 12px; text-align: center; }.recent-placeholder strong { display: block; font-weight: 500; color: var(--ink-600); }.recent-placeholder p { font-size: 11px; line-height: 1.7; }.recent-placeholder button { display: block; margin: 12px auto 0; padding: 5px; background: none; border: 0; color: var(--coral-700); font-size: 11px; }.empty-spark { display: block; margin-bottom: 10px; font-size: 28px; color: var(--coral-500); }
.daily-note { margin: 0; padding: 3px 7px; color: var(--ink-500); font-size: 11px; line-height: 1.6; }.daily-note > span { color: var(--rose-500); margin-right: 5px; }
</style>
