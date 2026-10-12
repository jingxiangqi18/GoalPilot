<script setup>
import PixelScene from './PixelScene.vue'
import PixelAccent from './PixelAccent.vue'
</script>

<template>
  <div class="workspace-scenery" aria-hidden="true">
    <div class="world-fragment riverside"><PixelScene scene="riverside" eager /><span>01 · RIVERSIDE</span></div>
    <div class="world-fragment highlands"><PixelScene scene="highlands" /><span>02 · SLOW DAYS</span></div>
    <div class="world-fragment railway"><PixelScene scene="railway" /><span>03 · ON THE WAY</span></div>
    <div class="station-fragment"><PixelAccent kind="tram" /><span>ONE STEP AT A TIME</span></div>
    <svg class="journey-dots" viewBox="0 0 140 50" fill="none"><path d="M4 42h35V24h52V8h45" stroke="currentColor" stroke-dasharray="3 5" /><path d="M1 39h6v6H1zM133 5h6v6h-6z" fill="currentColor" /></svg>
  </div>
</template>

<style scoped>
.workspace-scenery { position: absolute; inset: 0; pointer-events: none; user-select: none; z-index: 0; color: #9baa89; }
.world-fragment { position: absolute; width: clamp(116px, 11vw, 185px); padding: 7px 7px 10px; border: 1px solid #cbd5c2; background: #faf9ed; box-shadow: 3px 3px 0 #c3cebb55; opacity: .78; }
.world-fragment .pixel-scene { height: clamp(85px, 8vw, 125px); filter: saturate(.74); }
.world-fragment > span, .station-fragment > span { display: block; margin-top: 10px; color: #667f73; font: 8px var(--pixel); letter-spacing: .04em; }
.riverside { left: 0; top: 95px; transform: rotate(-5deg); }.highlands { right: 8px; top: 20px; transform: rotate(5deg); }.railway { left: 24px; bottom: 42px; width: clamp(115px, 10vw, 164px); transform: rotate(3deg); }
.station-fragment { position: absolute; bottom: 80px; right: 6px; text-align: center; }.station-fragment img { display: block; width: clamp(100px, 11vw, 170px); height: auto; image-rendering: pixelated; }.station-fragment > span { margin-top: 0; font-size: 7px; }
.journey-dots { position: absolute; width: 125px; right: 34px; top: 250px; opacity: .55; }
@media(max-width: 1499px) { .world-fragment { display: none; }.station-fragment { bottom: auto; top: 8px; right: 0; }.station-fragment img { width: 90px; opacity: .8; }.station-fragment > span, .journey-dots { display: none; } }
@media(max-width: 620px) { .station-fragment { top: 0; right: 2px; }.station-fragment img { width: 54px; opacity: .7; } }
</style>
