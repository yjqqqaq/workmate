<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center transition-colors duration-300">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p class="mt-4 text-gray-700 dark:text-gray-300 font-medium">{{ message || '加载中...' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: '加载中...'
    }
  }
}
</script>