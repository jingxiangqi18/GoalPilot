import { onBeforeUnmount, reactive, ref } from 'vue'
import { createTask } from '../api/task'
import { emptyTaskDraft, taskCreateChanges } from '../utils/taskDraft'

export function useTaskInbox() {
  // Creation receipts are session-only. Do not pretend this is a server task list,
  // and do not persist private task text across users in localStorage.
  const tasks = ref([])
  const states = reactive({})
  let disposed = false
  function stateFor(goalId = null) {
    const key = goalId || 'inbox'
    if (!states[key]) states[key] = {
      draft: emptyTaskDraft(goalId), open: false, detailsOpen: false,
      pending: false, error: '', notice: '', uncertain: false, retryAcknowledged: false,
    }
    return states[key]
  }
  async function submit(state) {
    if (disposed || state.pending || (state.uncertain && !state.retryAcknowledged)) return
    const { body, errors } = taskCreateChanges(state.draft)
    if (Object.keys(errors).length) return
    state.pending = true
    state.error = ''; state.notice = ''
    try {
      const task = await createTask(body)
      if (disposed) return
      tasks.value = [task, ...tasks.value.filter(item => item.id !== task.id)]
      state.draft = emptyTaskDraft(body.goalId)
      state.notice = `「${task.title}」已保存${task.goalId ? '，已关联目标' : '为独立任务'}。`
      state.open = false; state.detailsOpen = false; state.uncertain = false
    } catch (error) {
      if (disposed) return
      state.uncertain = ![400, 401, 403, 404].includes(error?.status)
      state.error = state.uncertain
        ? '保存结果未确认，任务可能已经写入。当前还没有任务查询接口，请先核对后端记录；重复提交可能产生重复任务。'
        : error?.status === 403 || error?.status === 404
          ? '关联目标已不存在或无法访问。输入已保留，可以重新选择目标，或保存为独立任务。'
          : error.message || '任务暂时未能保存，输入已保留。'
    } finally {
      if (!disposed) { state.pending = false; state.retryAcknowledged = false }
    }
  }
  onBeforeUnmount(() => { disposed = true })
  return { tasks, stateFor, submit }
}
