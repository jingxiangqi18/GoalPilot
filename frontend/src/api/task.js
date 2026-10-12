import { getJson, patchJson, postJson } from './client'
import { isTaskCreateReceipt } from '../utils/taskDraft'
import { isTaskPage, TASK_PAGE_SIZE } from '../utils/taskPage'
import { isTaskUpdateReceipt } from '../utils/taskUpdate'

export async function updateTask(id, patch) {
  const task = await patchJson(`/api/tasks/${encodeURIComponent(id)}`, patch)
  if (!isTaskUpdateReceipt(task, id, patch)) throw new Error('任务更新回执不完整，无法确认保存结果。')
  return task
}

export async function getTasks(page = 1, size = TASK_PAGE_SIZE) {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < 1 || size > 100) {
    throw new Error('任务页码或每页数量无效。')
  }
  const data = await getJson(`/api/tasks?${new URLSearchParams({ page, size })}`)
  if (!isTaskPage(data, page, size)) throw new Error('任务列表或分页信息不完整，请重新读取。')
  return data
}

export async function createTask(body) {
  const task = await postJson('/api/tasks', body)
  if (!isTaskCreateReceipt(task, body)) throw new Error('任务回执不完整，无法确认保存结果。')
  return task
}
