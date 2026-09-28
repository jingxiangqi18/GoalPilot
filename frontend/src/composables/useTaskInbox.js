import { onBeforeUnmount, reactive } from 'vue'
import { createTask, getTasks } from '../api/task'
import { emptyTaskDraft, taskCreateChanges } from '../utils/taskDraft'
import { TASK_PAGE_SIZE } from '../utils/taskPage'

export function useTaskInbox() {
  // Drafts and page positions are isolated by view; private data stays in memory.
  const states = reactive({})
  const readVersions = new WeakMap()
  let disposed = false
  function stateFor(goalId = null) {
    const key = goalId || 'inbox'
    if (!states[key]) states[key] = {
      draft: emptyTaskDraft(goalId), open: false, detailsOpen: false,
      pending: false, error: '', notice: '', uncertain: false, retryAcknowledged: false,
      list: { items: [], page: 1, size: TASK_PAGE_SIZE, total: 0, totalPages: 0,
        requestedPage: 1, loaded: false, loading: false, error: '', stale: true },
    }
    return states[key]
  }
  async function load(state, page = state.list.requestedPage, allowPageRecovery = true) {
    if (disposed) return
    const list = state.list
    const version = (readVersions.get(state) || 0) + 1
    readVersions.set(state, version)
    list.loading = true; list.error = ''; list.stale = false; list.requestedPage = page
    const current = () => !disposed && readVersions.get(state) === version
    try {
      const data = await getTasks(page, list.size)
      if (!current()) return
      // Records can disappear between reads. Recover once, without a fetch loop.
      const lastPage = Math.max(1, data.totalPages)
      if (page > lastPage) {
        if (allowPageRecovery) return await load(state, lastPage, false)
        throw new Error('任务页数已变化，请重新读取。')
      }
      Object.assign(list, data, { loaded: true })
    } catch (error) {
      if (current()) list.error = error.message || '任务列表暂时无法读取，请稍后重试。'
    } finally {
      if (current()) list.loading = false
    }
  }
  function invalidateLists(savedState) {
    for (const state of Object.values(states)) {
      readVersions.set(state, (readVersions.get(state) || 0) + 1)
      state.list.loading = false
      state.list.error = ''
      // The active creator returns to newest first; other views keep their page.
      if (state === savedState) state.list.requestedPage = 1
      state.list.stale = true
    }
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
      state.draft = emptyTaskDraft(body.goalId)
      state.notice = `「${task.title}」已保存${task.goalId ? '，已关联目标' : '为独立任务'}。`
      state.open = false; state.detailsOpen = false; state.uncertain = false
      invalidateLists(state)
    } catch (error) {
      if (disposed) return
      state.uncertain = ![400, 401, 403, 404].includes(error?.status)
      state.error = state.uncertain
        ? '保存结果未确认，任务可能已经写入。请刷新任务列表核对；同名任务不代表同一次提交，重复保存可能产生重复任务。'
        : error?.status === 403 || error?.status === 404
          ? '关联目标已不存在或无法访问。输入已保留，可以重新选择目标，或保存为独立任务。'
          : error.message || '任务暂时未能保存，输入已保留。'
    } finally {
      if (!disposed) { state.pending = false; state.retryAcknowledged = false }
    }
  }
  onBeforeUnmount(() => { disposed = true })
  return { stateFor, submit, load }
}
