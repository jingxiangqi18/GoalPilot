<script setup>
import { computed, reactive, ref } from 'vue'
import { loginUser, registerUser } from '../api/auth'

defineProps({
  initialMessage: {
    type: String,
    default: '',
  },
})

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
  if (!/^[A-Za-z0-9_]{3,50}$/.test(username)) {
    return '用户名需为 3–50 位字母、数字或下划线。'
  }
  if (!/^\S+@\S+\.\S+$/.test(registerForm.email.trim())) {
    return '请输入有效的邮箱地址。'
  }
  if (registerForm.password.length < 5 || registerForm.password.length > 72) {
    return '密码长度需为 5–72 个字符。'
  }
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
      const session = await loginUser(loginForm.account.trim(), loginForm.password)
      emit('authenticated', session)
      return
    }

    await registerUser(
      registerForm.username.trim(),
      registerForm.email.trim(),
      registerForm.password,
    )
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
    <section class="auth-story" aria-label="GoalPilot 品牌介绍">
      <div class="auth-brand">
        <span class="logo-glyph light">G</span>
        <span>GoalPilot</span>
      </div>

      <div class="story-copy">
        <span class="micro-label light-label">YOUR QUIET SPACE FOR PROGRESS</span>
        <h1>让每一个<br /><em>想做的事</em><br />都有方向。</h1>
        <p>不是把日程塞满，而是先看清真正重要的目标，再走出刚刚好的下一步。</p>
      </div>

      <div class="story-cards" aria-hidden="true">
        <div class="floating-card card-one">
          <span>01 · DEFINE</span>
          <strong>完成一场<br />半程马拉松</strong>
          <i></i>
        </div>
        <div class="floating-card card-two">
          <span>THIS WEEK</span>
          <strong>3 / 5</strong>
          <small>small steps, real progress</small>
        </div>
        <div class="sun-shape"></div>
      </div>

      <p class="story-footnote">Designed for deliberate living · 2026</p>
    </section>

    <section class="auth-panel">
      <div class="mobile-auth-brand">
        <span class="logo-glyph">G</span>
        <span>GoalPilot</span>
      </div>

      <div class="auth-form-wrap">
        <div class="auth-tabs" role="tablist" aria-label="账户操作">
          <button :class="{ active: isLogin }" @click="switchMode('login')">登录</button>
          <button :class="{ active: !isLogin }" @click="switchMode('register')">创建账户</button>
        </div>

        <Transition name="form-shift" mode="out-in">
          <form :key="mode" class="auth-form" @submit.prevent="submit">
            <div class="form-heading">
              <span class="micro-label">{{ isLogin ? 'WELCOME BACK' : 'BEGIN YOUR JOURNEY' }}</span>
              <h2>{{ isLogin ? '欢迎回来。' : '从一个账户开始。' }}</h2>
              <p>{{ isLogin ? '继续整理你的目标与下一步。' : '创建属于你的安静目标空间。' }}</p>
            </div>

            <div v-if="initialMessage && !formError && !successMessage" class="form-notice neutral">
              {{ initialMessage }}
            </div>
            <div v-if="successMessage" class="form-notice success">{{ successMessage }}</div>
            <div v-if="formError" class="form-notice error" role="alert">{{ formError }}</div>

            <template v-if="isLogin">
              <label class="field-group">
                <span>用户名或邮箱</span>
                <input
                  v-model="loginForm.account"
                  name="account"
                  autocomplete="username"
                  placeholder="name@example.com"
                  autofocus
                />
              </label>
            </template>

            <template v-else>
              <label class="field-group">
                <span>用户名</span>
                <input
                  v-model="registerForm.username"
                  name="username"
                  autocomplete="username"
                  maxlength="50"
                  placeholder="3–50 位字母、数字或下划线"
                  autofocus
                />
              </label>
              <label class="field-group">
                <span>邮箱</span>
                <input
                  v-model="registerForm.email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  maxlength="255"
                  placeholder="name@example.com"
                />
              </label>
            </template>

            <label class="field-group">
              <span>密码</span>
              <span class="password-field">
                <input
                  v-model="passwordValue"
                  name="password"
                  :type="showPassword ? 'text' : 'password'"
                  :autocomplete="isLogin ? 'current-password' : 'new-password'"
                  maxlength="72"
                  :placeholder="isLogin ? '输入你的密码' : '至少 5 个字符'"
                />
                <button type="button" @click="showPassword = !showPassword">
                  {{ showPassword ? '隐藏' : '显示' }}
                </button>
              </span>
            </label>

            <button class="auth-submit" :disabled="!canSubmit" type="submit">
              <span v-if="isSubmitting" class="spinner dark-spinner"></span>
              <template v-else>
                {{ isLogin ? '进入 GoalPilot' : '创建我的账户' }}
                <span aria-hidden="true">↗</span>
              </template>
            </button>

            <p class="switch-prompt">
              {{ isLogin ? '还没有账户？' : '已经有账户？' }}
              <button type="button" @click="switchMode(isLogin ? 'register' : 'login')">
                {{ isLogin ? '立即创建' : '返回登录' }}
              </button>
            </p>
          </form>
        </Transition>
      </div>

      <p class="auth-privacy">你的目标内容仅用于本次 AI 分析，不会在当前版本中持久化保存。</p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(500px, 1.05fr) minmax(440px, .95fr);
  background: #fffdf8;
}

.auth-story {
  position: relative;
  min-height: 100vh;
  padding: 38px clamp(42px, 6vw, 88px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #fffdf8;
  background: #3d4d3b;
}

.auth-story::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -150px;
  width: 430px;
  height: 430px;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 50%;
}

.auth-brand,
.mobile-auth-brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 11px;
  font-family: var(--serif);
  font-size: 25px;
  font-weight: 600;
}

.logo-glyph.light {
  color: #3d4d3b;
  background: #fffdf8;
}

.story-copy {
  position: relative;
  z-index: 2;
  width: min(620px, 92%);
  margin: auto 0;
  padding-bottom: 130px;
}

.micro-label {
  color: #b55338;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .14em;
}

.light-label {
  color: #edc0ae;
}

.story-copy h1 {
  margin: 22px 0 25px;
  font-family: var(--serif);
  font-size: clamp(58px, 6vw, 86px);
  font-weight: 600;
  line-height: .92;
  letter-spacing: -.045em;
}

.story-copy h1 em {
  color: #efb39b;
  font-weight: 600;
}

.story-copy > p {
  max-width: 460px;
  margin: 0;
  color: rgba(255,255,255,.78);
  font-size: 15px;
  line-height: 1.8;
}

.story-cards {
  position: absolute;
  z-index: 2;
  right: clamp(30px, 5vw, 76px);
  bottom: 58px;
  width: 360px;
  height: 235px;
}

.floating-card {
  position: absolute;
  padding: 18px 20px;
  color: #252922;
  background: #fffdf8;
  border: 1px solid rgba(36,40,32,.25);
  border-radius: 5px;
  box-shadow: 0 18px 45px rgba(20,25,18,.2);
}

.floating-card > span {
  color: #676a61;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
}

.floating-card strong {
  display: block;
  font-family: var(--serif);
  font-size: 27px;
  line-height: 1.05;
}

.card-one {
  width: 205px;
  top: 16px;
  left: 0;
  transform: rotate(-4deg);
}

.card-one strong { margin-top: 16px; }
.card-one i { width: 48px; height: 4px; display: block; margin-top: 17px; background: #c56345; }

.card-two {
  width: 180px;
  right: 0;
  bottom: 0;
  color: white;
  background: #c56345;
  border-color: #a94f35;
  transform: rotate(3deg);
}

.card-two > span,
.card-two small { color: rgba(255,255,255,.82); }
.card-two strong { margin: 11px 0 5px; font-size: 39px; }
.card-two small { font-family: var(--serif); font-size: 13px; font-style: italic; }

.sun-shape {
  position: absolute;
  right: 46px;
  top: -72px;
  width: 135px;
  height: 135px;
  background: #e6a88e;
  border-radius: 50%;
}

.story-footnote {
  position: relative;
  z-index: 2;
  margin: 0;
  color: rgba(255,255,255,.6);
  font-size: 11px;
}

.auth-panel {
  min-height: 100vh;
  padding: 34px clamp(35px, 6vw, 90px) 26px;
  display: flex;
  flex-direction: column;
  background: #fffdf8;
}

.mobile-auth-brand { display: none; }

.auth-form-wrap {
  width: min(440px, 100%);
  margin: auto;
}

.auth-tabs {
  width: fit-content;
  margin-bottom: 48px;
  display: flex;
  gap: 26px;
  border-bottom: 1px solid #bcb6aa;
}

.auth-tabs button {
  position: relative;
  padding: 0 2px 10px;
  color: #73756c;
  background: transparent;
  border: 0;
  font-size: 13px;
}

.auth-tabs button.active {
  color: #242820;
  font-weight: 700;
}

.auth-tabs button.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #3d4d3b;
}

.form-heading { margin-bottom: 34px; }
.form-heading h2 { margin: 12px 0 8px; font-family: var(--serif); font-size: 44px; line-height: 1; }
.form-heading p { margin: 0; color: #5f6259; font-size: 14px; }

.form-notice {
  margin: -10px 0 22px;
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.form-notice.neutral { color: #514b3f; background: #eee8dc; border-color: #c6baa5; }
.form-notice.success { color: #344b33; background: #e5eee1; border-color: #aabca5; }
.form-notice.error { color: #753b2a; background: #f5dfd6; border-color: #d99982; }

.field-group { margin-bottom: 21px; display: block; }
.field-group > span:first-child { display: block; margin-bottom: 8px; color: #44483f; font-size: 13px; font-weight: 600; }
.field-group input { width: 100%; height: 50px; padding: 0 13px; color: #252922; background: #f5f1e9; border: 1px solid #bcb6aa; border-radius: 8px; outline: none; font-size: 14px; }
.field-group input:focus { background: white; border-color: #536650; box-shadow: 0 0 0 3px rgba(69,86,67,.12); }
.field-group input::placeholder { color: #777970; }

.password-field { position: relative; display: block; }
.password-field input { padding-right: 58px; }
.password-field button { position: absolute; right: 12px; top: 17px; padding: 0; color: #555a51; background: none; border: 0; font-size: 12px; }

.auth-submit {
  width: 100%;
  min-height: 49px;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  background: #3d4d3b;
  border: 1px solid #303f2f;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}

.auth-submit:hover:not(:disabled) { background: #2f3e2d; }
.auth-submit:disabled { cursor: not-allowed; color: #686b63; background: #d3d4ce; border-color: #bdbfb8; }

.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.switch-prompt { margin: 20px 0 0; color: #62655d; text-align: center; font-size: 13px; }
.switch-prompt button { padding: 0 0 2px; color: #a94f35; background: none; border: 0; border-bottom: 1px solid #c87960; }
.auth-privacy { margin: 24px auto 0; color: #666960; text-align: center; font-size: 11px; line-height: 1.5; }

@media (max-width: 940px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-story { display: none; }
  .auth-panel { min-height: 100vh; padding-top: 28px; }
  .mobile-auth-brand { display: flex; }
  .auth-form-wrap { margin-top: auto; margin-bottom: auto; }
}

@media (max-width: 470px) {
  .auth-panel { padding: 22px 20px 18px; }
  .auth-tabs { margin-bottom: 40px; }
  .form-heading h2 { font-size: 38px; }
}
</style>
