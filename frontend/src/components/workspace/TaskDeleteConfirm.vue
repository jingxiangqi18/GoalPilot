<script setup>
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
defineProps({ task: { type: Object, required: true }, pending: Boolean })
const emit = defineEmits(['cancel', 'confirm'])
const dialog = ref(null), id = useId()
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="task-delete-confirm" :aria-labelledby="id + '-title'" :aria-describedby="id + '-description'" :aria-busy="pending" @cancel.prevent="!pending && emit('cancel')">
      <span class="delete-symbol" aria-hidden="true">−</span>
      <h2 :id="id + '-title'">删除这项任务？</h2>
      <strong>{{ task.title }}</strong>
      <p :id="id + '-description'">删除后无法恢复，未保存的修改也会丢弃。</p>
      <div><button type="button" autofocus :disabled="pending" @click="emit('cancel')">保留任务</button><button type="button" class="confirm-delete" :disabled="pending" @click="emit('confirm')">{{ pending ? '正在删除…' : '确认删除' }}</button></div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.task-delete-confirm { box-sizing: border-box; width: min(430px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); overflow-y: auto; padding: 28px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--paper); color: var(--ink); box-shadow: 4px 5px 0 #8a9a8040, 0 24px 80px #233a3430; font-family: var(--text-cn); }
.task-delete-confirm::backdrop { background: #243e3866; backdrop-filter: blur(3px); }
.delete-symbol { display: grid; place-items: center; width: 34px; height: 34px; color: var(--danger); background: var(--danger-soft); border: 1px solid currentColor; border-radius: 4px; font-size: 25px; }
h2 { margin: 20px 0 12px; font-size: 20px; font-weight: 600; }strong { display: block; overflow-wrap: anywhere; font-size: 14px; line-height: 1.8; font-weight: 500; }p { font-size: 12px; line-height: 1.8; color: var(--ink-600); }
.task-delete-confirm > div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }button { padding: 10px 16px; border: 1px solid var(--line); border-radius: 4px; background: var(--canvas); color: var(--ink); font: 12px var(--text-cn); }.confirm-delete { background: var(--danger); border-color: var(--danger); color: white; }button:disabled { opacity: .6; cursor: wait; }
</style>
