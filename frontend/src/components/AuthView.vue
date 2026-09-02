<script setup>
import { computed, reactive, ref } from 'vue'
import { loginUser, registerUser } from '../api/auth'
import gradientArtwork from '../assets/goalpilot-gradient-v2.jpg'

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
  <main class="auth-page" :style="{ '--gradient-artwork': `url(${gradientArtwork})` }">
    <section class="auth-gallery" aria-label="GoalPilot 品牌介绍">
      <div class="auth-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="grain"></div>

      <div class="route-visual" aria-hidden="true">
        <span class="route-orbit route-orbit-a"></span>
        <span class="route-orbit route-orbit-b"></span>
        <span class="route-core">GOAL<i></i></span>
        <small>IDEA</small><small>CLARITY</small><small>ACTION</small>
      </div>

      <div class="auth-brand">
        <span class="brand-mark"><i></i></span>
        <span><strong>GoalPilot</strong><small>thoughts into motion</small></span>
      </div>

      <span class="edition-label">PRIVATE EDITION · 2026</span>

      <div class="gallery-copy">
        <span>FROM INTENTION TO ACTION</span>
        <h1>让模糊的想法，<br />慢慢成为<em>路线。</em></h1>
        <p>写下目标，补全关键条件，再得到一份真正可以开始的行动计划。</p>
      </div>

      <div class="collage-note" aria-hidden="true">
        <span>01</span><strong>DEFINE<br />YOUR DIRECTION</strong><i></i>
      </div>
      <div class="progress-stamp" aria-hidden="true"><span>SMALL STEPS</span><strong>→</strong><small>REAL PROGRESS</small></div>
    </section>

    <section class="auth-panel">
      <div class="mobile-auth-brand">
        <span class="brand-mark"><i></i></span>
        <strong>GoalPilot</strong>
      </div>

      <div class="form-shell">
        <div class="auth-tabs" role="tablist" aria-label="账户操作">
          <button type="button" :class="{ active: isLogin }" @click="switchMode('login')">登录</button>
          <button type="button" :class="{ active: !isLogin }" @click="switchMode('register')">创建账户</button>
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

            <button class="auth-submit" :disabled="!canSubmit" type="submit">
              <span v-if="isSubmitting" class="spinner"></span>
              <template v-else><span>{{ isLogin ? '进入 GoalPilot' : '创建我的账户' }}</span><i>↗</i></template>
            </button>

            <p class="switch-prompt">
              {{ isLogin ? '还没有账户？' : '已经有账户？' }}
              <button type="button" @click="switchMode(isLogin ? 'register' : 'login')">{{ isLogin ? '立即创建' : '返回登录' }}</button>
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
.auth-page { position: relative; min-height: 100vh; padding: 28px; overflow: hidden; isolation: isolate; display: grid; grid-template-columns: minmax(540px, 1.18fr) minmax(460px, .72fr); color: var(--ink); background: #eeeef3; }
.auth-page::before { content: ''; position: absolute; z-index: -2; inset: -3%; background-image: var(--gradient-artwork); background-position: center; background-size: cover; filter: saturate(.82) contrast(.96); transform: scale(1.03); animation: artwork-arrive 1.4s cubic-bezier(.2,.75,.25,1) both; }
.auth-page::after { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, rgba(22,25,35,.46) 0%, rgba(29,31,43,.24) 38%, rgba(244,240,241,.12) 61%, rgba(248,247,249,.74) 83%, rgba(248,248,250,.88) 100%); }
@keyframes artwork-arrive { from { opacity: .25; transform: scale(1.09); } }
.auth-gallery { position: relative; z-index: 1; min-height: calc(100vh - 56px); overflow: hidden; color: white; background: linear-gradient(135deg, rgba(28,31,43,.32), rgba(31,33,45,.05) 60%, transparent); border: 1px solid rgba(255,255,255,.1); border-right: 0; border-radius: 28px 0 0 28px; box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
.auth-atmosphere { position: absolute; inset: 0; overflow: hidden; }
.auth-atmosphere::before { content: ''; position: absolute; inset: 0; opacity: .17; background-image: linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(circle at 66% 32%, black, transparent 57%); }
.auth-atmosphere i { position: absolute; display: block; border-radius: 50%; filter: blur(4px); animation: atmosphere-drift 12s ease-in-out infinite alternate; }
.auth-atmosphere i:nth-child(1) { top: -14%; right: -6%; width: 58vw; height: 58vw; background: radial-gradient(circle, rgba(147,154,203,.22), transparent 68%); }
.auth-atmosphere i:nth-child(2) { top: 28%; left: -17%; width: 38vw; height: 38vw; background: radial-gradient(circle, rgba(121,150,169,.17), transparent 70%); animation-delay: -4s; }
.auth-atmosphere i:nth-child(3) { right: 12%; bottom: -22%; width: 42vw; height: 42vw; background: radial-gradient(circle, rgba(213,149,166,.15), transparent 68%); animation-delay: -8s; }
@keyframes atmosphere-drift { to { transform: translate3d(2%, 3%, 0) scale(1.06); } }
.grain { position: absolute; inset: 0; opacity: .18; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; pointer-events: none; }
.auth-brand { position: absolute; z-index: 2; top: 31px; left: clamp(30px, 4.5vw, 70px); display: flex; align-items: center; gap: 12px; }
.brand-mark { position: relative; width: 42px; height: 42px; display: block; background: linear-gradient(145deg, #9aa2d6, #626ba6); border: 1px solid rgba(255,255,255,.22); border-radius: 13px; box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 10px 24px rgba(0,0,0,.2); }
.brand-mark::before, .brand-mark::after, .brand-mark i { content: ''; position: absolute; height: 2px; background: white; border-radius: 2px; }
.brand-mark::before { top: 22px; left: 8px; width: 18px; transform: rotate(-27deg); }.brand-mark::after { top: 16px; left: 22px; width: 12px; transform: rotate(-57deg); }.brand-mark i { top: 25px; left: 7px; width: 8px; transform: rotate(20deg); }
.auth-brand strong, .auth-brand small { display: block; }.auth-brand strong { font-family: var(--display); font-size: 20px; font-weight: 700; line-height: 1; letter-spacing: -.025em; }.auth-brand small { margin-top: 5px; color: rgba(255,255,255,.48); font-family: var(--display); font-size: 8px; letter-spacing: .08em; }
.edition-label { position: absolute; z-index: 2; top: 43px; right: clamp(28px, 4vw, 60px); color: rgba(255,255,255,.75); font-size: 8px; font-weight: 750; letter-spacing: .16em; }
.route-visual { position: absolute; z-index: 1; top: 17%; right: 5%; width: min(42vw, 500px); height: min(42vw, 500px); display: grid; place-items: center; }
.route-visual::before { content: ''; position: absolute; width: 57%; height: 57%; background: rgba(119,128,185,.11); border-radius: 50%; filter: blur(22px); }
.route-orbit { position: absolute; border: 1px solid rgba(224,226,243,.15); border-radius: 50%; }
.route-orbit-a { width: 76%; height: 45%; transform: rotate(28deg); animation: route-orbit 13s ease-in-out infinite alternate; }
.route-orbit-b { width: 46%; height: 75%; border-style: dashed; transform: rotate(52deg); animation: route-orbit 16s ease-in-out infinite alternate-reverse; }
.route-core { position: relative; width: 118px; height: 118px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, rgba(151,160,213,.94), rgba(75,84,139,.94)); border: 1px solid rgba(255,255,255,.32); border-radius: 38px; box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 28px 60px rgba(3,5,13,.32); font-size: 13px; font-weight: 700; letter-spacing: .18em; transform: rotate(-6deg); }
.route-core i { position: absolute; right: 16px; bottom: 16px; width: 7px; height: 7px; background: #e3e5f5; border-radius: 50%; }
.route-visual small { position: absolute; color: rgba(255,255,255,.34); font-size: 8px; font-weight: 700; letter-spacing: .15em; }
.route-visual small:nth-of-type(1) { top: 25%; left: 5%; }.route-visual small:nth-of-type(2) { top: 44%; right: 0; }.route-visual small:nth-of-type(3) { bottom: 18%; left: 23%; }
@keyframes route-orbit { to { transform: rotate(82deg) scale(1.06); } }
.gallery-copy { position: absolute; z-index: 2; right: 50px; bottom: clamp(45px, 7vh, 82px); left: clamp(35px, 5vw, 74px); max-width: 620px; }
.gallery-copy > span { color: var(--coral-300); font-size: 10px; font-weight: 750; letter-spacing: .18em; }
.gallery-copy h1 { margin: 14px 0 17px; font-family: var(--display); font-size: clamp(45px, 4.7vw, 68px); font-weight: 600; line-height: .99; letter-spacing: -.045em; text-shadow: 0 4px 30px rgba(0,0,0,.2); }
.gallery-copy h1 em { color: var(--coral-300); font-weight: inherit; }
.gallery-copy p { max-width: 440px; margin: 0; color: rgba(255,255,255,.82); font-size: 13px; line-height: 1.75; }
.collage-note { position: absolute; z-index: 3; top: 19%; right: -18px; width: 174px; padding: 17px 20px; color: #f4f5f8; background: rgba(255,255,255,.075); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,.18); backdrop-filter: blur(12px); transform: rotate(3deg); }
.collage-note span { color: var(--coral-700); font-family: var(--display); font-size: 12px; }.collage-note strong { margin-top: 11px; display: block; font-family: var(--display); font-size: 15px; line-height: 1.1; }.collage-note i { width: 46px; height: 3px; margin-top: 13px; display: block; background: var(--coral-500); }
.progress-stamp { position: absolute; z-index: 3; top: 38%; left: clamp(25px, 4vw, 55px); width: 102px; height: 102px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--paper); background: rgba(34,39,53,.8); border: 1px solid rgba(255,255,255,.22); border-radius: 32px; backdrop-filter: blur(10px); transform: rotate(-7deg); }
.progress-stamp span, .progress-stamp small { font-size: 6px; font-weight: 750; letter-spacing: .14em; }.progress-stamp strong { margin: 4px; color: var(--coral-300); font-size: 20px; }
.auth-panel { position: relative; z-index: 3; width: min(520px, calc(100% - 16px)); min-height: auto; margin: auto auto auto -20px; padding: clamp(31px, 3.2vw, 46px) clamp(32px, 4vw, 54px) 26px; display: flex; flex-direction: column; background: rgba(255,255,255,.78); border: 1px solid rgba(255,255,255,.7); border-radius: 30px; box-shadow: 0 30px 80px rgba(35,32,43,.2), inset 0 1px 0 rgba(255,255,255,.72); backdrop-filter: blur(24px) saturate(1.2); }
.mobile-auth-brand { display: none; }
.form-shell { width: min(430px, 100%); margin: 0 auto; }
.auth-tabs { width: 100%; margin-bottom: 34px; padding: 4px; display: grid; grid-template-columns: 1fr 1fr; background: rgba(239,240,244,.78); border: 1px solid rgba(213,215,223,.86); border-radius: 14px; }
.auth-tabs button { min-height: 36px; color: var(--ink-500); background: transparent; border: 0; border-radius: 10px; font-size: 11px; font-weight: 650; }
.auth-tabs button.active { color: var(--paper); background: linear-gradient(145deg, #303444, #20222b); box-shadow: 0 6px 16px rgba(31,34,44,.17); }
.auth-form > header > span { color: var(--coral-700); font-size: 9px; font-weight: 750; letter-spacing: .16em; }
.auth-form > header h2 { margin: 10px 0 9px; font-family: var(--display); font-size: 43px; font-weight: 600; line-height: 1; letter-spacing: -.035em; }
.auth-form > header p { margin: 0; color: var(--ink-500); font-size: 12px; }
.fields { margin-top: 32px; display: grid; gap: 17px; }
.field-group { display: block; }.field-group > span:first-child { margin-bottom: 7px; display: block; color: var(--ink-700); font-size: 11px; font-weight: 700; }
.input-wrap { position: relative; display: block; }.input-wrap > svg { position: absolute; z-index: 1; top: 16px; left: 14px; width: 18px; color: var(--ink-400); }
.input-wrap input { width: 100%; height: 50px; padding: 0 14px 0 43px; color: var(--ink); background: var(--canvas-soft); border: 1px solid var(--line-strong); border-radius: 12px; outline: none; font-size: 12px; transition: background .2s, border-color .2s, box-shadow .2s; }
.input-wrap input:focus { background: white; border-color: var(--coral-500); box-shadow: 0 0 0 4px rgba(104,113,170,.1); }.input-wrap input::placeholder { color: var(--ink-400); }.password-field input { padding-right: 60px; }.password-field button { position: absolute; z-index: 2; top: 16px; right: 13px; padding: 0; color: var(--ink-500); background: none; border: 0; font-size: 10px; }
.form-notice { margin: 21px 0 -10px; padding: 11px 13px; border: 1px solid; border-radius: 9px; font-size: 11px; line-height: 1.5; }.form-notice.neutral { color: var(--ink-700); background: var(--canvas); border-color: var(--line-strong); }.form-notice.success { color: var(--moss-800); background: var(--moss-100); border-color: var(--moss-300); }.form-notice.error { color: var(--danger); background: var(--danger-soft); border-color: var(--danger-line); }
.auth-submit { width: 100%; min-height: 49px; margin-top: 25px; padding: 0 8px 0 20px; display: flex; align-items: center; justify-content: space-between; color: var(--paper); background: var(--ink); border: 1px solid var(--ink); border-radius: 12px; font-size: 12px; font-weight: 700; transition: transform .2s, background .2s, box-shadow .2s; }.auth-submit i { width: 33px; height: 33px; display: grid; place-items: center; color: #fff; background: var(--coral-600); border-radius: 9px; font-style: normal; font-size: 15px; }.auth-submit:hover:not(:disabled) { background: var(--moss-800); box-shadow: 0 10px 22px rgba(29,31,39,.16); transform: translateY(-2px); }.auth-submit:disabled { cursor: not-allowed; color: var(--ink-400); background: var(--canvas); border-color: var(--line-strong); }.auth-submit:disabled i { opacity: .4; }
.spinner { width: 17px; height: 17px; margin: auto; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
.switch-prompt { margin: 18px 0 0; color: var(--ink-500); text-align: center; font-size: 10px; }.switch-prompt button { padding: 0 0 2px; color: var(--coral-700); background: none; border: 0; border-bottom: 1px solid var(--coral-400); font-weight: 700; }
.auth-footnote { margin: 20px auto 0; display: flex; align-items: center; gap: 7px; color: var(--ink-400); font-size: 9px; }.auth-footnote svg { width: 15px; }
@media (max-width: 1100px) { .auth-page { grid-template-columns: minmax(360px, .78fr) minmax(430px, 1fr); }.gallery-copy h1 { font-size: 50px; }.collage-note { display: none; }.route-visual { right: -16%; }.auth-panel { margin-left: -34px; } }
@media (max-width: 780px) { .auth-page { padding: 12px; display: block; }.auth-page::after { background: linear-gradient(to bottom, rgba(25,28,39,.16), rgba(246,243,245,.24) 33%, rgba(248,248,250,.92) 54%); }.auth-gallery { min-height: 285px; height: 35vh; border: 1px solid rgba(255,255,255,.14); border-radius: 24px; }.auth-brand { left: 22px; }.edition-label, .progress-stamp, .route-visual { display: none; }.gallery-copy { right: 22px; bottom: 31px; left: 22px; }.gallery-copy > span, .gallery-copy p { display: none; }.gallery-copy h1 { margin: 0; font-size: 39px; }.auth-panel { width: calc(100% - 16px); min-height: auto; margin: -22px auto 12px; padding: 31px 22px 24px; border-radius: 25px; }.auth-tabs { margin-bottom: 29px; }.form-shell { margin-top: 0; }.auth-footnote { margin-top: 28px; } }
@media (max-width: 470px) { .auth-gallery { min-height: 230px; height: 28vh; }.auth-brand strong { font-size: 21px; }.auth-brand small { display: none; }.gallery-copy h1 { font-size: 35px; }.auth-form > header h2 { font-size: 37px; }.fields { margin-top: 25px; } }
</style>
