<script setup>
import { computed } from 'vue'
import riverside from '../../assets/goalpilot-pixel-riverside-v1.webp'
import highlands from '../../assets/goalpilot-pixel-highlands-v1.webp'
import railway from '../../assets/goalpilot-pixel-city-v1.webp'

const props = defineProps({
  eager: Boolean,
  scene: { type: String, default: 'riverside', validator: value => ['riverside', 'highlands', 'railway'].includes(value) },
})
const scenes = {
  riverside: { src: riverside, width: 1536, height: 512 },
  highlands: { src: highlands, width: 1536, height: 768 },
  railway: { src: railway, width: 1536, height: 1024 },
}
const artwork = computed(() => scenes[props.scene] || scenes.riverside)
</script>

<template>
  <div class="pixel-scene" :class="'scene-' + scene" aria-hidden="true">
    <img :src="artwork.src" alt="" :width="artwork.width" :height="artwork.height" :loading="eager ? 'eager' : 'lazy'" :fetchpriority="eager ? 'high' : 'auto'" decoding="async" />
    <span class="scene-corner top"></span><span class="scene-corner bottom"></span>
    <slot />
  </div>
</template>

<style scoped>
.pixel-scene { position: relative; overflow: hidden; background: #b6cdca; pointer-events: none; }
.pixel-scene img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; image-rendering: pixelated; }
.scene-highlands img { object-position: center 55%; }
.scene-railway img { object-position: center 60%; }
.scene-corner { position: absolute; width: 8px; height: 8px; background: var(--canvas); }
.scene-corner.top { left: 0; top: 0; }.scene-corner.bottom { right: 0; bottom: 0; }
</style>
