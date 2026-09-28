<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getGoalDetails, updateGoal } from '../../api/goal'
import { goalEditValues, goalUpdateChanges, isGoalDetails } from '../../utils/goalUpdate'
import PixelSelect from '../ui/PixelSelect.vue'
import PixelDateTimePicker from '../ui/PixelDateTimePicker.vue'

const props = defineProps({ goal: { type: Object, required: true }, busy: Boolean, active: { type: Boolean, default: true } })
const emit = defineEmits(['saved', 'refreshed', 'busy-change', 'dirty-change'])
const baseline = ref({ ...props.goal })
const values = ref(goalEditValues(props.goal))
const form = ref(null)
const pending = ref(false)
const blocked = ref(false)
const error = ref('')
const notice = ref('')
const saved = ref(false)
let requestNumber = 0
const canEditText = computed(() => props.goal.status === 'DRAFT' && baseline.value.status === 'DRAFT')
const changes = computed(() => goalUpdateChanges({ ...baseline.value, status: props.goal.status }, values.value))
const validChanges = computed(() => !Object.keys(changes.value.errors).length && Object.keys(changes.value.patch).length > 0)
const disabled = computed(() => props.busy || pending.value)
const retainedText = computed(() => !canEditText.value && values.value.goalText.trim() !== props.goal.goalText.trim())
const dirty = computed(() => Object.keys(changes.value.patch).length > 0 || Object.keys(changes.value.errors).length > 0 || retainedText.value)
const priorityOptions = computed(() => [
  { value: '', label: '未设置', description: '暂不指定先后顺序', badge: '—', disabled: !!baseline.value.priority },
  { value: 'LOW', label: '低优先级', description: '按自己的节奏推进', badge: '↓', tone: 'low' },
  { value: 'MEDIUM', label: '中优先级', description: '纳入日常安排', badge: '＝', tone: 'medium' },
  { value: 'HIGH', label: '高优先级', description: '优先安排时间处理', badge: '↑', tone: 'high' },
])
watch(dirty, value => emit('dirty-change', value), { immediate: true })
watch(values, () => { saved.value = false; notice.value = '' }, { deep: true, flush: 'sync' })
watch(() => props.goal, goal => {
  if (pending.value) return
  mergeLatest(goal)
})

function mergeLatest(goal) {
  const previous = goalEditValues(baseline.value), fresh = goalEditValues(goal)
  for (const key of Object.keys(fresh)) {
    if (values.value[key] === previous[key]) values.value[key] = fresh[key]
  }
  baseline.value = { ...goal }
}
function resetChanges() {
  if (disabled.value) return
  values.value = goalEditValues(baseline.value)
  if (!blocked.value) error.value = ''
  notice.value = '未保存的修改已撤销。'
}

function setPending(value) {
  pending.value = value
  emit('busy-change', value)
}
async function save() {
  if (disabled.value || blocked.value || !validChanges.value) return
  const request = ++requestNumber
  const id = props.goal.id
  const patch = { ...changes.value.patch }
  setPending(true)
  error.value = ''
  notice.value = ''
  saved.value = false
  try {
    const updated = await updateGoal(id, patch)
    if (request !== requestNumber) return
    baseline.value = { ...updated }
    values.value = goalEditValues(updated)
    saved.value = true
    notice.value = '目标资料已保存，本次未修改计划或任务。'
    emit('saved', updated)
  } catch (cause) {
    if (request !== requestNumber) return
    blocked.value = cause?.status !== 400
    error.value = cause?.status === 409
      ? '目标状态已变化，暂不能按原来的资料保存。请重新读取后核对。'
      : cause?.status === 403 || cause?.status === 404
        ? '目标已不存在或无法访问，已暂停保存。可以重新读取，或返回目标库。'
        : cause?.status === 400
          ? cause.message
          : '无法确认保存结果，请重新读取资料后核对，不会自动重复提交。'
    await nextTick()
    form.value?.querySelector('[role="alert"]')?.focus({ preventScroll: true })
  } finally {
    if (request === requestNumber) setPending(false)
  }
}

async function reload() {
  if (disabled.value) return
  const request = ++requestNumber
  const id = props.goal.id
  setPending(true)
  try {
    const latest = await getGoalDetails(id)
    if (request !== requestNumber) return
    if (!isGoalDetails(latest, id)) throw new Error('返回的目标资料不完整。')
    // Keep user edits, but update fields they never touched to the latest values.
    mergeLatest(latest)
    blocked.value = false
    error.value = ''
    notice.value = '已读取最新资料，保留了你的输入。请核对后再保存；若没有变化，无需重复保存。'
    emit('refreshed', latest)
  } catch (cause) {
    if (request !== requestNumber) return
    error.value = `暂未读取到最新资料，输入已保留。${cause.message || '请稍后重试。'}`
  } finally {
    if (request === requestNumber) setPending(false)
  }
}

onBeforeUnmount(() => { requestNumber++; if (pending.value) emit('busy-change', false) })
</script>

<template>
  <form ref="form" class="goal-edit-form" aria-label="编辑目标资料" :aria-busy="pending" @submit.prevent="save">
    <fieldset :disabled="disabled">
      <div v-if="canEditText" class="edit-field">
        <label for="edit-goal-text">目标原文 <small>草稿可修改 · {{ values.goalText.length }} / 1000</small></label>
        <textarea id="edit-goal-text" v-model="values.goalText" rows="4" maxlength="1000" :aria-invalid="!!changes.errors.goalText" :aria-describedby="changes.errors.goalText ? 'edit-text-help' : 'goal-edit-help'" />
        <p v-if="changes.errors.goalText" id="edit-text-help" class="field-error">{{ changes.errors.goalText }}</p>
      </div>
      <details v-if="retainedText" class="retained-text"><summary>查看未保存的原文输入</summary><p>{{ values.goalText }}</p></details>
      <div class="edit-field">
        <label for="edit-goal-priority">优先级 <small>安排先后顺序</small></label>
        <PixelSelect id="edit-goal-priority" v-model="values.priority" label="选择目标优先级" :options="priorityOptions" :disabled="disabled" :active="active" :invalid="!!changes.errors.priority" :described-by="changes.errors.priority ? 'edit-priority-help' : 'goal-edit-help'" />
        <p v-if="changes.errors.priority" id="edit-priority-help" class="field-error">{{ changes.errors.priority }}</p>
      </div>
      <div class="edit-field">
        <label for="edit-goal-deadline">期待完成 <small>选填 · 精确到分钟</small></label>
        <PixelDateTimePicker id="edit-goal-deadline" v-model="values.deadline" :disabled="disabled" :active="active" :clearable="!baseline.deadline" :invalid="!!changes.errors.deadline" :described-by="changes.errors.deadline ? 'edit-deadline-help' : 'goal-edit-help'" />
        <p v-if="changes.errors.deadline" id="edit-deadline-help" class="field-error">{{ changes.errors.deadline }}</p>
      </div>
    </fieldset>
    <p id="goal-edit-help" class="edit-rule">直接调整上方资料，点击保存后生效。已设置的优先级和时间暂不支持清空。</p>
    <slot />
    <div v-if="error" class="edit-feedback error" role="alert" tabindex="-1"><p>{{ error }}</p><button v-if="blocked" type="button" :disabled="disabled" @click="reload">{{ pending ? '正在读取…' : '重新读取，保留输入' }}</button></div>
    <p v-if="notice" class="edit-feedback" :class="{ 'info-saved': saved }" role="status">{{ notice }}</p>
    <footer><span><i :class="{ dirty: dirty || blocked }" aria-hidden="true"></i>{{ pending ? '正在同步…' : blocked ? '请先核对资料' : dirty ? '有未保存的修改' : '资料已同步' }}</span><div><button type="button" :disabled="disabled || !dirty" @click="resetChanges">撤销修改</button><button class="save-goal" type="submit" :disabled="disabled || blocked || !validChanges">{{ pending ? '同步中…' : '保存修改' }}</button></div></footer>
  </form>
</template>

<style scoped>
.goal-edit-form { margin: 20px 0; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }.edit-field { padding: 17px 0; border-top: 1px solid var(--line); }label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; color: var(--ink-700); font-size: 12px; font-weight: 600; }label small { color: var(--ink-500); font-size: 10px; font-weight: 400; }
input, textarea { display: block; min-width: 0; width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: #f7f8f0; color: var(--ink); font: inherit; font-size: 14px; line-height: 1.8; transition: background .15s, box-shadow .15s; }textarea { resize: vertical; min-height: 105px; max-height: 280px; }input:focus, textarea:focus { background: var(--paper); outline: 2px solid var(--accent); outline-offset: 2px; box-shadow: 3px 3px 0 #b8cbbb55; }[aria-invalid="true"] { border-color: var(--danger); }.edit-field p, .edit-rule { margin: 9px 0 0; color: var(--ink-500); font-size: 11px; line-height: 1.8; }.edit-rule { margin: 0 0 20px; }.edit-field .field-error { color: var(--danger); }.deadline-preview { margin-top: 10px; }.retained-text { margin: 0 0 15px; color: var(--ink-600); font-size: 12px; }.retained-text p { white-space: pre-wrap; overflow-wrap: anywhere; }
.edit-feedback { margin: 14px 0; padding: 12px; color: var(--ink-700); background: var(--accent-soft); font-size: 12px; line-height: 1.8; }.edit-feedback.error { color: var(--danger); background: var(--danger-soft); }.edit-feedback p { margin: 0 0 10px; }button { min-height: 36px; padding: 8px 12px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); color: var(--ink-700); background: var(--paper); font: inherit; font-size: 12px; }button:disabled { opacity: .5; cursor: not-allowed; }button:hover:not(:disabled) { background: var(--accent-soft); }.save-goal { color: var(--paper); background: var(--accent-deep); border-color: var(--accent-deep); box-shadow: 2px 2px 0 #afc3b2; }.save-goal:hover:not(:disabled) { background: var(--accent); }
footer { position: sticky; z-index: 2; bottom: -22px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; padding: 13px 0; border-top: 1px dashed var(--line-strong); background: var(--paper); }footer > span { display: flex; align-items: center; gap: 7px; color: var(--ink-500); font-size: 11px; }footer i { width: 5px; height: 5px; background: #79947d; }footer i.dirty { background: var(--warm-accent); }footer > div { display: flex; gap: 8px; margin-left: auto; }
@media(prefers-reduced-motion: reduce) { input, textarea { transition: none; } }
</style>
