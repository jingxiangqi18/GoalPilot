export const worldScenes = [
  { key: 'harbor', label: '河岸小城', caption: 'RIVERSIDE · GOLDEN HOUR', preview: 'harbor' },
  { key: 'garden', label: '花园漫步', caption: 'BOTANICAL · SLOW MORNING', preview: 'garden' },
  { key: 'night-rail', label: '蓝调夜行', caption: 'BLUE HOUR · RAILWAY', preview: 'night-rail' },
  { key: 'singapore', label: '新加坡', caption: 'SINGAPORE · A GARDEN CITY', preview: 'singapore-atlas' },
]
export const appearanceKey = 'goalpilot.world-appearance.v1'

// Page roles, not component-specific aliases, select the city's scenery.
const sharedArt = {
  left: 'garden-edge', right: 'neighborhood-edge', footer: 'viaduct',
  welcome: 'reading-nook', empty: 'reading-nook', work: 'desk',
  study: 'reading-nook', wellness: 'garden-edge', detail: 'desk',
}
const singaporeArt = {
  home: 'singapore-atlas', sidebar: 'singapore-atlas', auth: 'singapore-atlas',
  tasks: 'singapore-gardens', library: 'singapore-quays',
  left: 'singapore-garden-edge', right: 'singapore-shophouse', footer: 'singapore-mrt',
  welcome: 'singapore-shophouse', empty: 'singapore-garden-edge',
  work: 'singapore-shophouse', study: 'singapore-garden-edge', wellness: 'singapore-garden-edge', detail: 'singapore-shophouse',
}
export function worldArtFor(scene, role, identity = '') {
  const selected = worldScenes.find(item => item.key === scene) || worldScenes[0]
  if (selected.key === 'singapore') {
    if (role === 'cover') {
      // A goal keeps its cover when its position changes after filtering/pagination.
      const hash = [...String(identity)].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0)
      return ['singapore-atlas', 'singapore-gardens', 'singapore-quays'][hash % 3]
    }
    return singaporeArt[role] || selected.preview
  }
  return sharedArt[role] || selected.preview
}

export function normalizeAppearance(value) {
  return {
    scene: worldScenes.some(scene => scene.key === value?.scene) ? value.scene : 'harbor',
    focused: value?.focused === true,
  }
}
