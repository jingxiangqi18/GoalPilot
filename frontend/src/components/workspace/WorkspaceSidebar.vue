<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  activeStep: { type: Number, required: true },
})

defineEmits(['logout'])

const userInitial = computed(() => props.user.username?.charAt(0).toUpperCase() || 'G')
const steps = [
  { number: 1, label: '定义目标', hint: '描述你真正想完成的事', target: '#workspace-top' },
  { number: 2, label: '补全信息', hint: '确认关键条件与限制', target: '#analysis' },
  { number: 3, label: '生成计划', hint: '获得清晰的行动路线', target: '#plan' },
]
</script>

<template>
  <aside class="sidebar">
    <a class="brand" href="#workspace-top">
      <span class="brand-mark">G</span>
      <span>GoalPilot</span>
    </a>

    <div class="sidebar-section">
      <p class="section-label">目标旅程</p>
      <nav aria-label="目标创建进度">
        <a
          v-for="step in steps"
          :key="step.number"
          :href="step.target"
          class="step"
          :class="{ active: activeStep === step.number, done: activeStep > step.number }"
        >
          <span class="step-number">
            <svg v-if="activeStep > step.number" viewBox="0 0 16 16" fill="none">
              <path d="m3.5 8 2.8 2.8 6.2-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <template v-else>{{ step.number }}</template>
          </span>
          <span class="step-copy">
            <strong>{{ step.label }}</strong>
            <small>{{ step.hint }}</small>
          </span>
        </a>
      </nav>
    </div>

    <div class="sidebar-tip">
      <span>今日提醒</span>
      <p>先确定方向，再认真前进。</p>
    </div>

    <div class="user-card">
      <span class="avatar">{{ userInitial }}</span>
      <span class="user-copy">
        <strong>{{ user.username }}</strong>
        <small>{{ user.email }}</small>
      </span>
      <button type="button" title="退出登录" aria-label="退出登录" @click="$emit('logout')">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M13 6l4 4-4 4M8 10h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  z-index: 20;
  inset: 0 auto 0 0;
  width: 280px;
  padding: 30px 24px 24px;
  display: flex;
  flex-direction: column;
  background: #fffdf8;
  border-right: 1px solid #bbb6aa;
  box-shadow: 8px 0 28px rgba(43, 47, 40, 0.04);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #242820;
  font-family: var(--serif);
  font-size: 25px;
  font-weight: 600;
  text-decoration: none;
}

.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #fffdf8;
  background: #344332;
  border-radius: 50%;
  font-size: 24px;
}

.sidebar-section {
  margin-top: 76px;
}

.section-label {
  margin: 0 0 17px;
  color: #77776e;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

nav {
  display: grid;
  gap: 7px;
}

.step {
  padding: 13px 12px;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 12px;
  color: #77786f;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: 0.2s ease;
}

.step:hover {
  color: #262a23;
  background: #f3efe7;
}

.step.active {
  color: #22261f;
  background: #ebe5da;
  border-color: #d0c7b8;
}

.step.done {
  color: #394b37;
}

.step-number {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: #696b62;
  background: #f2eee6;
  border: 1px solid #c9c3b7;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.step-number svg {
  width: 15px;
}

.step.active .step-number {
  color: white;
  background: #c56345;
  border-color: #c56345;
}

.step.done .step-number {
  color: white;
  background: #455643;
  border-color: #455643;
}

.step-copy strong,
.step-copy small {
  display: block;
}

.step-copy strong {
  font-size: 14px;
  font-weight: 600;
}

.step-copy small {
  margin-top: 4px;
  color: #7d7d74;
  font-size: 11px;
  line-height: 1.4;
}

.sidebar-tip {
  margin-top: auto;
  padding: 18px;
  background: #3d4d3b;
  border-radius: 12px;
}

.sidebar-tip span {
  color: #d9b4a2;
  font-size: 11px;
  font-weight: 600;
}

.sidebar-tip p {
  margin: 8px 0 0;
  color: #fffdf8;
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.4;
}

.user-card {
  margin-top: 14px;
  padding: 15px 4px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #cbc5b8;
}

.avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: white;
  background: #c56345;
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 19px;
}

.user-copy {
  min-width: 0;
}

.user-copy strong,
.user-copy small {
  max-width: 150px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-copy strong {
  color: #292d26;
  font-size: 13px;
}

.user-copy small {
  margin-top: 2px;
  color: #77776e;
  font-size: 10px;
}

.user-card button {
  width: 34px;
  height: 34px;
  margin-left: auto;
  padding: 7px;
  color: #66695f;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.user-card button:hover {
  color: #a94f35;
  background: #f0e6de;
}

@media (max-width: 1020px) {
  .sidebar { display: none; }
}
</style>

