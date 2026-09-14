<script setup>
import AgentSignal from './AgentSignal.vue'
import PixelScene from './PixelScene.vue'
defineProps({
  user: { type: Object, required: true },
  activeView: { type: String, required: true },
  activeGoalId: { type: Number, default: null },
  items: { type: Array, default: () => [] },
  goalTotal: { type: Number, default: 0 },
  busy: Boolean,
})
defineEmits(['logout', 'navigate', 'new-goal', 'open-goal'])
</script>

<template>
  <aside class="sidebar">
    <button class="brand" type="button" @click="$emit('navigate', 'create')"><span class="brand-mark" aria-hidden="true"><AgentSignal /></span><span><strong>GoalPilot</strong><small>YOUR NEXT STATION</small></span></button>
    <button class="new-conversation" type="button" :disabled="busy" @click="$emit('new-goal')"><span aria-hidden="true">＋</span> 新建目标 <i aria-hidden="true">↗</i></button>
    <nav class="main-nav" aria-label="工作区导航">
      <button type="button" :class="{ active: activeView === 'create' }" @click="$emit('navigate', 'create')"><span aria-hidden="true">✧</span><strong>规划工作台</strong></button>
      <button type="button" :class="{ active: activeView === 'library' }" @click="$emit('navigate', 'library')"><span aria-hidden="true">☷</span><strong>我的目标</strong><small>{{ goalTotal }}</small></button>
    </nav>
    <nav class="recent-goals" aria-label="最近的目标">
      <header><span>最近的目标</span><i aria-hidden="true">↙</i></header>
      <button v-for="goal in items.slice(0, 7)" :key="goal.id" type="button" :class="{ selected: activeGoalId === goal.id }" :aria-current="activeGoalId === goal.id ? 'page' : undefined" @click="$emit('open-goal', goal.id)"><i aria-hidden="true"></i><span>{{ goal.goalText }}</span></button>
      <p v-if="!items.length">新的想法，会在这里慢慢积累。</p>
      <button v-if="goalTotal > items.length || items.length > 7" type="button" class="all-goals" @click="$emit('navigate', 'library')">查看全部目标 →</button>
    </nav>
    <div class="sidebar-note"><PixelScene class="sidebar-scenery" scene="highlands" /><div><span class="note-label">ONE STEP AT A TIME</span><p>在对话中找方向，<br />在行动中见进展。</p><span class="mini-route" aria-hidden="true"><i></i><b></b><i></i><b></b><i></i></span></div></div>
    <div class="user-card"><span class="avatar">{{ user.username?.charAt(0).toUpperCase() || 'G' }}</span><div><strong>{{ user.username }}</strong><small>你的目标空间</small></div><button type="button" aria-label="退出登录" @click="$emit('logout')">↪</button></div>
  </aside>
</template>

<style scoped>
.sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 248px; display: flex; flex-direction: column; padding: 25px 17px 18px; background: var(--sidebar); border-right: 4px solid #506762; color: #e9eddf; font-family: var(--text-cn); }
.brand { display: flex; align-items: center; gap: 9px; padding: 0 2px; border: 0; background: none; text-align: left; }.brand-mark { width: 36px; height: 40px; display: grid; place-items: center; }.brand-mark .agent-signal { width: 36px; height: 36px; }.brand strong { display: block; color: #f5efd8; font-family: var(--pixel); font-size: 19px; font-weight: 400; letter-spacing: -.07em; }.brand small { display: block; margin-top: 6px; color: #b3c7bc; font: 8px var(--pixel); }
.new-conversation { display: flex; align-items: center; gap: 10px; margin: 29px 0 20px; padding: 10px 13px; border: 1px solid #b6c5ab; border-radius: 2px; color: #263943; background: #e1e7cc; box-shadow: 3px 3px 0 #172e39; font-size: 13px; font-weight: 500; }.new-conversation > span { font-size: 21px; }.new-conversation i { margin-left: auto; color: #5b7565; font-style: normal; font-size: 17px; }.new-conversation:hover:not(:disabled) { transform: translateY(-2px); background: #f0efd8; box-shadow: 3px 5px 0 #172e39; }.new-conversation:disabled { opacity: .5; }
.main-nav { display: grid; gap: 6px; }.main-nav button { position: relative; display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 12px; border: 1px solid transparent; border-radius: 2px; color: #b6c8c2; background: none; text-align: left; }.main-nav button > span { width: 20px; font-size: 19px; }.main-nav strong { font-size: 12px; font-weight: 500; }.main-nav small { margin-left: auto; min-width: 22px; padding: 3px 5px; text-align: center; background: #253943; font: 10px var(--pixel); }.main-nav button.active { color: #f5efd8; background: #405851; border-color: #5b7469; box-shadow: 2px 2px 0 #1f343d; }.main-nav button.active::before { content: ''; position: absolute; left: -2px; height: 16px; width: 3px; background: #d5b67b; }.main-nav button:hover:not(.active) { background: #364f53; }
.recent-goals { min-height: 0; overflow-y: auto; margin-top: 30px; scrollbar-width: thin; scrollbar-color: #536e68 transparent; }.recent-goals header { display: flex; justify-content: space-between; align-items: center; margin: 0 10px 13px; color: #aebeb7; font-size: 11px; }.recent-goals header i { font-size: 15px; font-style: normal; }.recent-goals button { display: flex; align-items: center; gap: 9px; width: 100%; margin-bottom: 4px; padding: 12px 10px; border: 0; border-radius: 2px; background: none; color: #d0dbd2; text-align: left; }.recent-goals button > i { width: 5px; height: 5px; flex-shrink: 0; background: #829e8a; }.recent-goals button > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }.recent-goals button.selected { color: #f3ebd1; background: #405951; }.recent-goals button.selected > i { background: #dbc28d; box-shadow: 0 0 0 2px #657a60; }.recent-goals button:hover { background: #395454; }.recent-goals p { margin: 10px; color: #b6c8c2; font-size: 12px; line-height: 1.8; }.recent-goals .all-goals { color: #ded4ad; font-size: 11px; }
.sidebar-note { margin: auto 3px 20px; border: 1px solid #526a63; background: #30494b; }.sidebar-scenery { height: 92px; margin: 5px; }.sidebar-note > div:last-child { padding: 10px 13px 13px; }.note-label { font: 8px var(--pixel); color: #c9cdaa; }.sidebar-note p { margin: 10px 0 14px; color: #e2e7d7; font-size: 12px; line-height: 1.8; }.mini-route { display: flex; align-items: center; width: 100%; gap: 5px; }.mini-route i { height: 5px; width: 5px; background: #cfba89; }.mini-route i:last-child { background: none; border: 1px solid #adc0a1; }.mini-route b { height: 1px; background: #779285; flex: 1; }
.user-card { display: flex; flex-shrink: 0; align-items: center; gap: 10px; padding: 16px 4px 0; border-top: 1px dashed #60766a; }.avatar { display: grid; place-items: center; width: 32px; height: 32px; background: #6f8978; color: #fff4d8; font: 14px var(--pixel); box-shadow: 2px 2px 0 #1a3039; }.user-card > div { min-width: 0; }.user-card strong { display: block; font-size: 12px; font-weight: 500; color: #e8eddc; }.user-card small { display: block; margin-top: 4px; color: #adbfaf; font-size: 10px; }.user-card button { margin-left: auto; padding: 6px; border: 0; background: none; color: #cbd8c5; font-size: 18px; }
@media(max-width: 1050px) { .sidebar { width: 200px; padding-inline: 12px; }.brand strong { font-size: 16px; }.brand small { font-size: 7px; }.brand-mark, .brand-mark .agent-signal { width: 32px; height: 32px; }.brand { gap: 6px; } }
@media(max-width: 800px) { .sidebar { display: none; } }
@media(max-height: 850px) { .sidebar-note { display: none; }.recent-goals { flex: 1; margin-bottom: 18px; }.user-card { margin-top: auto; } }
</style>
