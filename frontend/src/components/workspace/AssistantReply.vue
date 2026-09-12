<script setup>
import { computed } from 'vue'
import { replyBlocks, replyInlines } from '../../utils/assistantReply'

const props = defineProps({ text: { type: String, required: true } })
const blocks = computed(() => replyBlocks(props.text))
</script>

<template>
  <div class="assistant-reply">
    <template v-for="(block, index) in blocks" :key="index">
      <component :is="block.ordered ? 'ol' : 'ul'" v-if="block.type === 'list'" :start="block.ordered ? block.start : undefined">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><component :is="part.tag" v-for="(part, partIndex) in replyInlines(item)" :key="partIndex">{{ part.text }}</component></li>
      </component>
      <pre v-else-if="block.type === 'code'"><code>{{ block.text }}</code></pre>
      <component :is="block.type === 'heading' ? 'h3' : 'p'" v-else><component :is="part.tag" v-for="(part, partIndex) in replyInlines(block.text)" :key="partIndex">{{ part.text }}</component></component>
    </template>
  </div>
</template>

<style scoped>
.assistant-reply { color: var(--ink-700); font-family: var(--text-cn); font-size: 14px; line-height: 1.95; overflow-wrap: anywhere; }
.assistant-reply > :first-child { margin-top: 0; }.assistant-reply > :last-child { margin-bottom: 0; }
p { margin: 10px 0; white-space: pre-wrap; }
h3 { margin: 22px 0 8px; color: #514761; font-size: 15px; font-weight: 600; }
ul, ol { margin: 10px 0; padding-left: 24px; }
li { padding-left: 5px; margin: 7px 0; white-space: pre-wrap; }
li::marker { color: #87759e; font-weight: 500; }
strong { color: #514761; font-weight: 600; }
code { padding: 2px 5px; border-radius: 4px; background: #eeebf5; color: #635574; font-size: .92em; }
pre { margin: 14px 0; padding: 14px; border-radius: 10px; background: #f3f1f7; white-space: pre-wrap; overflow-wrap: anywhere; }pre code { padding: 0; background: none; }
</style>
