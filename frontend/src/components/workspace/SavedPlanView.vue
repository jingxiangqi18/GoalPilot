<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { getActivePlan } from '../../api/plan'
import PlanRoadmap from './PlanRoadmap.vue'

const props = defineProps({ goal: { type: Object, required: true } })
defineEmits(['back'])
const plan = ref(null)
const loading = ref(false)
const error = ref('')
const unavailable = ref(false)
let requestNumber = 0

async function loadPlan() {
  const request = ++requestNumber
  const goalId = props.goal.id
  loading.value = true
  error.value = ''
  unavailable.value = false
  plan.value = null
  try {
    const data = await getActivePlan(goalId)
    if (request !== requestNumber) return
    if (data?.status !== 'ACTIVE' || data?.goalId !== goalId || !Array.isArray(data?.stages)) {
      throw new Error('返回的正式计划数据不完整，请重试。')
    }
    plan.value = data
  } catch (cause) {
    if (request !== requestNumber) return
    unavailable.value = cause?.status === 404
    error.value = unavailable.value
      ? '该目标没有可读取的正式计划，或目标已不存在。可以返回目标库确认最新状态。'
      : cause instanceof Error ? cause.message : '暂时无法读取正式计划，请稍后重试。'
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

watch(() => props.goal.id, loadPlan, { immediate: true })
onBeforeUnmount(() => { requestNumber++ })
</script>

<template>
  <section class="saved-plan-view" aria-label="已保存的正式计划">
    <header class="saved-plan-nav">
      <button type="button" class="back-button" @click="$emit('back')">← 返回目标库</button>
      <span class="source-goal" :title="goal.goalText">{{ goal.goalText }}</span>
      <button type="button" :disabled="loading" @click="loadPlan">{{ loading ? '正在读取…' : '刷新计划' }}</button>
    </header>
    <div v-if="loading" class="plan-loading" role="status"><span class="loading-symbol">↗</span><h1>正在打开你的行动路线</h1><p>读取已保存的正式版本，不会重新生成计划。</p><div class="loading-lines"><i></i><i></i><i></i></div></div>
    <div v-else-if="error" class="plan-unavailable" :role="unavailable ? 'status' : 'alert'">
      <span class="empty-symbol">{{ unavailable ? '◇' : '!' }}</span>
      <h1>{{ unavailable ? '暂时没有可读取的正式计划' : '正式计划读取失败' }}</h1>
      <p>{{ error }}</p>
      <div><button type="button" @click="$emit('back')">返回目标库</button><button type="button" @click="loadPlan">重新读取 ↗</button></div>
    </div>
    <PlanRoadmap v-else-if="plan" :plan="plan" read-only @reset="$emit('back')" />
  </section>
</template>

<style scoped>
.saved-plan-view { display: grid; gap: 22px; }
.saved-plan-nav { display: flex; align-items: center; gap: 18px; padding: 0 0 16px; border-bottom: 1px solid #dedbe780; }
.saved-plan-nav button, .plan-unavailable button { padding: 10px 14px; border: 1px solid var(--line-strong); border-radius: 9px; background: var(--paper); font-size: 12px; white-space: nowrap; }
.saved-plan-nav button { color: #756b87; border: 0; border-radius: 8px; background: #ffffff90; }
.saved-plan-nav button:hover:not(:disabled) { background: #eae5f2; }
.saved-plan-nav .back-button { color: #6f6289; background: transparent; padding-left: 0; }
.source-goal { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-500); font-size: 13px; }
.plan-loading, .plan-unavailable { padding: 48px 24px; display: grid; justify-items: center; text-align: center; border: 1px solid var(--line-strong); border-radius: 20px; background: linear-gradient(130deg, white, #f4f3fa, #faf4f6); }
.loading-symbol, .empty-symbol { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 18px; background: var(--coral-100); color: var(--coral-700); font-size: 27px; }
.plan-loading h1, .plan-unavailable h1 { margin: 22px 0 10px; font-size: clamp(21px, 2vw, 28px); font-weight: 600; }
.plan-loading p, .plan-unavailable p { margin: 0; max-width: 540px; font-size: 13px; color: var(--ink-600); line-height: 1.8; }
.plan-unavailable > div { margin-top: 24px; display: flex; gap: 10px; }
.plan-unavailable button:last-child { color: white; background: var(--coral-700); border-color: var(--coral-700); }
.loading-lines { width: min(500px, 100%); margin-top: 30px; display: grid; gap: 12px; }
.loading-lines i { height: 50px; border-radius: 10px; background: linear-gradient(90deg, #e6e6f0, #f7f7fc, #e6e6f0); background-size: 200% 100%; animation: plan-shimmer 1.5s linear infinite; }
@keyframes plan-shimmer { to { background-position: -200% 0; } }
@media(max-width: 600px) { .saved-plan-nav { flex-wrap: wrap; gap: 10px; }.source-goal { flex-basis: 100%; order: 1; }.saved-plan-nav > button:last-child { margin-left: auto; } }
</style>
