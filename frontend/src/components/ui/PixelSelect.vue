<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  label: { type: String, required: true },
  id: String,
  describedBy: String,
  invalid: Boolean,
  disabled: Boolean,
  active: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])
const instanceId = useId()
const controlId = computed(() => props.id || `pixel-select-${instanceId}`)
const listId = computed(() => `${controlId.value}-options`)
const trigger = ref(null)
const popover = ref(null)
const list = ref(null)
const open = ref(false)
const activeIndex = ref(-1)
const placement = ref('bottom')
const position = ref({})
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const selected = computed(() => props.options[selectedIndex.value])
const enabledIndices = computed(() => props.options.flatMap((option, index) => option.disabled ? [] : [index]))
const activeId = computed(() => open.value && activeIndex.value >= 0 ? `${listId.value}-${activeIndex.value}` : undefined)
let typed = '', typedAt = 0
let anchor = null
let selecting = false, pointerRelease = null

function close(restoreFocus = false) {
  open.value = false
  selecting = false
  typed = ''
  if (restoreFocus) trigger.value?.focus({ preventScroll: true })
}
async function revealOption(index) {
  activeIndex.value = index
  await nextTick()
  const item = list.value?.children[index]
  if (!item || !list.value) return
  // Scroll only the menu, never the conversation or the surrounding tool panel.
  const row = item.getBoundingClientRect(), bounds = list.value.getBoundingClientRect()
  if (row.top < bounds.top) list.value.scrollTop -= bounds.top - row.top
  else if (row.bottom > bounds.bottom) list.value.scrollTop += row.bottom - bounds.bottom
}
async function expand(index = selectedIndex.value) {
  if (props.disabled || !props.active || !enabledIndices.value.length || trigger.value?.matches(':disabled')) return
  // Focusing a field can start a CSS smooth-scroll that continues after click.
  // Finish at the current position before anchoring the popup, otherwise that
  // leftover animation dismisses the menu between pointerdown and selection.
  for (let container = trigger.value.parentElement; container; container = container.parentElement) {
    if (container.scrollTop || container.scrollLeft) container.scrollTo({ top: container.scrollTop, left: container.scrollLeft, behavior: 'instant' })
  }
  window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' })
  const rect = trigger.value.getBoundingClientRect()
  anchor = { top: rect.top, left: rect.left }
  const viewWidth = document.documentElement.clientWidth
  const viewHeight = window.visualViewport?.height || window.innerHeight
  const offsetTop = window.visualViewport?.offsetTop || 0
  const below = Math.max(0, viewHeight + offsetTop - rect.bottom - 20)
  const above = Math.max(0, rect.top - offsetTop - 20)
  const up = below < Math.min(320, props.options.length * 64 + 42) && above > below
  const width = Math.min(rect.width, viewWidth - 24)
  placement.value = up ? 'top' : 'bottom'
  position.value = {
    width: `${width}px`, left: `${Math.max(12, Math.min(rect.left, viewWidth - width - 12))}px`,
    maxHeight: `${Math.min(380, up ? above : below)}px`,
    ...(up ? { bottom: `${window.innerHeight - rect.top + 7}px` } : { top: `${rect.bottom + 7}px` }),
  }
  open.value = true
  await revealOption(enabledIndices.value.includes(index) ? index : enabledIndices.value[0])
}
function choose(index) {
  const option = props.options[index]
  if (!open.value || !option || option.disabled || props.disabled || !props.active) return
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
  close(true)
}
function move(delta) {
  const indices = enabledIndices.value
  const current = indices.indexOf(activeIndex.value)
  revealOption(indices[(current + delta + indices.length) % indices.length])
}
function keydown(event) {
  if (props.disabled || !props.active || event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault(); event.stopPropagation(); close(true)
  } else if (event.key === 'Tab') close()
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
    event.preventDefault(); event.stopPropagation()
    if (event.key === 'Home' || event.key === 'End') {
      const index = event.key === 'Home' ? enabledIndices.value[0] : enabledIndices.value.at(-1)
      if (open.value) revealOption(index)
      else expand(index)
    } else if (!open.value) expand()
    else if (event.key === 'Enter' || event.key === ' ') choose(activeIndex.value)
    else move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const now = Date.now()
    typed = now - typedAt < 700 ? typed + event.key : event.key
    typedAt = now
    const index = props.options.findIndex(option => !option.disabled && option.label.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase()))
    if (index >= 0) { event.preventDefault(); if (open.value) revealOption(index); else expand(index) }
  }
}
function outside(event) {
  if (!trigger.value?.contains(event.target) && !popover.value?.contains(event.target)) close()
}
function scrolled(event) {
  if (selecting || popover.value?.contains(event.target) || !anchor || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  // Focusing a control can queue an earlier panel scroll event after opening.
  // Dismiss only if its anchor really moved; option scrolling stays independent.
  if (Math.abs(rect.top - anchor.top) > .5 || Math.abs(rect.left - anchor.left) > .5) close()
}
function releasePointer() {
  // Finish an option click before reacting to queued document scroll events.
  // This matters in long forms where browser scroll anchoring runs after pointerdown.
  clearTimeout(pointerRelease)
  pointerRelease = setTimeout(() => { selecting = false }, 0)
}
function cleanup() {
  clearTimeout(pointerRelease)
  document.removeEventListener('pointerup', releasePointer)
  document.removeEventListener('pointercancel', releasePointer)
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('focusin', outside)
  window.removeEventListener('scroll', scrolled, true)
  window.removeEventListener('resize', dismiss)
  window.visualViewport?.removeEventListener('resize', dismiss)
}
function dismiss() { close() }
watch(open, value => {
  cleanup()
  if (!value) return
  document.addEventListener('pointerup', releasePointer)
  document.addEventListener('pointercancel', releasePointer)
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('focusin', outside)
  window.addEventListener('scroll', scrolled, true)
  window.addEventListener('resize', dismiss)
  window.visualViewport?.addEventListener('resize', dismiss)
})
watch([() => props.disabled, () => props.active, () => props.options, () => props.modelValue], () => close())
onBeforeUnmount(cleanup)
</script>

<template>
  <div class="pixel-select">
    <button :id="controlId" ref="trigger" class="pixel-select-trigger" type="button" role="combobox" :disabled="disabled" :aria-label="label" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="open ? listId : undefined" :aria-activedescendant="activeId" :aria-describedby="describedBy" :aria-invalid="invalid || undefined" :data-value="modelValue" @click="open ? close() : expand()" @keydown="keydown">
      <span v-if="selected?.badge" class="select-badge" :class="selected.tone" aria-hidden="true">{{ selected.badge }}</span>
      <span class="select-value"><strong>{{ selected?.label || '请选择' }}</strong><small v-if="selected?.description">{{ selected.description }}</small></span>
      <svg class="select-chevron" :class="{ opened: open }" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    <Teleport to="body">
      <Transition name="select-pop">
        <div v-if="open" ref="popover" class="pixel-select-popover" :class="placement" :style="position" @keydown="keydown" @pointerdown="selecting = true">
          <div class="select-caption" aria-hidden="true"><span>{{ label }}</span><span>{{ enabledIndices.length }} 项可选</span></div>
          <ul :id="listId" ref="list" role="listbox" :aria-label="label">
            <li v-for="(option, index) in options" :id="`${listId}-${index}`" :key="option.value" role="option" :aria-selected="option.value === modelValue" :aria-disabled="option.disabled || undefined" :class="{ highlighted: activeIndex === index, chosen: option.value === modelValue }" @pointermove="!option.disabled && (activeIndex = index)" @mousedown.prevent @click="choose(index)">
              <span v-if="option.badge" class="select-badge" :class="option.tone" aria-hidden="true">{{ option.badge }}</span>
              <span class="select-value"><strong>{{ option.label }}</strong><small v-if="option.description">{{ option.description }}</small></span>
              <span class="select-check" aria-hidden="true">{{ option.value === modelValue ? '✓' : '' }}</span>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pixel-select { min-width: 0; width: 100%; }
.pixel-select-trigger { display: flex; align-items: center; gap: 11px; width: 100%; min-width: 0; min-height: 48px; padding: 10px 12px; text-align: left; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: #f7f8f0; color: var(--ink); font-family: var(--text-cn); cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s; }
.pixel-select-trigger:hover:not(:disabled) { background: #edf2e8; border-color: var(--accent-mid); }.pixel-select-trigger[aria-expanded="true"] { background: var(--paper); border-color: var(--accent); box-shadow: 3px 3px 0 #b8cbbb77; }.pixel-select-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }.pixel-select-trigger[aria-invalid="true"] { border-color: var(--danger); }.pixel-select-trigger:disabled { opacity: .55; cursor: not-allowed; }
.select-value { display: grid; min-width: 0; flex: 1; gap: 4px; }.select-value strong { font-size: 13px; font-weight: 500; line-height: 1.6; }.pixel-select-trigger .select-value strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }.select-value small { color: var(--ink-600); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }.select-badge { flex: 0 0 29px; min-height: 29px; display: grid; place-items: center; color: var(--accent); background: #e4ebe1; border: 1px solid #bdccbc; border-radius: 2px; font: 11px var(--pixel); }.select-badge.high { color: #895434; background: #f1e7d3; border-color: #d8c29b; }.select-badge.low { color: #516d53; background: #e7efdf; }.select-badge.medium { color: var(--accent); background: #e1ece9; }.select-chevron { flex: 0 0 16px; width: 16px; height: 16px; stroke: var(--accent); stroke-width: 1.5; transition: transform .15s; }.select-chevron.opened { transform: rotate(180deg); }
.pixel-select-popover { position: fixed; z-index: 80; display: flex; flex-direction: column; overflow: hidden; padding: 5px; border: 1px solid var(--accent-mid); border-radius: 4px; background: var(--paper); color: var(--ink); box-shadow: 4px 4px 0 #b9c8bba8, 0 12px 30px #233e4921; font-family: var(--text-cn); }
.select-caption { display: flex; justify-content: space-between; gap: 8px; flex: 0 0 auto; padding: 8px 9px 10px; margin-bottom: 3px; border-bottom: 1px dashed var(--line-strong); color: var(--ink-600); font-size: 10px; }.select-caption > span:last-child { white-space: nowrap; }
ul { position: relative; min-height: 0; margin: 0; padding: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--accent-mid) transparent; list-style: none; touch-action: pan-y; }
li { display: flex; align-items: center; gap: 11px; min-height: 47px; margin: 3px 0; padding: 10px 9px; border: 1px solid transparent; border-radius: 2px; cursor: pointer; transition: background .12s; }li.chosen { background: #e8eee2; }li.highlighted { background: #dce8e0; border-color: #adc2b5; }li[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }.select-value strong { overflow-wrap: anywhere; }.select-check { flex: 0 0 16px; color: #426a55; font-size: 15px; font-weight: 600; }
.select-pop-enter-active, .select-pop-leave-active { transition: opacity .13s ease-out, transform .13s ease-out; }.select-pop-enter-from, .select-pop-leave-to { opacity: 0; transform: translateY(-4px); }.top.select-pop-enter-from, .top.select-pop-leave-to { transform: translateY(4px); }
@media(prefers-reduced-motion: reduce) { *, .select-pop-enter-active, .select-pop-leave-active { transition: none; } }
</style>
