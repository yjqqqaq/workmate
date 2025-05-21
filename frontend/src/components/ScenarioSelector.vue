<template>
  <div class="form-group">
    <label for="scenarioSelect" class="form-label">选择Scenario：</label>
    <select 
      id="scenarioSelect" 
      v-model="selectedScenario"
      class="form-input"
      @change="handleScenarioChange"
    >
      <option :key="global" :value="global">
        -- 全局配置 --
      </option>
      <option 
        v-for="scenario in scenarios" 
        :key="scenario.id" 
        :value="scenario.id"
      >
        {{ scenario.name }}
      </option>
    </select>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import ApiClient from '../utils/api-client'

export default {
  name: 'ScenarioSelector',
  props: {
    selectedScenario: {
      type: String,
      default: ''
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const scenarios = ref([])
    const internalSelectedScenario = ref(props.selectedScenario || '')
    const loading = ref(false)
    const error = ref(null)
    
    const loadScenarios = async () => {
      loading.value = true
      error.value = null
      
      try {
        const data = await ApiClient.getScenarios() 
        scenarios.value = data 
      } catch (err) {
        console.error('加载Scenario列表失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const handleScenarioChange = () => {
      emit('change', internalSelectedScenario.value)
    }
    
    // 监听props变化，同步到内部状态
    watch(() => props.selectedScenario, (newValue) => {
      internalSelectedScenario.value = newValue
    })
    
    onMounted(() => {
      loadScenarios()
    })
    
    return {
      scenarios,
      selectedScenario: internalSelectedScenario,
      loading,
      error,
      handleScenarioChange
    }
  }
}
</script>