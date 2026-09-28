<script setup>
import { computed, nextTick, ref } from 'vue'
import PixelSelect from '../ui/PixelSelect.vue'
import PixelDateTimePicker from '../ui/PixelDateTimePicker.vue'
import { taskCreateChanges, taskPriorities } from '../../utils/taskDraft'

const props = defineProps({ state: { type: Object, required: true }, goals: { type: Array, default: () => [] }, goal: Object, active: { type: Boolean, default: true } })
defineEmits(['submit', 'close'])
const titleInput = ref(null)
const changes = computed(() => taskCreateChanges(props.state.draft))
const valid = computed(() => !Object.keys(changes.value.errors).length)
const goalOptions = computed(() => {
  const items = new Map(props.goals.map(goal => [goal.id, goal]))
  if (props.goal) items.set(props.goal.id, props.goal)
  const options = [{ value: '', label: '不关联目标', description: '一件独立的待办', badge: '□' }, ...[...items.values()].map(goal => ({ value: goal.id, label: goal.goalText, badge: '↗' }))]
  if (props.state.draft.goalId && !items.has(props.state.draft.goalId)) options.push({ value: props.state.draft.goalId, label: '此前选择的目标', description: '保存时会核对访问权限', badge: '↗' })
  return options
})
async function focusTitle() { await nextTick(); titleInput.value?.focus({ preventScroll: true }) }
defineExpose({ focusTitle })
</script>

<template>
  <form class="task-create-form" aria-label="新建待办任务" :aria-busy="state.pending" @submit.prevent="$emit('submit')">
    <header><div><strong>记下一件具体的事</strong><small>直接保存任务，不调用 AI</small></div><button type="button" aria-label="收起新建任务，保留草稿" @click="$emit('close')">−</button></header>
    <fieldset :disabled="state.pending">
      <label class="task-field"><span>任务标题 <small>{{ state.draft.title.length }} / 300</small></span><textarea ref="titleInput" v-model="state.draft.title" rows="2" maxlength="300" placeholder="例如：整理项目演示视频" aria-label="任务标题" /></label>
      <p v-if="state.draft.title && changes.errors.title" class="field-error">{{ changes.errors.title }}</p>
      <button class="detail-toggle" type="button" :aria-expanded="state.detailsOpen" @click="state.detailsOpen = !state.detailsOpen">{{ state.detailsOpen ? '− 收起' : '＋ 补充' }} 说明、时间与关联目标</button>
      <div v-show="state.detailsOpen" class="task-extra" :inert="!state.detailsOpen">
        <div class="task-field"><span>关联目标</span><PixelSelect v-model="state.draft.goalId" label="任务关联目标" :options="goalOptions" :disabled="state.pending" :active="active && state.detailsOpen" /><small>这里列出最近目标；其他目标可从目标库进入会话后添加任务。</small></div>
        <div class="task-field"><span>优先级</span><PixelSelect v-model="state.draft.priority" label="任务优先级" :options="taskPriorities" :disabled="state.pending" :active="active && state.detailsOpen" /></div>
        <div class="task-field"><span>期待完成 <small>选填</small></span><PixelDateTimePicker v-model="state.draft.deadline" label="任务期待完成时间" clearable :disabled="state.pending" :active="active && state.detailsOpen" /></div>
        <label class="task-field"><span>任务说明 <small>选填 · 最多 5000 字</small></span><textarea v-model="state.draft.description" rows="3" maxlength="5000" aria-label="任务说明" placeholder="要做什么，有哪些注意事项？" /></label>
        <label class="task-field"><span>完成标准 <small>选填 · 最多 2000 字</small></span><textarea v-model="state.draft.completionCriteria" rows="2" maxlength="2000" aria-label="任务完成标准" placeholder="做到什么程度，就可以算完成？" /></label>
      </div>
      <p v-if="goal && state.draft.goalId === goal.id" class="link-hint">↗ 将关联当前目标，不改动已有计划。</p>
      <p v-else class="link-hint">{{ state.draft.goalId ? '↗ 将关联所选目标，不改动已有计划。' : '□ 不必先建立目标，也可以记录任务。' }}</p>
    </fieldset>
    <div v-if="state.error" class="task-error" role="alert"><p>{{ state.error }}</p><label v-if="state.uncertain"><input v-model="state.retryAcknowledged" type="checkbox" :disabled="state.pending" />已核对未保存，允许重新提交</label></div>
    <footer><small>仅保存任务，不会自动完成或排期</small><button type="submit" class="create-task-submit" :disabled="!valid || state.pending || (state.uncertain && !state.retryAcknowledged)">{{ state.pending ? '正在保存…' : state.uncertain ? '确认重新提交' : '保存任务' }} <span aria-hidden="true">＋</span></button></footer>
  </form>
</template>

<style scoped>
.task-create-form { padding: 17px; border: 1px solid var(--line-strong); border-radius: 3px; background: #f7f8ed; box-shadow: 3px 3px 0 #cbd8c477; }header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; }header strong { display: block; font-size: 14px; font-weight: 600; }header small { display: block; margin-top: 5px; color: var(--ink-500); font-size: 10px; }button { border: 1px solid var(--line); border-radius: 2px; color: var(--accent-deep); background: var(--paper); font: inherit; cursor: pointer; }header button { align-self: flex-start; width: 28px; height: 28px; }fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }.task-field { display: grid; gap: 8px; margin-bottom: 16px; }.task-field > span { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }.task-field small { color: var(--ink-500); font-size: 10px; font-weight: 400; line-height: 1.7; }textarea { width: 100%; min-height: 70px; max-height: 230px; resize: vertical; padding: 11px; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper); color: var(--ink); font: inherit; font-size: 13px; line-height: 1.8; }textarea:focus { outline: 2px solid var(--accent); outline-offset: 2px; }.task-extra { margin-top: 16px; }.detail-toggle { padding: 7px 0; border: 0; background: none; font-size: 11px; }.link-hint { color: var(--ink-500); font-size: 10px; line-height: 1.8; overflow-wrap: anywhere; }footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--line); }footer small { max-width: 170px; color: var(--ink-500); font-size: 10px; line-height: 1.7; }footer button { margin-left: auto; padding: 9px 12px; color: var(--paper); background: var(--accent-deep); border-color: var(--accent-deep); box-shadow: 2px 2px 0 #b4c7b6; font-size: 12px; }footer span { padding-left: 8px; }button:disabled { opacity: .5; cursor: not-allowed; }.task-error { padding: 12px; color: var(--danger); background: var(--danger-soft); font-size: 12px; line-height: 1.8; }.task-error p { margin: 0; }.task-error label { display: flex; align-items: start; gap: 7px; margin-top: 12px; }.task-error input { margin-top: 5px; accent-color: var(--accent); }.field-error { color: var(--danger); font-size: 11px; }
</style>
