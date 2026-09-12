<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import GoalAssistantView from './GoalAssistantView.vue'
import GoalInfoPanel from './GoalInfoPanel.vue'
import SavedPlanView from './SavedPlanView.vue'
import GoalStatusBadge from './GoalStatusBadge.vue'

const props = defineProps({
  goal: { type: Object, required: true },
  session: { type: Object, required: true },
  initialPanel: { type: String, default: '' },
  busy: Boolean,
  hasDraft: Boolean,
})
const emit = defineEmits(['back', 'analyze', 'generate', 'updated'])
const panel = ref(props.initialPanel)
const planVisited = ref(props.initialPanel === 'plan')
const panelHeading = ref(null)
const panelButton = ref(null)
const conversationHost = ref(null)
const panelLabel = computed(() => panel.value === 'info' ? '目标资料' : '计划与任务')
const goalTitle = computed(() => String(props.goal.goalText || '').split('\n').find(line => line.trim()) || '目标会话')

async function openPanel(value) {
  panel.value = value
  if (value === 'plan') planVisited.value = true
  await nextTick()
  if (value) panelHeading.value?.focus({ preventScroll: true })
  else conversationHost.value?.querySelector('textarea, [tabindex="0"]')?.focus({ preventScroll: true })
}
async function closePanel() {
  panel.value = ''
  await nextTick()
  panelButton.value?.focus({ preventScroll: true })
}
watch(() => props.initialPanel, value => { if (value) openPanel(value) })
defineExpose({ openPanel })

// Narrow screens replace the conversation with the tool panel; desktop keeps
// both visible. A hidden conversation must not remain in the keyboard order.
const narrow = ref(window.matchMedia('(max-width: 1100px)').matches)
const media = window.matchMedia('(max-width: 1100px)')
const updateWidth = event => { narrow.value = event.matches }
media.addEventListener('change', updateWidth)
onBeforeUnmount(() => media.removeEventListener('change', updateWidth))
</script>

<template>
  <section class="goal-session" :class="{ 'tools-open': panel }" aria-label="目标会话">
    <header class="session-header">
      <button class="session-back" type="button" aria-label="返回目标库" @click="emit('back')">←</button>
      <div class="session-title"><span>GOAL SPACE <i aria-hidden="true">✧</i><small>围绕一个目标，持续向前</small></span><h1 :title="goal.goalText">{{ goalTitle }}</h1></div>
      <GoalStatusBadge :status="goal.status" />
      <div class="session-tools" role="group" aria-label="目标工具">
        <button type="button" :class="{ selected: panel === 'info' }" :aria-expanded="panel === 'info'" aria-controls="goal-tools-panel" @click="panel === 'info' ? closePanel() : openPanel('info')"><span aria-hidden="true">☷</span> 目标资料</button>
        <button ref="panelButton" type="button" :class="{ selected: panel === 'plan' }" :aria-expanded="panel === 'plan'" aria-controls="goal-tools-panel" @click="panel === 'plan' ? closePanel() : openPanel('plan')"><span aria-hidden="true">↗</span> 计划与任务</button>
      </div>
    </header>
    <div class="session-body">
      <div ref="conversationHost" class="session-conversation" :class="{ 'mobile-hidden': panel && narrow }" :inert="!!panel && narrow">
        <slot name="conversation">
          <GoalAssistantView :goal="goal" :session="session" @open-library="$emit('back')" @open-plan="openPanel('plan')" @analyze="$emit('analyze')" @generate="$emit('generate')" />
        </slot>
      </div>
      <aside v-show="panel" id="goal-tools-panel" class="session-panel" :aria-label="panelLabel" @keydown.esc.stop="closePanel">
        <header class="panel-heading"><div><span>手动操作区</span><h2 ref="panelHeading" tabindex="-1">{{ panelLabel }}</h2></div><button type="button" aria-label="关闭工具面板，返回对话" @click="closePanel">×</button></header>
        <div class="panel-scroll">
          <GoalInfoPanel v-if="panel === 'info'" :goal="goal" :busy="busy" :has-draft="hasDraft" @analyze="$emit('analyze')" @generate="$emit('generate')" @plan="openPanel('plan')" />
          <div v-show="panel === 'plan'" class="session-plan-content">
            <slot v-if="planVisited" name="plan">
              <SavedPlanView :goal="goal" embedded @back="closePanel" @updated="$emit('updated', $event)" @ask-assistant="openPanel('')" />
            </slot>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.goal-session { height: 100%; min-height: 0; display: flex; flex-direction: column; font-family: var(--text-cn); }
.session-header { display: flex; align-items: center; flex-shrink: 0; gap: 15px; min-height: 85px; padding: 14px 26px; border-bottom: 1px solid #e7e2ed; background: #faf9fcb5; }
.session-back { flex: 0 0 32px; height: 32px; padding: 0; border: 0; border-radius: 9px; background: transparent; color: #756880; font-size: 20px; }.session-back:hover { background: #eee7f4; }
.session-title { min-width: 0; flex: 1; }.session-title > span { display: flex; align-items: center; gap: 9px; color: #786687; font-family: var(--display); font-size: 9px; letter-spacing: .1em; }.session-title i { font-size: 13px; font-style: normal; }.session-title small { font-family: var(--text-cn); font-size: 10px; letter-spacing: 0; }.session-title h1 { max-width: 720px; margin: 5px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #51465c; font-size: 16px; font-weight: 500; }
.session-tools { display: flex; gap: 7px; margin-left: 9px; }.session-tools button { display: flex; align-items: center; gap: 7px; white-space: nowrap; min-height: 37px; padding: 8px 12px; border: 0; border-radius: 10px; background: #eee9f370; color: #766583; font-size: 12px; }.session-tools button.selected, .session-tools button:hover { background: #e7deef; color: #655072; }.session-tools button > span { font-size: 17px; }
.session-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }.session-conversation { flex: 1; min-width: 0; min-height: 0; }
.session-panel { flex: 0 0 clamp(420px, 41%, 820px); min-width: 0; display: flex; flex-direction: column; background: linear-gradient(145deg, #fbfafe, #f6f3f9); border-left: 1px solid #e5ddec; animation: panel-enter .25s var(--ease-out); }
.panel-heading { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding: 19px 24px 16px; }.panel-heading span { color: #7a6585; font-size: 10px; }.panel-heading h2 { margin: 4px 0 0; color: #695577; font-size: 17px; font-weight: 500; }.panel-heading h2:focus { outline: none; }.panel-heading button { width: 34px; height: 34px; padding: 0; border: 0; border-radius: 50%; background: #ece6f2; color: #796589; font-size: 23px; }
.panel-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0 24px 25px; scrollbar-width: thin; scrollbar-color: #d4c8df transparent; overscroll-behavior: contain; }
.session-plan-content :deep(.module-heading) { align-items: flex-start; gap: 15px; flex-wrap: wrap; }.session-plan-content :deep(.module-heading h2) { font-size: 21px; }.session-plan-content :deep(.plan-summary) { padding: 18px; }.session-plan-content :deep(.plan-summary > .summary-mark), .session-plan-content :deep(.summary-ornament) { display: none; }.session-plan-content :deep(.plan-summary) { display: block; }.session-plan-content :deep(.plan-decision) { padding: 18px; }
@keyframes panel-enter { from { opacity: 0; transform: translateX(16px); } }
@media(max-width: 1100px) { .session-conversation.mobile-hidden { display: none; }.session-panel { flex: 1; border-left: 0; }.session-header { padding-inline: 18px; gap: 10px; }.session-title small { display: none; } }
@media(max-width: 620px) { .session-header { flex-wrap: wrap; gap: 10px; padding: 12px 14px; }.session-title h1 { font-size: 14px; }.session-header :deep(.status-badge) { font-size: 10px; }.session-tools { flex-basis: 100%; justify-content: flex-end; margin: 0; }.session-tools button { min-height: 33px; padding: 6px 10px; font-size: 11px; }.panel-scroll { padding-inline: 16px; }.panel-heading { padding-inline: 16px; } }
</style>
