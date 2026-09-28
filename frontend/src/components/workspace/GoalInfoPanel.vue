<script setup>
import { computed, ref, watch } from 'vue'
import GoalStatusBadge from './GoalStatusBadge.vue'
import DateStamp from './DateStamp.vue'
import GoalEditForm from './GoalEditForm.vue'

const props = defineProps({ goal: { type: Object, required: true }, busy: Boolean, hasDraft: Boolean, active: { type: Boolean, default: true } })
const goalLines = computed(() => String(props.goal.goalText || '').split('\n').filter(line => line.trim()))
const emit = defineEmits(['analyze', 'generate', 'plan', 'goal-updated', 'edit-busy', 'dirty-change'])
const dirty = ref(false)
watch(dirty, value => emit('dirty-change', value))
</script>

<template>
  <section class="goal-info-panel" aria-label="目标资料">
    <div class="info-heading"><span>目标备忘</span><GoalStatusBadge :status="goal.status" /><small>可直接调整资料</small></div>
    <template v-if="goal.status !== 'DRAFT'">
    <h2>{{ goalLines[0] }}</h2>
    <div v-if="goalLines.length > 1" class="info-description"><p v-for="(line, index) in goalLines.slice(1)" :key="index">{{ line }}</p></div>
    <p class="original-note">原文已锁定，优先级和期待完成时间仍可调整。</p>
    </template>
    <GoalEditForm :goal="goal" :busy="busy" :active="active" @saved="emit('goal-updated', $event)" @refreshed="emit('goal-updated', $event)" @busy-change="emit('edit-busy', $event)" @dirty-change="dirty = $event">
      <dl>
        <div><dt>成功标准 <small>只读</small></dt><dd>{{ goal.successCriteria || '尚未记录，可以在分析与澄清时补充。' }}</dd></div>
        <div><dt>约束与条件 <small>只读</small></dt><dd>{{ goal.constraintText || '尚未记录' }}</dd></div>
      </dl>
    </GoalEditForm>
    <div class="info-actions">
      <button v-if="['DRAFT', 'NEEDS_CLARIFICATION'].includes(goal.status)" type="button" :disabled="busy || dirty" @click="$emit('analyze')">{{ goal.status === 'DRAFT' ? '分析这个目标' : '重新分析并继续澄清' }} <span>↗</span></button>
      <button v-if="goal.status === 'READY_TO_PLAN'" type="button" :disabled="busy || dirty" @click="$emit('generate')">{{ hasDraft ? '查看计划草稿' : '生成计划草稿' }} <span>↗</span></button>
      <button type="button" @click="$emit('plan')">查看计划与任务 <span>→</span></button>
    </div>
    <p class="info-note">{{ dirty ? '先保存或撤销资料修改，再继续分析与规划。' : '对话读取已保存的资料；修改资料不会自动重算分析或计划。' }}</p>
    <DateStamp :value="goal.updatedAt || goal.createdAt" label="最近更新" compact />
  </section>
</template>

<style scoped>
.goal-info-panel { padding: 9px 3px 24px; font-family: var(--text-cn); }
.info-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }.info-heading > span { color: var(--ink-500); font-size: 12px; }.info-heading > small { margin-left: auto; color: var(--ink-500); font-size: 10px; }.original-note { margin: -5px 0 15px; font-size: 11px; color: var(--ink-500); line-height: 1.8; }
h2 { margin: 18px 0 17px; font-size: 20px; line-height: 1.8; font-weight: 500; overflow-wrap: anywhere; white-space: pre-wrap; }
.info-description { margin: -2px 0 20px; padding-left: 12px; border-left: 2px solid var(--line); }.info-description p { margin: 5px 0; color: var(--ink-500); font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }
dl { margin: 0; }dl > div { padding: 17px 0; border-top: 1px solid var(--line); }dt { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--ink-700); font-size: 12px; }dt small { padding: 2px 5px; color: var(--ink-500); background: var(--canvas-soft); font-size: 9px; }dd { margin: 0; color: var(--ink-700); font-size: 13px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.info-actions { display: grid; gap: 9px; }.info-actions button { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 10px 15px; border: 0; border-radius: var(--radius-sm); background: var(--canvas-soft); color: var(--ink-700); font-size: 13px; }.info-actions button:hover:not(:disabled) { background: var(--accent-soft); }.info-actions button:disabled { opacity: .5; }
.info-note { margin: 19px 0 26px; color: var(--ink-500); font-size: 12px; line-height: 1.8; }
</style>
