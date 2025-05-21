<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed bottom-4 right-4 z-50 max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
      <div class="p-4 border-l-4" :class="{'border-green-500': type === 'success', 'border-blue-500': type === 'info'}">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg v-if="type === 'success'" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ title }}</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
            <div class="mt-3 flex gap-2">
              <button 
                @click="navigate" 
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                查看详情
              </button>
              <button 
                @click="close" 
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                关闭
              </button>
            </div>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button 
              @click="close" 
              class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span class="sr-only">关闭</span>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'TaskNotification',
  props: {
    message: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: '任务通知'
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success'].includes(value)
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    dockerId: {
      type: String,
      default: ''
    },
    autoClose: {
      type: Number,
      default: 5000 // 默认5秒后自动关闭
    }
  },
  setup(props, { emit }) {
    const router = useRouter();
    let autoCloseTimer = null;

    watch(() => props.isVisible, (newValue) => {
      if (newValue && props.autoClose > 0) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => {
          emit('close');
        }, props.autoClose);
      }
    });

    const close = () => {
      clearTimeout(autoCloseTimer);
      emit('close');
    };

    const navigate = () => {
      if (props.dockerId) {
        router.push({ 
          path: '/history', 
          query: { dockerId: props.dockerId }
        });
      }
      close();
    };

    return {
      close,
      navigate
    };
  }
}
</script>