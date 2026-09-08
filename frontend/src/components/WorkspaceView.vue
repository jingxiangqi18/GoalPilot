<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { analyzeGoal, clarifyGoal, createGoal, getGoalDetails, getGoals } from '../api/goal'
import { approvePlan, generatePlan, rejectPlan } from '../api/plan'
import WorkspaceSidebar from './workspace/WorkspaceSidebar.vue'
import GoalComposer from './workspace/GoalComposer.vue'
import AnalysisResult from './workspace/AnalysisResult.vue'
import PlanRoadmap from './workspace/PlanRoadmap.vue'
import GoalLibrary from './workspace/GoalLibrary.vue'
import GoalDetailDrawer from './workspace/GoalDetailDrawer.vue'
import TodayPanel from './workspace/TodayPanel.vue'
import PlanLaunchPanel from './workspace/PlanLaunchPanel.vue'
import JourneyNavigator from './workspace/JourneyNavigator.vue'
import SavedPlanView from './workspace/SavedPlanView.vue'
import { buildGoalText } from '../utils/goalDraft'
import { usePlanTasks } from '../composables/usePlanTasks'

const props = defineProps({ user: { type: Object, required: true } })
defineEmits(['logout'])

const activeView = ref('create')
const goalText = ref('')
const goalDetails = ref({})
const goalSubmissionText = computed(() => buildGoalText(goalText.value, goalDetails.value))
const viewedPlanGoal = ref(null)
const activeGoalId = ref(null)
const activeSavedText = ref('')
const result = ref(null)
const plan = ref(null)
const planGoalStatus = ref('')
const { pendingTask, taskBusy, taskFeedback, taskUpdatesBlocked, updateTask, refreshTasks } = usePlanTasks(plan, planGoalStatus, syncPlanSnapshot)
const planActionBlocked = ref(false)
watch(() => plan.value?.planId, () => { planActionBlocked.value = false })
const availableDraftGoalId = computed(() => plan.value?.status === 'DRAFT' && !planActionBlocked.value ? plan.value.goalId : null)
const errorMessage = ref('')
const errorTitle = ref('请求没有完成')
const activeRequest = ref(null)
watch(taskBusy, busy => {
  if (busy && !activeRequest.value) activeRequest.value = 'task'
  if (!busy && activeRequest.value === 'task') activeRequest.value = null
})
const clarificationAnswerCount = ref(0)
const clarificationAnswers = ref([])
const directPlanGoal = ref(null)
const journeyStep = ref(1)
const journeyDirection = ref(1)
watch(journeyStep, (next, previous) => { journeyDirection.value = next >= previous ? 1 : -1 })
const completedSteps = computed(() => {
  if (hasGoalTextChanges.value) return []
  return [result.value && 1, plan.value && 2, plan.value?.status === 'ACTIVE' && 3].filter(Boolean)
})
const requestLabel = computed(() => ({
  analysis: '正在梳理目标，识别你的起点与方向…',
  clarification: '正在整理补充信息，更新目标画像…',
  plan: '正在把目标拆解成阶段与任务，请稍候…',
  approval: '正在保存正式计划…',
  rejection: '正在保存这版草稿的选择…',
  task: '正在同步任务进展…',
})[activeRequest.value] || '')

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

function focusJourneyScreen(element) {
  element.parentElement.style.height = ''
  element.querySelector('h1, h2')?.setAttribute('tabindex', '-1')
  element.querySelector('h1, h2')?.focus({ preventScroll: true })
}

function holdJourneyHeight(element) {
  const viewport = element.parentElement
  viewport.getAnimations().forEach(animation => animation.cancel())
  viewport.style.height = viewport.getBoundingClientRect().height + 'px'
}

function resizeJourneyViewport(element) {
  const viewport = element.parentElement
  const previousHeight = viewport.style.height
  const nextHeight = element.getBoundingClientRect().height + 'px'
  viewport.style.height = nextHeight
  if (previousHeight && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    viewport.animate([{ height: previousHeight }, { height: nextHeight }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' })
  }
}

const goalItems = ref([])
const goalPage = ref(1)
const goalTotal = ref(0)
const goalTotalPages = ref(0)
const goalListLoading = ref(false)
const goalListError = ref('')
const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedGoal = ref(null)
const today = new Date()

const userInitial = computed(() => props.user.username?.charAt(0).toUpperCase() || 'G')
const todayDay = String(today.getDate()).padStart(2, '0')
const todayMonth = new Intl.DateTimeFormat('zh-CN', { month: 'long' }).format(today)
const todayWeekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(today)
const activeStep = computed(() => journeyStep.value)
const hasGoalTextChanges = computed(() => (
  Boolean(result.value || plan.value)
  && goalSubmissionText.value !== activeSavedText.value
))
const availableJourneySteps = computed(() => {
  if (directPlanGoal.value) return [3]
  const steps = [1]
  if (result.value && !hasGoalTextChanges.value) steps.push(2)
  if (plan.value && !hasGoalTextChanges.value) steps.push(3)
  return steps
})

function normalizeResult(data) {
  const questions = Array.isArray(data?.clarificationQuestions)
    ? data.clarificationQuestions.map((item, index) => (
        typeof item === 'string'
          ? { questionId: null, question: item, answer: '', sortOrder: index + 1 }
          : {
              questionId: item?.questionId ?? null,
              question: item?.question || '',
              answer: item?.answer || '',
              sortOrder: index + 1,
            }
      )).filter((item) => item.question)
    : []

  return {
    analysisId: data?.analysisId ?? null,
    goalId: data?.goalId ?? activeGoalId.value,
    versionNumber: data?.versionNumber ?? null,
    createdAt: data?.createdAt ?? null,
    goalSummary: data?.goalSummary || '未返回目标概述',
    knownInformation: Array.isArray(data?.knownInformation) ? data.knownInformation : [],
    missingInformation: Array.isArray(data?.missingInformation) ? data.missingInformation : [],
    readiness: data?.readiness || 'UNKNOWN',
    clarificationQuestions: questions,
  }
}

function normalizePlan(data) {
  return {
    planId: data?.planId ?? null,
    goalId: data?.goalId ?? activeGoalId.value,
    sourceAnalysisId: data?.sourceAnalysisId ?? null,
    versionNumber: data?.versionNumber ?? null,
    status: data?.status || 'DRAFT',
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
    planTitle: data?.planTitle || '未命名计划',
    planSummary: data?.planSummary || '未返回计划概述',
    stages: Array.isArray(data?.stages)
      ? data.stages.map((stage) => ({
          stageId: stage?.stageId ?? null,
          sortOrder: stage?.sortOrder ?? null,
          title: stage?.title || '未命名阶段',
          objective: stage?.objective || '未返回阶段目标',
          timeRange: stage?.timeRange || '未指定时间范围',
          tasks: Array.isArray(stage?.tasks)
            ? stage.tasks.map((task) => ({
                taskId: task?.taskId ?? null,
                sortOrder: task?.sortOrder ?? null,
                status: task?.status || 'TODO',
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

function selectJourneyStep(step) {
  if (!availableJourneySteps.value.includes(step) || activeRequest.value) return
  journeyStep.value = step
  errorMessage.value = ''
  scrollToTop()
}

let goalListRequest = 0
async function loadGoalPage(page = goalPage.value) {
  const request = ++goalListRequest
  goalListLoading.value = true
  goalListError.value = ''
  try {
    const data = await getGoals(page, 9)
    if (request !== goalListRequest) return
    goalItems.value = Array.isArray(data?.items) ? data.items : []
    goalPage.value = Number(data?.page) || page
    goalTotal.value = Number(data?.total) || 0
    goalTotalPages.value = Number(data?.totalPages) || 0
  } catch (error) {
    if (request !== goalListRequest) return
    goalListError.value = error instanceof Error ? error.message : '目标列表加载失败。'
  } finally {
    if (request === goalListRequest) goalListLoading.value = false
  }
}

async function submitGoal() {
  const normalized = goalSubmissionText.value
  if (!normalized || normalized.length > 1000 || activeRequest.value) return
  if (result.value && normalized === activeSavedText.value) return selectJourneyStep(2)

  activeRequest.value = 'analysis'
  errorMessage.value = ''
  directPlanGoal.value = null

  try {
    if (!activeGoalId.value || normalized !== activeSavedText.value) {
      const savedGoal = await createGoal(normalized)
      activeGoalId.value = savedGoal.id
      activeSavedText.value = savedGoal.goalText || normalized
      result.value = null
      plan.value = null
      clarificationAnswers.value = []
      loadGoalPage(1)
    }

    result.value = normalizeResult(await analyzeGoal(activeGoalId.value))
    plan.value = null
    clarificationAnswerCount.value = 0
    clarificationAnswers.value = result.value.clarificationQuestions.map((item) => item.answer || '')
    journeyStep.value = 2
    await loadGoalPage(1)
    scrollToTop()
  } catch (error) {
    setRequestError(activeGoalId.value ? '目标已保存，但分析没有完成' : '目标保存或分析没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

async function submitClarification() {
  if (activeRequest.value || !result.value || !activeGoalId.value) return
  const answers = result.value.clarificationQuestions.map((item, index) => ({
    questionId: item.questionId,
    answer: clarificationAnswers.value[index]?.trim() || '',
  }))

  if (!answers.length || answers.some((item) => !item.answer)) {
    errorTitle.value = '还没有回答完整'
    errorMessage.value = '后端要求一次提交当前全部澄清问题，请补全所有回答后再继续。'
    return
  }

  if (answers.some((item) => !item.questionId)) {
    errorTitle.value = '问题记录无效'
    errorMessage.value = '当前问题信息不完整，请重新分析目标后再试。'
    return
  }

  activeRequest.value = 'clarification'
  errorMessage.value = ''
  try {
    result.value = normalizeResult(await clarifyGoal(activeGoalId.value, answers))
    clarificationAnswerCount.value += answers.length
    clarificationAnswers.value = result.value.clarificationQuestions.map((item) => item.answer || '')
    plan.value = null
    journeyStep.value = 2
    await loadGoalPage(1)
  } catch (error) {
    setRequestError('补充信息没有提交', error)
  } finally {
    activeRequest.value = null
  }
}

async function requestPlan(goalId) {
  if (activeRequest.value || !goalId) return
  activeRequest.value = 'plan'
  errorMessage.value = ''
  try {
    plan.value = normalizePlan(await generatePlan(goalId))
    planGoalStatus.value = 'READY_TO_PLAN'
    journeyStep.value = 3
    scrollToTop()
  } catch (error) {
    if (plan.value?.status === 'REJECTED') handlePlanDecisionError('计划生成没有完成', error)
    else setRequestError('计划生成没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

async function createPlan() {
  if (activeRequest.value || result.value?.readiness !== 'READY' || !activeGoalId.value || plan.value) return
  await requestPlan(activeGoalId.value)
}

async function approveCurrentPlan() {
  if (activeRequest.value || planActionBlocked.value || !plan.value?.planId || plan.value.status !== 'DRAFT') return
  activeRequest.value = 'approval'
  errorMessage.value = ''
  try {
    const approved = await approvePlan(plan.value.planId)
    planGoalStatus.value = approved?.goalStatus || 'ACTIVE'
    plan.value = {
      ...plan.value,
      versionNumber: approved?.versionNumber ?? plan.value.versionNumber,
      status: approved?.planStatus || 'ACTIVE',
      updatedAt: approved?.updatedAt ?? new Date().toISOString(),
    }
    if (directPlanGoal.value) {
      directPlanGoal.value = {
        ...directPlanGoal.value,
        status: approved?.goalStatus || 'ACTIVE',
      }
    }
    await loadGoalPage(1)
    scrollToTop()
  } catch (error) {
    handlePlanDecisionError('计划确认没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

function handlePlanDecisionError(title, error) {
  if (error?.status === 409 || error?.status === 404) {
    planActionBlocked.value = true
    errorTitle.value = error.status === 409 ? '这版草稿的状态已变化' : '这版草稿已无法读取'
    errorMessage.value = '当前页面可能不是最新状态，已暂停此版本的后续操作。请到目标库查看最新状态；这里不会自动重新生成计划。'
    loadGoalPage(goalPage.value)
  } else setRequestError(title, error)
}

async function rejectCurrentPlan() {
  if (activeRequest.value || planActionBlocked.value || !plan.value?.planId || plan.value.status !== 'DRAFT') return
  activeRequest.value = 'rejection'
  errorMessage.value = ''
  try {
    await rejectPlan(plan.value.planId)
    // Rejection does not delete the goal or change its READY_TO_PLAN state.
    plan.value = { ...plan.value, status: 'REJECTED' }
    await loadGoalPage(goalPage.value)
  } catch (error) {
    handlePlanDecisionError('这版草稿暂未放弃', error)
  } finally {
    activeRequest.value = null
  }
}

async function regenerateCurrentPlan() {
  if (activeRequest.value || planActionBlocked.value || plan.value?.status !== 'REJECTED') return
  await requestPlan(plan.value.goalId)
}

function reviewGoalState() {
  navigate('library')
  loadGoalPage(goalPage.value)
}

function syncPlanSnapshot({ plan: latest, goalStatus }) {
  // A saved-plan page may show a different goal from the workbench draft.
  if (plan.value?.status === 'ACTIVE' && plan.value.goalId === latest.goalId) {
    plan.value = latest
    planGoalStatus.value = goalStatus
  }
  goalItems.value = goalItems.value.map(goal => goal.id === latest.goalId ? { ...goal, status: goalStatus } : goal)
  if (directPlanGoal.value?.id === latest.goalId) directPlanGoal.value = { ...directPlanGoal.value, status: goalStatus }
}

async function generateGoalPlan(goal) {
  if (activeRequest.value || !goal?.id) return
  // Reopen the current session's draft instead of creating a duplicate draft.
  if (availableDraftGoalId.value === goal.id) {
    activeView.value = 'create'
    journeyStep.value = 3
    detailOpen.value = false
    errorMessage.value = ''
    scrollToTop()
    return
  }
  goalText.value = goal.goalText || ''
  goalDetails.value = {}
  activeGoalId.value = goal.id
  activeSavedText.value = goal.goalText || ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationAnswerCount.value = 0
  clarificationAnswers.value = []
  directPlanGoal.value = goal
  journeyStep.value = 3
  detailOpen.value = false
  activeView.value = 'create'
  scrollToTop()
  await nextTick()
  await requestPlan(goal.id)
}

function clearJourney() {
  goalText.value = ''
  goalDetails.value = {}
  activeGoalId.value = null
  activeSavedText.value = ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationAnswerCount.value = 0
  clarificationAnswers.value = []
  directPlanGoal.value = null
  journeyStep.value = 1
}

function startNewGoal() {
  if (activeRequest.value) return
  clearJourney()
  activeView.value = 'create'
  detailOpen.value = false
  scrollToTop()
}

function resetAll() {
  startNewGoal()
}

function navigate(view) {
  activeView.value = view
  detailOpen.value = false
  scrollToTop()
  if (view === 'library' && !goalItems.value.length && !goalListLoading.value) loadGoalPage(1)
}

function openSavedPlan(goal) {
  if (!goal?.id) return
  viewedPlanGoal.value = goal
  detailOpen.value = false
  activeView.value = 'saved-plan'
  scrollToTop()
}

let detailRequest = 0
async function openGoalDetails(goalId) {
  const request = ++detailRequest
  detailOpen.value = true
  detailLoading.value = true
  selectedGoal.value = null
  try {
    const goal = await getGoalDetails(goalId)
    if (request === detailRequest) selectedGoal.value = goal
  } catch (error) {
    if (request !== detailRequest) return
    detailOpen.value = false
    goalListError.value = error instanceof Error ? error.message : '目标详情加载失败。'
  } finally {
    if (request === detailRequest) detailLoading.value = false
  }
}

function continueGoal(goal) {
  if (activeRequest.value) return
  goalText.value = goal.goalText || ''
  goalDetails.value = {}
  activeGoalId.value = goal.id
  activeSavedText.value = goal.goalText || ''
  result.value = null
  plan.value = null
  errorMessage.value = ''
  clarificationAnswerCount.value = 0
  clarificationAnswers.value = []
  directPlanGoal.value = null
  journeyStep.value = 1
  detailOpen.value = false
  activeView.value = 'create'
  scrollToTop()
  nextTick(() => document.querySelector('#goal-input')?.focus())
}

onMounted(() => loadGoalPage(1))
</script>

<template>
  <div class="workspace-shell">
    <WorkspaceSidebar
      :user="user"
      :active-step="activeStep"
      :active-view="activeView === 'saved-plan' ? 'library' : activeView"
      :goal-total="goalTotal"
      :completed-steps="completedSteps"
      @navigate="navigate"
      @logout="$emit('logout')"
    />

    <main class="workspace-main">
      <svg class="workspace-contour" viewBox="0 0 900 440" fill="none" aria-hidden="true">
        <path v-for="index in 9" :key="index" d="M-70 350C145 50 210 485 470 230S740 0 1020 175" :transform="'translate(0 ' + (index * 11 - 55) + ')'" stroke="currentColor" stroke-width="1" />
        <circle cx="598" cy="99" r="5" fill="currentColor" stroke="none" />
        <path d="M575 114v14m-7-7h14" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <header class="topbar">
        <div class="topbar-inner">
          <button class="mobile-brand" type="button" @click="navigate('create')"><span><i></i></span><strong>GoalPilot</strong></button>
          <nav class="mobile-nav" aria-label="移动端工作区导航">
            <button type="button" :class="{ active: activeView === 'create' }" @click="navigate('create')">工作台</button>
            <button type="button" :class="{ active: activeView !== 'create' }" @click="navigate('library')">目标库</button>
          </nav>
          <div class="topbar-context">
            <span class="date-number">{{ todayDay }}</span>
            <span class="date-copy"><strong>{{ todayWeekday }}</strong><small>{{ todayMonth }}</small></span>
            <i></i>
            <span class="workspace-status"><b class="live-dot"></b>{{ activeView === 'create' ? '目标规划中' : `共 ${goalTotal} 个目标` }}</span>
          </div>
          <div class="current-user">
            <span><small>WELCOME BACK</small><strong>{{ user.username }}</strong></span>
            <i>{{ userInitial }}</i>
            <button type="button" @click="$emit('logout')">退出</button>
          </div>
        </div>
      </header>

      <div class="workspace-content">
        <Transition name="request-notice">
          <div v-if="activeRequest" class="request-status" role="status"><i></i><span>{{ requestLabel }}</span><small>完成后将自动更新</small></div>
        </Transition>
        <Transition name="workspace-swap" mode="out-in">
          <div v-if="activeView === 'create'" key="create" class="create-dashboard">
            <div class="view-stack">
              <JourneyNavigator
                :current-step="journeyStep"
                :available-steps="availableJourneySteps"
                :goal-id="activeGoalId"
                :has-unsaved-changes="hasGoalTextChanges"
                :completed-steps="completedSteps"
                :busy="!!activeRequest"
                @select="selectJourneyStep"
              />

              <div class="journey-viewport" :style="{ '--journey-direction': journeyDirection }">
              <Transition name="journey-screen" mode="out-in" @before-leave="holdJourneyHeight" @enter="resizeJourneyViewport" @after-enter="focusJourneyScreen">
                <div v-if="journeyStep === 1" key="define" class="journey-screen">
                  <GoalComposer
                    v-model="goalText"
                    v-model:details="goalDetails"
                    :loading="activeRequest === 'analysis'"
                    :error-title="errorTitle"
                    :error-message="errorMessage"
                    :user-name="user.username"
                    :current-goal-id="activeGoalId"
                    :analyzed="!!result && goalSubmissionText === activeSavedText"
                    @submit="submitGoal"
                    @resume="selectJourneyStep(2)"
                    @dismiss-error="errorMessage = ''"
                  />
                </div>

                <div v-else-if="journeyStep === 2 && result" key="analysis" class="journey-screen">
                  <AnalysisResult
                    v-model:answers="clarificationAnswers"
                    :result="result"
                    :active-request="activeRequest"
                    :history-count="clarificationAnswerCount"
                    :error-title="errorTitle"
                    :error-message="errorMessage"
                    :plan-exists="!!plan"
                    @reset="resetAll"
                    @clarify="submitClarification"
                    @generate-plan="createPlan"
                    @view-plan="selectJourneyStep(3)"
                    @dismiss-error="errorMessage = ''"
                  />
                </div>

                <div v-else key="plan" class="journey-screen">
                  <PlanLaunchPanel
                    v-if="directPlanGoal && !plan"
                    :goal="directPlanGoal"
                    :loading="activeRequest === 'plan'"
                    :error-title="errorTitle"
                    :error-message="errorMessage"
                    @retry="requestPlan(activeGoalId)"
                    @cancel="startNewGoal"
                  />

                  <PlanRoadmap
                    v-else-if="plan"
                    :plan="plan"
                    :active-request="activeRequest"
                    :error-title="errorTitle"
                    :error-message="errorMessage"
                    :action-blocked="planActionBlocked"
                    :goal-status="planGoalStatus"
                    :pending-task="pendingTask"
                    :task-busy="taskBusy"
                    :task-feedback="taskFeedback"
                    :task-updates-blocked="taskUpdatesBlocked"
                    @update-task="updateTask"
                    @refresh-tasks="refreshTasks"
                    @approve="approveCurrentPlan"
                    @reject="rejectCurrentPlan"
                    @regenerate="regenerateCurrentPlan"
                    @open-library="reviewGoalState"
                    @reset="resetAll"
                    @dismiss-error="errorMessage = ''"
                  />
                </div>
              </Transition>
              </div>
            </div>

            <TodayPanel
              :date="today"
              :active-step="activeStep"
              :goal-total="goalTotal"
              :current-goal-id="activeGoalId"
              :readiness="result?.readiness"
              :plan-status="plan?.status"
              :items="goalItems"
              :loading="goalListLoading"
              :error-message="goalListError"
              @open-goal="openGoalDetails"
              @open-library="navigate('library')"
            />
          </div>

          <SavedPlanView v-else-if="activeView === 'saved-plan' && viewedPlanGoal" key="saved-plan" :goal="viewedPlanGoal" @back="reviewGoalState" @updated="syncPlanSnapshot" />

          <GoalLibrary
            v-else
            key="library"
            :items="goalItems"
            :loading="goalListLoading"
            :error-message="goalListError"
            :page="goalPage"
            :total-pages="goalTotalPages"
            :total="goalTotal"
            :busy="!!activeRequest"
            :available-draft-goal-id="availableDraftGoalId"
            @select="openGoalDetails"
            @continue="continueGoal"
            @generate-plan="generateGoalPlan"
            @view-plan="openSavedPlan"
            @new-goal="startNewGoal"
            @refresh="loadGoalPage(goalPage)"
            @page-change="loadGoalPage"
          />
        </Transition>
      </div>

      <footer class="workspace-footer"><span>GOALPILOT © 2026</span><span>THINK CLEARLY · MOVE GENTLY</span></footer>
    </main>

    <Teleport to="body">
      <Transition name="drawer-swap">
      <GoalDetailDrawer
        v-if="detailOpen"
        :goal="selectedGoal"
        :loading="detailLoading"
        :busy="!!activeRequest"
        :available-draft-goal-id="availableDraftGoalId"
        @close="detailOpen = false"
        @continue="continueGoal"
        @generate-plan="generateGoalPlan"
        @view-plan="openSavedPlan"
      />
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.workspace-shell { min-height: 100vh; background: var(--canvas); }
.workspace-main { position: relative; min-height: 100vh; margin-left: 248px; display: flex; flex-direction: column; }
.workspace-main::before { content: ''; position: fixed; z-index: 0; top: 64px; right: 0; bottom: 0; left: 248px; pointer-events: none; background: radial-gradient(circle at 84% 5%, rgba(214,164,180,.14), transparent 24%), radial-gradient(circle at 64% 18%, rgba(104,113,170,.09), transparent 28%), radial-gradient(circle at 11% 88%, rgba(112,134,154,.07), transparent 29%); }
.workspace-contour { position: absolute; z-index: 0; right: 0; bottom: 60px; width: min(70%, 1100px); height: auto; color: #9298b3; opacity: .14; pointer-events: none; mask-image: linear-gradient(90deg, transparent, black 25%, black 75%, transparent); }
.topbar { position: sticky; z-index: 20; top: 0; height: 64px; background: rgba(247,248,250,.86); border-bottom: 1px solid rgba(213,215,223,.82); backdrop-filter: blur(18px) saturate(1.2); }
.topbar-inner { width: min(2000px, calc(100% - 64px)); height: 100%; margin-inline: auto; display: flex; align-items: center; justify-content: space-between; }
.topbar-context { display: flex; align-items: center; gap: 10px; color: var(--ink-500); }
.date-number { width: 34px; height: 34px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, #8b91c2, #6871aa); border-radius: 11px; box-shadow: 0 6px 14px rgba(104,113,170,.18); font-size: 13px; font-weight: 700; }
.date-copy strong, .date-copy small { display: block; }
.date-copy strong { color: var(--ink); font-size: 10px; }.date-copy small { margin-top: 2px; color: var(--ink-400); font-size: 8px; }
.topbar-context > i { width: 1px; height: 27px; margin-inline: 5px; background: var(--line-strong); }
.workspace-status { padding: 7px 10px; display: inline-flex; align-items: center; gap: 7px; color: var(--ink-600); background: rgba(255,255,255,.72); border: 1px solid var(--line); border-radius: 999px; font-size: 9px; font-weight: 650; }
.live-dot { width: 6px; height: 6px; display: block; background: linear-gradient(145deg, #e3ad9e, #c4819b); border-radius: 50%; box-shadow: 0 0 0 4px rgba(213,150,167,.13); }
.current-user { display: flex; align-items: center; gap: 10px; }
.current-user > span { text-align: right; }
.current-user small, .current-user strong { display: block; }
.current-user small { color: var(--ink-400); font-size: 7px; font-weight: 750; letter-spacing: .13em; }
.current-user strong { margin-top: 3px; color: var(--ink); font-size: 11px; }
.current-user > i { width: 32px; height: 32px; display: grid; place-items: center; color: var(--paper); background: linear-gradient(145deg, var(--coral-500), var(--coral-700)); border: 2px solid var(--paper); border-radius: 10px; box-shadow: 0 0 0 1px var(--coral-300); font-family: var(--display); font-size: 13px; font-style: normal; }
.current-user button { padding: 7px 9px; color: var(--ink-500); background: transparent; border: 0; border-left: 1px solid var(--line-strong); font-size: 9px; }
.current-user button:hover { color: var(--coral-700); }
.mobile-brand, .mobile-nav { display: none; }
.workspace-content { position: relative; z-index: 1; width: min(2000px, calc(100% - 48px)); margin-inline: auto; padding: 24px 0 30px; flex: 1; }
.create-dashboard { display: grid; }
.create-dashboard > :deep(.today-panel) { display: none; }
.view-stack { min-width: 0; display: grid; align-content: start; gap: 20px; }
.journey-viewport { min-width: 0; }
.journey-screen { min-width: 0; }
.journey-screen-enter-active { transition: opacity .26s ease, transform .32s var(--ease-out); }
.journey-screen-leave-active { transition: opacity .14s ease, transform .18s ease; pointer-events: none; }
.journey-screen-enter-from { opacity: 0; transform: translateX(calc(16px * var(--journey-direction))); }
.journey-screen-leave-to { opacity: 0; transform: translateX(calc(-10px * var(--journey-direction))); }
.journey-screen-enter-active :deep(.reveal-item) { animation: none; }
.journey-screen :deep(h1:focus), .journey-screen :deep(h2:focus) { outline: none; }
.request-status { position: relative; overflow: hidden; margin-bottom: 14px; padding: 12px 16px; display: flex; align-items: center; gap: 11px; color: var(--coral-800); background: linear-gradient(100deg, var(--coral-100), #f7f1f5, #f0f4f8); border: 1px solid var(--coral-300); border-radius: 12px; font-size: 12px; }
.request-status > i { width: 14px; height: 14px; flex: 0 0 auto; border: 2px solid var(--coral-300); border-top-color: var(--coral-700); border-radius: 50%; animation: request-spin .8s linear infinite; }
.request-status small { margin-left: auto; color: var(--ink-500); font-size: 11px; }
.request-status::after { content: ''; position: absolute; bottom: 0; left: 0; height: 2px; width: 35%; background: linear-gradient(90deg, transparent, var(--coral-500), var(--rose-500), transparent); animation: request-travel 2.2s ease-in-out infinite; }
.request-notice-enter-active, .request-notice-leave-active { transition: opacity .2s, transform .2s; }
.request-notice-enter-from, .request-notice-leave-to { opacity: 0; transform: translateY(-6px); }
@keyframes request-spin { to { transform: rotate(360deg); } }
@keyframes request-travel { from { transform: translateX(-100%); } to { transform: translateX(390%); } }
.drawer-swap-enter-active, .drawer-swap-leave-active { transition: opacity .28s ease; }
.drawer-swap-enter-active :deep(.detail-drawer), .drawer-swap-leave-active :deep(.detail-drawer) { transition: transform .35s var(--ease-out); }
.drawer-swap-enter-from, .drawer-swap-leave-to { opacity: 0; }
.drawer-swap-enter-from :deep(.detail-drawer), .drawer-swap-leave-to :deep(.detail-drawer) { transform: translateX(100%); }
.workspace-footer { position: relative; z-index: 1; width: min(2000px, calc(100% - 64px)); margin-inline: auto; padding: 18px 0 23px; display: flex; justify-content: space-between; color: var(--ink-400); border-top: 1px solid var(--line); font-size: 8px; font-weight: 700; letter-spacing: .13em; }
.workspace-swap-enter-active, .workspace-swap-leave-active { transition: opacity .2s ease, transform .25s ease; }
.workspace-swap-enter-from { opacity: 0; transform: translateY(10px); }
.workspace-swap-leave-to { opacity: 0; transform: translateY(-6px); }
@media (min-width: 1500px) {
  .create-dashboard { grid-template-columns: minmax(0, 1fr) 280px; align-items: start; gap: 20px; }
  .create-dashboard > :deep(.today-panel) { display: grid; }
}
@media (min-width: 2100px) { .create-dashboard { grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; } }
@media (max-width: 1050px) {
  .workspace-main { margin-left: 0; }
  .workspace-main::before { left: 0; }
  .topbar-inner { width: calc(100% - 32px); }
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
  .workspace-contour { display: none; }
  .topbar { height: 63px; }
  .topbar-inner { width: calc(100% - 28px); }
  .mobile-brand strong { display: none; }
  .current-user > span, .current-user button { display: none; }
  .workspace-content, .workspace-footer { width: calc(100% - 28px); margin-right: auto; margin-left: auto; }
  .workspace-content { padding: 16px 0 28px; }
  .request-status small { display: none; }
  .view-stack { gap: 16px; }
  .workspace-footer { gap: 8px; flex-direction: column; }
}
</style>
