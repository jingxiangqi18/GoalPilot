<script setup>
import { computed, nextTick, ref } from 'vue'
import { analyzeGoal } from './api/goal'

const examples = [
  '我想在三个月内完成一个适合找 Java 后端实习的项目',
  '我想在今年通过英语六级考试，每天大约能学习一小时',
  '我想开始规律跑步，希望半年后完成一次半程马拉松',
]

const goalText = ref('')
const submittedGoal = ref('')
const result = ref(null)
const errorMessage = ref('')
const isLoading = ref(false)
const clarificationAnswers = ref([])
const resultSection = ref(null)

const characterCount = computed(() => goalText.value.length)
const canSubmit = computed(
  () => goalText.value.trim().length > 0 && goalText.value.length <= 1000 && !isLoading.value,
)
const isReady = computed(() => result.value?.readiness === 'READY')
const answeredCount = computed(() =>
  clarificationAnswers.value.filter((answer) => answer.trim()).length,
)

function useExample(example) {
  goalText.value = example
  errorMessage.value = ''
}

function normalizeResult(data) {
  return {
    goalSummary: data?.goalSummary || '未返回目标概述',
    knownInformation: Array.isArray(data?.knownInformation) ? data.knownInformation : [],
    missingInformation: Array.isArray(data?.missingInformation) ? data.missingInformation : [],
    readiness: data?.readiness || 'UNKNOWN',
    clarificationQuestions: Array.isArray(data?.clarificationQuestions)
      ? data.clarificationQuestions
      : [],
  }
}

async function submitGoal(text = goalText.value) {
  const normalized = text.trim()
  if (!normalized || normalized.length > 1000 || isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    result.value = normalizeResult(await analyzeGoal(normalized))
    submittedGoal.value = normalized
    clarificationAnswers.value = result.value.clarificationQuestions.map(() => '')
    await nextTick()
    resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分析失败，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}

async function resubmitWithAnswers() {
  if (isLoading.value) return

  const answeredItems = result.value.clarificationQuestions
    .map((question, index) => ({ question, answer: clarificationAnswers.value[index]?.trim() }))
    .filter((item) => item.answer)

  if (!answeredItems.length) return

  const supplement = answeredItems
    .map((item) => `问题：${item.question}\n回答：${item.answer}`)
    .join('\n')
  const combinedGoal = `${submittedGoal.value}\n\n补充信息：\n${supplement}`

  goalText.value = combinedGoal.slice(0, 1000)
  await submitGoal(goalText.value)
}

function resetAll() {
  goalText.value = ''
  submittedGoal.value = ''
  result.value = null
  errorMessage.value = ''
  clarificationAnswers.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="GoalPilot 首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" fill="none">
            <path d="M14 4v20M4 14h20" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" />
            <circle cx="14" cy="14" r="5" fill="currentColor" />
          </svg>
        </span>
        <span>GoalPilot</span>
      </a>

      <div class="header-status" title="接口地址：/api/goals/analyze">
        <span class="status-dot"></span>
        本地测试模式
      </div>
    </header>

    <main id="top">
      <section class="hero-section">
        <div class="eyebrow"><span></span> AI 目标分析助手</div>
        <h1>先想清楚目标，<br /><em>再开始行动。</em></h1>
        <p class="hero-copy">
          描述一个你想完成的目标，GoalPilot 会帮你梳理已有条件、发现关键信息缺口，判断是否可以开始制定计划。
        </p>

        <div class="input-card">
          <div class="input-card-header">
            <label for="goal-input">你想完成什么？</label>
            <span :class="{ warning: characterCount > 900 }">{{ characterCount }} / 1000</span>
          </div>

          <textarea
            id="goal-input"
            v-model="goalText"
            maxlength="1000"
            rows="6"
            placeholder="例如：我想在三个月内完成一个适合找 Java 后端实习的项目……"
            @keydown.ctrl.enter="submitGoal()"
            @keydown.meta.enter="submitGoal()"
          ></textarea>

          <div class="input-actions">
            <span class="shortcut-hint">Ctrl / ⌘ + Enter 快速提交</span>
            <button class="primary-button" :disabled="!canSubmit" @click="submitGoal()">
              <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
              <svg v-else viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m4 10 3.2 3.2L16 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ isLoading ? '正在分析…' : '开始分析' }}
            </button>
          </div>
        </div>

        <div class="examples">
          <span>试试这些目标</span>
          <button v-for="example in examples" :key="example" @click="useExample(example)">
            {{ example }}
          </button>
        </div>

        <div v-if="errorMessage" class="error-banner" role="alert">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.8" />
            <path d="M10 6.5v4.2M10 14h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <div>
            <strong>分析没有完成</strong>
            <p>{{ errorMessage }}</p>
          </div>
          <button @click="errorMessage = ''" aria-label="关闭错误提示">×</button>
        </div>
      </section>

      <section v-if="result" ref="resultSection" class="result-section">
        <div class="result-heading">
          <div>
            <div class="eyebrow"><span></span> 分析结果</div>
            <h2>目标已经梳理完成</h2>
          </div>
          <button class="text-button" @click="resetAll">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 5.5h12M7 5.5V4h6v1.5M6.5 8v7M10 8v7M13.5 8v7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            分析新目标
          </button>
        </div>

        <div class="summary-card">
          <div class="summary-topline">
            <span class="card-kicker">目标概述</span>
            <span class="readiness-badge" :class="isReady ? 'ready' : 'needs-info'">
              <span></span>
              {{ isReady ? '信息已充足' : '需要补充信息' }}
            </span>
          </div>
          <p>{{ result.goalSummary }}</p>
        </div>

        <div class="information-grid">
          <article class="info-card known-card">
            <div class="info-title">
              <span class="icon-box check-icon">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m4 10 3.5 3.5L16 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <div>
                <h3>已经明确</h3>
                <p>{{ result.knownInformation.length }} 项已知信息</p>
              </div>
            </div>
            <ul>
              <li v-for="item in result.knownInformation" :key="item">{{ item }}</li>
            </ul>
          </article>

          <article class="info-card missing-card">
            <div class="info-title">
              <span class="icon-box question-icon">?</span>
              <div>
                <h3>{{ isReady ? '没有关键缺口' : '还需要明确' }}</h3>
                <p>{{ result.missingInformation.length }} 项缺失信息</p>
              </div>
            </div>
            <ul v-if="result.missingInformation.length">
              <li v-for="item in result.missingInformation" :key="item">{{ item }}</li>
            </ul>
            <p v-else class="empty-copy">目前的信息足以生成一份合理的初步计划。</p>
          </article>
        </div>

        <article v-if="result.clarificationQuestions.length" class="clarification-card">
          <div class="clarification-intro">
            <span class="step-number">下一步</span>
            <div>
              <h3>补充几个关键信息</h3>
              <p>回答后会将信息合并到原目标，并重新调用分析接口。</p>
            </div>
          </div>

          <div class="question-list">
            <label
              v-for="(question, index) in result.clarificationQuestions"
              :key="question"
              class="question-item"
            >
              <span class="question-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="question-content">
                <strong>{{ question }}</strong>
                <input
                  v-model="clarificationAnswers[index]"
                  type="text"
                  maxlength="300"
                  placeholder="在这里输入你的回答"
                  @keydown.enter="resubmitWithAnswers"
                />
              </span>
            </label>
          </div>

          <div class="clarification-actions">
            <span>已回答 {{ answeredCount }} / {{ result.clarificationQuestions.length }}</span>
            <button
              class="primary-button"
              :disabled="answeredCount === 0 || isLoading"
              @click="resubmitWithAnswers"
            >
              <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
              {{ isLoading ? '重新分析中…' : '提交补充并重新分析' }}
            </button>
          </div>
        </article>

        <article v-else class="ready-card">
          <span class="ready-illustration" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity=".25" />
              <path d="m15 24 6 6 12-13" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div>
            <h3>可以进入计划阶段</h3>
            <p>当前版本尚未开放计划生成接口，这份结果可用于验证 READY 状态是否符合预期。</p>
          </div>
        </article>
      </section>
    </main>

    <footer>
      <span>GoalPilot · 让目标更清楚</span>
      <span>当前功能：Goal Analysis</span>
    </footer>
  </div>
</template>
