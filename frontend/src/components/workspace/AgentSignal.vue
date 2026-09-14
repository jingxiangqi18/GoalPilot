<script setup>
defineProps({ active: Boolean, large: Boolean })
</script>

<template>
  <span class="agent-signal" :class="{ active, large }" aria-hidden="true">
    <svg viewBox="0 0 32 32" shape-rendering="crispEdges">
      <path fill="#dce5dc" d="M6 2h20v2h4v24h-4v2H6v-2H2V4h4Z" />
      <g class="signal-engine">
        <path fill="#263e49" d="M10 5h12v2h2v17h-3v3h-3v-3h-4v3h-3v-3H8V7h2Z" />
        <path fill="#f5edd6" d="M10 9h12v11H10Z" />
        <path fill="#739cac" d="M11 10h4v5h-4Zm6 0h4v5h-4Z" />
        <path fill="#bd7951" d="M10 17h12v3H10Z" />
        <path class="signal-light" fill="#f4d68b" d="M11 21h3v2h-3Zm7 0h3v2h-3Z" />
        <path fill="#7b9586" d="M13 6h6v2h-6Z" />
      </g>
      <path fill="#7b9586" d="M8 28h16v1H8Z" />
    </svg>
  </span>
</template>

<style scoped>
.agent-signal { display: inline-flex; flex: 0 0 auto; width: 32px; height: 32px; vertical-align: middle; }
.agent-signal svg { width: 100%; height: 100%; image-rendering: pixelated; }
.large { width: 80px; height: 80px; }
.active .signal-engine { animation: engine-idle .6s steps(2, end) infinite; }
.active .signal-light { animation: signal-light 1s steps(2, end) infinite; }
@keyframes engine-idle { 50% { transform: translateY(-1px); } }
@keyframes signal-light { 50% { fill: #fff9df; } }
</style>
