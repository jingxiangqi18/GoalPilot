<script setup>
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
    <button class="brand" type="button" @click="$emit('navigate', 'create')"><span class="brand-mark" aria-hidden="true">✧</span><span><strong>GoalPilot</strong><small>a little closer, every day</small></span></button>
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
    <div class="sidebar-note"><span aria-hidden="true">✦</span><p>从一句话开始，<br />把想法变成下一步。</p><small>对话为中心，行动由你掌握。</small></div>
    <div class="user-card"><span class="avatar">{{ user.username?.charAt(0).toUpperCase() || 'G' }}</span><div><strong>{{ user.username }}</strong><small>你的目标空间</small></div><button type="button" aria-label="退出登录" @click="$emit('logout')">↪</button></div>
  </aside>
</template>

<style scoped>
.sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 248px; display: flex; flex-direction: column; padding: 26px 17px 18px; background: linear-gradient(160deg, #f0ebf5, #f4eff7 60%, #eee8f3); border-right: 1px solid #e4dbe9; color: #705d7e; font-family: var(--text-cn); }
.brand { display: flex; align-items: center; gap: 11px; padding: 0 7px; border: 0; background: transparent; text-align: left; }.brand-mark { flex: 0 0 35px; height: 37px; display: grid; place-items: center; border-radius: 12px 12px 12px 4px; background: linear-gradient(140deg, #a897c3, #c3a1ba); color: #fff; font-size: 29px; box-shadow: inset 0 1px 0 #ffffff50; }.brand strong { display: block; color: #61506f; font-family: var(--display); font-size: 20px; font-weight: 600; letter-spacing: -.035em; }.brand small { display: block; margin-top: 3px; color: #7b6584; font-family: var(--display); font-size: 8px; letter-spacing: .035em; }
.new-conversation { display: flex; align-items: center; gap: 9px; margin: 33px 0 18px; padding: 11px 13px; border: 1px solid #d5c5e0; border-radius: 12px; color: #7d638d; background: #fbf8fd80; font-size: 13px; }.new-conversation > span { font-size: 21px; }.new-conversation i { margin-left: auto; color: #7a6589; font-size: 18px; font-style: normal; }.new-conversation:hover:not(:disabled) { background: #fff; border-color: #bca3ce; box-shadow: 0 5px 12px #81649608; }.new-conversation:disabled { opacity: .5; }
.main-nav { display: grid; gap: 4px; }.main-nav button { display: flex; gap: 11px; align-items: center; width: 100%; padding: 11px 13px; border: 0; border-radius: 10px; color: #796684; background: transparent; text-align: left; }.main-nav button > span { width: 18px; font-size: 20px; }.main-nav strong { font-size: 12px; font-weight: 400; }.main-nav small { margin-left: auto; color: #7b6487; font-size: 10px; }.main-nav button.active, .main-nav button:hover { color: #80618f; background: #e8deef; }
.recent-goals { min-height: 0; overflow-y: auto; margin-top: 28px; scrollbar-width: thin; scrollbar-color: #d8c7e2 transparent; }.recent-goals header { display: flex; justify-content: space-between; align-items: center; margin: 0 10px 12px; color: #7a6585; font-size: 10px; }.recent-goals header i { font-size: 17px; font-style: normal; }.recent-goals button { display: flex; align-items: center; gap: 9px; width: 100%; margin-bottom: 3px; padding: 12px 11px; border: 0; border-radius: 9px; background: transparent; color: #7c648b; text-align: left; }.recent-goals button > i { width: 5px; height: 5px; flex-shrink: 0; border-radius: 50%; background: #c2acd0; }.recent-goals button > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; }.recent-goals button.selected { background: #e4d7ed; color: #79528e; }.recent-goals button.selected > i { background: #ac82c3; box-shadow: 0 0 0 3px #d7c1e5; }.recent-goals button:hover { background: #e7ddee; }.recent-goals p { margin: 10px; color: #7a6586; font-size: 11px; line-height: 1.8; }.recent-goals .all-goals { color: #7c648a; font-size: 10px; }
.sidebar-note { margin: auto 11px 24px; padding-top: 28px; }.sidebar-note > span { color: #7d6489; font-size: 22px; }.sidebar-note p { margin: 10px 0; color: #796584; font-size: 13px; line-height: 1.8; }.sidebar-note small { color: #7a6684; font-size: 9px; }
.user-card { display: flex; align-items: center; flex-shrink: 0; gap: 10px; padding: 17px 6px 0; border-top: 1px solid #ddd0e6; }.avatar { display: grid; place-items: center; width: 33px; height: 33px; border-radius: 50%; background: #e1d1ec; color: #845e98; font-size: 13px; }.user-card > div { min-width: 0; }.user-card strong { display: block; color: #7e628e; font-size: 12px; font-weight: 500; }.user-card small { display: block; margin-top: 4px; color: #7b6587; font-size: 9px; }.user-card button { margin-left: auto; padding: 6px; border: 0; background: none; color: #7c6488; font-size: 18px; }
@media(max-width: 1050px) { .sidebar { width: 200px; padding-inline: 12px; }.brand strong { font-size: 18px; }.brand small { font-size: 7px; } }
@media(max-width: 800px) { .sidebar { display: none; } }
@media(max-height: 750px) { .sidebar-note { display: none; }.recent-goals { flex: 1; margin-bottom: 18px; }.user-card { margin-top: auto; } }
</style>
