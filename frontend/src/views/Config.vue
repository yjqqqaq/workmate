<template>
  <div>
    <!-- 用户表单部分 -->
    <UserForm 
      v-if="!username" 
      :initial-username="username"
      @submit="handleUserSubmit"
    />
    
    <div v-else class="max-w-3xl mx-auto">
      <!-- Scenario选择器 -->
      <div class="mb-6">
        <ScenarioSelector @change="handleScenarioChange" :selected-scenario="scenarioId" />
      </div>
      
      <!-- 配置表单部分 -->
      <div v-if="scenarioId">
        <ConfigForm :scenario-id="scenarioId" />
      </div>
      
      <!-- 全局配置部分 -->
      <div v-else class="mt-8">
        <ConfigForm scenario-id="global" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserForm from '../components/UserForm.vue'
import ConfigForm from '../components/ConfigForm.vue'
import ScenarioSelector from '../components/ScenarioSelector.vue'
import { getUsername } from '../utils/storage'
import { saveFormState, getFormState } from '../store/formState'

export default {
  name: 'Config',
  components: {
    UserForm,
    ConfigForm,
    ScenarioSelector
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Get saved form state
    const savedState = getFormState('config')
    
    // Initialize with saved state or defaults
    const username = ref(savedState.username || '')
    const scenarioId = ref(savedState.scenarioId || '')
    
    const handleUserSubmit = (newUsername) => {
      username.value = newUsername
      // Save to form state
      saveFormState('config', { username: newUsername })
    }
    
    const handleScenarioChange = (newScenarioId) => {
      scenarioId.value = newScenarioId
      // Save to form state
      saveFormState('config', { scenarioId: newScenarioId })
      
      // 更新URL参数
      router.replace({ 
        query: { 
          ...route.query, 
          scenario: newScenarioId 
        }
      })
    }
    
    onMounted(() => {
      // If no saved username in form state, try from localStorage
      if (!username.value) {
        username.value = getUsername() || ''
        if (username.value) {
          saveFormState('config', { username: username.value })
        }
      }
      
      // URL parameters take precedence over saved state
      const urlScenarioId = route.query.scenario
      if (urlScenarioId) {
        scenarioId.value = urlScenarioId
        saveFormState('config', { scenarioId: urlScenarioId })
      }
    })
    
    // Save form state before navigating away
    onBeforeUnmount(() => {
      saveFormState('config', {
        username: username.value,
        scenarioId: scenarioId.value
      })
    })
    
    return {
      username,
      scenarioId,
      handleUserSubmit,
      handleScenarioChange
    }
  }
}
</script>