<script setup>
import DateStamp from './DateStamp.vue'
import PixelAccent from './PixelAccent.vue'
import PixelSelect from '../ui/PixelSelect.vue'
import PixelDateTimePicker from '../ui/PixelDateTimePicker.vue'
import { taskPriorities } from '../../utils/taskDraft'
import { taskUpdateChanges } from '../../utils/taskUpdate'
import { computed, nextTick, ref, useId, watch } from 'vue'
const props = defineProps({ task: { type: Object, required: true }, editState: { type: Object, required: true }, goalTitle: String, refreshing: Boolean, active: { type: Boolean, default: true } })
defineEmits(['open-goal', 'close', 'save', 'reset', 'verify'])
const fieldId = useId()
const title = ref(null)
const changes = computed(() => taskUpdateChanges(props.editState.baseline, props.editState.values))
const dirty = computed(() => Object.keys(changes.value.patch).length > 0 || Object.keys(changes.value.errors).length > 0)
const canSave = computed(() => dirty.value && !Object.keys(changes.value.errors).length && !props.editState.pending && !props.editState.blocked)
watch(() => props.editState.values, () => { props.editState.notice = '' }, { deep: true, flush: 'sync' })
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
    <header><span>任务详情</span><PixelAccent class="detail-art" kind="garden" /><button type="button" aria-label="关闭任务详情" @click="$emit('close')">×</button></header>
    <h2 ref="title" tabindex="-1">{{ task.title }}</h2>
    <div class="detail-tags"><span>{{ statuses[task.status] }}</span><span :class="{ important: task.priority === 'HIGH' }">{{ priorities[task.priority] }}</span></div>
    <form class="task-edit-form" aria-label="编辑任务资料" :aria-busy="editState.pending" @submit.prevent="$emit('save')">
      <fieldset :disabled="editState.pending">
        <div class="edit-field"><label :for="fieldId + '-title'">任务标题 <small>{{ editState.values.title.length }} / 300</small></label><textarea :id="fieldId + '-title'" v-model="editState.values.title" rows="2" maxlength="300" aria-label="修改任务标题" :aria-invalid="!!changes.errors.title" :aria-describedby="changes.errors.title ? fieldId + '-title-error' : undefined" /><p v-if="changes.errors.title" :id="fieldId + '-title-error'" class="field-error">{{ changes.errors.title }}</p></div>
        <div class="edit-field"><label :for="fieldId + '-priority'">优先级</label><PixelSelect :id="fieldId + '-priority'" v-model="editState.values.priority" label="编辑任务优先级" :options="taskPriorities" :disabled="editState.pending" :active="active" :invalid="!!changes.errors.priority" /></div>
        <div class="edit-field"><label :for="fieldId + '-deadline'">期待完成</label><PixelDateTimePicker :id="fieldId + '-deadline'" v-model="editState.values.deadline" label="编辑任务期待完成时间" clearable :disabled="editState.pending" :active="active" :invalid="!!changes.errors.deadline" /><small v-if="changes.patch.clearDeadline" class="clear-hint">保存后将清除原定时间。</small></div>
        <div class="edit-field"><label :for="fieldId + '-description'">任务说明 <small>可留空 · 最多 5000 字</small></label><textarea :id="fieldId + '-description'" v-model="editState.values.description" rows="3" maxlength="5000" aria-label="修改任务说明" :aria-invalid="!!changes.errors.description" /></div>
        <div class="edit-field"><label :for="fieldId + '-criteria'">完成标准 <small>可留空 · 最多 2000 字</small></label><textarea :id="fieldId + '-criteria'" v-model="editState.values.completionCriteria" rows="2" maxlength="2000" aria-label="修改完成标准" :aria-invalid="!!changes.errors.completionCriteria" /></div>
      </fieldset>
      <div v-if="editState.error" class="edit-error" role="alert"><p>{{ editState.error }}</p><template v-if="editState.blocked"><button type="button" :disabled="editState.pending || refreshing" @click="$emit('verify')">{{ refreshing ? '正在核对…' : '刷新列表核对' }}</button><small>需在新读取的列表中找到这项任务才能恢复保存；若任务移到其他页，请翻页查找。</small></template></div>
      <p v-if="editState.notice" class="edit-notice" role="status">{{ editState.notice }}</p>
      <footer><small v-if="dirty">有未保存的修改</small><div><button type="button" :disabled="editState.pending || !dirty" @click="$emit('reset')">撤销修改</button><button type="submit" class="save-task-edit" :disabled="!canSave">{{ editState.pending ? '正在保存…' : '保存修改' }}</button></div></footer>
    </form>
    <dl>
      <dt>归属</dt><dd><button v-if="task.goalId" class="goal-link" type="button" @click="$emit('open-goal', task.goalId)">↗ {{ goalTitle || '查看关联目标' }}</button><span v-else>独立任务</span></dd>
      <dt>创建时间</dt><dd><DateStamp :value="task.createdAt" label="" compact /></dd>
    </dl>
  </aside>
</template>

<style scoped>
.task-inspector { min-width: 0; align-self: start; padding: 22px; border: 1px solid var(--line-strong); background: #f3f5e9; box-shadow: 3px 3px 0 #c6d4c280; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px dashed var(--line-strong); font-size: 12px; color: var(--ink-500); }button { font: inherit; color: var(--accent-deep); cursor: pointer; }header button { width: 30px; height: 30px; border: 1px solid var(--line-strong); background: var(--paper); font-size: 20px; }
h2 { margin: 20px 0 14px; font-size: 20px; line-height: 1.7; font-weight: 600; overflow-wrap: anywhere; }.detail-tags { display: flex; flex-wrap: wrap; gap: 7px; }.detail-tags span { padding: 5px 8px; background: #e2eadc; font-size: 11px; }.detail-tags .important { color: #87582a; background: #f0e5cd; }
dl { margin: 24px 0 0; }dt { margin: 19px 0 8px; color: var(--ink-500); font-size: 11px; }dd { margin: 0; font-size: 13px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }.muted { color: var(--ink-500); }.goal-link { padding: 0; border: 0; background: none; text-align: left; line-height: inherit; }
.detail-art { width: 68px; height: 68px; margin-left: auto; }
.task-edit-form { margin-top: 24px; }fieldset { min-width: 0; padding: 0; margin: 0; border: 0; }.edit-field { display: grid; gap: 9px; margin: 0 0 18px; }.edit-field label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: 12px; }.edit-field small { color: var(--ink-500); font-size: 10px; font-weight: 400; line-height: 1.8; }textarea { width: 100%; min-height: 68px; max-height: 220px; resize: vertical; padding: 10px; color: var(--ink); border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper); font: 13px/1.85 var(--text-cn); }textarea:focus { outline: 2px solid var(--accent); outline-offset: 2px; }.field-error { margin: 0; font-size: 11px; color: var(--danger); }
.edit-error { padding: 12px; background: var(--danger-soft); color: var(--danger); font-size: 12px; line-height: 1.8; }.edit-error p { margin: 0; }.edit-error small { display: block; margin-top: 8px; font-size: 11px; }.edit-error button { padding: 7px 9px; margin-top: 10px; border: 1px solid var(--line-strong); background: var(--paper); }.edit-notice { margin: 12px 0; padding: 10px; background: #e4eddf; color: #3c624a; font-size: 12px; line-height: 1.8; }
footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 0 0; border-top: 1px dashed var(--line-strong); }footer small { color: var(--ink-500); font-size: 10px; }footer > div { display: flex; gap: 8px; margin-left: auto; }footer button { padding: 9px 12px; border: 1px solid var(--line-strong); border-radius: 2px; background: var(--paper); font-size: 12px; }footer .save-task-edit { color: var(--paper); background: var(--accent-deep); border-color: var(--accent-deep); }button:disabled { opacity: .5; cursor: not-allowed; }
</style>
