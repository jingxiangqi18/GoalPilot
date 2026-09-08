import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getGoalDetails } from '../api/goal'
import { getActivePlan, updatePlanTaskStatus } from '../api/plan'
import { replacePlanTask, taskStatusLabel, taskStatusOptions } from '../utils/planTasks'

// Shared by the workbench and saved-plan page. The owning page keeps the snapshot;
// a successful response replaces its task, without changing goal or plan status.
export function usePlanTasks(plan, goalStatus, onChanged = () => {}) {
  const pendingTask = ref(null)
  const refreshingTasks = ref(false)
  const taskFeedback = ref(null)
  const taskUpdatesBlocked = ref(false)
  const taskBusy = computed(() => Boolean(pendingTask.value) || refreshingTasks.value)
  const tasksEditable = computed(() => plan.value?.status === 'ACTIVE' && goalStatus.value === 'ACTIVE' && !taskUpdatesBlocked.value)
  let epoch = 0

  watch(() => plan.value?.planId, () => {
    epoch++
    pendingTask.value = null
    refreshingTasks.value = false
    taskFeedback.value = null
    taskUpdatesBlocked.value = false
  }, { flush: 'sync' })
  onBeforeUnmount(() => { epoch++ })

  async function updateTask({ taskId, status }) {
    if (taskBusy.value || !tasksEditable.value || !taskId) return
    if (!taskStatusOptions.some(option => option.value === status)) return
    const task = plan.value.stages.flatMap(stage => stage.tasks).find(item => item.taskId === taskId)
    if (!task || task.status === status || !taskStatusOptions.some(option => option.value === task.status)) return
    const request = epoch
    pendingTask.value = { taskId, status }
    taskFeedback.value = null
    try {
      const updated = await updatePlanTaskStatus(taskId, status)
      if (request !== epoch) return
      if (updated?.taskId !== taskId || !taskStatusOptions.some(option => option.value === updated?.status) || typeof updated?.title !== 'string') {
        throw new Error('服务器未返回完整的任务状态，暂时无法确认保存结果。')
      }
      plan.value = replacePlanTask(plan.value, updated)
      taskFeedback.value = { kind: 'success', taskId, message: `「${updated.title}」已保存为${taskStatusLabel(updated.status)}。` }
      onChanged({ plan: plan.value, goalStatus: goalStatus.value })
    } catch (error) {
      if (request !== epoch || error?.status === 401) return
      // A conflict or uncertain response must be reconciled by a read, not a repeat write.
      taskUpdatesBlocked.value = error?.status !== 400
      const message = error?.status === 409
        ? '任务、计划或目标状态已变化。请读取最新状态后再操作，本次不会自动重试。'
        : error?.status === 404 || error?.status === 403
          ? '任务已不存在或当前不可操作。请核对最新计划，也可以返回目标库。'
          : error?.status === 400
            ? (error.message || '状态不符合要求，请重新选择。')
            : '暂时无法确认保存结果，仍显示上次读取的状态。请刷新核对后再操作。'
      taskFeedback.value = { kind: 'error', taskId, message }
    } finally {
      if (request === epoch) pendingTask.value = null
    }
  }

  async function refreshTasks() {
    if (taskBusy.value || !plan.value?.goalId) return
    const request = epoch
    const goalId = plan.value.goalId
    refreshingTasks.value = true
    try {
      // The plan endpoint does not include goal status, so verify both prerequisites.
      const [goal, latest] = await Promise.all([getGoalDetails(goalId), getActivePlan(goalId)])
      if (request !== epoch) return
      if (goal?.id !== goalId || !goal.status || latest?.goalId !== goalId || !latest.planId || latest.status !== 'ACTIVE' || !Array.isArray(latest.stages)) {
        throw new Error('返回的目标或计划数据不完整。')
      }
      goalStatus.value = goal.status
      plan.value = latest
      taskUpdatesBlocked.value = false
      taskFeedback.value = { kind: 'info', message: goal.status === 'ACTIVE' ? '已读取最新任务状态，可以继续操作。' : '目标当前不在进行中，任务仅供查看。' }
      onChanged({ plan: latest, goalStatus: goal.status })
    } catch (error) {
      if (request !== epoch || error?.status === 401) return
      taskUpdatesBlocked.value = true
      taskFeedback.value = { kind: 'error', message: error?.status === 404 ? '当前目标或正式计划已无法读取，请返回目标库核对。' : '最新状态读取失败，已保留当前内容。请稍后重新读取。' }
    } finally {
      if (request === epoch) refreshingTasks.value = false
    }
  }

  return { pendingTask, refreshingTasks, taskFeedback, taskUpdatesBlocked, taskBusy, tasksEditable, updateTask, refreshTasks }
}
