<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useWorldAppearance } from '../../composables/useWorldAppearance'
import { worldArtFor } from '../../utils/worldAppearance'
import harbor from '../../assets/goalpilot-world-harbor-v1.webp'
import garden from '../../assets/goalpilot-world-garden-v1.webp'
import night from '../../assets/goalpilot-world-night-rail-v1.webp'
import gardenEdge from '../../assets/goalpilot-world-garden-edge-v1.webp'
import neighborhood from '../../assets/goalpilot-world-neighborhood-edge-v1.webp'
import viaduct from '../../assets/goalpilot-world-viaduct-v1.webp'
import desk from '../../assets/goalpilot-world-desk-v1.webp'
import reading from '../../assets/goalpilot-world-reading-nook-v1.webp'
import singaporeAtlas from '../../assets/goalpilot-world-singapore-atlas-v1.webp'
import singaporeGardens from '../../assets/goalpilot-world-singapore-gardens-v1.webp'
import singaporeQuays from '../../assets/goalpilot-world-singapore-quays-v1.webp'
import singaporeShophouse from '../../assets/goalpilot-world-singapore-shophouse-v1.webp'
import singaporeGardenEdge from '../../assets/goalpilot-world-singapore-garden-edge-v1.webp'
import singaporeMrt from '../../assets/goalpilot-world-singapore-mrt-v1.webp'

const props = defineProps({ asset: { type: String, default: 'harbor' }, sceneRole: String, identity: [String, Number], eager: Boolean })
const { appearance } = useWorldAppearance()
const selected = computed(() => props.sceneRole ? worldArtFor(appearance.scene, props.sceneRole, props.identity) : props.asset)
const images = { harbor, garden, 'night-rail': night, 'garden-edge': gardenEdge, 'neighborhood-edge': neighborhood, viaduct, desk, 'reading-nook': reading,
  'singapore-atlas': singaporeAtlas, 'singapore-gardens': singaporeGardens, 'singapore-quays': singaporeQuays,
  'singapore-shophouse': singaporeShophouse, 'singapore-garden-edge': singaporeGardenEdge, 'singapore-mrt': singaporeMrt }
const displayed = ref(selected.value)
let imageRequest = 0
watch(selected, async key => {
  const request = ++imageRequest
  // Keep the previous frame until the new bitmap is decoded. Fast switching
  // must not let a slower, older image replace the latest selection.
  const image = new Image()
  image.src = images[key] || images.harbor
  try {
    await image.decode()
    if (request === imageRequest) displayed.value = key
  } catch { /* Decorative image unavailable: keep the last complete frame. */ }
})
onBeforeUnmount(() => { imageRequest++ })
const dimensions = computed(() => {
  if (displayed.value === 'singapore-atlas') return [1536, 1024]
  if (['garden-edge', 'neighborhood-edge', 'singapore-shophouse', 'singapore-garden-edge'].includes(displayed.value)) return [512, 768]
  if (['desk', 'reading-nook'].includes(displayed.value)) return [640, 640]
  return [1536, 512]
})
</script>

<template>
  <img class="world-art" :data-art="selected" :data-displayed-art="displayed" :src="images[displayed] || images.harbor" alt="" aria-hidden="true" draggable="false" :loading="eager ? 'eager' : 'lazy'" decoding="async" :fetchpriority="eager ? 'high' : 'auto'" :width="dimensions[0]" :height="dimensions[1]" />
</template>

<style scoped>
.world-art { display: block; object-fit: contain; image-rendering: pixelated; pointer-events: none; user-select: none; }
</style>
