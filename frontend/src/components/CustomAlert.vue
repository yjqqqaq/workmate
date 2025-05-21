<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="absolute inset-0 bg-black opacity-50" @click="close"></div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 z-10 transition-colors duration-300">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center">
            <div v-if="type === 'success'" class="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div v-else-if="type === 'error'" class="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div v-else class="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ title }}</h3>
          </div>
          <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="text-gray-700 dark:text-gray-300 mb-4">{{ message }}</div>
        <div class="flex justify-end">
          <button 
            @click="close" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'CustomAlert',
  props: {
    message: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: '提示'
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'error'].includes(value)
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
}
</script>