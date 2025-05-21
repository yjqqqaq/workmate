<template>
  <div>
    <!-- 工具栏 -->
    <div class="flex justify-between items-center mb-5">
      <div>
        <button 
          @click="refreshList" 
          class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-custom transition-all duration-300 hover:bg-primary-dark"
        >
          <span class="mr-2">🔄</span>
          刷新列表
        </button>
      </div>
      <div class="flex gap-4">
        <div class="flex items-center">
          <label for="sortField" class="mr-2 text-sm">排序方式：</label>
          <select 
            id="sortField" 
            v-model="sortField"
            class="px-3 py-2 border border-borderColor rounded-custom text-sm"
          >
            <option value="createdAt">创建时间</option>
            <option value="status">状态</option>
            <option value="name">名称</option>
          </select>
        </div>
        <div class="flex items-center">
          <label for="sortDirection" class="mr-2 text-sm">排序顺序：</label>
          <select 
            id="sortDirection" 
            v-model="sortDirection"
            class="px-3 py-2 border border-borderColor rounded-custom text-sm"
          >
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>
    </div>
    
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
    
    <!-- 无数据状态 -->
    <div v-else-if="!dockerList.length" class="text-center py-10 bg-bgDark rounded-custom text-textLight italic">
      没有找到Docker容器记录
    </div>
    
    <!-- 数据表格 -->
    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse shadow-sm rounded-custom overflow-hidden">
        <thead>
          <tr class="bg-bgDark">
            <th class="p-4 text-left">场景名称</th>
            <th class="p-4 text-left">状态</th>
            <th class="p-4 text-left">创建时间</th>
            <th class="p-4 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="docker in sortedDockerList" 
            :key="docker.containerId"
            class="border-b border-borderColor hover:bg-primary/5 transition-colors duration-200"
          >
            <td class="p-4">{{ docker.scenarioName || '未知场景' }}</td>
            <td class="p-4">
              <span 
                :class="{
                  'text-green-600 font-bold': docker.status === 'running',
                  'text-red-600': docker.status === 'exited' && docker.exitStatus === 'Failure',
                  'text-green-600': docker.status === 'exited' && docker.exitStatus === 'Success',
                  'text-yellow-600': docker.status === 'created',
                  'text-blue-600': docker.status === 'paused'
                }"
              >
                {{ docker.status === 'exited' ? (docker.exitStatus || docker.status) : docker.status }}
              </span>
            </td>
            <td class="p-4">{{ formatDate(docker.createdAt) }}</td>
            <td class="p-4">
              <div class="flex gap-2">
                <button 
                  @click="viewDetails(docker.containerId)"
                  class="px-3 py-1 bg-primary text-white text-sm rounded-custom hover:bg-primary-dark"
                >
                  详情
                </button>
                <button 
                  v-if="docker.status === 'running'"
                  @click="changeState(docker.containerId, 'stop')"
                  class="px-3 py-1 bg-accent text-white text-sm rounded-custom hover:bg-red-700"
                >
                  停止
                </button>
                <button 
                  v-else-if="docker.status === 'exited' || docker.status === 'created'"
                  @click="changeState(docker.containerId, 'start')"
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded-custom hover:bg-green-700"
                >
                  启动
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import ApiClient from '../utils/api-client'
import { getUsername } from '../utils/storage'
import { parseYaml } from '../utils/yaml-parser'

export default {
  name: 'DockerList',
  emits: ['view-details'],
  setup(props, { emit }) {
    const dockerList = ref([])
    const loading = ref(false)
    const error = ref(null)
    const sortField = ref('createdAt')
    const sortDirection = ref('desc')
    
    const sortedDockerList = computed(() => {
      return [...dockerList.value].sort((a, b) => {
        let valueA = a[sortField.value]
        let valueB = b[sortField.value]
        
        // 处理日期比较
        if (sortField.value === 'createdAt') {
          valueA = new Date(valueA).getTime()
          valueB = new Date(valueB).getTime()
        }
        
        // 根据排序方向返回比较结果
        if (sortDirection.value === 'asc') {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })
    })
    
    const loadDockerList = async () => {
      const username = getUsername()
      if (!username) {
        error.value = '请先输入用户名'
        return
      }
      
      loading.value = true
      error.value = null
      
      try {
        const result = await ApiClient.getDockerList(username)
        if (result.success) {
          const dockerData = result.data || []
          
          // 创建一个场景ID到容器的映射，以便批量加载场景信息
          const scenarioIdMap = {}
          
          // 为每个容器加载场景名称
          for (const docker of dockerData) {
            if (docker.scenarioId) {
              if (!scenarioIdMap[docker.scenarioId]) {
                scenarioIdMap[docker.scenarioId] = []
              }
              scenarioIdMap[docker.scenarioId].push(docker)
            }
          }
          
          // 加载所有场景的YAML内容
          for (const scenarioId in scenarioIdMap) {
            try {
              const yamlContent = await ApiClient.getScenarioYaml(scenarioId)
              const scenarioData = parseYaml(yamlContent)
              
              // 更新所有使用此场景的容器的场景名称
              for (const docker of scenarioIdMap[scenarioId]) {
                docker.scenarioName = scenarioData.name || '未命名场景'
              }
            } catch (error) {
              console.error(`加载场景 ${scenarioId} 信息失败:`, error)
            }
          }
          
          dockerList.value = dockerData
        } else {
          error.value = result.error || '加载Docker列表失败'
        }
      } catch (err) {
        console.error('加载Docker列表失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const refreshList = () => {
      loadDockerList()
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      
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
    
    const viewDetails = (dockerId) => {
      emit('view-details', dockerId)
    }
    
    const changeState = async (dockerId, action) => {
      const username = getUsername()
      if (!username) {
        alert('请先输入用户名')
        return
      }
      
      try {
        const result = await ApiClient.changeDockerState(dockerId, action, username)
        if (result.success) {
          alert(`操作成功!`)
          // 刷新列表
          refreshList()
        } else {
          alert(`操作失败: ${result.error}`)
        }
      } catch (err) {
        console.error(`Docker操作失败 (${action}):`, err)
        alert(`操作失败: ${err.message}`)
      }
    }
    
    onMounted(() => {
      loadDockerList()
    })
    
    return {
      dockerList,
      loading,
      error,
      sortField,
      sortDirection,
      sortedDockerList,
      refreshList,
      formatDate,
      viewDetails,
      changeState
    }
  }
}
</script>