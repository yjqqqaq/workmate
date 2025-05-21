<template>
  <section class="max-w-md mx-auto p-6 bg-bgLight rounded-custom shadow-custom">
    <h2 class="text-xl text-primary font-bold mb-5 pb-2 border-b border-borderColor flex items-center">
      <span class="mr-2">👤</span>请输入您的用户名
    </h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="username" class="form-label">用户名：</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          placeholder="请输入您的用户名"
          class="form-input"
        >
        <div class="error-message">{{ errorMessage }}</div>
      </div>
      <button type="submit" class="btn">
        <span class="mr-2">🔍</span>确认
      </button>
    </form>
  </section>
</template>

<script>
import { ref } from 'vue'
import { saveUsername } from '../utils/storage'

export default {
  name: 'UserForm',
  props: {
    initialUsername: {
      type: String,
      default: ''
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const username = ref(props.initialUsername || '')
    const errorMessage = ref('')
    
    const validateForm = () => {
      errorMessage.value = ''
      
      if (!username.value || username.value.trim() === '') {
        errorMessage.value = '用户名不能为空！'
        return false
      }
      
      return true
    }
    
    const submitForm = () => {
      if (validateForm()) {
        // 保存用户名到localStorage
        saveUsername(username.value)
        
        // 触发提交事件
        emit('submit', username.value)
      }
    }
    
    return {
      username,
      errorMessage,
      submitForm
    }
  }
}
</script>