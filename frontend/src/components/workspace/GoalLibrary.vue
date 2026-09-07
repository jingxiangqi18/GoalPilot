<script setup>
import { computed, ref } from 'vue'
import planeArtwork from '../../assets/goalpilot-plane-charm-v1.webp'
import GoalStatusBadge from './GoalStatusBadge.vue'
import { goalPresentation, goalDate, priorityLabel } from '../../utils/goalPresentation'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
  availableDraftGoalId: { type: Number, default: null },
})
const emit = defineEmits(['select', 'continue', 'generate-plan', 'view-plan', 'new-goal', 'refresh', 'page-change'])
const activeFilter = ref('ALL')
const search = ref('')
const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'NEEDS_CLARIFICATION', label: '待补充' },
  { value: 'READY_TO_PLAN', label: '待规划' },
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ARCHIVED', label: '已归档' },
]
const visibleItems = computed(() => props.items.filter(item =>
  (activeFilter.value === 'ALL' || item.status === activeFilter.value)
  && String(item.goalText || '').toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())
))
const activeCount = computed(() => props.items.filter(item => item.status === 'ACTIVE').length)
const readyCount = computed(() => props.items.filter(item => item.status === 'READY_TO_PLAN').length)
function resetFilters() { activeFilter.value = 'ALL'; search.value = '' }
</script>

<template>
  <section class="library-view">
    <header class="library-hero reveal-item">
      <div class="hero-copy">
        <span class="eyebrow"><i aria-hidden="true"></i>YOUR PERSONAL COLLECTION</span>
        <h1>收好每个想法，<em>慢慢走向它。</em></h1>
        <p>从一句想法，到一条行动路线。你的目标，都在这里。</p>
        <dl class="collection-stats" aria-label="目标概览">
          <div><dt>累计目标</dt><dd>{{ loading ? '—' : total }}<small>个</small></dd></div>
          <div><dt>本页待规划</dt><dd>{{ loading ? '—' : readyCount }}<small>个</small></dd></div>
          <div><dt>本页进行中</dt><dd>{{ loading ? '—' : activeCount }}<small>个</small></dd></div>
        </dl>
      </div>
      <div class="hero-side">
        <div class="collection-art" aria-hidden="true">
          <div class="art-orbit"></div><div class="note-sheet back"></div>
          <div class="note-sheet front"><span>A NEW CHAPTER</span><i></i><i></i><small>make room for possibility.</small></div>
          <img :src="planeArtwork" alt="" width="144" height="144" />
          <span class="art-spark one">✧</span><span class="art-spark two">✦</span>
        </div>
        <button class="new-goal-button" type="button" :disabled="busy" @click="emit('new-goal')"><span aria-hidden="true">＋</span> 创建新目标 <span aria-hidden="true">↗</span></button>
      </div>
    </header>

    <section class="archive-module reveal-item" :aria-busy="loading">
      <header class="archive-heading">
        <div><span class="section-label">MY GOALS</span><h2>目标收藏 <span>{{ loading ? '正在读取' : '本页 ' + visibleItems.length + ' 个目标' }}</span></h2></div>
        <div class="toolbar-actions">
          <label class="goal-search"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg><input v-model="search" type="search" aria-label="搜索本页目标" placeholder="搜索本页目标" /></label>
          <button class="refresh-button" type="button" :disabled="loading" aria-label="刷新目标列表" @click="emit('refresh')"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 8a6.2 6.2 0 1 0 .1 3.2M16 4v4h-4" /></svg></button>
        </div>
      </header>
      <div class="archive-toolbar">
        <div class="filter-tabs" role="group" aria-label="本页目标状态筛选">
          <button v-for="filter in filters" :key="filter.value" type="button" :class="{ active: activeFilter === filter.value }" :aria-pressed="activeFilter === filter.value" @click="activeFilter = filter.value">{{ filter.label }}</button>
        </div>
        <span class="filter-note">{{ totalPages > 1 ? '筛选与搜索仅作用于本页' : '按自己的节奏，一步步来。' }}</span>
      </div>

      <div v-if="errorMessage" class="library-notice" role="alert"><span>!</span><div><strong>目标列表加载失败</strong><p>{{ errorMessage }}</p></div><button type="button" @click="emit('refresh')">重试</button></div>
      <div v-else-if="loading" class="goal-grid" aria-label="正在加载目标"><article v-for="index in 3" :key="index" class="goal-card skeleton-card"><i></i><i></i><i></i></article></div>
      <TransitionGroup v-else class="goal-grid" :class="{ 'is-empty': !visibleItems.length }" name="goal-filter" tag="div">
        <article v-for="goal in visibleItems" :key="goal.id" class="goal-card" :class="goalPresentation(goal.status).tone">
          <button class="card-open" type="button" :aria-label="'查看目标：' + goal.goalText" @click="emit('select', goal.id)">
            <span class="card-topline">
              <span class="goal-glyph" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M9 7h11l5 5v14H9z" /><path d="M20 7v6h5M13 18h8m-8 4h5" /></svg></span>
              <GoalStatusBadge :status="goal.status" />
              <span class="card-decoration" aria-hidden="true"><i></i><i></i><b>✧</b></span>
            </span>
            <span class="card-chapter">{{ goalPresentation(goal.status).chapter }}</span>
            <strong>{{ goal.goalText }}</strong>
            <span class="card-hint">{{ goalPresentation(goal.status).hint }}</span>
            <span class="card-meta"><span>记录于 {{ goalDate(goal.createdAt) }}</span><span v-if="goal.priority">{{ priorityLabel(goal.priority) }}</span></span>
          </button>
          <footer>
            <button type="button" class="details-button" @click="emit('select', goal.id)">查看详情 <span aria-hidden="true">↗</span></button>
            <button v-if="goal.status === 'DRAFT'" type="button" class="continue-button" :disabled="busy" @click="emit('continue', goal)">继续分析 <span aria-hidden="true">→</span></button>
            <button v-else-if="goal.status === 'READY_TO_PLAN'" type="button" class="continue-button" :disabled="busy" @click="emit('generate-plan', goal)">{{ goal.id === availableDraftGoalId ? '查看计划草稿' : '生成计划' }} <span aria-hidden="true">→</span></button>
            <button v-else-if="['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(goal.status)" type="button" class="state-button" @click="emit('view-plan', goal)">查看正式计划 <span aria-hidden="true">→</span></button>
            <span v-else class="card-state-note">{{ goalPresentation(goal.status).label }}</span>
          </footer>
        </article>
      </TransitionGroup>

      <div v-if="!loading && !errorMessage && !visibleItems.length" class="empty-archive">
        <img :src="planeArtwork" alt="" width="112" height="112" />
        <span class="section-label">{{ items.length ? 'KEEP EXPLORING' : 'YOUR NEXT CHAPTER' }}</span>
        <h3>{{ items.length ? '暂时没有匹配的目标' : '让第一个想法，在这里落笔' }}</h3>
        <p>{{ items.length ? '换一个关键词或状态，再找找看。' : '不必想得周全，一句自然的描述就够了。' }}</p>
        <button v-if="search || activeFilter !== 'ALL'" type="button" @click="resetFilters">清除筛选，查看本页全部目标 →</button>
        <button v-else type="button" :disabled="busy" @click="emit('new-goal')">写下新目标 →</button>
      </div>
      <footer class="collection-footer">
        <span><i aria-hidden="true">✧</i> 每个目标，都有自己的时区。</span>
        <div v-if="totalPages > 1" class="pagination">
          <span>第 {{ page }} / {{ totalPages }} 页</span>
          <button type="button" :disabled="page <= 1 || loading" @click="emit('page-change', page - 1)">← 上一页</button>
          <button type="button" :disabled="page >= totalPages || loading" @click="emit('page-change', page + 1)">下一页 →</button>
        </div>
        <small v-else>属于你的成长收藏</small>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.library-view { display: grid; gap: 24px; min-width: 0; font-family: var(--text-cn); }
.library-hero { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 30px 38px; overflow: hidden; border: 0; border-radius: 24px; background: radial-gradient(ellipse at 85% 100%, #f4e5ee, transparent 60%), linear-gradient(115deg, #fdfdff, #eeedf8 80%); box-shadow: var(--surface-shadow); }
.hero-copy { position: relative; z-index: 1; min-width: 0; }
.eyebrow, .section-label { display: flex; align-items: center; gap: 8px; color: #767399; font-family: var(--display); font-size: 10px; font-weight: 500; letter-spacing: .16em; }
.eyebrow i { width: 5px; height: 5px; border-radius: 50%; background: #9690bc; box-shadow: 0 0 0 4px #e7e3f1; }
.library-hero h1 { margin: 16px 0 10px; color: #30313e; font-size: clamp(24px, 1.8vw, 30px); font-weight: 600; line-height: 1.5; letter-spacing: .015em; text-wrap: balance; }
.library-hero h1 em { color: #797099; font-style: normal; font-weight: 500; }
.library-hero p { margin: 0; color: #727181; font-size: 13px; line-height: 1.8; }
.collection-stats { display: flex; margin: 23px 0 0; gap: 0; }
.collection-stats > div { display: flex; align-items: center; gap: 14px; padding-inline: 24px; border-left: 1px solid #dcd9e8; }
.collection-stats > div:first-child { padding-left: 0; border: 0; }
.collection-stats dt { color: #737080; font-size: 12px; }
.collection-stats dd { display: flex; align-items: baseline; gap: 5px; margin: 0; color: #514e70; font-family: var(--display); font-size: 25px; font-weight: 500; font-variant-numeric: tabular-nums; }
.collection-stats small { font-family: var(--text-cn); font-size: 10px; color: #817c92; font-weight: 400; }
.hero-side { position: relative; display: grid; justify-items: center; width: 270px; flex-shrink: 0; }
.collection-art { position: relative; width: 245px; height: 132px; pointer-events: none; }
.art-orbit { position: absolute; width: 242px; height: 82px; top: 23px; left: -10px; border: 1px dashed #c9bed9; border-radius: 50%; transform: rotate(-14deg); }
.note-sheet { position: absolute; width: 118px; height: 105px; top: 8px; left: 45px; border: 1px solid #d4cfe4; border-radius: 10px; }
.note-sheet.back { background: #e3dff1; transform: rotate(-14deg); }
.note-sheet.front { padding: 15px 12px; background: linear-gradient(140deg, #fff, #f5f2fa); box-shadow: 0 8px 15px #65557912; transform: rotate(-4deg); }
.note-sheet.front > span { color: #8a7e9b; font-size: 7px; letter-spacing: .1em; font-family: var(--display); }
.note-sheet.front i { display: block; height: 1px; margin-top: 11px; background: #e2ddec; width: 65%; }
.note-sheet.front i + i { width: 43%; margin-top: 8px; }
.note-sheet.front small { display: block; margin-top: 12px; color: #aaa0b8; font-family: var(--display); font-size: 6px; }
.collection-art img { position: absolute; top: -13px; left: 110px; width: 135px; height: 135px; object-fit: contain; transform: rotate(12deg); filter: drop-shadow(0 12px 10px #71679420); transition: transform .5s var(--ease-out); }
.library-hero:hover .collection-art img { transform: translate(4px, -5px) rotate(7deg); }
.art-spark { position: absolute; color: #b298b8; font-size: 23px; }
.art-spark.one { top: 1px; left: 12px; }.art-spark.two { bottom: 16px; right: 2px; font-size: 11px; }
.new-goal-button { min-height: 43px; padding: 0 18px; display: flex; align-items: center; justify-content: center; gap: 10px; color: white; background: linear-gradient(115deg, #6c6898, #8280ac); border: 1px solid #716d9e; border-radius: 12px; box-shadow: 0 5px 12px #756b9720; font-size: 13px; font-weight: 500; white-space: nowrap; }
.new-goal-button > span:first-child { font-size: 20px; font-weight: 400; }.new-goal-button > span:last-child { margin-left: 20px; }
.new-goal-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px #756b9730; }
.new-goal-button:disabled { opacity: .5; }
.archive-module { min-width: 0; overflow: hidden; background: rgba(255,255,255,.92); border: 0; border-radius: 24px; box-shadow: var(--surface-shadow); }
.archive-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 28px 20px; }
.archive-heading h2 { display: flex; align-items: center; gap: 14px; margin: 6px 0 0; font-size: 23px; line-height: 1.5; font-weight: 600; letter-spacing: .02em; }
.archive-heading h2 > span { padding-left: 14px; color: #82808e; border-left: 1px solid #dddbe6; font-size: 12px; font-weight: 400; letter-spacing: 0; }
.toolbar-actions { display: flex; gap: 9px; align-items: center; }
.goal-search { display: flex; align-items: center; gap: 9px; width: 235px; padding: 0 12px; height: 40px; background: #f7f7fa; border: 1px solid #e0dfea; border-radius: 11px; }
.goal-search:focus-within { border-color: #a39cbe; box-shadow: 0 0 0 3px #edebf6; }
.goal-search svg, .refresh-button svg { width: 17px; height: 17px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; color: #878397; }
.goal-search input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; font-size: 12px; }
.goal-search input::placeholder { color: #766f82; }
.refresh-button { width: 40px; height: 40px; display: grid; place-items: center; background: white; border: 1px solid #e0dfea; border-radius: 11px; }
.refresh-button:hover:not(:disabled) { background: #f0edf8; }
.refresh-button:disabled svg { animation: refresh-spin 1s linear infinite; }
@keyframes refresh-spin { to { transform: rotate(360deg); } }
.archive-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 28px 16px; border-bottom: 1px solid #eeedf3; }
.filter-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.filter-tabs button { min-height: 34px; padding: 6px 13px; color: #767282; background: transparent; border: 1px solid transparent; border-radius: 9px; font-size: 12px; font-weight: 400; }
.filter-tabs button:hover { color: #63588c; background: #f7f5fb; }
.filter-tabs button.active { color: #65578d; background: #eeebf7; border-color: #e0daed; font-weight: 500; box-shadow: inset 0 1px 0 white; }
.filter-note { color: #87818e; font-size: 11px; white-space: nowrap; }
.goal-grid { position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 18px; padding: 24px 28px; }
.goal-grid.is-empty { padding-block: 0; }
.goal-card { --card-accent: #626176; --card-tint: #f2f2f8; --card-border: #dfdfeb; position: relative; min-width: 0; overflow: hidden; display: flex; flex-direction: column; border: 0; border-radius: 21px 21px 21px 8px; background: linear-gradient(120deg, var(--card-tint), #fdfcff); box-shadow: inset 0 1px 0 #fff, 0 5px 18px #4e43570a; transition: transform .25s var(--ease-out), box-shadow .25s; }
.goal-card.lilac { --card-accent: #6d5b96; --card-tint: #f4f0fb; --card-border: #e0d8ee; }
.goal-card.blue { --card-accent: #4a6c86; --card-tint: #eff5fa; --card-border: #d8e3ee; }
.goal-card.rose { --card-accent: #915b74; --card-tint: #fbf1f5; --card-border: #ebdbe3; }
.goal-card.sage { --card-accent: #4c7266; --card-tint: #eff6f2; --card-border: #d5e6de; }
.goal-card::before { content: ''; position: absolute; top: 0; left: 24px; width: 84px; height: 2px; background: linear-gradient(90deg, var(--card-accent), transparent); opacity: .35; pointer-events: none; }
.goal-card:hover { transform: translateY(-3px); box-shadow: var(--surface-shadow-hover); }
.card-open { display: flex; flex-direction: column; align-items: flex-start; flex: 1; width: 100%; padding: 22px 24px 18px; color: inherit; text-align: left; background: transparent; border: 0; }
.card-open:focus-visible { outline-offset: -4px; border-radius: 15px; }
.card-topline { display: flex; align-items: center; width: 100%; gap: 12px; position: relative; }
.goal-glyph { position: relative; display: grid; place-items: center; width: 40px; height: 44px; color: var(--card-accent); background: white; border: 1px solid var(--card-border); border-radius: 10px; box-shadow: 3px 3px 0 var(--card-tint), 4px 4px 0 var(--card-border); transform: rotate(-5deg); }
.goal-glyph svg { width: 29px; height: 29px; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.card-decoration { position: absolute; top: 0; right: 0; width: 78px; height: 44px; color: var(--card-accent); opacity: .5; pointer-events: none; }
.card-decoration i { position: absolute; right: 0; top: 0; width: 48px; height: 38px; border: 1px solid currentColor; border-radius: 50%; transform: rotate(-35deg); }
.card-decoration i + i { right: 16px; top: 9px; }.card-decoration b { position: absolute; right: 8px; top: -7px; font-size: 22px; font-weight: 400; }
.card-chapter { margin-top: 23px; color: var(--card-accent); font-size: 11px; letter-spacing: .06em; }
.card-open > strong { display: -webkit-box; overflow: hidden; margin-top: 9px; color: #363542; font-size: 19px; font-weight: 500; line-height: 1.7; letter-spacing: .01em; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 3; text-wrap: pretty; }
.card-hint { margin: 11px 0 0; color: #706979; font-size: 12px; line-height: 1.8; }
.card-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%; margin-top: auto; padding-top: 23px; color: #746c7d; font-size: 11px; }
.goal-card > footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 13px 20px; border-top: 0; background: linear-gradient(100deg, #ffffff95, #ffffff45); }
.goal-card > footer button { min-height: 35px; padding: 7px 10px; border: 0; border-radius: 9px; background: transparent; font-size: 12px; font-weight: 500; white-space: nowrap; }
.details-button { color: #706879; }.details-button span { margin-left: 4px; }
.goal-card > footer .continue-button, .goal-card > footer .state-button { color: var(--card-accent); background: var(--card-tint); box-shadow: inset 0 0 0 1px var(--card-border); }
.goal-card > footer button > span { display: inline-block; margin-left: 9px; transition: transform .2s; }
.goal-card > footer button:hover:not(:disabled) > span { transform: translateX(3px); }
.goal-card > footer button:disabled { opacity: .45; }
.card-state-note { color: #8b8595; font-size: 11px; }
.goal-filter-move, .goal-filter-enter-active, .goal-filter-leave-active { transition: transform .3s var(--ease-out), opacity .2s; }
.goal-filter-enter-from, .goal-filter-leave-to { opacity: 0; transform: translateY(10px); }
.goal-filter-leave-active { position: absolute; visibility: hidden; pointer-events: none; }
.skeleton-card { min-height: 310px; padding: 24px; }
.skeleton-card i { height: 14px; margin-bottom: 18px; display: block; background: linear-gradient(90deg, #f0edf7 25%, #fcfcff 50%, #f0edf7 75%); background-size: 200% 100%; border-radius: 8px; animation: shimmer 1.3s infinite; }
.skeleton-card i:first-child { width: 22%; height: 40px; }.skeleton-card i:nth-child(2) { width: 85%; height: 46px; margin-top: 25px; }.skeleton-card i:nth-child(3) { width: 58%; }
@keyframes shimmer { to { background-position: -200% 0; } }
.library-notice { display: flex; align-items: center; gap: 12px; margin: 24px 28px; padding: 16px; color: var(--danger); background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: 12px; }
.library-notice > span { width: 28px; height: 28px; flex-shrink: 0; display: grid; place-items: center; background: #f3dce2; border-radius: 50%; }
.library-notice strong { font-size: 14px; font-weight: 500; }.library-notice p { margin: 4px 0 0; font-size: 12px; overflow-wrap: anywhere; }
.library-notice button { margin-left: auto; padding: 8px 12px; color: inherit; background: white; border: 1px solid var(--danger-line); border-radius: 8px; white-space: nowrap; font-size: 12px; }
.empty-archive { display: grid; justify-items: center; padding: 20px 24px 32px; text-align: center; }
.empty-archive img { object-fit: contain; margin-bottom: 4px; }
.empty-archive h3 { margin: 10px 0; font-size: 21px; font-weight: 500; }.empty-archive p { margin: 0; color: var(--ink-500); font-size: 13px; line-height: 1.7; }
.empty-archive button { margin-top: 20px; padding: 10px 16px; color: #65578d; background: #f0ecf8; border: 1px solid #ddd5ed; border-radius: 10px; font-size: 12px; }
.collection-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; padding: 15px 28px; background: #fbfafd; border-top: 1px solid #efecf4; color: #898191; font-size: 11px; }
.collection-footer > span { display: flex; align-items: center; gap: 8px; }.collection-footer > span > i { font-size: 19px; font-style: normal; color: #a69abc; }
.collection-footer > small { font-size: 10px; letter-spacing: .08em; }
.pagination { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pagination button { padding: 8px 10px; color: #706781; border: 1px solid #e0daea; background: white; border-radius: 8px; font-size: 11px; }
.pagination button:disabled { opacity: .4; }
@media (min-width: 1900px) { .goal-grid { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); }.card-open { padding: 26px 28px 22px; }.card-open > strong { font-size: 21px; }.card-hint { font-size: 13px; } }
@media (max-width: 1200px) { .filter-note { display: none; }.collection-stats > div { flex-direction: column; align-items: flex-start; gap: 4px; } }
@media (max-width: 760px) {
  .library-hero { padding: 24px; align-items: flex-start; gap: 12px; }.library-hero h1 { font-size: 24px; }.library-hero h1 em { display: block; }
  .hero-side { width: 170px; align-self: center; }.collection-art { width: 170px; transform: scale(.8); transform-origin: left center; }
  .new-goal-button { padding-inline: 13px; gap: 4px; }.new-goal-button > span:last-child { margin-left: 8px; }
  .collection-stats > div { padding-inline: 16px; }.collection-stats dt { font-size: 11px; }.collection-stats dd { font-size: 23px; }
  .archive-heading { align-items: flex-start; flex-direction: column; gap: 18px; padding: 22px 20px 16px; }.toolbar-actions { width: 100%; }.goal-search { width: auto; flex: 1; }
  .archive-toolbar { padding-inline: 16px; }.filter-tabs { gap: 3px; }.filter-tabs button { padding-inline: 10px; }
  .goal-grid { padding: 20px; grid-template-columns: 1fr; }.collection-footer { padding-inline: 20px; }.collection-footer > small { display: none; }
}
@media (max-width: 520px) {
  .library-view { gap: 18px; }.library-hero { padding: 24px 20px 20px; display: block; }.hero-copy { max-width: 100%; }
  .library-hero h1 { font-size: 23px; }.library-hero p { font-size: 12px; max-width: 220px; }.eyebrow { font-size: 8px; letter-spacing: .1em; }
  .collection-stats { margin-top: 22px; }.collection-stats > div { padding-inline: 14px; }.collection-stats > div:first-child { padding-left: 0; }
  .hero-side { position: static; width: auto; margin-top: 18px; display: block; }.collection-art { position: absolute; right: -7px; top: 61px; width: 90px; height: 85px; transform: none; }
  .collection-art img { width: 90px; height: 90px; left: 0; top: 0; }.art-orbit, .note-sheet, .art-spark { display: none; }
  .new-goal-button { width: 100%; justify-content: space-between; padding-inline: 16px; }.new-goal-button > span:last-child { margin-left: auto; }.new-goal-button > span:first-child { margin-right: 4px; }
  .archive-heading h2 { font-size: 21px; gap: 10px; }.archive-heading h2 > span { padding-left: 10px; font-size: 11px; }
  .card-open { padding: 20px; }.card-open > strong { font-size: 18px; }.card-meta { font-size: 10px; }.goal-card > footer { padding: 12px 14px; }
}
</style>
