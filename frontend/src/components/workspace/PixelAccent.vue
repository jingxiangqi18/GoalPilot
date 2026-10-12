<script setup>
import garden from '../../assets/goalpilot-pixel-pocket-garden-v1.webp'
import kiosk from '../../assets/goalpilot-pixel-flower-kiosk-v1.webp'
import tram from '../../assets/goalpilot-pixel-tram-stop-v1.webp'

defineProps({ kind: { type: String, default: 'garden', validator: value => ['garden', 'kiosk', 'tram'].includes(value) } })
const artwork = { garden, kiosk, tram }
</script>

<template>
  <img class="pixel-accent" :src="artwork[kind]" alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" width="1254" height="1254" />
</template>

<style scoped>
.pixel-accent { display: block; width: 120px; height: auto; flex-shrink: 0; object-fit: contain; image-rendering: pixelated; pointer-events: none; user-select: none; }
</style>
