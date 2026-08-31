<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { analyzeGoal, clarifyGoal, createGoal, getGoalDetails, getGoals } from '../api/goal'
import { generatePlan } from '../api/plan'
import WorkspaceSidebar from './workspace/WorkspaceSidebar.vue'
import GoalComposer from './workspace/GoalComposer.vue'
import AnalysisResult from './workspace/AnalysisResult.vue'
import PlanRoadmap from './workspace/PlanRoadmap.vue'
import GoalLibrary from './workspace/GoalLibrary.vue'
import GoalDetailDrawer from './workspace/GoalDetailDrawer.vue'

const props = defineProps({ user: { type: Object, required: true } })
defineEmits(['logout'])

const activeView = ref('create')
const goalText = ref('')
const submittedGoal = ref('')
const activeGoalId = ref(null)
const activeSavedText = ref('')
const result = ref(null)
const plan = ref(null)
const errorMessage = ref('')
const errorTitle = ref('请求没有完成')
const activeRequest = ref(null)
const clarificationHistory = ref([])
const clarificationAnswers = ref([])

const goalItems = ref([])
const goalPage = ref(1)
const goalTotal = ref(0)
const goalTotalPages = ref(0)
const goalListLoading = ref(false)
const goalListError = ref('')
const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedGoal = ref(null)

const userInitial = computed(() => props.user.username?.charAt(0).toUpperCase() || 'G')
const todayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', {
  month: 'long', day: 'numeric', weekday: 'long',
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

async function loadGoalPage(page = goalPage.value) {
  goalListLoading.value = true
  goalListError.value = ''
  try {
    const data = await getGoals(page, 9)
    goalItems.value = Array.isArray(data?.items) ? data.items : []
    goalPage.value = Number(data?.page) || page
    goalTotal.value = Number(data?.total) || 0
    goalTotalPages.value = Number(data?.totalPages) || 0
  } catch (error) {
    goalListError.value = error instanceof Error ? error.message : '目标列表加载失败。'
  } finally {
    goalListLoading.value = false
  }
}

async function submitGoal() {
  const normalized = goalText.value.trim()
  if (!normalized || normalized.length > 1000 || activeRequest.value) return

  activeRequest.value = 'analysis'
  errorMessage.value = ''

  try {
    if (!activeGoalId.value || normalized !== activeSavedText.value) {
      const savedGoal = await createGoal(normalized)
      activeGoalId.value = savedGoal.id
      activeSavedText.value = savedGoal.goalText || normalized
      loadGoalPage(1)
    }

    result.value = normalizeResult(await analyzeGoal(normalized))
    submittedGoal.value = normalized
    plan.value = null
    clarificationHistory.value = []
    clarificationAnswers.value = result.value.clarificationQuestions.map(() => '')
    scrollToSection('#analysis')
  } catch (error) {
    setRequestError(activeGoalId.value ? '目标已保存，但分析没有完成' : '目标保存或分析没有完成', error)
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

function clearJourney() {
  goalText.value = ''
  submittedGoal.value = ''
  activeGoalId.value = null
  activeSavedText.value = ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationHistory.value = []
  clarificationAnswers.value = []
}

function startNewGoal() {
  clearJourney()
  activeView.value = 'create'
  detailOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetAll() {
  startNewGoal()
}

function navigate(view) {
  activeView.value = view
  detailOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (view === 'library' && !goalItems.value.length && !goalListLoading.value) loadGoalPage(1)
}

async function openGoalDetails(goalId) {
  detailOpen.value = true
  detailLoading.value = true
  selectedGoal.value = null
  try {
    selectedGoal.value = await getGoalDetails(goalId)
  } catch (error) {
    detailOpen.value = false
    goalListError.value = error instanceof Error ? error.message : '目标详情加载失败。'
  } finally {
    detailLoading.value = false
  }
}

function continueGoal(goal) {
  goalText.value = goal.goalText || ''
  submittedGoal.value = ''
  activeGoalId.value = goal.id
  activeSavedText.value = goal.goalText || ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationHistory.value = []
  clarificationAnswers.value = []
  detailOpen.value = false
  activeView.value = 'create'
  window.scrollTo({ top: 0, behavior: 'smooth' })
  nextTick(() => document.querySelector('#goal-input')?.focus())
}

onMounted(() => loadGoalPage(1))
</script>

<template>
  <div class="workspace-shell">
    <WorkspaceSidebar
      :user="user"
      :active-step="activeStep"
      :active-view="activeView"
      :goal-total="goalTotal"
      @navigate="navigate"
      @logout="$emit('logout')"
    />

    <main class="workspace-main">
      <header class="topbar">
        <button class="mobile-brand" type="button" @click="navigate('create')"><span><i></i></span><strong>GoalPilot</strong></button>
        <nav class="mobile-nav" aria-label="移动端工作区导航">
          <button type="button" :class="{ active: activeView === 'create' }" @click="navigate('create')">工作台</button>
          <button type="button" :class="{ active: activeView === 'library' }" @click="navigate('library')">目标库</button>
        </nav>
        <div class="topbar-context"><span class="live-dot"></span><span>{{ todayLabel }}</span><i></i><span>{{ activeView === 'create' ? '目标规划中' : `共 ${goalTotal} 个目标` }}</span></div>
        <div class="current-user">
          <span><small>WELCOME BACK</small><strong>{{ user.username }}</strong></span>
          <i>{{ userInitial }}</i>
          <button type="button" @click="$emit('logout')">退出</button>
        </div>
      </header>

      <div class="workspace-content">
        <Transition name="workspace-swap" mode="out-in">
          <div v-if="activeView === 'create'" key="create" class="view-stack">
            <GoalComposer
              v-model="goalText"
              :loading="activeRequest === 'analysis'"
              :error-title="!result ? errorTitle : ''"
              :error-message="!result ? errorMessage : ''"
              :user-name="user.username"
              :current-goal-id="activeGoalId"
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

          <GoalLibrary
            v-else
            key="library"
            :items="goalItems"
            :loading="goalListLoading"
            :error-message="goalListError"
            :page="goalPage"
            :total-pages="goalTotalPages"
            :total="goalTotal"
            @select="openGoalDetails"
            @continue="continueGoal"
            @new-goal="startNewGoal"
            @refresh="loadGoalPage(goalPage)"
            @page-change="loadGoalPage"
          />
        </Transition>
      </div>

      <footer class="workspace-footer"><span>GOALPILOT © 2026</span><span>THINK CLEARLY · MOVE GENTLY</span></footer>
    </main>

    <Teleport to="body">
      <GoalDetailDrawer
        v-if="detailOpen"
        :goal="selectedGoal"
        :loading="detailLoading"
        @close="detailOpen = false"
        @continue="continueGoal"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.workspace-shell { min-height: 100vh; background: var(--canvas); }
.workspace-main { position: relative; min-height: 100vh; margin-left: 258px; display: flex; flex-direction: column; }
.workspace-main::before { content: ''; position: fixed; z-index: 0; top: 70px; right: 0; bottom: 0; left: 258px; pointer-events: none; opacity: .33; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(circle at 85% 7%, black, transparent 38%); }
.topbar { position: sticky; z-index: 20; top: 0; height: 70px; padding: 0 clamp(25px, 3vw, 48px); display: flex; align-items: center; justify-content: space-between; background: rgba(243, 241, 236, .92); border-bottom: 1px solid var(--line-strong); backdrop-filter: blur(16px); }
.topbar-context { display: flex; align-items: center; gap: 9px; color: var(--ink-500); font-size: 10px; font-weight: 600; letter-spacing: .03em; }
.topbar-context > i { width: 1px; height: 13px; background: var(--line-strong); }
.live-dot { width: 7px; height: 7px; background: var(--moss-600); border: 2px solid var(--moss-200); border-radius: 50%; box-sizing: content-box; }
.current-user { display: flex; align-items: center; gap: 10px; }
.current-user > span { text-align: right; }
.current-user small, .current-user strong { display: block; }
.current-user small { color: var(--ink-400); font-size: 7px; font-weight: 750; letter-spacing: .13em; }
.current-user strong { margin-top: 3px; color: var(--ink); font-size: 11px; }
.current-user > i { width: 34px; height: 34px; display: grid; place-items: center; color: var(--paper); background: var(--coral-600); border: 2px solid var(--paper); border-radius: 50%; box-shadow: 0 0 0 1px var(--coral-600); font-family: var(--display); font-size: 15px; font-style: normal; }
.current-user button { padding: 7px 9px; color: var(--ink-500); background: transparent; border: 0; border-left: 1px solid var(--line-strong); font-size: 9px; }
.current-user button:hover { color: var(--coral-700); }
.mobile-brand, .mobile-nav { display: none; }
.workspace-content { position: relative; z-index: 1; width: min(1760px, calc(100% - clamp(54px, 6vw, 96px))); margin-right: auto; margin-left: clamp(27px, 3vw, 48px); padding: clamp(30px, 3.2vw, 46px) 0 64px; flex: 1; }
.view-stack { display: grid; gap: 48px; }
.workspace-footer { position: relative; z-index: 1; width: min(1760px, calc(100% - clamp(54px, 6vw, 96px))); margin-right: auto; margin-left: clamp(27px, 3vw, 48px); padding: 19px 0 24px; display: flex; justify-content: space-between; color: var(--ink-400); border-top: 1px solid var(--line-strong); font-size: 8px; font-weight: 700; letter-spacing: .13em; }
.workspace-swap-enter-active, .workspace-swap-leave-active { transition: opacity .2s ease, transform .25s ease; }
.workspace-swap-enter-from { opacity: 0; transform: translateY(10px); }
.workspace-swap-leave-to { opacity: 0; transform: translateY(-6px); }
@media (max-width: 1050px) {
  .workspace-main { margin-left: 0; }
  .workspace-main::before { left: 0; }
  .workspace-content, .workspace-footer { margin-right: auto; margin-left: auto; }
  .mobile-brand { padding: 0; display: flex; align-items: center; gap: 8px; color: var(--ink); background: transparent; border: 0; }
  .mobile-brand > span { position: relative; width: 31px; height: 31px; display: block; background: var(--coral-500); border-radius: 50% 50% 50% 9px; transform: rotate(-8deg); }
  .mobile-brand > span::after { content: ''; position: absolute; top: 15px; left: 7px; width: 17px; height: 2px; background: white; transform: rotate(-24deg); }
  .mobile-brand strong { font-family: var(--editorial); font-size: 21px; }
  .mobile-nav { display: flex; padding: 3px; background: var(--paper); border: 1px solid var(--line); border-radius: 999px; }
  .mobile-nav button { padding: 6px 10px; color: var(--ink-500); background: transparent; border: 0; border-radius: 999px; font-size: 10px; }
  .mobile-nav button.active { color: var(--paper); background: var(--ink); }
  .topbar-context { display: none; }
}
@media (max-width: 620px) {
  .topbar { height: 63px; padding: 0 15px; }
  .mobile-brand strong { display: none; }
  .current-user > span, .current-user button { display: none; }
  .workspace-content, .workspace-footer { width: calc(100% - 28px); margin-right: auto; margin-left: auto; }
  .workspace-content { padding: 27px 0 48px; }
  .view-stack { gap: 40px; }
  .workspace-footer { gap: 8px; flex-direction: column; }
}
</style>
