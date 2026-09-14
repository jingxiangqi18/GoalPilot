<script setup>
import GoalStatusBadge from './GoalStatusBadge.vue'
import DateStamp from './DateStamp.vue'
defineProps({ items: { type: Array, required: true }, loading: Boolean, error: { type: String, default: '' }, busy: Boolean })
defineEmits(['open', 'plan', 'library', 'retry'])
const title = goal => String(goal.goalText || '').split('\n').find(line => line.trim()) || '未命名目标'
const hints = { DRAFT: '从这个想法，继续聊起', NEEDS_CLARIFICATION: '补充条件，让方向更清晰', READY_TO_PLAN: '信息已就绪，可以规划路线', ACTIVE: '回到对话，推进下一步', COMPLETED: '回顾这段已完成的旅程' }
</script>

<template>
  <section class="recent-start" aria-labelledby="recent-goals-heading">
    <header><div><span>KEEP GOING</span><h2 id="recent-goals-heading">从已有目标继续</h2></div><button type="button" :disabled="busy" @click="$emit('library')">查看目标库 <span aria-hidden="true">↗</span></button></header>
    <p v-if="error" class="recent-notice" role="alert">{{ error }} <button type="button" :disabled="loading" @click="$emit('retry')">重新读取</button></p>
    <p v-else-if="loading && !items.length" class="recent-notice" role="status">正在取回你的目标…</p>
    <div v-else-if="items.length" class="recent-grid">
      <article v-for="goal in items.slice(0, 3)" :key="goal.id" class="recent-goal">
        <div class="recent-meta"><GoalStatusBadge :status="goal.status" /><DateStamp :value="goal.updatedAt || goal.createdAt" :label="goal.updatedAt ? '更新于' : '记录于'" compact :show-time="false" /></div>
        <button class="recent-open" type="button" :disabled="busy" @click="$emit('open', goal.id)"><h3>{{ title(goal) }}</h3><span>{{ hints[goal.status] || '打开目标，查看当前进展' }} <i aria-hidden="true">↗</i></span></button>
        <button v-if="goal.status === 'ACTIVE' || goal.status === 'COMPLETED'" class="recent-plan" type="button" :disabled="busy" @click="$emit('plan', goal)"><svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m2 5 1.5 1.5L6 4m2 1h8M2 10h3m3 0h8M2 15h3m3 0h8"/></svg>查看任务清单</button>
      </article>
    </div>
    <div v-else class="recent-empty"><span aria-hidden="true">✧</span><div><h3>你的下一段旅程，从这里开始。</h3><p>写下第一个目标，之后可以随时回来继续对话。</p></div></div>
  </section>
</template>

<style scoped>
.recent-start { margin-top: 34px; font-family: var(--text-cn); }.recent-start > header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 15px; }.recent-start header > div > span { color: var(--ink-500); font-family: var(--display); font-size: 9px; letter-spacing: .13em; }.recent-start h2 { margin: 5px 0 0; color: var(--ink-700); font-size: 16px; font-weight: 500; }.recent-start header button, .recent-notice button { border: 0; background: transparent; color: var(--ink-500); font-size: 11px; padding: 8px 0; }.recent-start header button span { margin-left: 8px; }
.recent-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; }.recent-goal { position: relative; min-width: 0; padding: 18px 20px 15px; border-radius: var(--radius-sm); background: linear-gradient(115deg, color-mix(in srgb, var(--paper) 96%, transparent), color-mix(in srgb, var(--paper) 94%, transparent)); box-shadow: 0 1px 0 var(--line), 0 5px 18px color-mix(in srgb, var(--shadow-color) 2%, transparent); transition: box-shadow .2s, transform .25s var(--ease-out); }.recent-goal:nth-child(2) { background: linear-gradient(115deg, #fffefd, #f4f7f3); }.recent-goal:nth-child(3) { background: linear-gradient(115deg, #fffefd, #f9f1f4); }.recent-goal:hover { transform: translateY(-3px); box-shadow: 0 6px 22px color-mix(in srgb, var(--shadow-color) 5%, transparent); }.recent-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; justify-content: space-between; }.recent-meta :deep(.date-inline-label), .recent-meta :deep(.date-inline-day small), .recent-meta :deep(.date-inline-icon) { display: none; }.recent-meta :deep(.date-inline-day strong) { color: var(--ink-500); font-size: 10px; }.recent-meta :deep(.status-badge) { font-size: 10px; padding: 4px 8px; }
.recent-open { width: 100%; padding: 0; border: 0; background: transparent; text-align: left; }.recent-open h3 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 15px 0 12px; min-height: 48px; color: var(--ink-700); font-size: 14px; font-weight: 500; line-height: 1.75; overflow-wrap: anywhere; }.recent-open > span { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--ink-500); font-size: 11px; line-height: 1.8; }.recent-open i { font-style: normal; font-size: 18px; color: var(--ink-500); }
.recent-plan { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: var(--radius-sm); margin-top: 13px; padding: 5px 8px; color: #456e59; background: #eaf2e5; font-size: 10px; }.recent-plan svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.recent-empty { display: flex; align-items: center; gap: 17px; padding: 21px; border-radius: var(--radius-sm); background: linear-gradient(110deg, color-mix(in srgb, var(--canvas-soft) 31%, transparent), #eaf2eb60); }.recent-empty > span { font-size: 30px; color: var(--ink-500); }.recent-empty h3 { margin: 0 0 6px; font-size: 13px; font-weight: 500; color: var(--ink-500); }.recent-empty p, .recent-notice { margin: 0; font-size: 11px; color: var(--ink-500); line-height: 1.8; }
.recent-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr)); }
@media(max-width: 620px) { .recent-grid { grid-template-columns: minmax(0, 1fr); gap: 10px; }.recent-goal { padding: 15px 17px; }.recent-open h3 { min-height: 0; margin: 12px 0 8px; }.recent-start { margin-top: 25px; }.recent-start h2 { font-size: 14px; } }
</style>
