const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function getErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message

  if (status === 400) return '目标内容不符合要求，请检查后重试。'
  if (status === 502) return 'AI 返回了无效结果，请稍后再试。'
  return `请求失败（HTTP ${status}）`
}

export async function analyzeGoal(goalText) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/goals/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalText }),
    })
  } catch {
    throw new Error('无法连接后端服务，请确认 Spring Boot 已在 8080 端口启动。')
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status))
  }

  return data
}

