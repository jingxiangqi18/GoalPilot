<script setup>
import { computed, reactive, ref } from 'vue'
import { loginUser, registerUser } from '../api/auth'
import PixelScene from './workspace/PixelScene.vue'
import StudioBackdrop from './workspace/StudioBackdrop.vue'
import AgentSignal from './workspace/AgentSignal.vue'

defineProps({ initialMessage: { type: String, default: '' } })
const emit = defineEmits(['authenticated'])

const mode = ref('login')
const isSubmitting = ref(false)
const showPassword = ref(false)
const formError = ref('')
const successMessage = ref('')
const loginForm = reactive({ account: '', password: '' })
const registerForm = reactive({ username: '', email: '', password: '' })

const isLogin = computed(() => mode.value === 'login')
const passwordValue = computed({
  get: () => (isLogin.value ? loginForm.password : registerForm.password),
  set: (value) => {
    if (isLogin.value) loginForm.password = value
    else registerForm.password = value
  },
})
const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  if (isLogin.value) return loginForm.account.trim() && loginForm.password
  return registerForm.username.trim() && registerForm.email.trim() && registerForm.password
})

function switchMode(nextMode) {
  if (isSubmitting.value) return
  mode.value = nextMode
  formError.value = ''
  successMessage.value = ''
  showPassword.value = false
}

function validateRegistration() {
  const username = registerForm.username.trim()
  if (!/^[A-Za-z0-9_]{3,50}$/.test(username)) return '用户名需为 3–50 位字母、数字或下划线。'
  if (!/^\S+@\S+\.\S+$/.test(registerForm.email.trim())) return '请输入有效的邮箱地址。'
  if (registerForm.password.length < 5 || registerForm.password.length > 72) return '密码长度需为 5–72 个字符。'
  return ''
}

async function submit() {
  if (!canSubmit.value) return
  formError.value = ''
  successMessage.value = ''

  if (!isLogin.value) {
    const validationMessage = validateRegistration()
    if (validationMessage) {
      formError.value = validationMessage
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isLogin.value) {
      emit('authenticated', await loginUser(loginForm.account.trim(), loginForm.password))
      return
    }
    await registerUser(registerForm.username.trim(), registerForm.email.trim(), registerForm.password)
    loginForm.account = registerForm.email.trim()
    loginForm.password = ''
    mode.value = 'login'
    successMessage.value = '账户创建成功，现在可以登录了。'
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '请求失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <StudioBackdrop />
    <section class="auth-gallery" aria-label="GoalPilot 品牌介绍">
      <div class="auth-brand">
        <AgentSignal /><span><strong>GoalPilot</strong><small>YOUR NEXT STATION</small></span>
      </div>
      <PixelScene class="auth-artwork" scene="railway" eager><span class="artwork-caption">TOWN & COUNTRY · ON THE WAY</span></PixelScene>
      <div class="gallery-copy">
        <span>A NEW JOURNEY STARTS HERE</span>
        <h1>每个想法，<br />都有<em>下一站。</em></h1>
        <p>与 Agent 一起理清方向，用清单记录每一步。<br />从今天开始，靠近你想完成的事。</p>
      </div>
      <div class="auth-journey"><span><i>01</i> 说出想法</span><b>→</b><span><i>02</i> 理清路线</span><b>→</b><span><i>03</i> 开始行动</span></div>
    </section>

    <section class="auth-panel">
      <div class="mobile-auth-brand">
        <AgentSignal />
        <strong>GoalPilot</strong>
      </div>

      <div class="form-shell">
        <div class="auth-tabs" role="group" aria-label="账户操作">
          <button type="button" :class="{ active: isLogin }" :aria-pressed="isLogin" :disabled="isSubmitting" @click="switchMode('login')">登录</button>
          <button type="button" :class="{ active: !isLogin }" :aria-pressed="!isLogin" :disabled="isSubmitting" @click="switchMode('register')">创建账户</button>
        </div>

        <Transition name="form-shift" mode="out-in">
          <form :key="mode" class="auth-form" @submit.prevent="submit">
            <header>
              <span>{{ isLogin ? 'WELCOME BACK · 欢迎回来' : 'NEW CHAPTER · 新的开始' }}</span>
              <h2>{{ isLogin ? '继续你的旅程。' : '创建目标空间。' }}</h2>
              <p>{{ isLogin ? '你的目标和进度都在原来的位置。' : '一个安静、清晰、只属于你的规划空间。' }}</p>
            </header>

            <div v-if="initialMessage && !formError && !successMessage" class="form-notice neutral">{{ initialMessage }}</div>
            <div v-if="successMessage" class="form-notice success">{{ successMessage }}</div>
            <div v-if="formError" class="form-notice error" role="alert">{{ formError }}</div>

            <div class="fields">
              <label v-if="isLogin" class="field-group">
                <span>用户名或邮箱</span>
                <span class="input-wrap">
                  <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5" /><path d="M4.5 16c.7-2.8 2.5-4.2 5.5-4.2s4.8 1.4 5.5 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
                  <input v-model="loginForm.account" name="account" autocomplete="username" placeholder="name@example.com" autofocus />
                </span>
              </label>

              <template v-else>
                <label class="field-group">
                  <span>用户名</span>
                  <span class="input-wrap">
                    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5" /><path d="M4.5 16c.7-2.8 2.5-4.2 5.5-4.2s4.8 1.4 5.5 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
                    <input v-model="registerForm.username" name="username" autocomplete="username" maxlength="50" placeholder="3–50 位字母、数字或下划线" autofocus />
                  </span>
                </label>
                <label class="field-group">
                  <span>邮箱</span>
                  <span class="input-wrap">
                    <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5" /><path d="m4 6 6 5 6-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
                    <input v-model="registerForm.email" name="email" type="email" autocomplete="email" maxlength="255" placeholder="name@example.com" />
                  </span>
                </label>
              </template>

              <label class="field-group">
                <span>密码</span>
                <span class="input-wrap password-field">
                  <svg viewBox="0 0 20 20" fill="none"><rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5" /><path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.5" /></svg>
                  <input v-model="passwordValue" name="password" :type="showPassword ? 'text' : 'password'" :autocomplete="isLogin ? 'current-password' : 'new-password'" maxlength="72" :placeholder="isLogin ? '输入你的密码' : '至少 5 个字符'" />
                  <button type="button" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
                </span>
              </label>
            </div>

            <button class="auth-submit" :disabled="!canSubmit" :aria-busy="isSubmitting" :aria-label="isSubmitting ? '正在提交…' : isLogin ? '进入 GoalPilot' : '创建我的账户'" type="submit">
              <span v-if="isSubmitting" class="submit-pending"><span class="spinner" aria-hidden="true"></span>正在提交…</span>
              <template v-else><span>{{ isLogin ? '进入 GoalPilot' : '创建我的账户' }}</span><i aria-hidden="true">↗</i></template>
            </button>

            <p class="switch-prompt">
              {{ isLogin ? '还没有账户？' : '已经有账户？' }}
              <button type="button" :disabled="isSubmitting" @click="switchMode(isLogin ? 'register' : 'login')">{{ isLogin ? '立即创建' : '返回登录' }}</button>
            </p>
          </form>
        </Transition>
      </div>

      <footer class="auth-footnote">
        <svg viewBox="0 0 20 20" fill="none"><path d="M10 3.2 4.3 5.4v4.3c0 3.4 2.4 6.2 5.7 7.1 3.3-.9 5.7-3.7 5.7-7.1V5.4L10 3.2Z" stroke="currentColor" stroke-width="1.5" /></svg>
        <span>目标记录与账号绑定保存，并由登录身份隔离访问。</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.auth-page { position: relative; isolation: isolate; min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 730px) minmax(340px, 420px); align-items: center; justify-content: center; gap: 0; padding: 48px 5vw; overflow: hidden; color: var(--ink); background: var(--canvas); }
.auth-gallery, .auth-panel { position: relative; z-index: 1; min-width: 0; }
.auth-gallery { padding: 30px 36px 28px; background: #e6eadf; border: 1px solid #bccabb; border-right: 0; }
.auth-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }.auth-brand .agent-signal { width: 40px; height: 40px; }.auth-brand strong { display: block; color: var(--ink); font: 22px var(--pixel); letter-spacing: -.05em; }.auth-brand small { display: block; margin-top: 5px; color: var(--ink-600); font: 9px var(--pixel); }
.auth-artwork { position: relative; height: clamp(230px, 28vh, 350px); overflow: hidden; border: 4px solid #fff9e7; outline: 1px solid #b7c5b7; box-shadow: 4px 4px 0 #a7b9ac55; }
.artwork-caption { position: absolute; bottom: 10px; right: 10px; padding: 7px 8px; color: #f7eed5; background: #263943ee; font: 9px var(--pixel); }
.gallery-copy { margin-top: 28px; }.gallery-copy > span { color: var(--accent); font: 10px var(--pixel); }.gallery-copy h1 { margin: 14px 0; font-size: clamp(34px, 3vw, 47px); font-weight: 650; line-height: 1.35; letter-spacing: .02em; }.gallery-copy em { color: var(--accent); font-style: normal; }.gallery-copy p { margin: 0; font-size: 13px; line-height: 1.9; color: var(--ink-600); }
.auth-journey { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 25px; padding-top: 18px; border-top: 1px dashed #a9bba6; color: var(--ink-600); font-size: 11px; }.auth-journey i { display: inline-grid; place-items: center; width: 23px; height: 23px; margin-right: 5px; background: #f8f5e5; color: var(--accent); font: 9px var(--pixel); }.auth-journey b { font-size: 13px; font-weight: 400; color: #839983; }
.auth-panel { padding: 34px; background: var(--paper); border: 1px solid var(--line-strong); border-top: 5px solid var(--accent); box-shadow: 6px 6px 0 #aabeb444; }
.auth-panel::before, .auth-panel::after { content: ''; position: absolute; left: -5px; width: 8px; height: 8px; background: var(--canvas); border: 1px solid var(--line-strong); }.auth-panel::before { top: 17px; }.auth-panel::after { bottom: 17px; }
.mobile-auth-brand { display: none; }.form-shell { width: 100%; }
.auth-tabs { display: grid; grid-template-columns: repeat(2, 1fr); margin-bottom: 28px; border: 1px solid var(--line); background: #eff0e7; }.auth-tabs button { min-height: 40px; border: 0; background: transparent; color: var(--ink-600); font-size: 12px; }.auth-tabs button.active { color: var(--paper); background: var(--accent-deep); box-shadow: 0 2px 0 #1b3343; }
.auth-form > header > span { color: var(--accent); font-size: 10px; letter-spacing: .04em; }.auth-form > header h2 { margin: 12px 0 8px; color: var(--ink); font: 650 28px/1.5 var(--display); letter-spacing: .01em; }.auth-form > header p { margin: 0; color: var(--ink-500); font-size: 12px; line-height: 1.8; }
.fields { display: grid; gap: 18px; margin-top: 25px; }.field-group { display: block; }.field-group > span:first-child { display: block; margin-bottom: 8px; color: var(--ink-700); font-size: 12px; font-weight: 500; }.input-wrap { position: relative; display: block; }.input-wrap > svg { position: absolute; top: 15px; left: 13px; width: 18px; height: 18px; color: var(--ink-500); }.input-wrap input { width: 100%; height: 48px; padding: 0 12px 0 41px; border: 1px solid #c5d0c6; border-radius: 2px; outline: none; color: var(--ink); background: #f5f5ed; font-size: 13px; transition: border-color .2s, box-shadow .2s; }.input-wrap input:focus { background: #fffef8; border-color: var(--accent); box-shadow: 3px 3px 0 #8aa6a633; }.input-wrap input::placeholder { color: var(--ink-500); }.password-field input { padding-right: 58px; }.password-field button { position: absolute; right: 10px; top: 9px; min-height: 30px; padding: 4px; border: 0; color: var(--ink-600); background: none; font-size: 11px; }
.form-notice { margin: 20px 0 -7px; padding: 11px 13px; border: 1px solid var(--line); font-size: 12px; line-height: 1.7; }.form-notice.neutral { background: var(--canvas); color: var(--ink-600); }.form-notice.success { background: var(--moss-100); color: var(--moss-700); border-color: var(--moss-300); }.form-notice.error { color: var(--danger); background: var(--danger-soft); border-color: var(--danger-line); }
.auth-submit { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 48px; margin-top: 26px; padding: 0 9px 0 16px; border: 1px solid var(--accent-deep); border-radius: 2px; background: var(--accent-deep); color: #fffef8; box-shadow: 3px 3px 0 #aabeb4; font-size: 13px; font-weight: 500; }.auth-submit i { display: grid; place-items: center; width: 29px; height: 29px; background: #ffffff15; font-size: 16px; font-style: normal; }.auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 3px 5px 0 #aabeb4; }.auth-submit:disabled { color: #63746f; background: #e1e7de; border-color: #c1cfc3; box-shadow: 2px 2px 0 #cbd4c6; }
.spinner { width: 16px; height: 16px; border: 2px solid #a6bcb5; border-top-color: var(--accent); animation: spin .8s steps(4, end) infinite; }.submit-pending { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; }
.switch-prompt { margin: 20px 0 0; text-align: center; color: var(--ink-500); font-size: 11px; }.switch-prompt button { padding: 0 0 2px; color: var(--accent); background: none; border: 0; border-bottom: 1px solid var(--accent-mid); font-weight: 600; }.auth-footnote { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 26px; color: var(--ink-500); font-size: 10px; line-height: 1.8; }.auth-footnote svg { flex: 0 0 15px; width: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(min-width: 1800px) { .auth-page { grid-template-columns: minmax(0, 820px) minmax(360px, 440px); }.auth-gallery { padding: 36px 44px; }.auth-artwork { height: 350px; }.auth-panel { padding: 40px; } }
@media(max-width: 1100px) { .auth-page { padding: 30px; grid-template-columns: minmax(0, 1fr) 360px; }.auth-gallery { padding: 24px; }.auth-panel { padding: 26px; }.auth-artwork { height: 240px; }.gallery-copy h1 { font-size: 34px; }.auth-journey { gap: 6px; font-size: 10px; }.auth-journey b { display: none; }.auth-brand strong { font-size: 20px; } }
@media(max-width: 780px) { .auth-page { display: flex; flex-direction: column; padding: 22px 20px 35px; gap: 0; }.auth-gallery { width: min(100%, 440px); padding: 18px; border-right: 1px solid #bccabb; border-bottom: 0; }.auth-brand { margin-bottom: 16px; }.auth-brand strong { font-size: 20px; }.auth-brand .agent-signal { width: 32px; height: 32px; }.auth-artwork { height: 150px; }.artwork-caption { font-size: 8px; bottom: 6px; right: 6px; }.gallery-copy { margin-top: 17px; }.gallery-copy > span, .gallery-copy p, .auth-journey { display: none; }.gallery-copy h1 { margin: 0; font-size: 23px; line-height: 1.5; }.gallery-copy h1 br { display: none; }.auth-panel { width: min(100%, 440px); padding: 24px; border-top-width: 3px; }.auth-tabs { margin-bottom: 24px; }.auth-form > header h2 { font-size: 26px; } }
@media(max-width: 380px) { .auth-page { padding-inline: 14px; }.auth-panel { padding: 20px; }.auth-artwork { height: 120px; }.gallery-copy h1 { font-size: 21px; }.auth-brand small { font-size: 8px; } }
@media(max-width: 780px) and (max-height: 750px) { .auth-page { padding-top: 14px; }.auth-gallery { padding: 14px; }.auth-artwork { height: 90px; }.auth-brand { margin-bottom: 12px; }.gallery-copy { display: none; }.auth-tabs { margin-bottom: 19px; }.fields { gap: 13px; margin-top: 18px; }.auth-submit { margin-top: 19px; } }
</style>
