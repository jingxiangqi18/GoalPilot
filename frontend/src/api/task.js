import { postJson } from './client'
import { isTaskCreateReceipt } from '../utils/taskDraft'

export async function createTask(body) {
  const task = await postJson('/api/tasks', body)
  if (!isTaskCreateReceipt(task, body)) throw new Error('任务回执不完整，无法确认保存结果。')
  return task
}
