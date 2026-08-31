<script setup>
import { computed } from 'vue'

const props = defineProps({ plan: { type: Object, required: true } })
defineEmits(['reset'])

const taskCount = computed(() => props.plan.stages.reduce((sum, stage) => sum + stage.tasks.length, 0))
</script>

<template>
  <section id="plan" class="plan-module">
    <header class="module-heading">
      <div class="heading-index">03</div>
      <div class="heading-copy">
        <span>行动路线</span>
        <h2>{{ plan.planTitle }}</h2>
        <p>这是一份可以按实际情况持续调整的初步计划。</p>
      </div>
      <div class="plan-stats">
        <span><strong>{{ plan.stages.length }}</strong> 个阶段</span>
        <span><strong>{{ taskCount }}</strong> 项任务</span>
      </div>
    </header>

    <article class="plan-summary">
      <span>整体思路</span>
      <p>{{ plan.planSummary }}</p>
    </article>

    <ol class="stage-list">
      <li v-for="(stage, stageIndex) in plan.stages" :key="`${stageIndex}-${stage.title}`">
        <div class="stage-number">{{ stageIndex + 1 }}</div>
        <article class="stage-card">
          <header>
            <div>
              <span>阶段 {{ stageIndex + 1 }}</span>
              <h3>{{ stage.title }}</h3>
            </div>
            <span class="time-range">{{ stage.timeRange }}</span>
          </header>

          <div class="stage-objective">
            <strong>阶段目标</strong>
            <p>{{ stage.objective }}</p>
          </div>

          <div class="task-list">
            <article v-for="(task, taskIndex) in stage.tasks" :key="`${taskIndex}-${task.title}`" class="task-card">
              <div class="task-number">{{ String(taskIndex + 1).padStart(2, '0') }}</div>
              <div class="task-content">
                <h4>{{ task.title }}</h4>
                <p>{{ task.description }}</p>
                <div class="criteria">
                  <span>✓</span>
                  <p><strong>完成标准</strong>{{ task.completionCriteria }}</p>
                </div>
              </div>
            </article>
          </div>
        </article>
      </li>
    </ol>

    <footer class="plan-footer">
      <div><strong>计划不是约束</strong><p>它是一张可以随着执行情况不断修正的地图。</p></div>
      <button @click="$emit('reset')">规划另一个目标 →</button>
    </footer>
  </section>
</template>

<style scoped>
.plan-module {
  scroll-margin-top: 24px;
  display: grid;
  gap: 20px;
}

.module-heading {
  padding-top: 32px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 17px;
  align-items: center;
  border-top: 1px solid var(--line-strong);
}

.heading-index {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border-radius: 12px;
  font-family: var(--serif);
  font-size: 20px;
}

.heading-copy > span {
  color: var(--coral-700);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
}

.heading-copy h2 {
  margin: 4px 0 3px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: clamp(36px, 3.5vw, 48px);
  font-weight: 600;
  line-height: 1.05;
}

.heading-copy p {
  margin: 0;
  color: var(--ink-600);
  font-size: 13px;
}

.plan-stats {
  display: flex;
  gap: 10px;
}

.plan-stats span {
  padding: 9px 12px;
  color: var(--ink-700);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  font-size: 12px;
}

.plan-stats strong {
  margin-right: 3px;
  color: var(--coral-700);
  font-size: 17px;
}

.plan-summary {
  padding: 28px 31px;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 24px;
  color: var(--paper);
  background: var(--coral-600);
  border: 1px solid var(--coral-700);
  border-radius: 15px;
  box-shadow: var(--shadow-sm);
}

.plan-summary > span {
  padding-top: 5px;
  color: rgba(255,255,255,.82);
  font-size: 12px;
  font-weight: 700;
}

.plan-summary p {
  margin: 0;
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.45;
}

.stage-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
  list-style: none;
}

.stage-list > li {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
}

.stage-number {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border: 3px solid var(--moss-200);
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 17px;
}

.stage-card {
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 15px;
  box-shadow: var(--shadow-sm);
}

.stage-card > header {
  padding: 23px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--line-strong);
}

.stage-card > header > div > span {
  color: var(--coral-700);
  font-size: 11px;
  font-weight: 700;
}

.stage-card h3 {
  margin: 5px 0 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 27px;
  line-height: 1;
}

.time-range {
  padding: 8px 11px;
  color: var(--moss-800);
  background: var(--moss-100);
  border: 1px solid var(--moss-300);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.stage-objective {
  padding: 18px 26px;
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 16px;
  background: var(--canvas);
  border-bottom: 1px solid var(--line-strong);
}

.stage-objective strong {
  color: var(--ink-600);
  font-size: 12px;
}

.stage-objective p {
  margin: 0;
  color: var(--ink-700);
  font-size: 14px;
  line-height: 1.55;
}

.task-list {
  padding: 4px 26px 12px;
}

.task-card {
  padding: 22px 0;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 13px;
}

.task-card + .task-card {
  border-top: 1px solid var(--line);
}

.task-number {
  color: var(--coral-700);
  font-family: var(--serif);
  font-size: 15px;
}

.task-content h4 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
}

.task-content > p {
  margin: 8px 0 0;
  color: var(--ink-600);
  font-size: 13px;
  line-height: 1.65;
}

.criteria {
  margin-top: 13px;
  padding: 11px 13px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--moss-800);
  background: var(--moss-100);
  border: 1px solid var(--moss-300);
  border-radius: 8px;
}

.criteria > span {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--moss-700);
  border-radius: 50%;
  font-size: 11px;
}

.criteria p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.criteria strong {
  margin-right: 8px;
  font-size: 12px;
}

.plan-footer {
  padding: 23px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
}

.plan-footer strong { color: var(--ink); font-family: var(--serif); font-size: 19px; }
.plan-footer p { margin: 3px 0 0; color: var(--ink-600); font-size: 12px; }
.plan-footer button { min-height: 40px; padding: 0 15px; color: var(--paper); background: var(--moss-800); border: 1px solid var(--moss-900); border-radius: 8px; font-size: 12px; font-weight: 600; }

@media (max-width: 760px) {
  .module-heading { grid-template-columns: 45px 1fr; }
  .heading-index { width: 42px; height: 42px; }
  .plan-stats { grid-column: 2; }
  .plan-summary { grid-template-columns: 1fr; gap: 8px; }
}

@media (max-width: 560px) {
  .stage-list > li { grid-template-columns: 1fr; }
  .stage-number { width: 38px; height: 38px; }
  .stage-card > header, .plan-footer { align-items: flex-start; flex-direction: column; }
  .stage-objective { grid-template-columns: 1fr; gap: 6px; }
  .task-card { grid-template-columns: 1fr; }
  .plan-footer button { width: 100%; }
}
</style>
