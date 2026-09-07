<script setup>
import { computed } from 'vue'
import { getDateParts } from '../../utils/dateTime'

const props = defineProps({ value: { type: String, default: '' }, label: { type: String, default: '保存时间' } })
const date = computed(() => getDateParts(props.value))
</script>

<template>
  <time v-if="date" class="date-stamp" :datetime="date.datetime" :title="date.fullLabel" :aria-label="`${label}：${date.fullLabel}`">
    <span class="calendar-leaf" aria-hidden="true"><small>{{ date.month }}月</small><strong>{{ date.dayPadded }}</strong></span>
    <span class="date-stamp-copy" aria-hidden="true"><small>{{ label }}</small><strong>{{ date.hasTime ? date.time : `${date.month}月${date.day}日` }}</strong><span>{{ date.year }}年 · {{ date.weekday }}</span></span>
  </time>
  <span v-else class="date-unknown">{{ label }}未记录</span>
</template>

<style scoped>
.date-stamp { display: inline-flex; align-items: center; gap: 13px; flex-shrink: 0; font-family: var(--display); }
.calendar-leaf { position: relative; display: grid; width: 54px; text-align: center; overflow: hidden; background: #fff; border-radius: 10px 10px 14px 10px; box-shadow: 0 3px 9px #625c7e09, 2px 3px 0 #ddddea80; transform: rotate(-3deg); }
.calendar-leaf small { padding: 4px 0; background: #e9e6f2; color: #62577d; font-family: var(--text-cn); font-size: 10px; font-weight: 500; }
.calendar-leaf strong { padding: 3px 0 5px; font-size: 25px; line-height: 1.3; font-weight: 500; letter-spacing: -.06em; color: #4b455e; font-variant-numeric: tabular-nums; }
.date-stamp-copy { display: grid; gap: 3px; }
.date-stamp-copy > small { font-family: var(--text-cn); font-size: 10px; color: var(--ink-500); }
.date-stamp-copy > strong { color: #514b62; font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.date-stamp-copy > span { color: var(--ink-600); font-size: 10px; }
.date-unknown { font-size: 12px; color: var(--ink-500); }
</style>
