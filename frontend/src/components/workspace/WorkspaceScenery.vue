<script setup>
import WorldArt from './WorldArt.vue'
</script>

<template>
  <div class="workspace-scenery world-decoration" aria-hidden="true">
    <WorldArt class="ambient-landscape" scene-role="home" eager />
    <WorldArt class="world-edge garden-edge" scene-role="left" eager />
    <WorldArt class="world-edge neighborhood-edge" scene-role="right" eager />
    <WorldArt class="world-viaduct" scene-role="footer" />
  </div>
</template>

<style scoped>
.workspace-scenery { position: absolute; inset: 0; overflow: hidden; border-radius: 12px 12px 0 0; z-index: 0; pointer-events: none; user-select: none; }
/* Keep the original framing: panoramas are 3:1, the city atlas is 3:2.
   Only the last strip blends into the canvas; never wash out the whole image. */
.ambient-landscape { position: absolute; inset: 0 0 auto; width: 100%; height: auto; object-fit: contain; opacity: 1; mask-image: linear-gradient(#000 86%, transparent 100%); animation: scenery-arrive .45s ease-out; }
.world-edge { position: absolute; top: clamp(370px, 33vw, 660px); width: clamp(165px, 16vw, 280px); height: 330px; object-fit: contain; }.garden-edge { left: -24px; }.neighborhood-edge { right: -24px; }
/* The atlas already has its own complete foreground. Avoid stacking cutouts on it. */
.workspace-scenery:has([data-displayed-art="singapore-atlas"], [data-displayed-art="nus-campus"]) .world-edge { display: none; }
.world-viaduct { position: absolute; bottom: 0; left: 0; width: min(540px, 38%); height: 210px; object-fit: contain; object-position: bottom left; opacity: .85; }
@keyframes scenery-arrive { from { opacity: 0; transform: translateY(6px); } }
@media(max-width: 1499px) { .world-edge { display: none; }.world-viaduct { width: 250px; height: 100px; } }
@media(max-width: 960px) { .world-viaduct { width: 180px; } }
@media(max-width: 620px) { .world-viaduct { display: none; } }
@media(prefers-reduced-motion: reduce) { .ambient-landscape { animation: none; } }
</style>
