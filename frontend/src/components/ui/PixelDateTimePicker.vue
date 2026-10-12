<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { calendarCells, calendarKey, calendarLabel, calendarWeekday, daysInMonth, localMinuteValue, localToday, readCalendarDate, readLocalMinute, shiftCalendarDay, shiftCalendarMonth } from '../../utils/calendar'

const props = defineProps({
  modelValue: { type: String, default: '' },
  id: String,
  label: { type: String, default: '选择期待完成时间' },
  disabled: Boolean,
  invalid: Boolean,
  describedBy: String,
  clearable: Boolean,
  active: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])
const instanceId = useId()
const controlId = computed(() => props.id || `pixel-date-${instanceId}`)
const popupId = computed(() => `${controlId.value}-calendar`)
const trigger = ref(null), popup = ref(null)
const open = ref(false), jumpOpen = ref(false)
const compact = ref(false), section = ref('date')
const today = ref(localToday())
const draftDate = ref(today.value), focusDate = ref(today.value)
const hour = ref('18'), minute = ref('00')
const view = ref(readCalendarDate(today.value))
const jumpYear = ref(String(view.value.year))
const position = ref({})
const stored = computed(() => readLocalMinute(props.modelValue))
const selectedValue = computed(() => localMinuteValue(draftDate.value, hour.value, minute.value))
const monthTitle = computed(() => `${view.value.year}年${view.value.month}月`)
const cells = computed(() => calendarCells(view.value.year, view.value.month))
const weeks = computed(() => Array.from({ length: 6 }, (_, row) => cells.value.slice(row * 7, row * 7 + 7)))
const validYear = computed(() => /^\d{1,4}$/.test(jumpYear.value) && Number(jumpYear.value) >= 1 && Number(jumpYear.value) <= 9999)
const dateLabel = computed(() => stored.value ? calendarLabel(stored.value.date) : '选择期待完成的日期')
const shortcuts = [{ label: '今天', days: 0 }, { label: '明天', days: 1 }, { label: '一周后', days: 7 }]
const timePresets = [{ label: '上午', hour: '09' }, { label: '下午', hour: '14' }, { label: '傍晚', hour: '18' }]
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

function timeKeys(event, unit) {
  const options = unit === 'hour' ? hours : minutes
  const columns = unit === 'hour' ? 6 : 4
  const index = options.indexOf(event.target.dataset.timeOption)
  if (index < 0) return
  const offset = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key]
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : offset == null ? null : Math.max(0, Math.min(options.length - 1, index + offset))
  if (next == null) return
  event.preventDefault(); event.stopPropagation()
  event.currentTarget.querySelector(`[data-time-option="${options[next]}"]`)?.focus()
}
function stepTime(event, unit) {
  if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const value = unit === 'hour' ? hour : minute, limit = unit === 'hour' ? 24 : 60
  value.value = String(((Number(value.value) || 0) + (event.key === 'ArrowUp' ? 1 : -1) + limit) % limit).padStart(2, '0')
}
async function showSection(next, focusTime = false) {
  section.value = next
  await nextTick()
  positionPopup()
  if (focusTime) popup.value?.querySelector('.hour-options [tabindex="0"]')?.focus({ preventScroll: true })
}

function positionPopup() {
  if (!trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const viewport = window.visualViewport
  const width = document.documentElement.clientWidth
  const height = viewport?.height || window.innerHeight
  const top = viewport?.offsetTop || 0
  if (!compact.value && width <= 640 && popup.value?.querySelector('.calendar-time')?.contains(document.activeElement)) section.value = 'time'
  compact.value = width <= 640
  const popupWidth = Math.min(compact.value ? 380 : 640, width - 24)
  // Use the full content height: a calendar that fits on screen must not hide its time controls.
  const contentHeight = popup.value
    ? popup.value.querySelector('.calendar-header').offsetHeight + (popup.value.querySelector('.calendar-sections')?.offsetHeight || 0) + popup.value.querySelector('.calendar-body').scrollHeight + popup.value.querySelector('.calendar-footer').offsetHeight + 2
    : compact.value ? 560 : 510
  const below = top + height - rect.bottom - 20, above = rect.top - top - 20
  const base = { width: `${popupWidth}px`, left: `${Math.max(12, Math.min(rect.left, width - popupWidth - 12))}px` }
  if (width > 600 && below >= contentHeight) position.value = { ...base, top: `${rect.bottom + 8}px`, maxHeight: `${below}px` }
  else if (width > 600 && above >= contentHeight) position.value = { ...base, bottom: `${window.innerHeight - rect.top + 8}px`, maxHeight: `${above}px` }
  else position.value = { ...base, top: `${top + Math.max(12, (height - contentHeight) / 2)}px`, maxHeight: `${height - 24}px` }
}
function close(restoreFocus = false) {
  open.value = false
  if (restoreFocus) trigger.value?.focus({ preventScroll: true })
}
async function focusDay(key) {
  if (!readCalendarDate(key)) return
  focusDate.value = key
  view.value = readCalendarDate(key)
  await nextTick()
  if (open.value) popup.value?.querySelector(`[data-date="${key}"]`)?.focus({ preventScroll: true })
}
async function expand() {
  if (props.disabled || !props.active || trigger.value?.matches(':disabled')) return
  today.value = localToday()
  draftDate.value = stored.value?.date || today.value
  focusDate.value = draftDate.value
  view.value = readCalendarDate(draftDate.value)
  hour.value = stored.value?.hour || '18'
  minute.value = stored.value?.minute || '00'
  jumpYear.value = String(view.value.year)
  jumpOpen.value = false
  section.value = 'date'
  positionPopup()
  open.value = true
  await focusDay(draftDate.value)
  if (open.value) positionPopup()
}
function chooseDate(key) {
  if (!key) return
  draftDate.value = key
  focusDay(key)
}
function moveMonth(offset) {
  const key = shiftCalendarMonth(focusDate.value, offset)
  if (!key) return
  focusDate.value = key
  view.value = readCalendarDate(key)
  jumpYear.value = String(view.value.year)
}
async function toggleJump() {
  jumpOpen.value = !jumpOpen.value
  jumpYear.value = String(view.value.year)
  await nextTick()
  if (jumpOpen.value) popup.value?.querySelector('.jump-year input')?.focus({ preventScroll: true })
  else focusDay(focusDate.value)
}
function jumpToMonth(month) {
  if (!validYear.value) return
  const year = Number(jumpYear.value)
  const day = Math.min(readCalendarDate(focusDate.value).day, daysInMonth(year, month))
  jumpOpen.value = false
  focusDay(calendarKey(year, month, day))
}
function calendarKeys(event) {
  const weekStart = (calendarWeekday(focusDate.value) + 6) % 7
  let key
  if (event.key === 'ArrowLeft') key = shiftCalendarDay(focusDate.value, -1)
  else if (event.key === 'ArrowRight') key = shiftCalendarDay(focusDate.value, 1)
  else if (event.key === 'ArrowUp') key = shiftCalendarDay(focusDate.value, -7)
  else if (event.key === 'ArrowDown') key = shiftCalendarDay(focusDate.value, 7)
  else if (event.key === 'Home') key = shiftCalendarDay(focusDate.value, -weekStart)
  else if (event.key === 'End') key = shiftCalendarDay(focusDate.value, 6 - weekStart)
  else if (event.key === 'PageUp' || event.key === 'PageDown') key = shiftCalendarMonth(focusDate.value, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1))
  else return
  event.preventDefault(); event.stopPropagation()
  if (key) focusDay(key)
}
function apply() {
  if (!open.value || !selectedValue.value || props.disabled || !props.active) return
  emit('update:modelValue', selectedValue.value)
  close(true)
}
function clear() {
  if (!props.clearable || props.disabled || !props.active) return
  emit('update:modelValue', '')
  close(true)
}
function outside(event) {
  if (!trigger.value?.contains(event.target) && !popup.value?.contains(event.target)) close()
}
function leaveOnTab(event) {
  // Teleport places this dialog after the page. Restore the field's natural tab order at its edges.
  const isAvailable = element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert]') && element.getClientRects().length
  const selector = 'button, input, textarea, select, a[href], [tabindex]'
  const controls = [...popup.value.querySelectorAll(selector)].filter(isAvailable)
  if (event.shiftKey && document.activeElement === controls[0]) {
    event.preventDefault()
    close(true)
  } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
    event.preventDefault()
    const pageControls = [...document.querySelectorAll(selector)].filter(element => isAvailable(element) && !popup.value.contains(element))
    const next = pageControls[pageControls.indexOf(trigger.value) + 1]
    close()
    ;(next || trigger.value)?.focus({ preventScroll: true })
  }
}
function scrolled(event) {
  if (!popup.value?.contains(event.target)) positionPopup()
}
function cleanup() {
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('focusin', outside)
  window.removeEventListener('resize', positionPopup)
  window.removeEventListener('scroll', scrolled, true)
  window.visualViewport?.removeEventListener('resize', positionPopup)
  window.visualViewport?.removeEventListener('scroll', positionPopup)
}
watch(open, value => {
  cleanup()
  if (!value) return
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('focusin', outside)
  window.addEventListener('resize', positionPopup)
  window.addEventListener('scroll', scrolled, true)
  window.visualViewport?.addEventListener('resize', positionPopup)
  window.visualViewport?.addEventListener('scroll', positionPopup)
})
watch([() => props.disabled, () => props.active, () => props.modelValue], () => close())
watch([compact, jumpOpen, selectedValue], async () => { await nextTick(); if (open.value) positionPopup() })
onBeforeUnmount(cleanup)
</script>

<template>
  <div class="pixel-date-picker">
    <button :id="controlId" ref="trigger" class="date-picker-trigger" type="button" :disabled="disabled" :aria-label="stored ? `${label}，${dateLabel} ${stored.hour}:${stored.minute}` : label" aria-haspopup="dialog" :aria-expanded="open" :aria-controls="open ? popupId : undefined" :aria-invalid="invalid || undefined" :aria-describedby="describedBy" :data-value="modelValue" @click="open ? close(true) : expand()">
      <span class="date-tile" aria-hidden="true"><small>{{ stored ? `${stored.month}月` : '日程' }}</small><strong v-if="stored">{{ String(stored.day).padStart(2, '0') }}</strong><svg v-else viewBox="0 0 24 24" fill="none"><path d="M5 4h14v17H5zM8 2v5m8-5v5M5 9h14M8 12h2v2H8zm6 0h2v2h-2zm-6 5h2" /></svg></span>
      <span class="date-picker-copy"><strong>{{ dateLabel }}</strong><small v-if="stored">周{{ '日一二三四五六'[calendarWeekday(stored.date)] }} <i aria-hidden="true">·</i><span class="selected-clock">{{ stored.hour }}:{{ stored.minute }}</span></small><small v-else>选一个日期，为下一步留出时间</small></span>
      <svg class="date-open-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m5 3 5 5-5 5" /></svg>
    </button>
    <Teleport to="body">
      <Transition name="calendar-pop">
        <section v-if="open" :id="popupId" ref="popup" class="pixel-calendar" :class="{ 'is-compact': compact }" role="dialog" aria-label="选择日期与时间" :style="position" @keydown.esc.stop.prevent="close(true)" @keydown.tab="leaveOnTab">
          <header class="calendar-header"><span class="calendar-mark" aria-hidden="true">▦</span><div><h3>选择日期与时间</h3><p>留一点时间，给下一步。</p></div><svg class="calendar-landscape" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M1 27h70M5 26V13h10v13m-7-9h4m-4 4h4m9 5V6h15v20m-11-16h3m4 0h3m-10 6h3m4 0h3m10 11V14h11v13m-8-9h5m10 8v-9m-5 1h10l-5-10z" /><path d="M48 3h5v5h-5z" /></svg><button type="button" aria-label="关闭日期选择" @click="close(true)">×</button></header>
          <div v-if="compact" class="calendar-sections" role="group" aria-label="日期时间步骤"><button type="button" :aria-pressed="section === 'date'" @click="showSection('date')"><span>01</span> 日期 <small>{{ readCalendarDate(draftDate).month }}月{{ readCalendarDate(draftDate).day }}日</small></button><button type="button" :aria-pressed="section === 'time'" @click="showSection('time')"><span>02</span> 时间 <small>{{ selectedValue?.slice(11) || '待填写' }}</small></button></div>
          <div class="calendar-body">
            <section v-show="!compact || section === 'date'" class="calendar-dates" aria-label="选择日期">
            <div class="date-shortcuts" role="group" aria-label="快捷日期"><button v-for="shortcut in shortcuts" :key="shortcut.label" type="button" @click="chooseDate(shiftCalendarDay(today, shortcut.days))">{{ shortcut.label }}<span aria-hidden="true">↗</span></button></div>
            <div class="month-navigation">
              <button class="month-arrow" type="button" aria-label="上个月" :disabled="view.year === 1 && view.month === 1" @click="moveMonth(-1)">‹</button>
              <button class="month-title" type="button" aria-label="切换年月" :aria-expanded="jumpOpen" @click="toggleJump"><span aria-live="polite">{{ monthTitle }}</span><span aria-hidden="true">⌄</span></button>
              <button class="month-arrow" type="button" aria-label="下个月" :disabled="view.year === 9999 && view.month === 12" @click="moveMonth(1)">›</button>
            </div>
            <div v-if="jumpOpen" class="month-jump">
              <label class="jump-year">年份<input v-model="jumpYear" type="text" inputmode="numeric" maxlength="4" aria-label="跳转年份" :aria-invalid="!validYear" @keydown.enter.prevent="jumpToMonth(view.month)" /><span>年</span></label>
              <p v-if="!validYear" class="calendar-validation" role="alert">请输入 1 至 9999 之间的年份。</p>
              <div class="month-grid"><button v-for="month in 12" :key="month" type="button" :disabled="!validYear" :aria-label="`查看${jumpYear}年${month}月`" :class="{ current: view.month === month && view.year === Number(jumpYear) }" @click="jumpToMonth(month)">{{ month }}月</button></div>
            </div>
            <table v-else class="calendar-grid" role="grid" :aria-label="monthTitle" @keydown="calendarKeys">
              <thead><tr><th v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" scope="col">{{ day }}</th></tr></thead>
              <tbody><tr v-for="(week, row) in weeks" :key="row"><td v-for="(day, column) in week" :key="day?.key || `empty-${column}`" :aria-selected="day?.key === draftDate"><button v-if="day" class="calendar-day" type="button" :class="{ chosen: day.key === draftDate, today: day.key === today, adjacent: day.month !== view.month }" :data-date="day.key" :tabindex="day.key === focusDate ? 0 : -1" :aria-label="calendarLabel(day.key, true)" :aria-current="day.key === today ? 'date' : undefined" @focus="focusDate = day.key" @click="chooseDate(day.key)">{{ day.day }}<i v-if="day.key === today" aria-hidden="true"></i></button></td></tr></tbody>
            </table>
            <button v-if="compact" type="button" class="next-section" @click="showSection('time', true)">选择具体时间 <span aria-hidden="true">→</span></button>
            </section>
            <section v-show="!compact || section === 'time'" class="calendar-time" aria-label="选择具体时间"><div class="time-heading"><span>时刻</span><small>24 小时制 · 本地时间</small></div>
              <div class="time-entry"><label><input v-model="hour" type="text" inputmode="numeric" maxlength="2" aria-label="小时" :aria-invalid="!/^\d{1,2}$/.test(hour) || Number(hour) > 23" @focus="$event.target.select()" @keydown="stepTime($event, 'hour')" @keydown.enter.prevent="apply" /><small>小时</small></label><b aria-hidden="true">:</b><label><input v-model="minute" type="text" inputmode="numeric" maxlength="2" aria-label="分钟" :aria-invalid="!/^\d{1,2}$/.test(minute) || Number(minute) > 59" @focus="$event.target.select()" @keydown="stepTime($event, 'minute')" @keydown.enter.prevent="apply" /><small>分钟</small></label></div>
              <div class="time-options-heading">选小时 <small>也可在上方直接输入</small></div>
              <div class="hour-options" role="group" aria-label="点选小时" @keydown="timeKeys($event, 'hour')"><button v-for="option in hours" :key="option" type="button" :data-time-option="option" :aria-label="`${option}时`" :aria-pressed="Number(hour) === Number(option) && hour !== ''" :tabindex="option === (hours.includes(hour.padStart(2, '0')) ? hour.padStart(2, '0') : '00') ? 0 : -1" @click="hour = option">{{ option }}</button></div>
              <div class="time-options-heading">选分钟 <small>支持任意分钟</small></div>
              <div class="minute-options" role="group" aria-label="点选分钟" @keydown="timeKeys($event, 'minute')"><button v-for="option in minutes" :key="option" type="button" :data-time-option="option" :aria-label="`${option}分`" :aria-pressed="Number(minute) === Number(option) && minute !== ''" :tabindex="option === (minutes.includes(minute.padStart(2, '0')) ? minute.padStart(2, '0') : '00') ? 0 : -1" @click="minute = option">{{ option }}<small>分</small></button></div>
              <div class="time-presets" role="group" aria-label="常用时间"><button v-for="preset in timePresets" :key="preset.hour" type="button" :aria-pressed="hour === preset.hour && minute === '00'" @click="hour = preset.hour; minute = '00'">{{ preset.label }} <span>{{ preset.hour }}:00</span></button></div>
              <p v-if="!selectedValue" class="calendar-validation" role="alert">小时填写 00–23，分钟填写 00–59。</p>
            </section>
          </div>
          <footer class="calendar-footer"><p aria-live="polite"><span>{{ calendarLabel(draftDate, true) }}</span><strong v-if="selectedValue">{{ selectedValue.slice(11) }}</strong></p><div><button v-if="clearable && modelValue" class="unset-date" type="button" @click="clear">暂不设置</button><button type="button" @click="close(true)">取消</button><button class="apply-date" type="button" :disabled="!selectedValue" @click="apply">选好时间 <span aria-hidden="true">✓</span></button></div></footer>
        </section>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pixel-date-picker { min-width: 0; }.date-picker-trigger { display: flex; align-items: center; gap: 13px; width: 100%; padding: 12px; text-align: left; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); color: var(--ink); background: #f7f8f0; font-family: var(--text-cn); transition: background .16s, box-shadow .16s; }.date-picker-trigger:hover:not(:disabled), .date-picker-trigger[aria-expanded="true"] { background: var(--paper); border-color: var(--accent); box-shadow: 3px 3px 0 #b8cbbb77; }.date-picker-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }.date-picker-trigger:disabled { opacity: .55; cursor: not-allowed; }.date-picker-trigger[aria-invalid="true"] { border-color: var(--danger); }
.date-tile { flex: 0 0 44px; align-self: stretch; display: flex; flex-direction: column; text-align: center; border: 1px solid #a4b9a7; background: #fffdf0; border-radius: 2px; box-shadow: 2px 2px 0 #c7d3be; }.date-tile small { padding: 3px; background: #dfe8d8; color: #47604d; font-size: 9px; letter-spacing: .1em; }.date-tile strong { padding: 4px 0; font: 19px var(--pixel); color: var(--accent-deep); }.date-tile svg { width: 25px; height: 28px; margin: 2px auto; stroke: var(--accent); stroke-width: 1.3; }.date-picker-copy { flex: 1; display: grid; gap: 7px; min-width: 0; }.date-picker-copy > strong { font-size: 13px; line-height: 1.5; font-weight: 500; overflow-wrap: anywhere; }.date-picker-copy > small { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--ink-600); font-size: 11px; line-height: 1.5; }.date-picker-copy i { font-style: normal; }.selected-clock { padding: 2px 6px; background: #e7edde; color: var(--accent); font-variant-numeric: tabular-nums; }.date-open-icon { flex: 0 0 15px; width: 15px; height: 15px; stroke: var(--accent); stroke-width: 1.4; }
.pixel-calendar { position: fixed; z-index: 85; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #a5b9a5; border-radius: 8px; background: #fffef6; box-shadow: 4px 4px 0 #b9c8bb88, 0 16px 48px #233e4924; color: var(--ink); font-family: var(--text-cn); }
button { border: 1px solid transparent; border-radius: 3px; color: inherit; background: transparent; font-family: inherit; cursor: pointer; }button:disabled { cursor: not-allowed; opacity: .4; }button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }button:hover:not(:disabled) { background: #e5ecdf; }
.calendar-header { flex-shrink: 0; display: flex; align-items: center; gap: 11px; padding: 15px 20px; background: #f0f3e7; border-bottom: 1px solid #dbe3d1; }.calendar-mark { width: 32px; height: 32px; display: grid; place-items: center; background: #dce6d3; color: var(--accent); font-size: 23px; box-shadow: 2px 2px 0 #bacbb0; }.calendar-header h3 { margin: 0; font-size: 14px; font-weight: 600; }.calendar-header p { margin: 4px 0 0; font-size: 10px; color: var(--ink-600); }.calendar-landscape { margin-left: auto; width: 64px; height: 29px; stroke: #79927c; stroke-width: 1; }.calendar-header > button { width: 30px; height: 30px; padding: 0; background: #fffef6; font-size: 21px; }
.calendar-body { display: grid; grid-template-columns: 1.12fr 1fr; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--accent-mid) transparent; }.calendar-dates, .calendar-time { min-width: 0; padding: 18px; }.calendar-time { border-left: 1px solid #dce4d3; background: #f7f8ef; }
.date-shortcuts { display: flex; gap: 6px; }.date-shortcuts button { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 8px; font-size: 11px; border-color: #d7e0cd; background: #f1f4e9; }.date-shortcuts span { color: #7b937a; font-size: 12px; }
.month-navigation { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 12px; }.month-arrow { width: 30px; height: 30px; border-color: var(--line); font-size: 22px; line-height: 1; background: #f6f7ee; }.month-title { display: flex; gap: 8px; align-items: center; padding: 6px; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }.month-title > span:last-child { color: var(--ink-500); }
.calendar-grid { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 3px 5px; }th { height: 24px; color: var(--ink-500); font-size: 11px; font-weight: 400; }th:nth-last-child(-n+2) { color: #92704c; }td { padding: 0; height: 33px; text-align: center; }.calendar-day { position: relative; width: 100%; height: 33px; padding: 0; font-size: 13px; font-variant-numeric: tabular-nums; }.calendar-day.adjacent { color: #849184; }.calendar-day.today { border-color: #d2bd8b; }.calendar-day > i { position: absolute; width: 3px; height: 3px; bottom: 3px; left: calc(50% - 1px); background: #b1834a; }.calendar-day.chosen, .calendar-day.chosen:hover { color: #fff8e2; background: var(--accent-deep); border-color: var(--accent-deep); box-shadow: 2px 2px 0 #b0c5b3; }.calendar-day.chosen > i { background: #e1ce9a; }.calendar-day:focus-visible { outline-offset: 0; }
.month-jump { padding: 10px 0; min-height: 258px; }.jump-year { display: flex; align-items: center; justify-content: center; gap: 9px; font-size: 12px; }.jump-year input { width: 82px; padding: 7px; text-align: center; }.month-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 18px; }.month-grid button { min-height: 40px; border-color: var(--line); font-size: 12px; }.month-grid .current { color: var(--paper); background: var(--accent-deep); }
.time-heading, .time-options-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; }.time-heading small, .time-options-heading small { color: var(--ink-500); font-size: 9px; font-weight: 400; }
.time-entry { display: flex; align-items: center; justify-content: center; gap: 13px; margin: 13px 0 17px; }.time-entry label { display: grid; gap: 5px; text-align: center; }.time-entry input { width: 76px; height: 49px; padding: 6px; text-align: center; font-size: 28px; font-weight: 500; font-variant-numeric: tabular-nums; border-color: #b8cbb2; background: #fffef7; }.time-entry small { color: var(--ink-500); font-size: 9px; }.time-entry b { align-self: flex-start; padding-top: 5px; color: #799079; font-size: 28px; font-weight: 400; }
.time-options-heading { margin: 12px 0 8px; font-size: 10px; }.hour-options { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; }.hour-options button, .minute-options button { min-width: 0; height: 31px; padding: 0; border: 1px solid #dce4d4; background: #fffef9; color: var(--accent); font-size: 12px; font-variant-numeric: tabular-nums; }.hour-options button[aria-pressed="true"], .minute-options button[aria-pressed="true"] { color: #fff9e8; background: var(--accent-deep); border-color: var(--accent-deep); box-shadow: 1px 2px 0 #b4c6ad; }
.minute-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }.minute-options small { margin-left: 3px; font-size: 9px; opacity: .75; }
.time-presets { display: flex; gap: 5px; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cdd9c4; }.time-presets button { flex: 1; padding: 5px 0; font-size: 10px; border: 0; }.time-presets span { display: block; margin-top: 3px; color: var(--ink-600); font-size: 10px; font-variant-numeric: tabular-nums; }.time-presets button[aria-pressed="true"] { background: #e3ebd9; }
input { min-width: 0; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper); color: var(--ink); font-family: inherit; }input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }input[aria-invalid="true"] { border-color: var(--danger); }.calendar-validation { margin: 8px 0 0; color: var(--danger); font-size: 11px; line-height: 1.7; }
.calendar-footer { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 18px; border-top: 1px solid #d2ddc7; background: #fffef6; }.calendar-footer > p { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0; color: var(--ink-600); font-size: 11px; }.calendar-footer strong { padding: 4px 7px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--accent-deep); background: #e8efde; }.calendar-footer > div { display: flex; justify-content: flex-end; gap: 8px; margin-left: auto; }.calendar-footer button { min-height: 36px; padding: 7px 12px; font-size: 12px; border-color: #bfceb7; background: var(--paper); }.calendar-footer .unset-date { margin-right: auto; padding-inline: 4px; border-color: transparent; background: transparent; font-size: 11px; }.calendar-footer .apply-date { color: #fff9e5; background: var(--accent-deep); border-color: var(--accent-deep); box-shadow: 2px 2px 0 #abbfa6; }.apply-date span { margin-left: 8px; }.calendar-footer .apply-date:hover:not(:disabled) { background: var(--accent); }
.calendar-sections { display: flex; flex-shrink: 0; gap: 6px; padding: 10px 14px 0; }.calendar-sections button { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; padding: 9px 8px; border-color: #d5dfcb; background: #f4f6ea; font-size: 12px; }.calendar-sections button[aria-pressed="true"] { color: var(--accent-deep); border-color: #8ba585; background: #e8efdc; }.calendar-sections span { font: 9px var(--pixel); opacity: .65; }.calendar-sections small { margin-left: auto; font-size: 10px; color: var(--ink-600); font-variant-numeric: tabular-nums; }
.is-compact .calendar-body { display: block; }.is-compact .calendar-dates, .is-compact .calendar-time { padding: 14px; }.is-compact .calendar-time { border-left: 0; background: transparent; }.is-compact .calendar-footer > p, .is-compact .calendar-footer > div { width: 100%; justify-content: space-between; }.is-compact .calendar-footer > div { justify-content: flex-end; }.is-compact .calendar-footer { gap: 10px; padding: 12px 14px; }.is-compact .month-navigation { margin-top: 14px; }.is-compact .calendar-header { padding: 12px 14px; }.is-compact .calendar-grid { border-spacing: 3px; }.is-compact .hour-options button, .is-compact .minute-options button { height: 35px; }
.next-section { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 13px; padding: 10px 12px; color: var(--accent-deep); border: 1px solid #c8d6be; background: #edf3e2; font-size: 12px; }
.calendar-pop-enter-active, .calendar-pop-leave-active { transition: opacity .14s, transform .14s; }.calendar-pop-enter-from, .calendar-pop-leave-to { opacity: 0; transform: translateY(5px); }
@media(max-width: 360px) { .calendar-landscape { width: 44px; }.date-picker-copy > strong { font-size: 12px; }.calendar-sections span { display: none; }.calendar-footer button { padding-inline: 9px; } }
@media(prefers-reduced-motion: reduce) { *, .calendar-pop-enter-active, .calendar-pop-leave-active { transition: none; } }
</style>
