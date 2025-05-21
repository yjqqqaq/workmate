<template>
  <div>
    <!-- 用户表单部分 -->
    <UserForm 
      v-if="!username" 
      :initial-username="username"
      @submit="handleUserSubmit"
    />
    
    <!-- Scenario部分 -->
    <div v-else class="max-w-3xl mx-auto p-6 bg-bgLight rounded-custom shadow-custom">
      <h2 class="text-xl text-primary font-bold mb-5 pb-2 border-b border-borderColor flex items-center">
        <span class="mr-2">▶️</span>选择并运行Scenario
      </h2>
      
      <!-- Scenario选择器 -->
      <ScenarioSelector @change="handleScenarioChange" />
      
      <!-- Scenario详情 -->
      <ScenarioDetails v-if="selectedScenario" :scenario-id="selectedScenario" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import UserForm from '../components/UserForm.vue'
import ScenarioSelector from '../components/ScenarioSelector.vue'
import ScenarioDetails from '../components/ScenarioDetails.vue'
import { getUsername } from '../utils/storage'
import { saveFormState, getFormState } from '../store/formState'

export default {
  name: 'Home',
  components: {
    UserForm,
    ScenarioSelector,
    ScenarioDetails
  },
  setup() {
    // Get saved form state
    const savedState = getFormState('home')
    
    // Initialize with saved state or defaults
    const username = ref(savedState.username || '')
    const selectedScenario = ref(savedState.selectedScenario || '')
    
    const handleUserSubmit = (newUsername) => {
      username.value = newUsername
      // Save to form state
      saveFormState('home', { username: newUsername })
    }
    
    const handleScenarioChange = (scenarioId) => {
      selectedScenario.value = scenarioId
      // Save to form state
      saveFormState('home', { selectedScenario: scenarioId })
    }
    
    onMounted(() => {
      // If no saved username in form state, try from localStorage
      if (!username.value) {
        username.value = getUsername() || ''
        if (username.value) {
          saveFormState('home', { username: username.value })
        }
      }
    })
    
    // Save form state before navigating away
    onBeforeUnmount(() => {
      saveFormState('home', {
        username: username.value,
        selectedScenario: selectedScenario.value
      })
    })
    
    return {
      username,
      selectedScenario,
      handleUserSubmit,
      handleScenarioChange
    }
  }
}
</script>