<template>
  <div>
    <!-- 用户表单部分 -->
    <UserForm 
      v-if="!username" 
      :initial-username="username"
      @submit="handleUserSubmit"
    />
    
    <!-- Docker历史部分 -->
    <div v-else>
      <!-- Docker列表 -->
      <div v-if="!selectedDockerId" class="max-w-5xl mx-auto">
        <DockerList @view-details="viewDockerDetails" />
      </div>
      
      <!-- Docker详情 -->
      <div v-else class="max-w-5xl mx-auto">
        <DockerDetails 
          :docker-id="selectedDockerId"
          @back="backToList"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import UserForm from '../components/UserForm.vue'
import DockerList from '../components/DockerList.vue'
import DockerDetails from '../components/DockerDetails.vue'
import { getUsername } from '../utils/storage'
import { saveFormState, getFormState } from '../store/formState'

export default {
  name: 'History',
  components: {
    UserForm,
    DockerList,
    DockerDetails
  },
  setup() {
    // Get saved form state
    const savedState = getFormState('history')
    
    // Initialize with saved state or defaults
    const username = ref(savedState.username || '')
    const selectedDockerId = ref(savedState.selectedDockerId || '')
    
    const handleUserSubmit = (newUsername) => {
      username.value = newUsername
      // Save to form state
      saveFormState('history', { username: newUsername })
    }
    
    const viewDockerDetails = (dockerId) => {
      selectedDockerId.value = dockerId
      // Save to form state
      saveFormState('history', { selectedDockerId: dockerId })
    }
    
    const backToList = () => {
      selectedDockerId.value = ''
      // Update form state
      saveFormState('history', { selectedDockerId: '' })
    }
    
    onMounted(() => {
      // If no saved username in form state, try from localStorage
      if (!username.value) {
        username.value = getUsername() || ''
        if (username.value) {
          saveFormState('history', { username: username.value })
        }
      }
    })
    
    // Save form state before navigating away
    onBeforeUnmount(() => {
      saveFormState('history', {
        username: username.value,
        selectedDockerId: selectedDockerId.value
      })
    })
    
    return {
      username,
      selectedDockerId,
      handleUserSubmit,
      viewDockerDetails,
      backToList
    }
  }
}
</script>