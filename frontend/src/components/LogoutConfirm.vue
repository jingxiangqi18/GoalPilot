<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
const emit = defineEmits(['cancel', 'confirm'])
const dialog = ref(null)
function keepFocus(event) {
  if (event.key !== 'Tab') return
  const buttons = [...dialog.value.querySelectorAll('button:not(:disabled)')]
  const first = buttons[0], last = buttons.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="logout-confirm" aria-labelledby="logout-title" aria-describedby="logout-description" @cancel.prevent="emit('cancel')" @keydown="keepFocus">
      <span class="logout-mark" aria-hidden="true">↪</span>
      <h2 id="logout-title">要退出当前账户吗？</h2>
      <p id="logout-description">未提交的输入与本地对话会清空。已保存的目标和计划不会删除。</p>
      <div><button type="button" autofocus @click="emit('cancel')">继续使用</button><button type="button" class="confirm" @click="emit('confirm')">确认退出</button></div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.logout-confirm { box-sizing: border-box; width: min(420px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); overflow-y: auto; padding: 28px; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper); color: var(--ink); box-shadow: 5px 5px 0 #b4c3b580, 0 24px 80px #26394330; font-family: var(--text-cn); animation: logout-appear .18s ease-out; }
.logout-confirm::backdrop { background: #26394370; backdrop-filter: blur(3px); }
.logout-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--line); background: var(--canvas); color: var(--accent); font-size: 23px; }
h2 { margin: 20px 0 12px; font-size: 20px; font-weight: 600; }p { margin: 0; color: var(--ink-500); line-height: 1.9; font-size: 13px; }
.logout-confirm > div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }button { padding: 10px 16px; border: 1px solid var(--line); border-radius: 2px; color: var(--ink); background: var(--canvas); font-size: 12px; }.confirm { background: var(--accent-deep); color: var(--paper); border-color: var(--accent-deep); }
@keyframes logout-appear { from { opacity: 0; transform: translateY(6px); } }
@media(prefers-reduced-motion: reduce) { .logout-confirm { animation: none; } }
</style>
