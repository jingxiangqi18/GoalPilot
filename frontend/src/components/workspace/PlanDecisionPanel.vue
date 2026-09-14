<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
  activeRequest: { type: String, default: null },
  readOnly: { type: Boolean, default: false },
  actionBlocked: { type: Boolean, default: false },
})
const emit = defineEmits(['approve', 'reject', 'regenerate', 'reset', 'open-library'])
const decision = ref(null)
const cancelButton = ref(null)
const panelTitle = ref(null)
const busy = computed(() => !!props.activeRequest)
const draft = computed(() => props.plan.status === 'DRAFT' && !props.readOnly && !props.actionBlocked)
const rejected = computed(() => props.plan.status === 'REJECTED')
const active = computed(() => props.plan.status === 'ACTIVE')
const copy = computed(() => {
  if (props.actionBlocked) return ['请先核对目标状态', '旧草稿的操作已暂停，目标库会为你展示最新的目标状态。']
  if (active.value) return [`正式计划已启用 · V${props.plan.versionNumber || 1}`, '方向已定。从第一件小事开始，按自己的节奏向前。']
  if (rejected.value) return ['这版草稿未采用，目标仍然保留', '你可以保留这次思考，再手动生成一份新的草稿。']
  if (props.plan.status === 'DRAFT') return ['这条路线，符合你的期待吗？', '合适就确认启用；不合适也没关系，可以不采用这版。']
  return ['这份计划仅供回看', '当前版本不支持继续确认或放弃。']
})

watch(() => [props.plan.planId, props.plan.status, props.actionBlocked, props.readOnly], async () => {
  const hadDecision = Boolean(decision.value)
  decision.value = null
  if (hadDecision) {
    await nextTick()
    panelTitle.value?.focus({ preventScroll: true })
  }
})

function choose(action) {
  if (!draft.value || busy.value || !props.plan.planId) return
  decision.value = action
}

function focusConfirmation() {
  if (decision.value) cancelButton.value?.focus({ preventScroll: true })
}

async function cancel() {
  if (busy.value) return
  decision.value = null
  await nextTick()
  panelTitle.value?.focus({ preventScroll: true })
}

function confirm() {
  if (!draft.value || busy.value || !props.plan.planId) return
  if (decision.value === 'approve') emit('approve')
  if (decision.value === 'reject') emit('reject')
}

function handleEscape(event) {
  if (!decision.value) return
  event.stopPropagation()
  cancel()
}
</script>

<template>
  <footer class="plan-decision" :class="{ 'is-rejected': rejected, 'is-active': active, 'is-blocked': actionBlocked, 'is-reading': readOnly }" :aria-busy="busy" @keydown.esc="handleEscape">
    <div class="decision-copy" role="status">
      <div class="decision-seal" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none"><path d="M9 32C8 17 21 8 34 14s6 25-6 24S13 22 23 21s0 12-7 8" /><path v-if="active" class="seal-symbol" d="m20 23 5 5 9-11" /><path v-else class="seal-symbol" d="M27 15v8m-4-4h8" /></svg>
        <span>✧</span>
      </div>
      <div><span class="decision-eyebrow">{{ active ? 'A LITTLE CLOSER' : rejected ? 'ROOM FOR A NEW DIRECTION' : 'YOUR NEXT STEP' }}</span><h3 ref="panelTitle" tabindex="-1">{{ copy[0] }}</h3><p>{{ copy[1] }}</p></div>
    </div>

    <slot name="notice" />
    <Transition name="decision-unfold" mode="out-in" @after-enter="focusConfirmation">
      <section v-if="decision && draft" key="confirmation" class="decision-confirmation" :class="decision" role="group" aria-labelledby="plan-decision-title">
        <div><h4 id="plan-decision-title">{{ decision === 'reject' ? '确定不采用这版草稿？' : '将这版草稿设为正式计划？' }}</h4><p>{{ decision === 'reject' ? '这版将标记为未采用，不能再启用。原目标和分析会保留，不会自动重新生成。' : '确认后，目标会进入进行中状态。正式计划不能通过“不采用”操作撤回。' }}</p></div>
        <div class="decision-buttons"><button ref="cancelButton" type="button" class="cancel-button" :disabled="busy" @click="cancel">{{ decision === 'reject' ? '保留这版' : '暂不启用' }}</button><button type="button" :class="decision === 'reject' ? 'confirm-reject-button' : 'approve-button confirming'" :disabled="busy || !plan.planId" @click="confirm"><span v-if="busy" class="spinner" aria-hidden="true"></span>{{ busy ? '正在保存…' : decision === 'reject' ? '确定不采用' : '确定启用正式版本' }}</button></div>
      </section>
      <div v-else key="actions" class="decision-actions">
        <button class="reset-button" type="button" :disabled="busy" @click="emit('reset')">{{ readOnly ? '返回目标库' : '规划其他目标' }}</button>
        <template v-if="actionBlocked"><button type="button" class="review-state-button" :disabled="busy" @click="emit('open-library')">查看目标最新状态 <span aria-hidden="true">↗</span></button></template>
        <template v-else-if="draft"><button type="button" class="reject-button" :disabled="busy || !plan.planId" @click="choose('reject')">不采用这版</button><button type="button" class="approve-button" :disabled="busy || !plan.planId" @click="choose('approve')">确认并启用计划 <span aria-hidden="true">→</span></button></template>
        <button v-else-if="rejected && !readOnly" class="regenerate-button" type="button" :disabled="busy || !plan.goalId" @click="emit('regenerate')"><span v-if="activeRequest === 'plan'" class="spinner" aria-hidden="true"></span>{{ activeRequest === 'plan' ? '正在重新规划…' : '重新生成草稿' }} <span v-if="!busy" aria-hidden="true">↗</span></button>
        <span v-else-if="active" class="approval-complete"><i aria-hidden="true">✓</i>已启用</span>
      </div>
    </Transition>
  </footer>
</template>

<style scoped>
.plan-decision { container-type: inline-size; padding: 24px; overflow: hidden; background: linear-gradient(120deg, var(--canvas-soft), #fff9fb 70%, #f3f6fa); border-radius: var(--radius-sm); box-shadow: inset 0 1px 0 white, var(--surface-shadow); }
.plan-decision.is-rejected { background: linear-gradient(115deg, var(--canvas-soft), var(--paper), var(--paper)); }
.plan-decision.is-active { background: linear-gradient(115deg, #edf5f2, var(--paper)); }
.decision-copy { display: flex; align-items: center; gap: 16px; }
.decision-copy > div:last-child { min-width: 0; }
.decision-eyebrow { color: var(--ink-500); font-family: var(--display); font-size: 8px; font-weight: 500; letter-spacing: .14em; }
.decision-copy h3 { margin: 7px 0; color: var(--ink); font-size: 18px; font-weight: 500; line-height: 1.6; text-wrap: pretty; }
.decision-copy h3:focus { outline: none; }
.decision-copy p { margin: 0; color: var(--ink-500); font-size: 12px; line-height: 1.8; }
.decision-seal { position: relative; flex: 0 0 auto; width: 62px; height: 66px; display: grid; place-items: center; color: var(--ink-500); background: #ffffff91; border-radius: var(--radius-sm); box-shadow: 3px 4px 0 var(--line); transform: rotate(-6deg); }
.decision-seal svg { width: 51px; stroke: currentColor; stroke-width: 1; stroke-linecap: round; }.decision-seal .seal-symbol { stroke-width: 1.6; }
.decision-seal > span { position: absolute; top: -7px; right: -5px; color: var(--ink-500); font-size: 19px; }
.is-active .decision-seal { color: #648b80; box-shadow: 3px 4px 0 #d7e8e160; }
.decision-actions { display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 9px; margin-top: 20px; }
.decision-actions .reset-button { margin-right: auto; }
.plan-decision :slotted(.plan-error) { margin-top: 18px; }
.plan-decision button { min-height: 42px; padding: 0 15px; border-radius: var(--radius-sm); border: 0; font-size: 12px; font-weight: 500; line-height: 1.6; }
.plan-decision button:disabled { opacity: .5; cursor: not-allowed; }.plan-decision button > span:not(.spinner) { margin-left: 8px; }
.reset-button { background: transparent; color: var(--ink-500); }.reset-button:hover:not(:disabled) { background: #ffffffa8; }
.reject-button { color: var(--ink-500); background: var(--canvas-soft); }.reject-button:hover:not(:disabled) { background: var(--accent-soft); }
.approve-button, .regenerate-button, .review-state-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: white; background: linear-gradient(115deg, var(--accent), var(--accent)); box-shadow: 0 5px 12px color-mix(in srgb, var(--shadow-color) 11%, transparent); }
.approve-button:hover:not(:disabled), .regenerate-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px color-mix(in srgb, var(--shadow-color) 17%, transparent); }
.decision-confirmation { display: grid; grid-template-columns: 1fr; gap: 15px; padding: 18px; margin-top: 20px; background: #ffffffb3; border-radius: var(--radius-sm); box-shadow: inset 3px 0 0 var(--shadow-color); }
.decision-confirmation.reject { box-shadow: inset 3px 0 0 var(--shadow-color); }
.decision-confirmation h4 { margin: 0 0 7px; color: var(--ink); font-size: 15px; font-weight: 500; }.decision-confirmation p { margin: 0; max-width: 650px; color: var(--ink-500); font-size: 12px; line-height: 1.85; }
.decision-buttons { display: flex; justify-content: flex-end; gap: 10px; }
.cancel-button { color: var(--ink-700); background: var(--canvas-soft); }.confirm-reject-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: white; background: var(--accent); }
.approval-complete { display: inline-flex; align-items: center; gap: 8px; color: #4c7468; font-size: 12px; }.approval-complete i { font-style: normal; width: 23px; height: 23px; display: grid; place-items: center; background: #deeee5; border-radius: 50%; }
.spinner { width: 14px; height: 14px; display: inline-block; border: 2px solid #ffffff55; border-top-color: white; border-radius: 50%; animation: decision-spin .8s linear infinite; }
.decision-unfold-enter-active { transition: opacity .2s, transform .28s var(--ease-out); }.decision-unfold-leave-active { transition: opacity .12s; }.decision-unfold-enter-from { opacity: 0; transform: translateY(7px); }.decision-unfold-leave-to { opacity: 0; }
@keyframes decision-spin { to { transform: rotate(360deg); } }
@container(max-width: 500px) { .decision-seal { width: 44px; height: 49px; }.decision-seal svg { width: 39px; }.decision-copy { gap: 12px; align-items: flex-start; }.decision-copy h3 { font-size: 16px; }.decision-actions .reset-button { flex-basis: 100%; text-align: left; padding-left: 0; }.decision-actions > button:not(.reset-button) { flex: 1; }.decision-buttons { flex-wrap: wrap; }.decision-buttons button { flex: 1; padding-inline: 10px; }.decision-confirmation { padding: 15px; } }
@media(max-width: 480px) { .plan-decision { padding: 20px 16px; } }
.plan-decision.is-reading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 20px; padding: 15px 20px; border-radius: var(--radius-sm); box-shadow: inset 0 1px 0 #fff; }
.is-reading .decision-copy { gap: 12px; }.is-reading .decision-copy h3 { font-size: 13px; margin: 0; }.is-reading .decision-copy p, .is-reading .decision-eyebrow, .is-reading .approval-complete { display: none; }
.is-reading .decision-seal { width: 32px; height: 35px; border-radius: var(--radius-sm); }.is-reading .decision-seal svg { width: 29px; }.is-reading .decision-seal > span { font-size: 13px; }
.is-reading .decision-actions { margin: 0; }.is-reading .decision-actions .reset-button { flex-basis: auto; padding: 5px 9px; min-height: 34px; font-size: 11px; }
.is-reading :slotted(.plan-error) { flex-basis: 100%; }
</style>
