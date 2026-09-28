<script setup>
import DateStamp from './DateStamp.vue'
import { nextTick, ref, watch } from 'vue'
const props = defineProps({ task: { type: Object, required: true }, goalTitle: String })
defineEmits(['open-goal', 'close'])
const title = ref(null)
watch(() => props.task.id, async () => {
  await nextTick()
  title.value?.focus({ preventScroll: true })
  if (window.matchMedia('(max-width: 1100px)').matches) title.value?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
}, { immediate: true })
const statuses = { TODO: '待开始', IN_PROGRESS: '进行中', DONE: '已完成', SKIPPED: '已跳过' }
const priorities = { LOW: '低优先级', MEDIUM: '中优先级', HIGH: '高优先级' }
</script>

<template>
  <aside id="selected-task-details" class="task-inspector" aria-label="任务详情" @keydown.esc.stop="$emit('close')">
    <header><span>任务详情</span><button type="button" aria-label="关闭任务详情" @click="$emit('close')">×</button></header>
    <h2 ref="title" tabindex="-1">{{ task.title }}</h2>
    <div class="detail-tags"><span>{{ statuses[task.status] }}</span><span :class="{ important: task.priority === 'HIGH' }">{{ priorities[task.priority] }}</span></div>
    <dl><dt>期待完成</dt><dd><DateStamp v-if="task.deadline" :value="task.deadline" label="" compact /><span v-else class="muted">尚未设置</span></dd>
      <dt>任务说明</dt><dd>{{ task.description || '尚未填写说明' }}</dd>
      <dt>完成标准</dt><dd>{{ task.completionCriteria || '尚未填写完成标准' }}</dd>
      <dt>归属</dt><dd><button v-if="task.goalId" class="goal-link" type="button" @click="$emit('open-goal', task.goalId)">↗ {{ goalTitle || '查看关联目标' }}</button><span v-else>独立任务</span></dd>
      <dt>创建时间</dt><dd><DateStamp :value="task.createdAt" label="" compact /></dd>
    </dl>
    <p class="read-only-note">当前支持新建与查看。任务编辑、完成及删除将在对应接口接入后开放。</p>
  </aside>
</template>

<style scoped>
.task-inspector { min-width: 0; align-self: start; padding: 22px; border: 1px solid var(--line-strong); background: #f3f5e9; box-shadow: 3px 3px 0 #c6d4c280; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px dashed var(--line-strong); font-size: 12px; color: var(--ink-500); }button { font: inherit; color: var(--accent-deep); cursor: pointer; }header button { width: 30px; height: 30px; border: 1px solid var(--line-strong); background: var(--paper); font-size: 20px; }
h2 { margin: 20px 0 14px; font-size: 20px; line-height: 1.7; font-weight: 600; overflow-wrap: anywhere; }.detail-tags { display: flex; flex-wrap: wrap; gap: 7px; }.detail-tags span { padding: 5px 8px; background: #e2eadc; font-size: 11px; }.detail-tags .important { color: #87582a; background: #f0e5cd; }
dl { margin: 24px 0 0; }dt { margin: 19px 0 8px; color: var(--ink-500); font-size: 11px; }dd { margin: 0; font-size: 13px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }.muted { color: var(--ink-500); }.goal-link { padding: 0; border: 0; background: none; text-align: left; line-height: inherit; }
.read-only-note { margin: 22px 0 0; padding-top: 14px; border-top: 1px dashed var(--line-strong); font-size: 11px; line-height: 1.85; color: var(--ink-500); }
</style>
