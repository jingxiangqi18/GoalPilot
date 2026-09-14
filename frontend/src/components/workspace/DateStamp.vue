<script setup>
import { computed } from 'vue'
import { getDateParts } from '../../utils/dateTime'

const props = defineProps({
  value: { type: String, default: '' },
  label: { type: String, default: '保存时间' },
  compact: { type: Boolean, default: false },
  showTime: { type: Boolean, default: true },
})
const date = computed(() => getDateParts(props.value))
</script>

<template>
  <time v-if="date" class="date-stamp" :class="{ compact }" :datetime="date.datetime" :title="date.fullLabel" :aria-label="`${label ? label + '：' : ''}${date.fullLabel}`">
    <template v-if="compact">
      <svg class="date-inline-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="3" /><path d="M6.5 2.5v4m7-4v4M3 9h14" /></svg>
      <span v-if="label" class="date-inline-label" aria-hidden="true">{{ label }}</span>
      <span class="date-inline-day" aria-hidden="true"><small>{{ date.year }}年</small><strong>{{ date.month }}月{{ date.day }}日</strong></span>
      <span v-if="showTime && date.hasTime" class="date-inline-clock" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>{{ date.time }}</span>
    </template>
    <template v-else>
    <span class="calendar-leaf" aria-hidden="true"><small>{{ date.month }}月</small><strong>{{ date.dayPadded }}</strong></span>
    <span class="date-stamp-copy" aria-hidden="true"><small>{{ label }}</small><strong>{{ showTime && date.hasTime ? date.time : `${date.month}月${date.day}日` }}</strong><span>{{ date.year }}年<i></i>{{ date.weekday }}</span></span>
    </template>
  </time>
  <span v-else class="date-unknown">{{ label || '时间' }}未记录</span>
</template>

<style scoped>
.date-stamp { display: inline-flex; align-items: center; gap: 14px; flex-shrink: 0; max-width: 100%; font-family: var(--display); font-variant-numeric: lining-nums tabular-nums; }
.calendar-leaf { position: relative; display: grid; width: 56px; flex-shrink: 0; text-align: center; overflow: hidden; background: linear-gradient(145deg, #fff, var(--paper)); border-radius: var(--radius-sm); box-shadow: 0 4px 12px color-mix(in srgb, var(--shadow-color) 4%, transparent), 2px 3px 0 var(--line); transform: rotate(-2deg); }
.calendar-leaf small { padding: 4px 0; background: linear-gradient(100deg, var(--canvas-soft), var(--canvas-soft)); color: var(--ink-700); font-family: var(--text-cn); font-size: 11px; font-weight: 500; }
.calendar-leaf strong { padding: 3px 0 5px; font-size: 27px; line-height: 1.3; font-weight: 500; letter-spacing: -.035em; color: var(--ink-700); }
.date-stamp-copy { display: grid; gap: 3px; }
.date-stamp-copy > small { font-family: var(--text-cn); font-size: 11px; color: var(--ink-500); }
.date-stamp-copy > strong { color: var(--ink-700); font-size: 19px; font-weight: 500; letter-spacing: .01em; }
.date-stamp-copy > span { display: flex; align-items: center; gap: 7px; color: var(--ink-500); font-size: 11px; }.date-stamp-copy > span i { width: 3px; height: 3px; border-radius: 50%; background: var(--accent-mid); }
.date-stamp.compact { flex-wrap: wrap; gap: 6px 8px; font-family: var(--text-cn); line-height: 1.7; }
.date-inline-icon { width: 16px; height: 16px; flex-shrink: 0; color: var(--ink-500); stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.date-inline-label { font-size: 11px; color: var(--ink-500); }
.date-inline-day { display: inline-flex; align-items: baseline; gap: 7px; white-space: nowrap; }.date-inline-day small { color: var(--ink-500); font-size: 11px; font-weight: 400; }.date-inline-day strong { color: var(--ink-700); font-size: 12px; font-weight: 500; }
.date-inline-clock { display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px; color: var(--ink-700); background: color-mix(in srgb, var(--canvas-soft) 50%, transparent); border-radius: 6px; font-family: var(--display); font-size: 12px; font-weight: 500; white-space: nowrap; }
.date-inline-clock svg { width: 13px; height: 13px; stroke: currentColor; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
.date-unknown { font-size: 12px; color: var(--ink-500); }
</style>
