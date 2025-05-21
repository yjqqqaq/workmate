<template>
  <div class="min-h-screen flex flex-col bg-bgColor dark:bg-gray-900 p-5 transition-colors duration-300">
    <header class="bg-gradient-to-r from-primary to-primary-dark text-white p-5 rounded-custom mb-5 shadow-custom text-center relative">
      <div class="absolute right-4 top-4">
        <button 
          @click="toggleTheme" 
          class="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
          :title="themeButtonTitle"
        >
          <span v-if="currentTheme === 'light'" class="text-xl">🌙</span>
          <span v-else-if="currentTheme === 'dark'" class="text-xl">🌞</span>
          <span v-else class="text-xl">⚙️</span>
        </button>
      </div>
      <h1 class="text-2xl font-bold tracking-wide">{{ pageTitle }}</h1>
      <nav class="mt-4">
        <ul class="flex justify-center gap-5">
          <li v-for="item in navItems" :key="item.path">
            <router-link 
              :to="item.path" 
              class="flex items-center px-4 py-2 rounded-custom transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5"
              :class="{ 'bg-white/30 font-bold shadow-sm': isActive(item.path) }"
            >
              <span class="mr-2">{{ item.icon }}</span>
              {{ item.text }}
            </router-link>
          </li>
        </ul>
      </nav>
    </header>
    
    <main class="bg-bgLight dark:bg-gray-800 p-6 rounded-custom shadow-custom flex-1 transition-colors duration-300">
      <router-view />
    </main>
    
    <!-- 全屏加载组件 -->
    <Loading :show="loading" :message="loadingMessage" />
    
    <!-- 自定义Alert组件 -->
    <CustomAlert 
      :message="alertState.message" 
      :title="alertState.title" 
      :type="alertState.type" 
      :isVisible="alertState.isVisible" 
      @close="closeAlert" 
    />
    
    <!-- 任务通知组件 -->
    <TaskNotification
      :message="notificationState.message"
      :title="notificationState.title"
      :type="notificationState.type"
      :isVisible="notificationState.isVisible"
      :dockerId="notificationState.dockerId"
      @close="closeNotification"
    />
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Loading from './components/Loading.vue'
import CustomAlert from './components/CustomAlert.vue'
import TaskNotification from './components/TaskNotification.vue'
import { loading, loadingMessage } from './utils/api-client'
import alertService from './utils/alert-service'
import notificationService from './utils/notification-service'
import ApiClient from './utils/api-client'
import { getUsername } from './utils/storage'
import themeService from './utils/theme-service'

export default {
  name: 'App',
  components: {
    Loading,
    CustomAlert,
    TaskNotification
  },
  setup() {
    const route = useRoute()
    const pollingInterval = ref(null)
    const lastDockerList = ref([])
    const currentTheme = ref(themeService.getThemeMode())
    
    const navItems = [
      { path: '/', text: '首页', icon: '🏠' },
      { path: '/history', text: 'Docker历史', icon: '📜' },
      { path: '/config', text: '配置', icon: '⚙️' }
    ]
    
    const pageTitle = computed(() => {
      switch(route.path) {
        case '/': return 'Scenario运行页面'
        case '/history': return 'Docker历史记录'
        case '/config': return '场景配置'
        default: return 'Scenario运行页面'
      }
    })
    
    const themeButtonTitle = computed(() => {
      switch(currentTheme.value) {
        case 'light': return '切换到深色模式'
        case 'dark': return '切换到系统模式'
        default: return '切换到浅色模式'
      }
    })
    
    const toggleTheme = () => {
      currentTheme.value = themeService.toggleTheme()
    }
    
    const isActive = (path) => {
      return route.path === path
    }
    
    const alertState = alertService.getState()
    const notificationState = notificationService.getState()
    
    const closeAlert = () => {
      alertService.close()
    }
    
    const closeNotification = () => {
      notificationService.close()
    }
    
    // 检查Docker状态变化
    const checkDockerStatus = async () => {
      const username = getUsername()
      if (!username) return
      
      try {
        const result = await ApiClient.getDockerList(username)
        if (result.success && result.data) {
          const currentTime = new Date()
          const tenSecondsAgo = new Date(currentTime.getTime() - 10000) // 10秒前
          
          // 检查是否有Docker在过去10秒内结束
          result.data.forEach(docker => {
            // 查找上一次检查中对应的Docker
            const prevDocker = lastDockerList.value.find(d => d.containerId === docker.containerId)
            
            // 如果Docker状态从running变为exited，且结束时间在过去10秒内
            if (prevDocker && prevDocker.status === 'running' && docker.status === 'exited') {
              const finishTime = new Date(docker.finishedAt || docker.updatedAt || currentTime)
              
              if (finishTime >= tenSecondsAgo) {
                // 显示通知
                notificationService.success(
                  `场景"${docker.scenarioName || '未知场景'}"的任务已完成`,
                  '任务完成通知',
                  docker.containerId
                )
              }
            }
          })
          
          // 更新上一次的Docker列表
          lastDockerList.value = [...result.data]
        }
      } catch (error) {
        console.error('轮询Docker状态失败:', error)
      }
    }
    
    // 启动轮询
    const startPolling = () => {
      if (pollingInterval.value) return
      
      // 立即执行一次，获取初始状态
      checkDockerStatus()
      
      // 设置10秒轮询间隔
      pollingInterval.value = setInterval(checkDockerStatus, 10000)
    }
    
    // 停止轮询
    const stopPolling = () => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
        pollingInterval.value = null
      }
    }
    
    onMounted(() => {
      // 初始化主题
      themeService.initTheme()
      startPolling()
    })
    
    onUnmounted(() => {
      stopPolling()
    })
    
    return {
      navItems,
      pageTitle,
      isActive,
      loading,
      loadingMessage,
      alertState,
      notificationState,
      closeAlert,
      closeNotification,
      toggleTheme,
      currentTheme,
      themeButtonTitle
    }
  }
}
</script>