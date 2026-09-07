<script setup>
import { computed } from 'vue'
import { goalPresentation } from '../../utils/goalPresentation'
const props = defineProps({ status: { type: String, default: '' } })
const state = computed(() => goalPresentation(props.status))
</script>

<template><span class="goal-status-badge" :class="state.tone"><i aria-hidden="true"></i>{{ state.label }}</span></template>

<style scoped>
.goal-status-badge { display: inline-flex; align-items: center; gap: 7px; width: fit-content; padding: 6px 10px; color: #606575; background: #f3f4f7; border: 1px solid #dadde5; border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 1.3; white-space: nowrap; }
.goal-status-badge i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.lilac { color: #5e5891; background: #f0eef9; border-color: #dbd5ef; }
.blue { color: #44647e; background: #edf4f8; border-color: #cddfe9; }
.rose { color: #915b74; background: #fbf0f4; border-color: #eed4df; }
.sage { color: #4c7266; background: #edf5f0; border-color: #cedfd5; }
</style>
