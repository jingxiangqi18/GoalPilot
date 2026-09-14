<script setup>
import station from '../../assets/goalpilot-pixel-station-v1.webp'
</script>

<template>
  <aside class="progress-garden" aria-label="从想法到行动">
    <header><span class="pixel-label">ROOM TO GROW</span><span aria-hidden="true">↗</span></header>
    <div class="garden-art" aria-hidden="true"><img :src="station" width="512" height="512" alt="" decoding="async" /></div>
    <div class="garden-copy"><h2>让想法，慢慢生长。</h2><p>先和 Agent 聊聊方向，<br />再用任务清单记录每一步。</p></div>
    <ol class="garden-steps" aria-label="规划过程"><li><i>01</i> 说出想法</li><li><i>02</i> 理清路线</li><li><i>03</i> 开始行动</li></ol>
  </aside>
</template>

<style scoped>
.progress-garden { position: relative; min-width: 0; padding: 18px 20px; border: 1px solid var(--line-strong); background: #e7eddf; box-shadow: 3px 3px 0 #bccabd66; }
.progress-garden header { display: flex; justify-content: space-between; align-items: center; color: var(--accent); font-size: 18px; }
.pixel-label { font: 10px var(--pixel); letter-spacing: .02em; }
.garden-art { position: absolute; right: 8px; top: 35px; width: 144px; height: 144px; }
.garden-art img { display: block; width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
.garden-copy { position: relative; max-width: calc(100% - 115px); padding-top: 24px; }
.garden-copy h2 { margin: 0 0 10px; color: var(--ink); font-size: 16px; font-weight: 600; line-height: 1.6; }
.garden-copy p { margin: 0; color: var(--ink-600); font-size: 11px; line-height: 1.85; }
.garden-steps { display: flex; gap: 10px; justify-content: space-between; list-style: none; margin: 25px 0 0; padding: 14px 0 0; border-top: 1px dashed #a8bca6; color: var(--ink-600); font-size: 10px; }
.garden-steps i { display: block; margin-bottom: 6px; color: var(--accent); font: 11px var(--pixel); }
@media(max-width: 1320px) { .garden-art { width: 110px; height: 110px; top: 40px; right: 6px; }.garden-copy { max-width: calc(100% - 82px); }.progress-garden { padding: 18px 16px; }.garden-steps { gap: 5px; } }
@media(max-width: 960px) { .progress-garden { display: none; } }
</style>
