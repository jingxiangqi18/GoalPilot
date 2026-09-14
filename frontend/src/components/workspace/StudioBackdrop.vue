<template>
  <div class="studio-backdrop" aria-hidden="true">
    <div class="survey-grid"></div>
    <svg class="city-outline" viewBox="0 0 1200 150" fill="none" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
      <path class="distant-hills" d="M0 106h24V90h28V76h28V60h36V44h24V60h28V76h32V90h42v18h68v18h510v-18h44V92h32V76h28V60h28V42h28V26h30V42h30V60h36v18h36v18h32v18h36v36H0Z" />
      <path d="M270 128h40V92h16V76h38V92h16v36h30V62h18V48h42v14h18v66h32V86h20V72h38v14h20v42h42V96h20V82h40v14h20v32h34V66h18V52h42v14h18v62h40" />
      <g v-for="x in [28, 140, 220, 840, 930, 1070, 1150]" :key="x" :transform="'translate(' + x + ' 78)'">
        <path class="outline-tree" d="M0 35h6V23h6V11h6V0h8v11h6v12h6v12h6v10H0Z" />
        <path d="M22 45v10" />
      </g>
      <path d="M0 140h450v4h230v-4h520" />
    </svg>
  </div>
</template>

<style scoped>
.studio-backdrop { position: absolute; inset: 0; overflow: hidden; pointer-events: none; background: var(--canvas); }
.survey-grid { position: absolute; inset: 0; background-image: linear-gradient(#536e7710 1px, transparent 1px), linear-gradient(90deg, #536e7710 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(180deg, #0008, transparent 55%); }
.city-outline { position: absolute; bottom: 0; width: 100%; height: 150px; stroke: #788d80; stroke-width: 1; opacity: .13; }
.distant-hills { fill: #cbd8bf; stroke: #8fa387; opacity: .7; }
.outline-tree { fill: #aebfa0; stroke: #6d8a72; }
</style>
