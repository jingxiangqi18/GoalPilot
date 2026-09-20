<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
defineProps({ user: { type: Object, required: true } })
const emit = defineEmits(['logout'])
const open = ref(false)
const root = ref(null)
const trigger = ref(null)
const logout = ref(null)
const id = useId()
async function toggle() {
  open.value = !open.value
  if (open.value) { await nextTick(); logout.value?.focus() }
}
function close(restoreFocus = false) {
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}
function requestLogout() { close(true); emit('logout') }
function outside(event) { if (!root.value?.contains(event.target)) close() }
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <div ref="root" class="account-control" @keydown.esc.stop.prevent="close(true)" @focusout="event => { if (!root?.contains(event.relatedTarget)) close() }">
    <button ref="trigger" class="current-user" type="button" aria-label="账户菜单" :aria-expanded="open" :aria-controls="id" @click="toggle"><i>{{ user.username?.charAt(0).toUpperCase() || 'G' }}</i><span>{{ user.username }}</span><small aria-hidden="true">⌄</small></button>
    <div v-if="open" :id="id" class="account-popover" aria-label="当前账户">
      <span>当前账户</span><strong>{{ user.username }}</strong><p v-if="user.email">{{ user.email }}</p>
      <button ref="logout" type="button" @click="requestLogout">退出登录 <span aria-hidden="true">↪</span></button>
    </div>
  </div>
</template>

<style scoped>
.account-control { position: relative; }
.current-user { display: flex; align-items: center; gap: 9px; padding: 4px; color: var(--ink-700); background: transparent; border: 0; font-size: 12px; }
.current-user i { display: grid; place-items: center; width: 32px; height: 32px; font-style: normal; }.current-user small { color: var(--ink-500); }
.account-popover { position: absolute; right: 0; top: calc(100% + 10px); z-index: 50; width: 245px; max-width: calc(100vw - 32px); padding: 18px; background: var(--paper); border: 1px solid var(--line-strong); box-shadow: 4px 4px 0 #8fa7a033, 0 12px 32px #26394312; animation: account-appear .15s ease-out; }
.account-popover > span { color: var(--ink-500); font-size: 10px; }.account-popover strong { display: block; margin-top: 9px; font-size: 14px; overflow-wrap: anywhere; }.account-popover p { margin: 5px 0 0; color: var(--ink-500); font-size: 11px; overflow-wrap: anywhere; }
.account-popover button { width: 100%; display: flex; justify-content: space-between; margin-top: 16px; padding: 12px 0 0; border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--ink-700); font-size: 12px; }
@keyframes account-appear { from { opacity: 0; transform: translateY(-4px); } }
@media(max-width: 800px) { .current-user > span { display: none; } }
@media(prefers-reduced-motion: reduce) { .account-popover { animation: none; } }
</style>
