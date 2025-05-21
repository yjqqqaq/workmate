<template>
  <div>
    <!-- 加载中状态 -->
    <div v-if="loading" class="text-center py-8 flex flex-col items-center">
      <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <div class="text-textLight">正在加载数据...</div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="p-4 bg-accent/10 border-l-4 border-accent rounded-custom text-accent flex items-start gap-3">
      <span class="text-xl">⚠️</span>
      <div>{{ error }}</div>
    </div>
    
    <!-- 详情内容 -->
    <div v-else-if="dockerDetails" class="bg-bgLight rounded-custom shadow-custom">
      <!-- 操作按钮部分 -->
      <div class="p-6 border-b border-borderColor">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <h3 class="text-lg text-primary font-bold flex items-center">
              <span class="mr-2">🔧</span>操作
            </h3>
            <!-- 轮询间隔配置移到这里 -->
            <div class="ml-6 flex items-center">
              <div class="font-bold text-textColor mr-2">轮询间隔 (秒):</div>
              <input 
                v-model.number="pollingInterval" 
                type="number" 
                min="2" 
                max="60" 
                class="w-24 px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <button 
              v-if="dockerDetails.status === 'running'"
              @click="changeState('stop')"
              class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="停止"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <rect x="6" y="6" width="8" height="8" />
              </svg>
            </button>
            <button 
              v-else-if="dockerDetails.status === 'exited' || dockerDetails.status === 'created'"
              @click="changeState('start')"
              class="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              title="启动"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 5v10l8-5-8-5z" />
              </svg>
            </button>
            <button 
              v-if="dockerDetails.status === 'running'"
              @click="changeState('restart')"
              class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="重启"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
            </button>
            <button 
              v-if="dockerDetails.status === 'running'"
              @click="changeState('pause')"
              class="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
              title="暂停"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
            <button 
              v-if="dockerDetails.status === 'paused'"
              @click="changeState('unpause')"
              class="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              title="恢复"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            </button>
            <button 
              @click="changeState('remove')"
              class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="删除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 基本信息部分 -->
      <div class="p-6 border-b border-borderColor">
        <h3 class="text-lg text-primary font-bold mb-4 flex items-center">
          <span class="mr-2">📋</span>基本信息
        </h3>
        <div class="space-y-3">
          <div class="flex">
            <div class="font-bold w-36 text-textColor">所属场景:</div>
            <div class="flex-1 break-words">{{ dockerDetails.scenarioName || '未知' }}</div>
          </div>
          <div class="flex">
            <div class="font-bold w-36 text-textColor">创建时间:</div>
            <div class="flex-1 break-words">{{ formatDate(dockerDetails.createdAt) }}</div>
          </div>
          <div class="flex">
            <div class="font-bold w-36 text-textColor">启动时间:</div>
            <div class="flex-1 break-words">{{ formatDate(dockerDetails.startedAt) }}</div>
          </div>
          <div class="flex">
            <div class="font-bold w-36 text-textColor">状态:</div>
            <div 
              class="flex-1 break-words font-bold"
              :class="{
                'text-green-600': dockerDetails.status === 'running',
                'text-red-600': dockerDetails.status === 'exited' && dockerDetails.exitStatus === 'Failure',
                'text-green-600': dockerDetails.status === 'exited' && dockerDetails.exitStatus === 'Success',
                'text-yellow-600': dockerDetails.status === 'created',
                'text-blue-600': dockerDetails.status === 'paused'
              }"
            >
              {{ dockerDetails.status === 'exited' 
                ? `${dockerDetails.exitStatus} (Exit Code: ${dockerDetails.exitCode})` 
                : dockerDetails.status }}
            </div>
          </div>
        </div>
      </div>
      

      
      <!-- 日志部分 -->
      <div class="p-6 border-b border-borderColor">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <h3 class="text-lg text-primary font-bold flex items-center">
              <span class="mr-2">📝</span>日志
            </h3>
            <button 
              @click="toggleLogs" 
              class="ml-3 text-sm text-primary hover:text-primary-dark"
            >
              {{ showLogs ? '收起' : '展开' }}
            </button>
          </div>
          <button 
            @click="refreshLogs"
            class="px-3 py-1 bg-primary text-white text-sm rounded-custom hover:bg-primary-dark"
          >
            刷新日志
          </button>
        </div>
        
        <div v-if="showLogs" class="bg-white rounded-custom overflow-hidden border border-borderColor">
          <div v-if="logsLoading" class="p-4 text-center text-gray-400">
            加载日志中...
          </div>
          <div v-else-if="logsError" class="p-4 text-center text-red-400">
            {{ logsError }}
          </div>
          <div v-else-if="logs" class="max-h-96 overflow-y-auto">
            <ConsoleOutput :content="logs" />
          </div>
        </div>
      </div>
      
      <!-- Docker输出部分 -->
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <h3 class="text-lg text-primary font-bold flex items-center">
              <span class="mr-2">📊</span>Docker输出
            </h3>
            <button 
              @click="toggleOutput" 
              class="ml-3 text-sm text-primary hover:text-primary-dark"
            >
              {{ showOutput ? '收起' : '展开' }}
            </button>
          </div>
          <button 
            @click="refreshOutput"
            class="px-3 py-1 bg-primary text-white text-sm rounded-custom hover:bg-primary-dark"
          >
            刷新输出
          </button>
        </div>
        
        <div v-if="showOutput" class="bg-white rounded-custom overflow-hidden border border-borderColor">
          <div v-if="outputLoading" class="p-4 text-center text-gray-400">
            加载输出中...
          </div>
          <div v-else-if="outputError" class="p-4 text-center text-red-400">
            {{ outputError }}
          </div>
          <div v-else-if="dockerOutput" class="p-4">
            <!-- 根据scenario的outputs属性显示输出 -->
            <div v-if="typeof dockerOutput === 'object' && dockerOutput !== null" class="space-y-4">
              <!-- 显示outputs中定义的字段 -->
              <div v-for="(value, key) in filteredOutputs" :key="key" class="bg-white p-3 rounded-md border border-borderColor">
                <div class="font-bold text-textColor mb-1">{{ getOutputLabel(key) }}</div>
                <div class="bg-white p-2 rounded break-words border border-borderColor">
                  <!-- 处理链接类型 -->
                  <a v-if="isLink(value)" :href="value" target="_blank" rel="noopener noreferrer" 
                     class="text-blue-500 hover:text-blue-400 underline font-bold">
                    {{ value }}
                  </a>
                  <!-- 处理对象类型 -->
                  <div v-else-if="typeof value === 'object'">
                    <ConsoleOutput :content="JSON.stringify(value, null, 2)" />
                  </div>
                  <!-- 处理普通文本 -->
                  <div v-else class="text-black">{{ value }}</div>
                </div>
              </div>
              
              <!-- 显示其他字段（不在outputs中定义的） -->
              <div v-if="Object.keys(otherOutputs).length > 0" class="bg-white p-3 rounded-md border border-borderColor">
                <div class="font-bold text-textColor mb-1">其他信息</div>
                <div class="bg-white p-2 rounded break-words border border-borderColor">
                  <ConsoleOutput :content="JSON.stringify(otherOutputs, null, 2)" />
                </div>
              </div>
            </div>
            <!-- 如果输出是字符串，则直接展示 -->
            <div v-else class="max-h-96 overflow-y-auto">
              <ConsoleOutput :content="dockerOutput" />
            </div>
          </div>
          <div v-else class="p-4 text-center text-gray-400">
            暂无输出数据
          </div>
        </div>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="mt-6">
      <button @click="goBack" class="btn btn-secondary">
        <span class="mr-2">⬅️</span>返回列表
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import ApiClient from '../utils/api-client'
import { getUsername } from '../utils/storage'
import { parseYaml } from '../utils/yaml-parser'
import ConsoleOutput from './ConsoleOutput.vue'

export default {
  name: 'DockerDetails',
  components: {
    ConsoleOutput
  },
  props: {
    dockerId: {
      type: String,
      required: true
    }
  },
  emits: ['back'],
  setup(props, { emit }) {
    const dockerDetails = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const logs = ref(null)
    const logsLoading = ref(false)
    const logsError = ref(null)
    const dockerOutput = ref(null)
    const outputLoading = ref(false)
    const outputError = ref(null)
    const scenarioData = ref(null)
    const scenarioLoading = ref(false)
    const showLogs = ref(false)
    const showOutput = ref(true) // 默认展开输出
    const scenarioOutputFields = ref([])
    
    // 轮询配置
    const pollingInterval = ref(10) // 默认10秒
    
    // 轮询定时器
    const pollingTimer = ref(null)
    
    // 根据scenario的outputs字段过滤输出
    const filteredOutputs = computed(() => {
      if (!dockerOutput.value || typeof dockerOutput.value !== 'object' || !scenarioOutputFields.value.length) {
        return dockerOutput.value || {}
      }
      
      const result = {}
      scenarioOutputFields.value.forEach(field => {
        if (dockerOutput.value.hasOwnProperty(field)) {
          result[field] = dockerOutput.value[field]
        }
      })
      
      return result
    })
    
    // 其他输出字段（不在outputs中定义的）
    const otherOutputs = computed(() => {
      if (!dockerOutput.value || typeof dockerOutput.value !== 'object' || !scenarioOutputFields.value.length) {
        return {}
      }
      
      const result = {}
      Object.keys(dockerOutput.value).forEach(key => {
        if (!scenarioOutputFields.value.includes(key)) {
          result[key] = dockerOutput.value[key]
        }
      })
      
      return result
    })
    
    // 获取输出字段的显示标签
    const getOutputLabel = (fieldName) => {
      if (!scenarioData.value || !scenarioData.value.outputs) return fieldName
      
      const outputField = scenarioData.value.outputs.find(output => output.name === fieldName)
      return outputField ? outputField.label || fieldName : fieldName
    }
    
    // 切换日志显示状态
    const toggleLogs = () => {
      showLogs.value = !showLogs.value
    }
    
    // 切换输出显示状态
    const toggleOutput = () => {
      showOutput.value = !showOutput.value
    }
    
    // 启动或停止轮询
    const setupPolling = () => {
      // 清除现有的轮询
      clearPolling()
      
      // 只有当容器状态为 running 时才启用轮询
      if (dockerDetails.value && dockerDetails.value.status !== 'running') {
        return
      }
      
      // 设置新的轮询
      const intervalMs = Math.max((pollingInterval.value || 2) * 1000, 2000) ; 
      
      // 设置轮询 - 同时轮询所有内容
      pollingTimer.value = setInterval(() => {
        loadDockerDetails(false) // 更新状态
        loadLogs(false)     // 更新日志
        loadOutput(false)   // 更新输出
      }, intervalMs)
    }
    
    // 清除所有轮询
    const clearPolling = () => {
      if (pollingTimer.value) {
        clearInterval(pollingTimer.value)
        pollingTimer.value = null
      }
    }
    
    const loadDockerDetails = async (isManualRefresh = true) => {
      
      if (isManualRefresh) {
        loading.value = true
      }
      error.value = null
      
      try {
        // 获取Docker基本状态信息
        const statusResult = await ApiClient.getDockerStatus(props.dockerId)
        
        if (!statusResult.success) {
          error.value = statusResult.error || '加载Docker详情失败'
          return
        }
        
        // 合并状态信息和Redis信息
        dockerDetails.value = statusResult.data
        
        // 如果有scenarioId，加载scenario信息
        if (dockerDetails.value.scenarioId && !scenarioData.value) {
          loadScenarioData(dockerDetails.value.scenarioId)
        }
      } catch (err) {
        console.error('加载Docker详情失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    // 加载scenario数据
    const loadScenarioData = async (scenarioId) => {
      if (!scenarioId) return
      
      scenarioLoading.value = true
      
      try {
        const yamlContent = await ApiClient.getScenarioYaml(scenarioId)
        scenarioData.value = parseYaml(yamlContent)
        
        // 提取outputs字段名
        if (scenarioData.value && scenarioData.value.outputs) {
          scenarioOutputFields.value = scenarioData.value.outputs.map(output => output.name)
        }
      } catch (err) {
        console.error('加载Scenario信息失败:', err)
      } finally {
        scenarioLoading.value = false
      }
    }
    
    const loadLogs = async (isManualRefresh = true) => {
      // 只有手动刷新时才显示加载状态
      if (isManualRefresh) {
        logsLoading.value = true
      }
      logsError.value = null
      
      try {
        const result = await ApiClient.getDockerLogs(props.dockerId)
        if (result.success) {
          logs.value = result.data
        }
        else {
          logsError.value = result.error 
        }
      } catch (err) {
        console.error('加载Docker日志失败:', err)
        logsError.value = err.message
      } finally {
        // 只有手动刷新时才重置加载状态
        if (isManualRefresh) {
          logsLoading.value = false
        }
      }
    }
    
    const loadOutput = async (isManualRefresh = true) => {
      // 只有手动刷新时才显示加载状态
      if (isManualRefresh) {
        outputLoading.value = true
      }
      outputError.value = null
      
      try {
        const result = await ApiClient.getDockerOutput(props.dockerId)
        if (result.success) {
          dockerOutput.value = result.data
        } else {
          outputError.value = result.error || '加载Docker输出失败'
        }
      } catch (err) {
        console.error('加载Docker输出失败:', err)
        outputError.value = err.message
      } finally {
        // 只有手动刷新时才重置加载状态
        if (isManualRefresh) {
          outputLoading.value = false
        }
      }
    }
    
    const refreshLogs = () => {
      loadLogs(true) // 手动刷新，显示加载状态
    }
    
    const refreshOutput = () => {
      loadOutput(true) // 手动刷新，显示加载状态
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    const changeState = async (action) => {
      const username = getUsername()
      if (!username) {
        alert('请先输入用户名')
        return
      }
      
      if (action === 'remove' && !confirm('确定要删除此Docker容器吗？此操作不可撤销。')) {
        return
      }
      
      try {
        const result = await ApiClient.changeDockerState(props.dockerId, action, username)
        if (result.success) {
          alert(`操作成功: ${action}`)
          
          if (action === 'remove') {
            goBack()
          } else {
            // 刷新详情、日志和输出
            loadDockerDetails()
            loadLogs()
            loadOutput()
          }
        } else {
          alert(`操作失败: ${result.error}`)
        }
      } catch (err) {
        console.error(`Docker操作失败 (${action}):`, err)
        alert(`操作失败: ${err.message}`)
      }
    }
    
    const goBack = () => {
      emit('back')
    }
    
    /**
     * 判断值是否为链接
     * @param {any} value - 要检查的值
     * @returns {boolean} - 是否为链接
     */
    const isLink = (value) => {
      if (typeof value !== 'string') return false
      
      // 检查是否为URL格式
      const urlPattern = /^(https?:\/\/|www\.)[^\s$.?#].[^\s]*$/i
      return urlPattern.test(value)
    }
    
    /**
     * 将文本中的URL转换为可点击的链接
     * @param {string} text - 要处理的文本
     * @returns {string} - 处理后的HTML
     */
    const formatTextWithLinks = (text) => {
      if (typeof text !== 'string') return text
      
      // URL正则表达式
      const urlRegex = /(https?:\/\/[^\s]+)/g
      
      // 将URL替换为HTML链接
      return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline font-bold">${url}</a>`
      })
    }
    
    onMounted(async () => {
      await loadDockerDetails()
      loadLogs()
      loadOutput()
      
      // 初始化时根据容器状态设置展开状态
      if (dockerDetails.value) {
        if (dockerDetails.value.status === 'running') {
          showLogs.value = true
          showOutput.value = false
        } else {
          showLogs.value = false
          showOutput.value = true
        }
      }
      
      // 初始化轮询
      setupPolling()
    })
    
    // 当Docker输出更新时，自动展开输出区域
    watch(dockerOutput, (newValue) => {
      if (newValue && typeof newValue === 'object' && Object.keys(newValue).length > 0) {
        showOutput.value = true
      }
    })
    
    // 监听轮询间隔变化
    watch(pollingInterval, () => {
      setupPolling()
    })
    
    // 监听容器状态变化
    watch(() => dockerDetails.value?.status, (newStatus) => {
      // 状态变化时重新设置轮询
      setupPolling()
      
      // 根据状态自动展开不同内容
      if (newStatus === 'running') {
        showLogs.value = true
        showOutput.value = false
      } else {
        showLogs.value = false
        showOutput.value = true
      }
    })
    
    // 组件卸载前清除所有轮询
    onBeforeUnmount(() => {
      clearPolling()
    })
    
    return {
      dockerDetails,
      loading,
      error,
      logs,
      logsLoading,
      logsError,
      dockerOutput,
      outputLoading,
      outputError,
      scenarioData,
      showLogs,
      showOutput,
      filteredOutputs,
      otherOutputs,
      pollingInterval,
      formatDate,
      refreshLogs,
      refreshOutput,
      changeState,
      goBack,
      isLink,
      formatTextWithLinks,
      toggleLogs,
      toggleOutput,
      getOutputLabel
    }
  }
}
</script>