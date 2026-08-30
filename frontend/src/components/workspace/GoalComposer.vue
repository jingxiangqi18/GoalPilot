<script setup>
import { computed, nextTick } from 'vue'

const goalText = defineModel({ type: String, required: true })
const props = defineProps({
  loading: { type: Boolean, default: false },
  errorTitle: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'dismiss-error'])

const examples = [
  { tag: '职业', text: '三个月内完成一个适合找 Java 后端实习的项目' },
  { tag: '学习', text: '今年通过英语六级，每天可以学习一小时' },
  { tag: '健康', text: '开始规律跑步，半年后完成一次半程马拉松' },
]

const count = computed(() => goalText.value.length)
const canSubmit = computed(() => goalText.value.trim() && count.value <= 1000 && !props.loading)

async function chooseExample(text) {
  goalText.value = text
  await nextTick()
  document.querySelector('#goal-input')?.focus()
}
</script>

<template>
  <section class="home-module">
    <header class="page-heading">
      <div>
        <span class="eyebrow">目标工作台</span>
        <h1>规划一个新目标</h1>
        <p>先把想法说清楚，再由 AI 帮你整理条件、补全信息并生成行动计划。</p>
      </div>
      <span class="step-badge">步骤 1 / 3</span>
    </header>

    <div class="module-grid">
      <article class="composer panel">
        <div class="panel-heading">
          <div>
            <span class="panel-icon">✦</span>
            <div>
              <h2>描述你的目标</h2>
              <p>自然地写下来，不需要提前整理格式。</p>
            </div>
          </div>
          <span class="counter" :class="{ warning: count > 900 }">{{ count }} / 1000</span>
        </div>

        <textarea
          id="goal-input"
          v-model="goalText"
          maxlength="1000"
          rows="8"
          placeholder="例如：我想在半年内完成第一次半程马拉松，目前每周能跑两次……"
          @keydown.ctrl.enter="emit('submit')"
          @keydown.meta.enter="emit('submit')"
        ></textarea>

        <div class="composer-footer">
          <span>支持 Ctrl / ⌘ + Enter 快速提交</span>
          <button class="primary-button" :disabled="!canSubmit" @click="emit('submit')">
            <span v-if="loading" class="spinner"></span>
            <template v-else>开始分析 <span aria-hidden="true">→</span></template>
          </button>
        </div>
      </article>

      <aside class="process-panel panel">
        <span class="eyebrow light">工作方式</span>
        <h2>从一个想法，<br />到一条清晰路线。</h2>
        <ol>
          <li>
            <span>01</span>
            <div><strong>理解目标</strong><p>提取期限、范围和已有条件。</p></div>
          </li>
          <li>
            <span>02</span>
            <div><strong>补全信息</strong><p>只追问真正影响计划的内容。</p></div>
          </li>
          <li>
            <span>03</span>
            <div><strong>生成计划</strong><p>形成阶段、任务与完成标准。</p></div>
          </li>
        </ol>
      </aside>
    </div>

    <div class="examples-module panel">
      <div class="examples-heading">
        <h3>不知道怎么开始？</h3>
        <p>选择一个示例，再按你的情况修改。</p>
      </div>
      <div class="example-list">
        <button v-for="example in examples" :key="example.tag" @click="chooseExample(example.text)">
          <span>{{ example.tag }}</span>
          <strong>{{ example.text }}</strong>
          <i>→</i>
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-banner" role="alert">
      <div><strong>{{ errorTitle }}</strong><p>{{ errorMessage }}</p></div>
      <button @click="emit('dismiss-error')">×</button>
    </div>
  </section>
</template>

<style scoped>
.home-module {
  display: grid;
  gap: 24px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
}

.eyebrow {
  color: #a94f35;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.eyebrow.light {
  color: #e7b8a5;
}

.page-heading h1 {
  margin: 9px 0 8px;
  color: #20241e;
  font-family: var(--serif);
  font-size: clamp(42px, 4.1vw, 58px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.035em;
}

.page-heading p {
  max-width: 650px;
  margin: 0;
  color: #62645c;
  font-size: 15px;
  line-height: 1.65;
}

.step-badge {
  padding: 9px 13px;
  color: #42483f;
  background: #e2e6dc;
  border: 1px solid #c4cbbd;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.module-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(300px, 0.75fr);
  gap: 20px;
}

.panel {
  background: #fffdf8;
  border: 1px solid #bbb6aa;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(45, 48, 41, 0.06);
}

.composer {
  padding: 28px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.panel-heading > div {
  display: flex;
  align-items: center;
  gap: 13px;
}

.panel-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #c56345;
  border-radius: 11px;
  font-size: 17px;
}

.panel-heading h2,
.process-panel h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}

.panel-heading p {
  margin: 4px 0 0;
  color: #686a62;
  font-size: 13px;
}

.counter {
  color: #6e7067;
  font-size: 12px;
  font-weight: 600;
}

.counter.warning {
  color: #a94f35;
}

.composer textarea {
  width: 100%;
  min-height: 230px;
  margin-top: 23px;
  padding: 20px;
  resize: vertical;
  color: #282c25;
  background: #f4f1ea;
  border: 1px solid #c7c1b5;
  border-radius: 12px;
  outline: none;
  font-size: 17px;
  line-height: 1.7;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.composer textarea::placeholder {
  color: #7a7b73;
}

.composer textarea:focus {
  background: #fff;
  border-color: #596b56;
  box-shadow: 0 0 0 3px rgba(69, 86, 67, 0.13);
}

.composer-footer {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.composer-footer > span {
  color: #686a62;
  font-size: 12px;
}

.primary-button {
  min-width: 145px;
  min-height: 46px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  background: #3f503d;
  border: 1px solid #344332;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
}

.primary-button:hover:not(:disabled) {
  background: #30402e;
}

.primary-button:disabled {
  cursor: not-allowed;
  color: #6d7068;
  background: #d6d7d1;
  border-color: #c0c1ba;
}

.process-panel {
  padding: 29px 27px;
  color: #fffdf8;
  background: #3d4d3b;
  border-color: #344332;
}

.process-panel h2 {
  margin-top: 12px;
  font-family: var(--serif);
  font-size: 31px;
  font-weight: 600;
  line-height: 1.12;
}

.process-panel ol {
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
}

.process-panel li {
  padding: 17px 0;
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.24);
}

.process-panel li > span {
  color: #e7b8a5;
  font-family: var(--serif);
  font-size: 17px;
}

.process-panel strong {
  font-size: 14px;
}

.process-panel p {
  margin: 5px 0 0;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  line-height: 1.5;
}

.examples-module {
  padding: 22px 24px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
  align-items: center;
}

.examples-heading h3 {
  margin: 0;
  color: #292d26;
  font-size: 16px;
}

.examples-heading p {
  margin: 5px 0 0;
  color: #6e7068;
  font-size: 12px;
}

.example-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.example-list button {
  min-width: 0;
  padding: 13px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px 8px;
  color: #33372f;
  text-align: left;
  background: #f2eee6;
  border: 1px solid #d0c9bc;
  border-radius: 9px;
}

.example-list button:hover {
  background: #ebe4d8;
  border-color: #aaa294;
}

.example-list span {
  color: #a94f35;
  font-size: 11px;
  font-weight: 700;
}

.example-list strong {
  grid-column: 1;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.example-list i {
  grid-area: 1 / 2 / 3 / 3;
  align-self: center;
  color: #5d6359;
  font-style: normal;
}

.error-banner {
  padding: 15px 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: #753b2a;
  background: #f5dfd6;
  border: 1px solid #d99982;
  border-radius: 10px;
}

.error-banner strong { font-size: 14px; }
.error-banner p { margin: 4px 0 0; font-size: 13px; }
.error-banner button { color: currentColor; background: none; border: 0; font-size: 21px; }

@media (max-width: 860px) {
  .module-grid { grid-template-columns: 1fr; }
  .examples-module { grid-template-columns: 1fr; }
  .example-list { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .page-heading h1 { font-size: 39px; }
  .composer { padding: 20px; }
  .panel-heading { gap: 12px; }
  .panel-heading p { display: none; }
  .composer textarea { min-height: 190px; padding: 15px; font-size: 15px; }
  .composer-footer { align-items: stretch; flex-direction: column; }
  .composer-footer > span { display: none; }
  .primary-button { width: 100%; }
}
</style>
