<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useWorldAppearance } from '../../composables/useWorldAppearance'
import { worldScenes } from '../../utils/worldAppearance'
import WorldArt from './WorldArt.vue'
const { appearance, setScene, setFocused } = useWorldAppearance()
const open = ref(false), root = ref(null), trigger = ref(null)
const panelId = useId()
async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    const selected = root.value?.querySelector('[aria-pressed="true"]')
    // Native focus scrolling can shift the entire page when this fixed panel
    // is inside the filtered top bar. Scroll only the menu to reveal its selection.
    selected?.focus({ preventScroll: true })
    const panel = selected?.closest('.appearance-panel')
    if (!panel) return
    const item = selected.getBoundingClientRect(), bounds = panel.getBoundingClientRect()
    const top = bounds.top + panel.clientTop + 8, bottom = bounds.top + panel.clientTop + panel.clientHeight - 8
    if (item.bottom > bottom) panel.scrollTop += item.bottom - bottom
    else if (item.top < top) panel.scrollTop += item.top - top
  }
}
function close() { open.value = false; trigger.value?.focus({ preventScroll: true }) }
function outside(event) { if (!root.value?.contains(event.target)) open.value = false }
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <div ref="root" class="world-appearance" @keydown.esc.stop.prevent="close" @focusout="event => { if (event.relatedTarget && !root?.contains(event.relatedTarget)) open = false }">
    <button ref="trigger" type="button" class="appearance-trigger" aria-label="工作室外观" :aria-expanded="open" :aria-controls="panelId" @click="toggle"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M2 15 7 8l4 5 3-3 4 5M2 3h16v14H2z"/><path d="M12 6h2"/></svg><span>风景</span></button>
    <Transition name="appearance">
      <section v-if="open" :id="panelId" class="appearance-panel" aria-label="工作室外观设置">
        <header><strong>城市与风景</strong><button type="button" aria-label="关闭外观设置" @click="close">×</button></header>
        <div class="scene-options" role="group" aria-label="选择风景">
          <button v-for="scene in worldScenes" :key="scene.key" type="button" :aria-label="scene.label" :aria-pressed="appearance.scene === scene.key" @click="setScene(scene.key)"><WorldArt :asset="scene.preview" /><span>{{ scene.label }}<i v-if="appearance.scene === scene.key" aria-hidden="true">✓</i></span></button>
        </div>
        <label class="focus-toggle"><span>专注模式</span><input type="checkbox" :checked="appearance.focused" @change="setFocused($event.target.checked)" /><i aria-hidden="true"></i></label>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.world-appearance { position: relative; flex-shrink: 0; }.appearance-trigger { display: flex; align-items: center; gap: 7px; min-height: 34px; padding: 7px 11px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink-700); font-size: 12px; white-space: nowrap; }.appearance-trigger svg { width: 17px; height: 17px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.2; }
.appearance-panel { position: absolute; right: 0; top: calc(100% + 14px); z-index: 80; width: 348px; max-width: calc(100vw - 24px); max-height: calc(100dvh - 88px); overflow-y: auto; padding: 17px; border: 1px solid var(--line-strong); border-radius: 9px; background: var(--paper); box-shadow: 0 18px 60px #233d352b, 4px 4px 0 var(--line); }
.appearance-panel > header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }.appearance-panel > header strong { font-size: 13px; font-weight: 600; }.appearance-panel > header button { width: 28px; height: 28px; border: 0; border-radius: 3px; background: var(--canvas-soft); color: var(--ink); font-size: 20px; }
.scene-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.scene-options button { overflow: hidden; padding: 4px; border: 1px solid var(--line); border-radius: 6px; color: var(--ink-700); background: var(--paper); text-align: left; }.scene-options button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 1px var(--accent); }.scene-options .world-art { width: 100%; height: 64px; object-fit: cover; border-radius: 3px; }.scene-options span { display: flex; justify-content: space-between; gap: 3px; padding: 8px 4px 5px; font-size: 11px; }.scene-options i { font-style: normal; }
.focus-toggle { display: flex; align-items: center; gap: 12px; padding-top: 16px; margin-top: 14px; border-top: 1px solid var(--line); font-size: 12px; cursor: pointer; }.focus-toggle input { position: absolute; opacity: 0; width: 1px; height: 1px; }.focus-toggle > i { display: block; margin-left: auto; width: 34px; height: 20px; padding: 3px; background: #ced8c8; border-radius: 4px; }.focus-toggle > i::after { content: ''; display: block; width: 14px; height: 14px; border-radius: 2px; background: var(--paper); transition: transform .18s; }.focus-toggle input:checked + i { background: var(--accent); }.focus-toggle input:checked + i::after { transform: translateX(14px); }.focus-toggle input:focus-visible + i { outline: 2px solid var(--accent); outline-offset: 3px; }
.scene-options > button:last-child:nth-child(odd) { grid-column: 1 / -1; display: grid; grid-template-columns: 108px minmax(0, 1fr); align-items: center; gap: 10px; }
.appearance-enter-active, .appearance-leave-active { transition: opacity .16s, transform .18s; }.appearance-enter-from, .appearance-leave-to { opacity: 0; transform: translateY(-5px); }
@media(max-width: 620px) { .appearance-trigger { padding: 7px; }.appearance-trigger > span { display: none; }.appearance-panel { position: fixed; top: 64px; left: 12px; right: 12px; width: auto; max-width: none; } }
@media(prefers-reduced-motion: reduce) { *, *::after { transition: none !important; } }
</style>
