<script setup>
import { computed, nextTick, ref } from 'vue'
import { analyzeGoal, clarifyGoal } from '../api/goal'
import { generatePlan } from '../api/plan'
import WorkspaceSidebar from './workspace/WorkspaceSidebar.vue'
import GoalComposer from './workspace/GoalComposer.vue'
import AnalysisResult from './workspace/AnalysisResult.vue'
import PlanRoadmap from './workspace/PlanRoadmap.vue'

const props = defineProps({
  user: { type: Object, required: true },
})

defineEmits(['logout'])

const goalText = ref('')
const submittedGoal = ref('')
const result = ref(null)
const plan = ref(null)
const errorMessage = ref('')
const errorTitle = ref('请求没有完成')
const activeRequest = ref(null)
const clarificationHistory = ref([])
const clarificationAnswers = ref([])

const userInitial = computed(() => props.user.username?.charAt(0).toUpperCase() || 'G')
const todayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date()))
const activeStep = computed(() => {
  if (plan.value || result.value?.readiness === 'READY') return 3
  if (result.value) return 2
  return 1
})

function normalizeResult(data) {
  return {
    goalSummary: data?.goalSummary || '未返回目标概述',
    knownInformation: Array.isArray(data?.knownInformation) ? data.knownInformation : [],
    missingInformation: Array.isArray(data?.missingInformation) ? data.missingInformation : [],
    readiness: data?.readiness || 'UNKNOWN',
    clarificationQuestions: Array.isArray(data?.clarificationQuestions) ? data.clarificationQuestions : [],
  }
}

function normalizePlan(data) {
  return {
    planTitle: data?.planTitle || '未命名计划',
    planSummary: data?.planSummary || '未返回计划概述',
    stages: Array.isArray(data?.stages)
      ? data.stages.map((stage) => ({
          title: stage?.title || '未命名阶段',
          objective: stage?.objective || '未返回阶段目标',
          timeRange: stage?.timeRange || '未指定时间范围',
          tasks: Array.isArray(stage?.tasks)
            ? stage.tasks.map((task) => ({
                title: task?.title || '未命名任务',
                description: task?.description || '未返回任务说明',
                completionCriteria: task?.completionCriteria || '未返回完成标准',
              }))
            : [],
        }))
      : [],
  }
}

function setRequestError(title, error) {
  errorTitle.value = title
  errorMessage.value = error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

function scrollToSection(id) {
  nextTick(() => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

async function submitGoal() {
  const normalized = goalText.value.trim()
  if (!normalized || normalized.length > 1000 || activeRequest.value) return

  activeRequest.value = 'analysis'
  errorMessage.value = ''

  try {
    result.value = normalizeResult(await analyzeGoal(normalized))
    submittedGoal.value = normalized
    plan.value = null
    clarificationHistory.value = []
    clarificationAnswers.value = result.value.clarificationQuestions.map(() => '')
    scrollToSection('#analysis')
  } catch (error) {
    setRequestError('目标分析没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

async function submitClarification() {
  if (activeRequest.value || !result.value) return

  const newAnswers = result.value.clarificationQuestions
    .map((question, index) => ({ question, answer: clarificationAnswers.value[index]?.trim() }))
    .filter((item) => item.answer)

  if (!newAnswers.length) return
  const updatedHistory = [...clarificationHistory.value, ...newAnswers]

  if (updatedHistory.length > 10) {
    errorTitle.value = '无法继续补充'
    errorMessage.value = '澄清记录最多支持 10 项，请重新提交一个信息更完整的目标。'
    return
  }

  activeRequest.value = 'clarification'
  errorMessage.value = ''

  try {
    result.value = normalizeResult(await clarifyGoal(submittedGoal.value, updatedHistory))
    clarificationHistory.value = updatedHistory
    clarificationAnswers.value = result.value.clarificationQuestions.map(() => '')
    plan.value = null
    scrollToSection('#analysis')
  } catch (error) {
    setRequestError('补充信息没有提交', error)
  } finally {
    activeRequest.value = null
  }
}

async function createPlan() {
  if (activeRequest.value || result.value?.readiness !== 'READY') return

  activeRequest.value = 'plan'
  errorMessage.value = ''

  try {
    plan.value = normalizePlan(await generatePlan(submittedGoal.value, result.value))
    scrollToSection('#plan')
  } catch (error) {
    setRequestError('计划生成没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

function resetAll() {
  goalText.value = ''
  submittedGoal.value = ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationHistory.value = []
  clarificationAnswers.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="workspace-shell">
    <WorkspaceSidebar :user="user" :active-step="activeStep" @logout="$emit('logout')" />

    <main id="workspace-top" class="workspace-main">
      <header class="topbar">
        <a class="mobile-brand" href="#workspace-top"><span>G</span><strong>GoalPilot</strong></a>
        <span class="date">{{ todayLabel }}</span>
        <div class="current-user">
          <span>你好，{{ user.username }}</span>
          <i>{{ userInitial }}</i>
          <button @click="$emit('logout')">退出登录</button>
        </div>
      </header>

      <div class="workspace-content">
        <GoalComposer
          v-model="goalText"
          :loading="activeRequest === 'analysis'"
          :error-title="!result ? errorTitle : ''"
          :error-message="!result ? errorMessage : ''"
          @submit="submitGoal"
          @dismiss-error="errorMessage = ''"
        />

        <AnalysisResult
          v-if="result"
          v-model:answers="clarificationAnswers"
          :result="result"
          :active-request="activeRequest"
          :history-count="clarificationHistory.length"
          :error-title="errorTitle"
          :error-message="errorMessage"
          :plan-exists="!!plan"
          @reset="resetAll"
          @clarify="submitClarification"
          @generate-plan="createPlan"
          @dismiss-error="errorMessage = ''"
        />

        <PlanRoadmap v-if="plan" :plan="plan" @reset="resetAll" />
      </div>

      <footer class="workspace-footer">
        <span>GoalPilot © 2026</span>
        <span>想清楚，然后温柔地前进。</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.workspace-shell {
  min-height: 100vh;
  background: #ece9e2;
}

.workspace-main {
  min-height: 100vh;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  height: 72px;
  padding: 0 clamp(28px, 4vw, 64px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 253, 248, .94);
  border-bottom: 1px solid #b8b2a6;
  backdrop-filter: blur(10px);
}

.date {
  color: #555a51;
  font-size: 13px;
}

.current-user {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #484d44;
  font-size: 13px;
}

.current-user i {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #c56345;
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 16px;
  font-style: normal;
}

.current-user button {
  padding: 6px 9px;
  color: #565b52;
  background: transparent;
  border: 1px solid #bcb6aa;
  border-radius: 7px;
  font-size: 11px;
}

.current-user button:hover { color: #8d3f2c; background: #f3e4de; border-color: #d09b87; }

.mobile-brand { display: none; color: #22261f; text-decoration: none; }

.workspace-content {
  width: min(1540px, calc(100% - clamp(56px, 8vw, 128px)));
  margin: 0 auto;
  padding: clamp(46px, 5vw, 76px) 0 80px;
  display: grid;
  flex: 1;
  gap: 64px;
}

.workspace-footer {
  width: min(1540px, calc(100% - clamp(56px, 8vw, 128px)));
  margin: 0 auto;
  padding: 24px 0 30px;
  display: flex;
  justify-content: space-between;
  color: #64675f;
  border-top: 1px solid #aaa498;
  font-size: 11px;
}

@media (max-width: 1020px) {
  .workspace-main { margin-left: 0; }
  .mobile-brand { display: flex; align-items: center; gap: 8px; }
  .mobile-brand span { width: 31px; height: 31px; display: grid; place-items: center; color: #fff; background: #3d4d3b; border-radius: 50%; font-family: var(--serif); font-size: 18px; }
  .mobile-brand strong { font-family: var(--serif); font-size: 20px; }
  .date { display: none; }
}

@media (max-width: 620px) {
  .topbar { height: 64px; padding: 0 17px; }
  .current-user > span { display: none; }
  .current-user button { font-size: 0; border: 0; padding: 3px; }
  .current-user button::after { content: '退出'; font-size: 11px; }
  .workspace-content, .workspace-footer { width: calc(100% - 30px); }
  .workspace-content { padding: 37px 0 60px; gap: 48px; }
  .workspace-footer { gap: 7px; flex-direction: column; }
}
</style>
