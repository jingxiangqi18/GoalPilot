<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  goal: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'continue'])

const statusLabels = {
  DRAFT: '草稿', NEEDS_CLARIFICATION: '待补充', READY_TO_PLAN: '待规划',
  ACTIVE: '进行中', COMPLETED: '已完成', ARCHIVED: '已归档',
}
const priorityLabels = { LOW: '低', MEDIUM: '中', HIGH: '高' }
const statusLabel = computed(() => statusLabels[props.goal?.status] || props.goal?.status || '未知')

function formatDate(value, includeTime = false) {
  if (!value) return '暂未设置'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="drawer-layer" role="dialog" aria-modal="true" aria-label="目标详情">
    <button class="drawer-backdrop" type="button" aria-label="关闭目标详情" @click="emit('close')"></button>
    <aside class="detail-drawer">
      <header>
        <div>
          <span>GOAL DETAILS · 目标详情</span>
          <strong v-if="goal">#{{ goal.id }}</strong>
        </div>
        <button type="button" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 20 20" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
        </button>
      </header>

      <div v-if="loading" class="detail-loading">
        <i></i><i></i><i></i><p>正在取回目标信息…</p>
      </div>

      <template v-else-if="goal">
        <div class="goal-title-block">
          <span class="status-chip"><i></i>{{ statusLabel }}</span>
          <h2>{{ goal.goalText }}</h2>
          <p>创建于 {{ formatDate(goal.createdAt, true) }}</p>
        </div>

        <dl class="detail-list">
          <div><dt>优先级</dt><dd>{{ priorityLabels[goal.priority] || goal.priority || '暂未设置' }}</dd></div>
          <div><dt>截止时间</dt><dd>{{ formatDate(goal.deadline) }}</dd></div>
          <div class="wide"><dt>成功标准</dt><dd>{{ goal.successCriteria || '等待后续目标完善流程补充' }}</dd></div>
          <div class="wide"><dt>约束与条件</dt><dd>{{ goal.constraintText || '等待后续目标完善流程补充' }}</dd></div>
          <div><dt>最近更新</dt><dd>{{ formatDate(goal.updatedAt, true) }}</dd></div>
          <div><dt>记录 ID</dt><dd>#{{ goal.id }}</dd></div>
        </dl>

        <div class="backend-note">
          <span>i</span>
          <p>当前后端已支持创建、分页与详情查询；优先级、期限等字段会随后端编辑能力开放后在这里完善。</p>
        </div>

        <footer>
          <button type="button" class="ghost-button" @click="emit('close')">稍后再看</button>
          <button type="button" class="continue-button" @click="emit('continue', goal)">继续梳理目标 <span>↗</span></button>
        </footer>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.drawer-layer { position: fixed; z-index: 80; inset: 0; }
.drawer-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; background: rgba(20, 22, 19, .58); border: 0; backdrop-filter: blur(4px); animation: fade-in .25s ease both; }
.detail-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(570px, 100%); overflow-y: auto; color: var(--ink); background: var(--paper); border-left: 1px solid var(--line-strong); box-shadow: -25px 0 70px rgba(20, 23, 19, .22); animation: slide-in .38s cubic-bezier(.22, .8, .28, 1) both; }
@keyframes fade-in { from { opacity: 0; } }
@keyframes slide-in { from { transform: translateX(100%); } }
.detail-drawer > header { height: 78px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line-strong); }
.detail-drawer > header > div { display: flex; align-items: center; gap: 12px; }
.detail-drawer > header span { color: var(--coral-700); font-size: 10px; font-weight: 750; letter-spacing: .14em; }
.detail-drawer > header strong { color: var(--ink-400); font-family: var(--display); font-size: 14px; }
.detail-drawer > header button { width: 38px; height: 38px; padding: 9px; color: var(--ink); background: var(--canvas); border: 1px solid var(--line); border-radius: 50%; }
.detail-drawer > header button:hover { color: var(--paper); background: var(--ink); }
.goal-title-block { padding: 42px 34px 34px; background: var(--canvas-soft); border-bottom: 1px solid var(--line); }
.status-chip { padding: 6px 10px; display: inline-flex; align-items: center; gap: 7px; color: var(--moss-800); background: var(--moss-100); border: 1px solid var(--moss-300); border-radius: 999px; font-size: 10px; font-weight: 700; }
.status-chip i { width: 6px; height: 6px; background: var(--moss-600); border-radius: 50%; }
.goal-title-block h2 { margin: 16px 0 15px; font-family: var(--display); font-size: clamp(27px, 3.2vw, 38px); font-weight: 650; line-height: 1.22; letter-spacing: -.025em; }
.goal-title-block p { margin: 0; color: var(--ink-500); font-size: 11px; }
.detail-list { margin: 0; padding: 28px 34px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-list > div { min-height: 90px; padding: 16px; background: var(--canvas-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); }
.detail-list .wide { grid-column: 1 / -1; min-height: 106px; }
.detail-list dt { color: var(--ink-500); font-size: 10px; font-weight: 750; letter-spacing: .1em; }
.detail-list dd { margin: 10px 0 0; color: var(--ink); font-size: 13px; line-height: 1.6; }
.backend-note { margin: 0 34px; padding: 15px; display: flex; align-items: flex-start; gap: 11px; color: var(--moss-800); background: var(--moss-100); border: 1px solid var(--moss-300); border-radius: var(--radius-sm); }
.backend-note span { width: 24px; height: 24px; flex: 0 0 auto; display: grid; place-items: center; color: var(--paper); background: var(--moss-700); border-radius: 50%; font-family: var(--display); font-size: 13px; }
.backend-note p { margin: 1px 0 0; font-size: 11px; line-height: 1.65; }
.detail-drawer > footer { position: sticky; bottom: 0; margin-top: 32px; padding: 18px 34px; display: flex; justify-content: flex-end; gap: 10px; background: rgba(255, 253, 248, .94); border-top: 1px solid var(--line-strong); backdrop-filter: blur(12px); }
.detail-drawer > footer button { min-height: 43px; padding: 0 17px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.ghost-button { color: var(--ink-600); background: var(--paper); border: 1px solid var(--line-strong); }
.continue-button { color: var(--paper); background: var(--ink); border: 1px solid var(--ink); }
.detail-loading { padding: 48px 34px; }
.detail-loading i { width: 100%; height: 16px; margin-bottom: 16px; display: block; background: var(--canvas); border-radius: 10px; animation: pulse 1s ease-in-out infinite alternate; }
.detail-loading i:nth-child(2) { width: 82%; height: 50px; margin-top: 36px; }
.detail-loading i:nth-child(3) { width: 57%; }
.detail-loading p { margin-top: 30px; color: var(--ink-500); font-size: 12px; }
@keyframes pulse { to { opacity: .45; } }
@media (max-width: 520px) {
  .detail-drawer > header, .goal-title-block, .detail-list { padding-left: 20px; padding-right: 20px; }
  .detail-list { grid-template-columns: 1fr; }
  .detail-list .wide { grid-column: auto; }
  .backend-note { margin-inline: 20px; }
  .detail-drawer > footer { padding-inline: 20px; }
}
</style>
