import { computed, reactive, readonly, watch } from 'vue'
import { appearanceKey, normalizeAppearance, worldScenes } from '../utils/worldAppearance'

function readAppearance() {
  try { return normalizeAppearance(JSON.parse(localStorage.getItem(appearanceKey))) }
  catch { return normalizeAppearance(null) }
}
const state = reactive(readAppearance())
// Root tokens also reach date/select popovers teleported outside the workspace.
watch(() => state.scene, scene => {
  if (typeof document !== 'undefined') document.documentElement.dataset.scenery = scene
}, { immediate: true })
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== appearanceKey && event.key !== null) return
    try { Object.assign(state, normalizeAppearance(event.newValue ? JSON.parse(event.newValue) : null)) }
    catch { /* Ignore malformed external updates; keep the current appearance. */ }
  })
}

export function useWorldAppearance() {
  function update(patch) {
    Object.assign(state, normalizeAppearance({ ...state, ...patch }))
    try { localStorage.setItem(appearanceKey, JSON.stringify(state)) } catch { /* Appearance still works without storage. */ }
  }
  return { appearance: readonly(state), theme: computed(() => worldScenes.find(scene => scene.key === state.scene)), setScene: scene => update({ scene }), setFocused: focused => update({ focused }) }
}
