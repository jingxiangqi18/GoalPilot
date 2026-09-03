<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['select', 'continue', 'generate-plan', 'new-goal', 'refresh', 'page-change'])

const activeFilter = ref('ALL')
const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'NEEDS_CLARIFICATION', label: '待补充' },
  { value: 'READY_TO_PLAN', label: '待规划' },
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
]

const statusLabels = {
  DRAFT: '草稿',
  NEEDS_CLARIFICATION: '待补充',
  READY_TO_PLAN: '待规划',
  ACTIVE: '进行中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
}

const visibleItems = computed(() => {
  if (activeFilter.value === 'ALL') return props.items
  return props.items.filter((item) => item.status === activeFilter.value)
})

const activeCount = computed(() => props.items.filter((item) => item.status === 'ACTIVE').length)
const readyCount = computed(() => props.items.filter((item) => item.status === 'READY_TO_PLAN').length)

function formatDate(value) {
  if (!value) return '时间未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
</script>

<template>
  <section class="library-view">
    <header class="library-hero reveal-item">
      <div>
        <span class="kicker">GOAL ARCHIVE · 目标档案</span>
        <h1>每一个想法，<em>都有迹可循。</em></h1>
        <p>这里保存了你提交过的目标草稿。打开一条记录查看信息，或继续让 AI 帮你梳理下一步。</p>
      </div>
      <button class="new-goal-button" type="button" @click="emit('new-goal')">
        <span>＋</span> 创建新目标
      </button>
    </header>

    <div class="stat-strip reveal-item">
      <article>
        <span class="stat-index">01</span>
        <div><strong>{{ total }}</strong><small>累计目标</small></div>
      </article>
      <article>
        <span class="stat-index coral">02</span>
        <div><strong>{{ readyCount }}</strong><small>本页待规划</small></div>
      </article>
      <article>
        <span class="stat-index moss">03</span>
        <div><strong>{{ activeCount }}</strong><small>本页进行中</small></div>
      </article>
      <p>Small steps<br /><em>still move you forward.</em></p>
    </div>

    <section class="archive-module reveal-item">
      <header class="archive-toolbar">
        <div>
          <span class="section-label">MY COLLECTION</span>
          <h2>目标列表</h2>
        </div>
        <div class="toolbar-actions">
          <div class="filter-tabs" role="tablist" aria-label="目标状态筛选">
            <button
              v-for="filter in filters"
              :key="filter.value"
              type="button"
              :class="{ active: activeFilter === filter.value }"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <button class="refresh-button" type="button" :disabled="loading" aria-label="刷新目标列表" @click="emit('refresh')">
            <svg viewBox="0 0 20 20" fill="none"><path d="M16 8a6.2 6.2 0 1 0 .1 3.2M16 4v4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </div>
      </header>

      <div v-if="errorMessage" class="library-notice" role="alert">
        <span>!</span><div><strong>目标列表加载失败</strong><p>{{ errorMessage }}</p></div>
        <button type="button" @click="emit('refresh')">重试</button>
      </div>

      <div v-else-if="loading" class="goal-grid" aria-label="正在加载目标">
        <article v-for="index in 6" :key="index" class="goal-card skeleton-card">
          <i></i><i></i><i></i>
        </article>
      </div>

      <div v-else-if="visibleItems.length" class="goal-grid">
        <article v-for="(goal, index) in visibleItems" :key="goal.id" class="goal-card">
          <button class="card-open" type="button" :aria-label="`查看目标：${goal.goalText}`" @click="emit('select', goal.id)">
            <span class="card-number">{{ String((page - 1) * 9 + index + 1).padStart(2, '0') }}</span>
            <span class="status-chip" :class="`status-${goal.status?.toLowerCase()}`">
              <i></i>{{ statusLabels[goal.status] || goal.status || '未知状态' }}
            </span>
            <strong>{{ goal.goalText }}</strong>
            <span class="card-meta">
              <span>{{ formatDate(goal.createdAt) }}</span>
              <span v-if="goal.priority">{{ goal.priority }}</span>
            </span>
          </button>
          <footer>
            <button type="button" @click="emit('select', goal.id)">查看详情</button>
            <button v-if="goal.status === 'DRAFT'" type="button" class="continue-button" @click="emit('continue', goal)">继续分析 <span>↗</span></button>
            <button v-else-if="goal.status === 'READY_TO_PLAN'" type="button" class="continue-button" @click="emit('generate-plan', goal)">生成计划 <span>↗</span></button>
            <button v-else type="button" class="state-button" @click="emit('select', goal.id)">查看进度 <span>→</span></button>
          </footer>
        </article>
      </div>

      <div v-else class="empty-archive">
        <span class="empty-orbit"><i></i></span>
        <span class="section-label">A BLANK PAGE</span>
        <h3>{{ items.length ? '当前筛选下还没有目标' : '从第一个目标开始' }}</h3>
        <p>{{ items.length ? '试试切换其他状态，或写下一个新的目标。' : '一句自然的描述就够了，其余的交给 GoalPilot。' }}</p>
        <button type="button" @click="emit('new-goal')">写下新目标 <span>→</span></button>
      </div>

      <footer v-if="totalPages > 1" class="pagination">
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <div>
          <button type="button" :disabled="page <= 1 || loading" @click="emit('page-change', page - 1)">← 上一页</button>
          <button type="button" :disabled="page >= totalPages || loading" @click="emit('page-change', page + 1)">下一页 →</button>
        </div>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.library-view { display: grid; gap: 22px; }
.library-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
.library-hero > div { max-width: 790px; }
.kicker, .section-label { color: var(--coral-700); font-size: 11px; font-weight: 750; letter-spacing: .16em; }
.library-hero h1 { margin: 10px 0 11px; color: var(--ink); font-family: var(--display); font-size: clamp(36px, 4vw, 56px); font-weight: 650; line-height: 1.03; letter-spacing: -.045em; }
.library-hero h1 em { color: var(--coral-600); background: linear-gradient(90deg, #6871aa, #bd7e97); background-clip: text; -webkit-background-clip: text; font-weight: inherit; -webkit-text-fill-color: transparent; }
.library-hero p { max-width: 650px; margin: 0; color: var(--ink-600); font-size: 13px; line-height: 1.7; }
.new-goal-button { min-height: 48px; padding: 0 20px; display: inline-flex; align-items: center; gap: 9px; color: var(--paper); background: var(--ink); border: 1px solid var(--ink); border-radius: 999px; font-size: 13px; font-weight: 700; white-space: nowrap; transition: transform .2s, background .2s; }
.new-goal-button:hover { background: var(--moss-800); transform: translateY(-2px); }
.new-goal-button span { font-size: 20px; font-weight: 400; }

.stat-strip { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)) 1.25fr; background: var(--paper); border: 1px solid var(--line-strong); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.stat-strip article { min-height: 102px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; border-right: 1px solid var(--line); }
.stat-index { width: 36px; height: 36px; display: grid; place-items: center; color: var(--paper); background: var(--ink); border-radius: 50%; font-family: var(--display); font-size: 14px; }
.stat-index.coral { background: linear-gradient(145deg, var(--coral-500), var(--rose-500)); }
.stat-index.moss { background: var(--moss-700); }
.stat-strip strong, .stat-strip small { display: block; }
.stat-strip strong { color: var(--ink); font-family: var(--display); font-size: 34px; font-weight: 650; line-height: 1; }
.stat-strip small { margin-top: 5px; color: var(--ink-500); font-size: 11px; }
.stat-strip > p { margin: 0; padding: 18px 24px; display: flex; align-items: center; color: var(--paper); background: linear-gradient(135deg, #293041, #1d2028); border-radius: 0 calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px) 0; font-family: var(--display); font-size: 18px; font-weight: 600; line-height: 1.18; }
.stat-strip > p em { color: var(--coral-300); }

.archive-module { overflow: hidden; background: var(--paper); border: 1px solid var(--line-strong); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
.archive-toolbar { min-height: 92px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--line-strong); }
.archive-toolbar h2 { margin: 5px 0 0; color: var(--ink); font-family: var(--display); font-size: 29px; line-height: 1; }
.toolbar-actions, .filter-tabs { display: flex; align-items: center; gap: 8px; }
.filter-tabs { padding: 4px; background: var(--canvas); border: 1px solid var(--line); border-radius: 999px; }
.filter-tabs button { padding: 7px 11px; color: var(--ink-500); background: transparent; border: 0; border-radius: 999px; font-size: 11px; font-weight: 650; }
.filter-tabs button.active { color: var(--paper); background: var(--ink); }
.refresh-button { width: 38px; height: 38px; display: grid; place-items: center; color: var(--ink-600); background: var(--paper); border: 1px solid var(--line-strong); border-radius: 50%; }
.refresh-button:hover:not(:disabled) { color: var(--coral-700); background: var(--coral-100); }
.refresh-button svg { width: 17px; }

.goal-grid { padding: 24px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; }
.goal-card { min-width: 0; overflow: hidden; background: var(--canvas-soft); border: 1px solid var(--line); border-radius: var(--radius-md); transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
.goal-card:hover { transform: translateY(-4px); border-color: var(--ink-400); box-shadow: var(--shadow-sm); }
.card-open { width: 100%; min-height: 190px; padding: 18px; display: flex; flex-direction: column; align-items: flex-start; color: inherit; text-align: left; background: transparent; border: 0; }
.card-number { color: var(--ink-400); font-family: var(--display); font-size: 13px; }
.status-chip { margin-top: 27px; padding: 6px 9px; display: inline-flex; align-items: center; gap: 6px; color: var(--ink-600); background: var(--paper); border: 1px solid var(--line-strong); border-radius: 999px; font-size: 10px; font-weight: 700; }
.status-chip i { width: 6px; height: 6px; background: var(--ink-400); border-radius: 50%; }
.status-ready_to_plan, .status-active { color: var(--moss-800); background: var(--moss-100); border-color: var(--moss-300); }
.status-ready_to_plan i, .status-active i { background: var(--moss-600); }
.status-needs_clarification { color: var(--coral-800); background: var(--coral-100); border-color: var(--coral-300); }
.status-needs_clarification i { background: var(--coral-600); }
.card-open strong { margin-top: 12px; display: -webkit-box; overflow: hidden; color: var(--ink); font-family: var(--display); font-size: 18px; font-weight: 650; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.card-meta { width: 100%; margin-top: auto; padding-top: 18px; display: flex; justify-content: space-between; gap: 10px; color: var(--ink-500); font-size: 10px; }
.goal-card > footer { padding: 11px 14px; display: flex; justify-content: space-between; gap: 8px; background: var(--paper); border-top: 1px solid var(--line); }
.goal-card > footer button { padding: 6px 4px; color: var(--ink-500); background: transparent; border: 0; font-size: 11px; font-weight: 650; }
.goal-card > footer .continue-button { color: var(--coral-700); }
.goal-card > footer .state-button { color: var(--moss-700); }
.goal-card > footer button:hover { color: var(--ink); }
.skeleton-card { min-height: 260px; padding: 24px; }
.skeleton-card i { height: 14px; margin-bottom: 18px; display: block; background: linear-gradient(90deg, var(--canvas) 25%, var(--paper) 50%, var(--canvas) 75%); background-size: 200% 100%; border-radius: 8px; animation: shimmer 1.3s infinite; }
.skeleton-card i:nth-child(1) { width: 22%; }
.skeleton-card i:nth-child(2) { width: 85%; height: 46px; margin-top: 45px; }
.skeleton-card i:nth-child(3) { width: 58%; }
@keyframes shimmer { to { background-position: -200% 0; } }

.library-notice { margin: 24px; padding: 16px; display: flex; align-items: center; gap: 12px; color: var(--danger); background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: var(--radius-sm); }
.library-notice > span { width: 30px; height: 30px; display: grid; place-items: center; color: white; background: var(--danger); border-radius: 50%; font-weight: 800; }
.library-notice strong { font-size: 13px; }
.library-notice p { margin: 3px 0 0; font-size: 12px; }
.library-notice button { margin-left: auto; padding: 8px 12px; color: inherit; background: transparent; border: 1px solid currentColor; border-radius: 999px; font-size: 11px; }
.empty-archive { min-height: 390px; padding: 55px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-orbit { position: relative; width: 72px; height: 72px; margin-bottom: 23px; border: 1px solid var(--ink-400); border-radius: 50%; }
.empty-orbit::before { content: ''; position: absolute; inset: 10px; border: 1px dashed var(--coral-500); border-radius: 50%; animation: orbit 8s linear infinite; }
.empty-orbit i { position: absolute; top: 4px; left: 29px; width: 13px; height: 13px; background: var(--coral-600); border-radius: 50%; }
@keyframes orbit { to { transform: rotate(360deg); } }
.empty-archive h3 { margin: 8px 0 7px; font-family: var(--display); font-size: 28px; }
.empty-archive p { margin: 0; color: var(--ink-500); font-size: 13px; }
.empty-archive button { margin-top: 20px; padding: 10px 14px; color: var(--paper); background: var(--ink); border: 0; border-radius: 999px; font-size: 12px; font-weight: 700; }
.pagination { padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; color: var(--ink-500); background: var(--canvas-soft); border-top: 1px solid var(--line); font-size: 11px; }
.pagination div { display: flex; gap: 8px; }
.pagination button { padding: 8px 11px; color: var(--ink-700); background: var(--paper); border: 1px solid var(--line-strong); border-radius: 999px; font-size: 11px; }
.pagination button:disabled { cursor: not-allowed; opacity: .4; }

@media (max-width: 1120px) {
  .stat-strip { grid-template-columns: repeat(3, 1fr); }
  .stat-strip > p { display: none; }
  .stat-strip article:nth-child(3) { border-right: 0; }
  .goal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 1900px) {
  .goal-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .library-hero, .archive-toolbar { align-items: flex-start; flex-direction: column; }
  .new-goal-button { width: 100%; justify-content: center; }
  .toolbar-actions { width: 100%; justify-content: space-between; }
  .filter-tabs { max-width: calc(100% - 48px); overflow-x: auto; }
  .goal-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .library-hero h1 { font-size: 41px; }
  .stat-strip article { min-height: 92px; padding: 15px 10px; gap: 9px; flex-direction: column; align-items: flex-start; }
  .stat-index { width: 28px; height: 28px; font-size: 11px; }
  .stat-strip strong { font-size: 27px; }
  .archive-toolbar, .goal-grid { padding: 18px; }
  .filter-tabs button { padding-inline: 9px; }
}
</style>
