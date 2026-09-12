<script setup>
import { computed } from 'vue'
import GoalStatusBadge from './GoalStatusBadge.vue'
import DateStamp from './DateStamp.vue'
import { priorityLabel } from '../../utils/goalPresentation'

const props = defineProps({ goal: { type: Object, required: true }, busy: Boolean, hasDraft: Boolean })
const goalLines = computed(() => String(props.goal.goalText || '').split('\n').filter(line => line.trim()))
defineEmits(['analyze', 'generate', 'plan'])
</script>

<template>
  <section class="goal-info-panel" aria-label="目标资料">
    <div class="info-heading"><span>目标备忘</span><GoalStatusBadge :status="goal.status" /></div>
    <h2>{{ goalLines[0] }}</h2>
    <div v-if="goalLines.length > 1" class="info-description"><p v-for="(line, index) in goalLines.slice(1)" :key="index">{{ line }}</p></div>
    <DateStamp :value="goal.createdAt" label="记录于" compact :show-time="false" />
    <dl>
      <div><dt>优先级</dt><dd>{{ priorityLabel(goal.priority) }}</dd></div>
      <div><dt>期待完成</dt><dd><DateStamp v-if="goal.deadline" :value="goal.deadline" label="" compact :show-time="false" /><span v-else>尚未设置</span></dd></div>
      <div><dt>成功标准</dt><dd>{{ goal.successCriteria || '尚未记录，可以在分析与澄清时补充。' }}</dd></div>
      <div><dt>约束与条件</dt><dd>{{ goal.constraintText || '尚未记录' }}</dd></div>
    </dl>
    <div class="info-actions">
      <button v-if="['DRAFT', 'NEEDS_CLARIFICATION'].includes(goal.status)" type="button" :disabled="busy" @click="$emit('analyze')">{{ goal.status === 'DRAFT' ? '分析这个目标' : '重新分析并继续澄清' }} <span>↗</span></button>
      <button v-if="goal.status === 'READY_TO_PLAN'" type="button" :disabled="busy" @click="$emit('generate')">{{ hasDraft ? '查看计划草稿' : '生成计划草稿' }} <span>↗</span></button>
      <button type="button" @click="$emit('plan')">查看计划与任务 <span>→</span></button>
    </div>
    <p class="info-note">这里是手动操作区。对话负责查询与解释；计划确认和任务状态由你亲自操作。</p>
    <DateStamp :value="goal.updatedAt || goal.createdAt" label="最近更新" compact />
  </section>
</template>

<style scoped>
.goal-info-panel { padding: 9px 3px 24px; font-family: var(--text-cn); }
.info-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }.info-heading > span { color: #786588; font-size: 12px; }
h2 { margin: 18px 0 17px; font-size: 20px; line-height: 1.8; font-weight: 500; overflow-wrap: anywhere; white-space: pre-wrap; }
.info-description { margin: -2px 0 20px; padding-left: 12px; border-left: 2px solid #d7c8e1; }.info-description p { margin: 5px 0; color: #786583; font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }
dl { margin: 28px 0; }dl > div { padding: 17px 0; border-top: 1px solid #e7e1ed; }dt { margin-bottom: 8px; color: #75687d; font-size: 12px; }dd { margin: 0; color: #514857; font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.info-actions { display: grid; gap: 9px; }.info-actions button { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 10px 15px; border: 0; border-radius: 12px; background: #ede7f3; color: #756082; font-size: 13px; }.info-actions button:hover:not(:disabled) { background: #e5dcef; }.info-actions button:disabled { opacity: .5; }
.info-note { margin: 19px 0 26px; color: #766880; font-size: 12px; line-height: 1.8; }
</style>
