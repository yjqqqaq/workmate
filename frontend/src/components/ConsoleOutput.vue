<template>
  <div 
    class="console-output bg-gray-900 text-gray-200 font-mono rounded-md overflow-hidden border border-gray-700"
    :class="{ 'h-full': fullHeight }"
  >
    <div 
      ref="consoleContainer"
      class="p-3 overflow-auto h-full whitespace-pre-wrap"
      :style="{ maxHeight: maxHeight }"
    >
      <div v-if="!content" class="text-gray-500 italic">No output</div>
      <div v-else v-html="formattedContent"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

export default {
  name: 'ConsoleOutput',
  props: {
    content: {
      type: String,
      default: ''
    },
    maxHeight: {
      type: String,
      default: '400px'
    },
    fullHeight: {
      type: Boolean,
      default: false
    },
    autoScroll: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const consoleContainer = ref(null)

    // ANSI color codes mapping to CSS classes
    const ansiToHtml = (text) => {
      if (!text) return ''
      
      // Replace ANSI color codes with span elements with appropriate CSS classes
      const colorMap = {
        // Regular colors
        '\u001b[30m': '<span class="text-black">',
        '\u001b[31m': '<span class="text-red-500">',
        '\u001b[32m': '<span class="text-green-500">',
        '\u001b[33m': '<span class="text-yellow-500">',
        '\u001b[34m': '<span class="text-blue-500">',
        '\u001b[35m': '<span class="text-purple-500">',
        '\u001b[36m': '<span class="text-cyan-500">',
        '\u001b[37m': '<span class="text-white">',
        
        // Bright colors
        '\u001b[90m': '<span class="text-gray-500">',
        '\u001b[91m': '<span class="text-red-400">',
        '\u001b[92m': '<span class="text-green-400">',
        '\u001b[93m': '<span class="text-yellow-400">',
        '\u001b[94m': '<span class="text-blue-400">',
        '\u001b[95m': '<span class="text-purple-400">',
        '\u001b[96m': '<span class="text-cyan-400">',
        '\u001b[97m': '<span class="text-white">',
        
        // Reset
        '\u001b[0m': '</span>',
      }
      
      let result = text
      
      // Replace all color codes with their HTML equivalents
      for (const [ansi, html] of Object.entries(colorMap)) {
        result = result.split(ansi).join(html)
      }
      
      // Handle any unclosed spans
      const openSpans = (result.match(/<span/g) || []).length
      const closeSpans = (result.match(/<\/span>/g) || []).length
      
      if (openSpans > closeSpans) {
        result += '</span>'.repeat(openSpans - closeSpans)
      }
      
      return result
    }

    const formattedContent = computed(() => {
      return ansiToHtml(props.content)
    })

    const scrollToBottom = () => {
      if (consoleContainer.value && props.autoScroll) {
        nextTick(() => {
          consoleContainer.value.scrollTop = consoleContainer.value.scrollHeight
        })
      }
    }

    // Watch for content changes to auto-scroll
    watch(() => props.content, () => {
      scrollToBottom()
    })

    onMounted(() => {
      scrollToBottom()
    })

    return {
      consoleContainer,
      formattedContent
    }
  }
}
</script>

<style scoped>
.console-output {
  min-height: 100px;
}
</style>