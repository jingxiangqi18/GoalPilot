<script setup>
defineProps({
  goal: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
})

defineEmits(['retry', 'cancel', 'dismiss-error'])
</script>

<template>
  <section class="launch-panel">
    <div class="launch-mark"><span>03</span><i></i></div>
    <div class="launch-copy">
      <span>READY GOAL · 待规划目标</span>
      <h1>{{ goal.goalText }}</h1>
      <p>目标记录 #{{ goal.id }} 已完成分析，正在使用后端保存的最新分析生成计划草稿。</p>
    </div>

    <div v-if="loading" class="launch-state" aria-live="polite">
      <span class="spinner"></span>
      <div><strong>正在生成并保存</strong><small>AI 生成后将自动写入计划、阶段与任务记录</small></div>
    </div>

    <div v-else-if="errorMessage" class="launch-error" role="alert">
      <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <button class="retry-button" type="button" @click="$emit('retry')">重新尝试</button>
    </div>

    <footer>
      <span><i></i>直接使用目标 ID 请求，不在浏览器拼装分析数据</span>
      <button type="button" @click="$emit('cancel')">返回新目标</button>
    </footer>
  </section>
</template>

<style scoped>
.launch-panel {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  padding: 44px;
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(239,240,248,.9));
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.launch-panel::after {
  content: '';
  position: absolute;
  right: -110px;
  bottom: -170px;
  width: 400px;
  height: 400px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(201,134,157,.18), rgba(104,113,170,.07) 48%, transparent 70%);
  border-radius: 50%;
}

.launch-mark { position: relative; z-index: 1; width: 64px; height: 64px; display: grid; place-items: center; color: var(--paper); background: linear-gradient(145deg, var(--coral-500), var(--coral-700)); border-radius: 18px; box-shadow: 0 12px 28px rgba(81,89,141,.2); font-size: 16px; font-weight: 700; }
.launch-mark i { position: absolute; right: 9px; bottom: 9px; width: 6px; height: 6px; background: var(--paper); border-radius: 50%; }
.launch-copy { position: relative; z-index: 1; max-width: 850px; }
.launch-copy > span { color: var(--coral-700); font-size: 10px; font-weight: 750; letter-spacing: .14em; }
.launch-copy h1 { margin: 13px 0 12px; color: var(--ink); font-family: var(--display); font-size: clamp(30px, 4vw, 50px); font-weight: 650; line-height: 1.14; letter-spacing: -.04em; }
.launch-copy p { margin: 0; color: var(--ink-600); font-size: 13px; line-height: 1.7; }

.launch-state,
.launch-error { position: relative; z-index: 1; grid-column: 2; min-height: 82px; padding: 17px 19px; display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,.75); border: 1px solid var(--line-strong); border-radius: var(--radius-md); backdrop-filter: blur(10px); }
.launch-state strong, .launch-state small { display: block; }
.launch-state strong { color: var(--ink); font-size: 13px; }
.launch-state small { margin-top: 4px; color: var(--ink-500); font-size: 10px; }
.spinner { width: 25px; height: 25px; flex: 0 0 auto; border: 2px solid var(--coral-300); border-top-color: var(--coral-700); border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.launch-error { justify-content: space-between; color: var(--danger); background: var(--danger-soft); border-color: var(--danger-line); }
.launch-error strong { font-size: 13px; }
.launch-error p { margin: 4px 0 0; font-size: 11px; }
.retry-button { min-height: 38px; padding: 0 14px; flex: 0 0 auto; color: var(--paper); background: var(--danger); border: 1px solid var(--danger); border-radius: 999px; font-size: 11px; font-weight: 700; }

.launch-panel footer { position: relative; z-index: 1; grid-column: 1 / -1; align-self: end; padding-top: 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-top: 1px solid var(--line); }
.launch-panel footer > span { display: flex; align-items: center; gap: 8px; color: var(--ink-500); font-size: 10px; }
.launch-panel footer > span i { width: 7px; height: 7px; background: var(--moss-600); border-radius: 50%; box-shadow: 0 0 0 4px var(--moss-100); }
.launch-panel footer button { padding: 8px 2px; color: var(--ink-600); background: transparent; border: 0; font-size: 11px; font-weight: 700; }
.launch-panel footer button:hover { color: var(--coral-700); }

@media (max-width: 700px) {
  .launch-panel { min-height: 320px; padding: 27px; grid-template-columns: 50px minmax(0, 1fr); gap: 18px; }
  .launch-mark { width: 50px; height: 50px; border-radius: 14px; font-size: 13px; }
  .launch-state, .launch-error { grid-column: 1 / -1; }
}

@media (max-width: 500px) {
  .launch-panel { grid-template-columns: 1fr; }
  .launch-error, .launch-panel footer { align-items: flex-start; flex-direction: column; }
  .retry-button { width: 100%; }
}
</style>
