<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AuthView from './components/AuthView.vue'
import WorkspaceView from './components/WorkspaceView.vue'
import { getCurrentUser, hasStoredSession, logoutUser } from './api/auth'

const sessionState = ref('checking')
const currentUser = ref(null)
const authMessage = ref('')

async function restoreSession() {
  if (!hasStoredSession()) {
    sessionState.value = 'guest'
    return
  }

  try {
    currentUser.value = await getCurrentUser()
    sessionState.value = 'authenticated'
  } catch {
    logoutUser()
    authMessage.value = '上次登录已失效，请重新登录。'
    sessionState.value = 'guest'
  }
}

function handleAuthenticated(session) {
  currentUser.value = session.user
  authMessage.value = ''
  sessionState.value = 'authenticated'
}

function handleLogout() {
  logoutUser()
  currentUser.value = null
  authMessage.value = ''
  sessionState.value = 'guest'
}

function handleUnauthorized() {
  if (sessionState.value !== 'authenticated') return
  logoutUser()
  currentUser.value = null
  authMessage.value = '登录状态已过期，请重新登录后继续。'
  sessionState.value = 'guest'
}

onMounted(() => {
  window.addEventListener('goalpilot:unauthorized', handleUnauthorized)
  restoreSession()
})

onBeforeUnmount(() => {
  window.removeEventListener('goalpilot:unauthorized', handleUnauthorized)
})
</script>

<template>
  <Transition name="page-fade" mode="out-in">
    <div v-if="sessionState === 'checking'" key="checking" class="splash-screen">
      <div class="splash-brand">
        <span class="logo-glyph">G</span>
        <span>GoalPilot</span>
      </div>
      <span class="splash-line"></span>
      <p>正在打开你的目标空间</p>
    </div>

    <AuthView
      v-else-if="sessionState === 'guest'"
      key="auth"
      :initial-message="authMessage"
      @authenticated="handleAuthenticated"
    />

    <WorkspaceView
      v-else
      key="workspace"
      :user="currentUser"
      @logout="handleLogout"
    />
  </Transition>
</template>
