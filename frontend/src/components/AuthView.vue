<script setup>
import { computed, reactive, ref } from 'vue'
import { loginUser, registerUser } from '../api/auth'
import editorialImage from '../assets/goalpilot-editorial.jpg'

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
  <main class="auth-page">
    <section class="auth-gallery" aria-label="GoalPilot 品牌介绍">
      <img :src="editorialImage" alt="打开的笔记本上，一条混乱线条逐渐成为清晰路线" />
      <div class="photo-overlay"></div>
      <div class="grain"></div>

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
.auth-page { min-height: 100vh; display: grid; grid-template-columns: minmax(520px, 1.12fr) minmax(430px, .88fr); color: var(--ink); background: var(--paper); }
.auth-gallery { position: relative; min-height: 100vh; overflow: hidden; color: white; background: var(--moss-900); }
.auth-gallery > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.78) contrast(1.08); animation: photo-arrive 1.25s cubic-bezier(.2,.8,.2,1) both; }
@keyframes photo-arrive { from { opacity: .5; transform: scale(1.07); } }
.photo-overlay { position: absolute; inset: 0; background: linear-gradient(110deg, rgba(18,24,20,.72) 0%, rgba(18,24,20,.16) 58%, rgba(18,24,20,.35) 100%), linear-gradient(to top, rgba(15,20,17,.76), transparent 55%); }
.grain { position: absolute; inset: 0; opacity: .18; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; pointer-events: none; }
.auth-brand { position: absolute; z-index: 2; top: 31px; left: clamp(30px, 4.5vw, 70px); display: flex; align-items: center; gap: 12px; }
.brand-mark { position: relative; width: 42px; height: 42px; display: block; background: var(--coral-500); border-radius: 50% 50% 50% 10px; transform: rotate(-8deg); }
.brand-mark::before, .brand-mark::after, .brand-mark i { content: ''; position: absolute; height: 2px; background: white; border-radius: 2px; }
.brand-mark::before { top: 22px; left: 8px; width: 18px; transform: rotate(-27deg); }.brand-mark::after { top: 16px; left: 22px; width: 12px; transform: rotate(-57deg); }.brand-mark i { top: 25px; left: 7px; width: 8px; transform: rotate(20deg); }
.auth-brand strong, .auth-brand small { display: block; }.auth-brand strong { font-family: var(--editorial); font-size: 27px; line-height: .9; }.auth-brand small { margin-top: 6px; color: rgba(255,255,255,.7); font-family: var(--editorial); font-size: 10px; font-style: italic; letter-spacing: .05em; }
.edition-label { position: absolute; z-index: 2; top: 43px; right: clamp(28px, 4vw, 60px); color: rgba(255,255,255,.75); font-size: 8px; font-weight: 750; letter-spacing: .16em; }
.gallery-copy { position: absolute; z-index: 2; right: 50px; bottom: clamp(65px, 10vh, 120px); left: clamp(35px, 6vw, 90px); max-width: 690px; }
.gallery-copy > span { color: var(--coral-300); font-size: 10px; font-weight: 750; letter-spacing: .18em; }
.gallery-copy h1 { margin: 16px 0 19px; font-family: var(--display); font-size: clamp(53px, 6vw, 86px); font-weight: 550; line-height: .91; letter-spacing: -.045em; text-shadow: 0 4px 30px rgba(0,0,0,.25); }
.gallery-copy h1 em { color: var(--coral-300); font-weight: inherit; }
.gallery-copy p { max-width: 440px; margin: 0; color: rgba(255,255,255,.82); font-size: 13px; line-height: 1.75; }
.collage-note { position: absolute; z-index: 3; top: 20%; right: -18px; width: 174px; padding: 17px 20px; color: var(--ink); background: rgba(255,253,248,.9); border: 1px solid rgba(31,34,29,.28); box-shadow: 0 15px 35px rgba(0,0,0,.18); backdrop-filter: blur(8px); transform: rotate(4deg); }
.collage-note span { color: var(--coral-700); font-family: var(--display); font-size: 12px; }.collage-note strong { margin-top: 11px; display: block; font-family: var(--display); font-size: 15px; line-height: 1.1; }.collage-note i { width: 46px; height: 3px; margin-top: 13px; display: block; background: var(--coral-500); }
.progress-stamp { position: absolute; z-index: 3; top: 37%; left: clamp(25px, 4vw, 55px); width: 102px; height: 102px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--paper); background: rgba(41,57,45,.86); border: 1px solid rgba(255,255,255,.5); border-radius: 50%; backdrop-filter: blur(8px); transform: rotate(-9deg); }
.progress-stamp span, .progress-stamp small { font-size: 6px; font-weight: 750; letter-spacing: .14em; }.progress-stamp strong { margin: 4px; color: var(--coral-300); font-size: 20px; }
.auth-panel { min-height: 100vh; padding: 27px clamp(35px, 5vw, 72px) 23px; display: flex; flex-direction: column; background: var(--paper); }
.mobile-auth-brand { display: none; }
.form-shell { width: min(430px, 100%); margin: auto; }
.auth-tabs { width: 100%; margin-bottom: 42px; padding: 4px; display: grid; grid-template-columns: 1fr 1fr; background: var(--canvas); border: 1px solid var(--line); border-radius: 999px; }
.auth-tabs button { min-height: 36px; color: var(--ink-500); background: transparent; border: 0; border-radius: 999px; font-size: 11px; font-weight: 650; }
.auth-tabs button.active { color: var(--paper); background: var(--ink); box-shadow: 0 4px 14px rgba(31,34,29,.15); }
.auth-form > header > span { color: var(--coral-700); font-size: 9px; font-weight: 750; letter-spacing: .16em; }
.auth-form > header h2 { margin: 10px 0 9px; font-family: var(--display); font-size: 43px; font-weight: 600; line-height: 1; letter-spacing: -.035em; }
.auth-form > header p { margin: 0; color: var(--ink-500); font-size: 12px; }
.fields { margin-top: 32px; display: grid; gap: 17px; }
.field-group { display: block; }.field-group > span:first-child { margin-bottom: 7px; display: block; color: var(--ink-700); font-size: 11px; font-weight: 700; }
.input-wrap { position: relative; display: block; }.input-wrap > svg { position: absolute; z-index: 1; top: 16px; left: 14px; width: 18px; color: var(--ink-400); }
.input-wrap input { width: 100%; height: 50px; padding: 0 14px 0 43px; color: var(--ink); background: var(--canvas-soft); border: 1px solid var(--line-strong); border-radius: 12px; outline: none; font-size: 12px; transition: background .2s, border-color .2s, box-shadow .2s; }
.input-wrap input:focus { background: white; border-color: var(--moss-700); box-shadow: 0 0 0 4px rgba(50,69,54,.1); }.input-wrap input::placeholder { color: var(--ink-400); }.password-field input { padding-right: 60px; }.password-field button { position: absolute; z-index: 2; top: 16px; right: 13px; padding: 0; color: var(--ink-500); background: none; border: 0; font-size: 10px; }
.form-notice { margin: 21px 0 -10px; padding: 11px 13px; border: 1px solid; border-radius: 9px; font-size: 11px; line-height: 1.5; }.form-notice.neutral { color: var(--ink-700); background: var(--canvas); border-color: var(--line-strong); }.form-notice.success { color: var(--moss-800); background: var(--moss-100); border-color: var(--moss-300); }.form-notice.error { color: var(--danger); background: var(--danger-soft); border-color: var(--danger-line); }
.auth-submit { width: 100%; min-height: 49px; margin-top: 25px; padding: 0 8px 0 20px; display: flex; align-items: center; justify-content: space-between; color: var(--paper); background: var(--ink); border: 1px solid var(--ink); border-radius: 999px; font-size: 12px; font-weight: 750; transition: transform .2s, background .2s; }.auth-submit i { width: 33px; height: 33px; display: grid; place-items: center; color: var(--ink); background: var(--coral-400); border-radius: 50%; font-style: normal; font-size: 15px; }.auth-submit:hover:not(:disabled) { background: var(--moss-800); transform: translateY(-2px); }.auth-submit:disabled { cursor: not-allowed; color: var(--ink-400); background: var(--canvas); border-color: var(--line-strong); }.auth-submit:disabled i { opacity: .4; }
.spinner { width: 17px; height: 17px; margin: auto; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
.switch-prompt { margin: 18px 0 0; color: var(--ink-500); text-align: center; font-size: 10px; }.switch-prompt button { padding: 0 0 2px; color: var(--coral-700); background: none; border: 0; border-bottom: 1px solid var(--coral-400); font-weight: 700; }
.auth-footnote { margin: 20px auto 0; display: flex; align-items: center; gap: 7px; color: var(--ink-400); font-size: 9px; }.auth-footnote svg { width: 15px; }
@media (max-width: 980px) { .auth-page { grid-template-columns: minmax(320px, .8fr) 1fr; }.gallery-copy h1 { font-size: 54px; }.collage-note { display: none; } }
@media (max-width: 780px) { .auth-page { display: block; background: var(--paper); }.auth-gallery { min-height: 300px; height: 36vh; }.auth-brand { left: 22px; }.edition-label, .progress-stamp { display: none; }.gallery-copy { right: 22px; bottom: 25px; left: 22px; }.gallery-copy > span, .gallery-copy p { display: none; }.gallery-copy h1 { margin: 0; font-size: 42px; }.auth-panel { min-height: 64vh; padding: 28px 22px 22px; }.auth-tabs { margin-bottom: 31px; }.form-shell { margin-top: 0; }.auth-footnote { margin-top: 30px; } }
@media (max-width: 470px) { .auth-gallery { min-height: 230px; height: 28vh; }.auth-brand strong { font-size: 21px; }.auth-brand small { display: none; }.gallery-copy h1 { font-size: 35px; }.auth-form > header h2 { font-size: 37px; }.fields { margin-top: 25px; } }
</style>
