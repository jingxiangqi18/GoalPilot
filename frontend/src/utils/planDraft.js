// A failed/incomplete read must never be treated as permission to generate again.
export function readDraftPage(data, goalId) {
  if (!Array.isArray(data?.items) || data.page !== 1 || data.size !== 1
    || !Number.isSafeInteger(data.total) || data.total < 0
    || data.totalPages !== data.total || data.items.length !== Math.min(data.total, 1)) {
    throw new Error('草稿查询结果不完整，请重新读取。')
  }
  if (!data.total) return null
  const draft = data.items[0]
  if (draft?.goalId !== goalId || draft.status !== 'DRAFT'
    || !Number.isSafeInteger(draft.planId) || draft.planId < 1
    || typeof draft.planTitle !== 'string' || !draft.planTitle.trim() || !Array.isArray(draft.stages) || !draft.stages.length
    || draft.stages.some(stage => !stage || !Array.isArray(stage.tasks) || !stage.tasks.length)) {
    throw new Error('返回的计划草稿与当前目标不一致或内容不完整，请重新读取。')
  }
  return draft
}
