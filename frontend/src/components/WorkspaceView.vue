<script setup>
import StudioBackdrop from './workspace/StudioBackdrop.vue'
import AccountMenu from './workspace/AccountMenu.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { analyzeGoal, clarifyGoal, createGoal, getGoalDetails, getGoals } from '../api/goal'
import { approvePlan, generatePlan, rejectPlan } from '../api/plan'
import WorkspaceSidebar from './workspace/WorkspaceSidebar.vue'
import GoalComposer from './workspace/GoalComposer.vue'
import RecentGoals from './workspace/RecentGoals.vue'
import PlanRoadmap from './workspace/PlanRoadmap.vue'
import GoalLibrary from './workspace/GoalLibrary.vue'
import GoalSessionView from './workspace/GoalSessionView.vue'
import PlanningConversation from './workspace/PlanningConversation.vue'
import { buildGoalText } from '../utils/goalDraft'
import { usePlanTasks } from '../composables/usePlanTasks'

const props = defineProps({ user: { type: Object, required: true } })
defineEmits(['logout'])

const activeView = ref('create')
const goalText = ref('')
const goalDetails = ref({})
const goalSubmissionText = computed(() => buildGoalText(goalText.value, goalDetails.value))
const sessionView = ref(null)
const sessionPanel = ref('')
const useSavedPlan = ref(false)
const sessionError = ref('')
const chatSessions = ref({})
const sessionId = ref(null)
const planningMode = computed(() => selectedGoal.value?.id === activeGoalId.value && plan.value?.status !== 'ACTIVE' && Boolean(result.value || plan.value || directPlanGoal.value || activeRequest.value))
function sessionFor(id) {
  return chatSessions.value[id] ??= { question: '', entries: [] }
}
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
const clarificationAnswers = ref([])
const directPlanGoal = ref(null)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

const goalItems = ref([])
const goalPage = ref(1)
const goalTotal = ref(0)
const goalTotalPages = ref(0)
const goalListLoading = ref(false)
const goalListError = ref('')
const goalStatusFilter = ref('ALL')
// Home and sidebar always show recent goals, independent of library filters/pages.
const recentItems = ref([])
const recentTotal = ref(0)
const recentLoading = ref(false)
const recentError = ref('')
const detailLoading = ref(false)
const selectedGoal = ref(null)
const today = new Date()

const todayDay = String(today.getDate()).padStart(2, '0')
const todayMonth = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(today)
const todayWeekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(today)
const todayDateValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${todayDay}`
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

let goalListRequest = 0
let recentListRequest = 0
function setRecentGoals(data) {
  recentItems.value = data.items
  recentTotal.value = Number(data.total) || 0
}
async function loadRecentGoals() {
  const request = ++recentListRequest
  recentLoading.value = true
  recentError.value = ''
  try {
    const data = await getGoals(1, 9)
    if (request === recentListRequest) setRecentGoals(data)
  } catch (error) {
    if (request === recentListRequest) recentError.value = error.message || '最近目标加载失败。'
  } finally {
    if (request === recentListRequest) recentLoading.value = false
  }
}
async function loadGoalPage(page = goalPage.value) {
  const request = ++goalListRequest
  const status = goalStatusFilter.value
  const recentRequest = status === 'ALL' && page === 1 ? ++recentListRequest : null
  if (recentRequest) { recentLoading.value = true; recentError.value = '' }
  goalPage.value = page
  goalListLoading.value = true
  goalListError.value = ''
  try {
    const data = await getGoals(page, 9, status)
    if (recentRequest === recentListRequest) setRecentGoals(data)
    if (request !== goalListRequest) return
    const lastPage = Math.max(1, Number(data?.totalPages) || 0)
    if (page > lastPage) return loadGoalPage(lastPage)
    goalItems.value = Array.isArray(data?.items) ? data.items : []
    goalPage.value = Number(data?.page) || page
    goalTotal.value = Number(data?.total) || 0
    goalTotalPages.value = Number(data?.totalPages) || 0
  } catch (error) {
    if (recentRequest === recentListRequest) recentError.value = error.message || '最近目标加载失败。'
    if (request !== goalListRequest) return
    goalListError.value = error instanceof Error ? error.message : '目标列表加载失败。'
  } finally {
    if (recentRequest === recentListRequest) recentLoading.value = false
    if (request === goalListRequest) goalListLoading.value = false
  }
}

function changeGoalFilter(status) {
  if (status === goalStatusFilter.value) return
  goalStatusFilter.value = status
  loadGoalPage(1)
}
function refreshGoalLists(page = goalPage.value) {
  const refreshRecent = goalStatusFilter.value !== 'ALL' || page !== 1
  return Promise.all([loadGoalPage(page), refreshRecent ? loadRecentGoals() : null])
}

async function submitGoal() {
  const normalized = goalSubmissionText.value
  if (!normalized || normalized.length > 1000 || activeRequest.value) return
  if (result.value && normalized === activeSavedText.value) return openGoalDetails(activeGoalId.value)

  activeRequest.value = 'analysis'
  errorMessage.value = ''
  directPlanGoal.value = null

  try {
    if (!activeGoalId.value || normalized !== activeSavedText.value) {
      const savedGoal = await createGoal(normalized)
      activeGoalId.value = savedGoal.id
      activeSavedText.value = savedGoal.goalText || normalized
      if (activeView.value === 'create') showSession(savedGoal)
      result.value = null
      plan.value = null
      clarificationAnswers.value = []
      refreshGoalLists(1)
    }

    result.value = normalizeResult(await analyzeGoal(activeGoalId.value))
    updateSelectedStatus(result.value.readiness === 'READY' ? 'READY_TO_PLAN' : 'NEEDS_CLARIFICATION')
    plan.value = null
    clarificationAnswers.value = result.value.clarificationQuestions.map((item) => item.answer || '')
    await refreshGoalLists(1)
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
    updateSelectedStatus(result.value.readiness === 'READY' ? 'READY_TO_PLAN' : 'NEEDS_CLARIFICATION')
    clarificationAnswers.value = result.value.clarificationQuestions.map((item) => item.answer || '')
    plan.value = null
    await refreshGoalLists(1)
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
    if (activeView.value === 'session' && selectedGoal.value?.id === goalId) { await nextTick(); sessionView.value?.openPanel('plan') }
    scrollToTop()
  } catch (error) {
    if (plan.value?.status === 'REJECTED') handlePlanDecisionError('计划生成没有完成', error)
    else setRequestError('计划生成没有完成', error)
  } finally {
    activeRequest.value = null
  }
}

async function createPlan() {
  if (activeRequest.value || (result.value?.readiness !== 'READY' && selectedGoal.value?.status !== 'READY_TO_PLAN') || !activeGoalId.value || plan.value) return
  await requestPlan(activeGoalId.value)
}

async function approveCurrentPlan() {
  if (activeRequest.value || planActionBlocked.value || !plan.value?.planId || plan.value.status !== 'DRAFT') return
  activeRequest.value = 'approval'
  errorMessage.value = ''
  try {
    const approved = await approvePlan(plan.value.planId)
    planGoalStatus.value = approved?.goalStatus || 'ACTIVE'
    updateSelectedStatus(planGoalStatus.value)
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
    await refreshGoalLists(1)
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
    refreshGoalLists(goalPage.value)
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
    await refreshGoalLists(goalPage.value)
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
  refreshGoalLists(goalPage.value)
}

function syncPlanSnapshot({ plan: latest, goalStatus }) {
  if (selectedGoal.value?.id === latest.goalId) selectedGoal.value = { ...selectedGoal.value, status: goalStatus }
  // A saved-plan page may show a different goal from the workbench draft.
  if (plan.value?.status === 'ACTIVE' && plan.value.goalId === latest.goalId) {
    plan.value = latest
    planGoalStatus.value = goalStatus
  }
  goalItems.value = goalItems.value.map(goal => goal.id === latest.goalId ? { ...goal, status: goalStatus } : goal)
  recentItems.value = recentItems.value.map(goal => goal.id === latest.goalId ? { ...goal, status: goalStatus } : goal)
  if (goalStatusFilter.value !== 'ALL' && goalItems.value.some(goal => goal.status !== goalStatusFilter.value)) loadGoalPage(goalPage.value)
  if (directPlanGoal.value?.id === latest.goalId) directPlanGoal.value = { ...directPlanGoal.value, status: goalStatus }
}

async function generateGoalPlan(goal) {
  if (activeRequest.value || !goal?.id) return
  if (availableDraftGoalId.value === goal.id || (plan.value?.goalId === goal.id && plan.value.status === 'REJECTED')) {
    showSession(goal, 'plan')
    return
  }
  if (activeGoalId.value !== goal.id) clearJourney()
  goalText.value = goal.goalText || ''
  goalDetails.value = {}
  activeGoalId.value = goal.id
  activeSavedText.value = goal.goalText || ''
  directPlanGoal.value = goal
  showSession(goal)
  await nextTick()
  sessionView.value?.openPanel('')
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
  clarificationAnswers.value = []
  directPlanGoal.value = null
}

function updateSelectedStatus(status) {
  if (selectedGoal.value?.id === activeGoalId.value) selectedGoal.value = { ...selectedGoal.value, status }
}

function startNewGoal() {
  if (activeRequest.value) return
  clearJourney()
  detailRequest++
  activeView.value = 'create'
  selectedGoal.value = null
  sessionId.value = null
  writeRoute('#/new')
}
function resetAll() { startNewGoal() }

let lastRoute = ''
function writeRoute(hash) {
  lastRoute = hash
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)
}
function navigate(view) {
  if (view === 'create' && activeGoalId.value) return openGoalDetails(activeGoalId.value)
  detailRequest++
  activeView.value = view
  if (view === 'library') {
    writeRoute('#/goals')
    if (!goalItems.value.length && !goalListLoading.value) loadGoalPage(1)
  } else writeRoute('#/new')
  scrollToTop()
}
function showSession(goal, panel = '') {
  detailRequest++
  selectedGoal.value = goal
  sessionId.value = goal.id
  sessionPanel.value = panel
  useSavedPlan.value = false
  sessionError.value = ''
  detailLoading.value = false
  activeView.value = 'session'
  writeRoute('#/goals/' + goal.id)
  nextTick(() => { if (panel) sessionView.value?.openPanel(panel) })
}
function openSavedPlan(goal) { return openGoalDetails(goal.id, 'plan') }

let detailRequest = 0
async function openGoalDetails(goalId, panel = '') {
  const request = ++detailRequest
  sessionId.value = goalId
  sessionPanel.value = panel
  useSavedPlan.value = panel === 'plan'
  selectedGoal.value = null
  detailLoading.value = true
  sessionError.value = ''
  activeView.value = 'session'
  writeRoute('#/goals/' + goalId)
  try {
    const goal = await getGoalDetails(goalId)
    if (request !== detailRequest) return
    if (goal?.id !== goalId || !goal.status) throw new Error('返回的目标信息不完整，请重新读取。')
    selectedGoal.value = goal
    if (goalId === activeGoalId.value && plan.value?.status === 'ACTIVE') planGoalStatus.value = goal.status
  } catch (error) {
    if (request !== detailRequest) return
    sessionError.value = error?.status === 404 || error?.status === 403
      ? '这个目标已不存在或无法访问，请返回目标库确认。'
      : error instanceof Error ? error.message : '目标暂时无法读取。'
  } finally {
    if (request === detailRequest) detailLoading.value = false
  }
}
async function continueGoal(goal) {
  if (activeRequest.value || !goal?.id) return
  if (activeGoalId.value === goal.id && (result.value || plan.value)) {
    showSession(goal)
    await nextTick()
    sessionView.value?.openPanel('')
    return
  }
  clearJourney()
  goalText.value = goal.goalText || ''
  activeGoalId.value = goal.id
  activeSavedText.value = goal.goalText || ''
  showSession(goal)
  await nextTick()
  sessionView.value?.openPanel('')
  await submitGoal()
}

function restoreRoute() {
  const hash = window.location.hash
  if (hash === lastRoute) return
  lastRoute = hash
  const goalMatch = /^#\/goals\/([1-9]\d*)$/.exec(hash)
  if (goalMatch && Number.isSafeInteger(Number(goalMatch[1]))) openGoalDetails(Number(goalMatch[1]))
  else if (hash === '#/goals') navigate('library')
  else { detailRequest++; activeView.value = 'create'; if (hash !== '#/new') { window.history.replaceState(null, '', '#/new'); lastRoute = '#/new' } }
}
onMounted(() => {
  loadGoalPage(1)
  restoreRoute()
  window.addEventListener('popstate', restoreRoute)
  window.addEventListener('hashchange', restoreRoute)
})
onBeforeUnmount(() => {
  detailRequest++
  goalListRequest++
  recentListRequest++
  window.removeEventListener('popstate', restoreRoute)
  window.removeEventListener('hashchange', restoreRoute)
})
</script>

<template>
  <div class="workspace-shell" :class="{ 'in-session': activeView === 'session' }">
    <WorkspaceSidebar :user="user" :active-view="activeView" :active-goal-id="activeView === 'session' ? sessionId : null" :items="recentItems" :goal-total="recentTotal" :busy="!!activeRequest" @navigate="navigate" @new-goal="startNewGoal" @open-goal="openGoalDetails" @logout="$emit('logout')" />
    <main class="workspace-main">
      <StudioBackdrop />
      <header class="topbar">
        <nav class="mobile-nav" aria-label="移动端工作区导航"><button type="button" @click="startNewGoal">新建目标</button><button type="button" @click="navigate('library')">目标库</button></nav>
        <div class="topbar-context"><span class="space-name">GoalPilot <i>✧</i> {{ activeView === 'session' ? '目标会话' : activeView === 'library' ? '我的目标' : '让想法开始生长' }}</span></div>
        <div class="topbar-right"><time class="topbar-date" :datetime="todayDateValue"><span class="date-number">{{ todayDay }}</span><span class="date-copy"><strong>{{ todayWeekday }}</strong><small>{{ todayMonth }}</small></span></time><AccountMenu :user="user" @logout="$emit('logout')" /></div>
      </header>
      <div class="workspace-content" :class="{ 'session-content': activeView === 'session' }">
        <div v-if="activeView === 'create'" class="create-dashboard">
          <GoalComposer v-model="goalText" v-model:details="goalDetails" :loading="activeRequest === 'analysis'" :error-title="errorTitle" :error-message="errorMessage" :user-name="user.username" :current-goal-id="activeGoalId" :analyzed="!!result && goalSubmissionText === activeSavedText" @submit="submitGoal" @resume="openGoalDetails(activeGoalId)" @dismiss-error="errorMessage = ''" />
          <RecentGoals :items="recentItems" :loading="recentLoading" :error="recentError" :busy="!!activeRequest" @open="openGoalDetails" @plan="openSavedPlan" @library="navigate('library')" @retry="loadRecentGoals" />
        </div>
        <template v-else-if="activeView === 'session'">
          <div v-if="detailLoading || !selectedGoal" class="session-loading">
            <span aria-hidden="true">✧</span><h1>{{ sessionError ? '暂时无法打开这个目标' : '正在打开目标会话' }}</h1>
            <p v-if="sessionError" role="alert">{{ sessionError }}</p><p v-else role="status">取回目标信息，不会自动生成或修改计划。</p>
            <div><button type="button" @click="navigate('library')">返回目标库</button><button v-if="sessionError" type="button" @click="openGoalDetails(sessionId)">重新读取</button></div>
          </div>
          <GoalSessionView v-else :key="selectedGoal.id" ref="sessionView" :goal="selectedGoal" :session="sessionFor(selectedGoal.id)" :initial-panel="sessionPanel" :busy="!!activeRequest" :has-draft="availableDraftGoalId === selectedGoal.id" @back="reviewGoalState" @analyze="continueGoal(selectedGoal)" @generate="generateGoalPlan(selectedGoal)" @updated="syncPlanSnapshot">
            <template v-if="planningMode" #conversation>
              <PlanningConversation v-model:answers="clarificationAnswers" :goal="selectedGoal" :result="result" :plan="plan" :active-request="activeRequest" :error-message="errorMessage" :error-title="errorTitle" @analyze="submitGoal" @clarify="submitClarification" @generate-plan="createPlan" @open-plan="sessionView?.openPanel('plan')" @open-info="sessionView?.openPanel('info')" />
            </template>
            <template v-if="selectedGoal.id === activeGoalId && plan && !useSavedPlan" #plan>
              <PlanRoadmap :plan="plan" :active-request="activeRequest" :error-title="errorTitle" :error-message="errorMessage" :action-blocked="planActionBlocked" :goal-status="planGoalStatus" :pending-task="pendingTask" :task-busy="taskBusy" :task-feedback="taskFeedback" :task-updates-blocked="taskUpdatesBlocked" @update-task="updateTask" @refresh-tasks="refreshTasks" @approve="approveCurrentPlan" @reject="rejectCurrentPlan" @regenerate="regenerateCurrentPlan" @open-library="reviewGoalState" @reset="resetAll" @dismiss-error="errorMessage = ''" @ask-assistant="sessionView?.askAssistant($event)" />
            </template>
          </GoalSessionView>
        </template>
        <GoalLibrary v-else :items="goalItems" :loading="goalListLoading" :error-message="goalListError" :page="goalPage" :total-pages="goalTotalPages" :total="goalTotal" :status-filter="goalStatusFilter" :busy="!!activeRequest" :available-draft-goal-id="availableDraftGoalId" @status-change="changeGoalFilter" @select="openGoalDetails" @continue="continueGoal" @generate-plan="generateGoalPlan" @view-plan="openSavedPlan" @new-goal="startNewGoal" @refresh="loadGoalPage(goalPage)" @page-change="loadGoalPage" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.workspace-shell { min-height: 100dvh; background: var(--canvas); color: var(--ink); }
.workspace-main { position: relative; isolation: isolate; min-height: 100dvh; margin-left: 248px; display: flex; flex-direction: column; background: var(--canvas); }
.topbar { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; gap: 20px; height: 65px; padding: 0 28px; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--paper) 66%, transparent); }
.space-name { color: var(--ink-500); font-size: 12px; }.space-name i { display: inline-block; margin: 0 10px; color: var(--ink-500); font-size: 17px; font-style: normal; }
.topbar-right { display: flex; align-items: center; gap: 23px; }.topbar-date { display: inline-flex; align-items: center; gap: 9px; }.date-number { position: relative; width: 34px; height: 36px; display: grid; place-items: center; padding-top: 3px; border-radius: var(--radius-sm); color: var(--ink-500); background: linear-gradient(140deg, var(--canvas-soft), var(--canvas-soft)); box-shadow: inset 0 1px 0 #fff; font-family: var(--display); font-variant-numeric: tabular-nums; font-size: 20px; }.date-number::before { content: ''; position: absolute; top: 5px; width: 14px; height: 2px; border-radius: 2px; background: var(--accent-pale); }.date-copy strong, .date-copy small { display: block; }.date-copy strong { color: var(--ink-500); font-size: 10px; font-weight: 500; }.date-copy small { margin-top: 3px; color: var(--ink-500); font-size: 9px; }
.current-user { display: flex; align-items: center; gap: 8px; padding: 0; border: 0; background: transparent; color: var(--ink-500); font-size: 11px; }.current-user i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--ink-500); background: var(--canvas-soft); font-size: 13px; font-style: normal; }
.workspace-content { position: relative; z-index: 1; width: min(1800px, calc(100% - 72px)); margin-inline: auto; padding: 32px 0; flex: 1; min-height: 0; }
.workspace-shell.in-session, .in-session .workspace-main { height: 100dvh; min-height: 0; overflow: hidden; }.workspace-content.session-content { width: 100%; padding: 0; display: flex; flex-direction: column; overflow: hidden; }
.create-dashboard { width: min(1440px, 100%); margin: clamp(15px, 3.5vh, 48px) auto 25px; animation: workspace-arrive .38s var(--ease-out) both; }
.topbar { position: relative; z-index: 2; background: #f7f8f1c9; backdrop-filter: blur(12px); }.date-number { color: var(--accent-deep); background: #e4ebda; }.date-copy strong { color: var(--ink-700); font-size: 11px; }.current-user i { background: #eee4d3; color: #786044; border-radius: var(--radius-sm); }
@keyframes workspace-arrive { from { opacity: 0; transform: translateY(8px); } }
.session-loading { margin: auto; max-width: 550px; padding: 35px; text-align: center; }.session-loading > span { color: var(--ink-500); font-size: 45px; }.session-loading h1 { margin: 15px 0; font-size: 22px; font-weight: 500; }.session-loading p { font-size: 13px; color: var(--ink-500); line-height: 1.8; }.session-loading button { margin: 10px 5px; padding: 10px 15px; border: 0; border-radius: var(--radius-sm); color: var(--ink-500); background: var(--canvas-soft); font-size: 12px; }
.mobile-nav { display: none; }
@media(max-width: 1050px) { .workspace-main { margin-left: 200px; } }
@media(max-width: 800px) { .workspace-main { margin-left: 0; }.topbar { height: 56px; padding-inline: 17px; }.topbar-context { display: none; }.mobile-nav { display: flex; gap: 8px; }.mobile-nav button { padding: 7px 11px; border: 0; border-radius: var(--radius-sm); background: var(--canvas-soft); color: var(--ink-500); font-size: 11px; }.current-user > span { display: none; }.topbar-right { gap: 10px; }.workspace-content { width: calc(100% - 32px); padding-top: 20px; }.create-dashboard { margin-top: 20px; } }
@media(max-width: 480px) { .topbar-date { display: none; }.create-dashboard { margin-top: 10px; } }
</style>
