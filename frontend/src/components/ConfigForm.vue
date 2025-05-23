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
    
    <!-- 全局配置表单 -->
    <form v-else-if="isGlobalConfig" @submit.prevent="saveConfig">
      <h2 class="text-xl text-primary font-bold mb-5 pb-2 border-b border-borderColor flex items-center">
        <span class="mr-2">⚙️</span>全局配置
      </h2>
      
      <!-- 默认LLM模型选择 -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label for="setting-DefaultLLMModel" class="block mb-2 font-bold">
          选择默认使用的大语言模型
          <span class="text-accent">*</span>
        </label>
        
        <select 
          id="setting-DefaultLLMModel"
          name="DefaultLLMModel"
          v-model="globalSettings.DefaultLLMModel"
          class="form-input"
        >
          <option value="gemini">Gemini</option>
          <option value="deepseek">DeepSeek</option>
          <option value="claude">Claude</option>
          <option value="aws_claude">AWS Claude</option>
        </select>
      </div>
      
      <!-- Gemini API Key -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label for="setting-GeminiApiKey" class="block mb-2 font-bold">
          Gemini模型的API密钥
        </label>
        
        <input 
          type="password"
          id="setting-GeminiApiKey"
          name="GeminiApiKey"
          placeholder="输入Gemini API Key"
          v-model="globalSettings.GeminiApiKey"
          class="form-input"
        >
      </div>
      
      <!-- DeepSeek API Key -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label for="setting-DeepSeekApiKey" class="block mb-2 font-bold">
          DeepSeek模型的API密钥
        </label>
        
        
        <input 
          type="password"
          id="setting-DeepSeekApiKey"
          name="DeepSeekApiKey"
          placeholder="输入DeepSeek API Key"
          v-model="globalSettings.DeepSeekApiKey"
          class="form-input"
        >
      </div>
      
      <!-- Claude API Key -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label for="setting-ClaudeApiKey" class="block mb-2 font-bold">
          Claude模型的API密钥
        </label>
        
        
        <input 
          type="password"
          id="setting-ClaudeApiKey"
          name="ClaudeApiKey"
          placeholder="输入Claude API Key"
          v-model="globalSettings.ClaudeApiKey"
          class="form-input"
        >
      </div>
      
      <!-- AWS Claude Credentials -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label class="block mb-4 font-bold">
          AWS Claude模型的认证信息
        </label>
        
        <div class="mb-3">
          <label for="setting-AwsAccessKeyId" class="block mb-1">
            AWS Access Key ID
          </label>
          <input 
            type="password"
            id="setting-AwsAccessKeyId"
            name="AwsAccessKeyId"
            placeholder="输入AWS Access Key ID"
            v-model="globalSettings.AwsAccessKeyId"
            class="form-input"
          >
        </div>
        
        <div class="mb-3">
          <label for="setting-AwsSecretAccessKey" class="block mb-1">
            AWS Secret Access Key
          </label>
          <input 
            type="password"
            id="setting-AwsSecretAccessKey"
            name="AwsSecretAccessKey"
            placeholder="输入AWS Secret Access Key"
            v-model="globalSettings.AwsSecretAccessKey"
            class="form-input"
          >
        </div>
        
        <div>
          <label for="setting-AwsRegion" class="block mb-1">
            AWS Region
          </label>
          <input 
            type="text"
            id="setting-AwsRegion"
            name="AwsRegion"
            placeholder="例如: us-east-1"
            v-model="globalSettings.AwsRegion"
            class="form-input"
          >
        </div>
      </div>
      
      <!-- Backend Host -->
      <div class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary">
        <label for="setting-BackendHost" class="block mb-2 font-bold">
          后端服务器地址
          <span class="text-accent">*</span>
        </label>
        
        <input 
          type="text"
          id="setting-BackendHost"
          name="BackendHost"
          placeholder="例如: http://localhost:4000"
          v-model="globalSettings.BackendHost"
          class="form-input"
        >
      </div>
      
      <button type="submit" class="btn">
        <span class="mr-2">💾</span>保存全局配置
      </button>
    </form>
    
    <!-- 场景配置表单 -->
    <form v-else @submit.prevent="saveConfig">
      <h2 class="text-xl text-primary font-bold mb-5 pb-2 border-b border-borderColor flex items-center">
        <span class="mr-2">⚙️</span>{{ scenarioData ? scenarioData.name || '场景配置' : '加载中...' }}
      </h2>
      
      <div v-if="scenarioData && scenarioData.description" class="mb-6 text-textColor">
        {{ scenarioData.description }}
      </div>
      
      <div v-if="scenarioData && scenarioData.settings" id="settings-container">
        <div 
          v-for="setting in scenarioData.settings" 
          :key="setting.name"
          class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary"
        >
          <label :for="`setting-${setting.name}`" class="block mb-2 font-bold">
            {{ setting.description }}
            <span v-if="setting.required === 'true'" class="text-accent">*</span>
          </label>
          
          <!-- 文本框 -->
          <input 
            v-if="!setting.type || setting.type === 'text'"
            :type="setting.type || 'text'"
            :id="`setting-${setting.name}`"
            :name="setting.name"
            :placeholder="setting.placeholder || ''"
            v-model="settingsValues[setting.name]"
            class="form-input"
          >
          
          <!-- 文本区域 -->
          <textarea 
            v-else-if="setting.type === 'textarea'"
            :id="`setting-${setting.name}`"
            :name="setting.name"
            :placeholder="setting.placeholder || ''"
            v-model="settingsValues[setting.name]"
            class="form-input min-h-[120px] resize-y"
          ></textarea>
          
          <!-- 下拉选择 -->
          <select 
            v-else-if="setting.type === 'select'"
            :id="`setting-${setting.name}`"
            :name="setting.name"
            v-model="settingsValues[setting.name]"
            class="form-input"
          >
            <option 
              v-for="option in getOptions(setting.options)" 
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          
          <!-- 数字输入 -->
          <input 
            v-else-if="setting.type === 'number'"
            type="number"
            :id="`setting-${setting.name}`"
            :name="setting.name"
            :min="setting.min"
            :max="setting.max"
            :step="setting.step || 1"
            v-model.number="settingsValues[setting.name]"
            class="form-input"
          >
          
          <!-- 复选框 -->
          <div v-else-if="setting.type === 'checkbox'" class="flex items-center">
            <input 
              type="checkbox"
              :id="`setting-${setting.name}`"
              :name="setting.name"
              v-model="settingsValues[setting.name]"
              class="w-5 h-5 text-primary focus:ring-primary border-borderColor rounded"
            >
            <label :for="`setting-${setting.name}`" class="ml-2">
              {{ setting.label || '启用' }}
            </label>
          </div>
        </div>
      </div>
      
      <div v-else class="py-6 text-center text-textLight italic">
        此场景没有可配置的设置项
      </div>
      
      <button type="submit" class="btn">
        <span class="mr-2">💾</span>保存配置
      </button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import ApiClient from '../utils/api-client'
import { parseYaml } from '../utils/yaml-parser'
import { getUsername, getData, saveData, getGlobalConfig, saveGlobalConfig } from '../utils/storage'
import { saveFormState, getFormState } from '../store/formState'

export default {
  name: 'ConfigForm',
  props: {
    scenarioId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // Get saved form state
    const savedState = getFormState('config')
    
    const scenarioData = ref(null)
    const settingsValues = ref(savedState.settingsValues || {})
    const globalSettings = ref(savedState.globalSettings || {
      DefaultLLMModel: 'gemini',
      GeminiApiKey: '',
      DeepSeekApiKey: '',
      ClaudeApiKey: '',
      AwsAccessKeyId: '',
      AwsSecretAccessKey: '',
      AwsRegion: 'us-east-1',
      BackendHost: 'http://localhost:4000'
    })
    const loading = ref(false)
    const error = ref(null)
    
    // 判断是否为全局配置
    const isGlobalConfig = computed(() => props.scenarioId === 'global')
    
    
    const loadScenarioConfig = async () => {
      if (isGlobalConfig.value) {
        // 加载全局配置
        loading.value = true
        try {
          // 使用getGlobalConfig获取持久化的全局配置
          const config = getGlobalConfig();
          
          // 将标准格式的配置映射到表单字段
          globalSettings.value = {
            DefaultLLMModel: config.DEFAULT_LLM || 'gemini',
            GeminiApiKey: config.GEMINI_API_KEY || '',
            DeepSeekApiKey: config.DEEPSEEK_API_KEY || '',
            ClaudeApiKey: config.CLAUDE_API_KEY || '',
            AwsAccessKeyId: config.AWS_ACCESS_KEY_ID || '',
            AwsSecretAccessKey: config.AWS_SECRET_ACCESS_KEY || '',
            AwsRegion: config.AWS_REGION || 'us-east-1',
            BackendHost: config.BACKEND_HOST || 'http://localhost:4000'
          };
        } catch (err) {
          console.error('加载全局配置失败:', err)
          error.value = err.message
        } finally {
          loading.value = false
        }
        return
      }
      
      // 加载场景配置
      loading.value = true
      error.value = null
      
      try {
        const yamlContent = await ApiClient.getScenarioYaml(props.scenarioId)
        scenarioData.value = parseYaml(yamlContent)
        
        // 初始化设置值
        if (scenarioData.value && scenarioData.value.settings) {
          for (const setting of scenarioData.value.settings) {
            settingsValues.value[setting.name] = setting.defaultValue || ''
          }
        }
        
        // 尝试加载用户保存的设置
        const username = getUsername()
        if (username) {
          try {
            const userSettings = await ApiClient.getUserSettings(username, props.scenarioId)
            if (userSettings) {
              // 合并用户设置
              settingsValues.value = { ...settingsValues.value, ...userSettings.value }
            }
          } catch (err) {
            console.warn('加载用户设置失败:', err)
            // 继续使用默认值
          }
        }
      } catch (err) {
        console.error('加载场景配置失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const getOptions = (optionsString) => {
      if (!optionsString) return []
      return optionsString.split(',').map(option => option.trim())
    }
    
    const saveConfig = async () => {
      const username = getUsername()
      if (!username) {
        alert('请先输入用户名')
        return
      }
      
      loading.value = true
      
      if (isGlobalConfig.value) {
        // 保存全局配置
        try {
          // 将表单字段映射到标准格式的配置
          const config = {
            DEFAULT_LLM: globalSettings.value.DefaultLLMModel,
            CLAUDE_API_KEY: globalSettings.value.ClaudeApiKey,
            DEEPSEEK_API_KEY: globalSettings.value.DeepSeekApiKey,
            GEMINI_API_KEY: globalSettings.value.GeminiApiKey,
            AWS_ACCESS_KEY_ID: globalSettings.value.AwsAccessKeyId,
            AWS_SECRET_ACCESS_KEY: globalSettings.value.AwsSecretAccessKey,
            AWS_REGION: globalSettings.value.AwsRegion,
            BACKEND_HOST: globalSettings.value.BackendHost
          };
          
          // 使用saveGlobalConfig保存配置
          saveGlobalConfig(config);
          alert('全局配置保存成功');
        } catch (err) {
          console.error('保存全局配置失败:', err)
          alert(`保存失败: ${err.message}`)
        } finally {
          loading.value = false
        }
        return
      }
      
      // 保存场景配置
      try {
        const result = await ApiClient.saveUserSettings(
          username, 
          props.scenarioId, 
          settingsValues.value
        )
        
        if (result.success) {
          alert('配置保存成功')
        } else {
          alert(`保存失败: ${result.error}`)
        }
      } catch (err) {
        console.error('保存配置失败:', err)
        alert(`保存失败: ${err.message}`)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      loadScenarioConfig()
    })

    watch(() => props.scenarioId, (newId) => {
      loadScenarioConfig() ;
    })
    
    // Watch for changes in form values and save to form state
    watch(settingsValues, (newValues) => {
      saveFormState('config', { settingsValues: newValues })
    }, { deep: true })
    
    watch(globalSettings, (newValues) => {
      saveFormState('config', { globalSettings: newValues })
    }, { deep: true })
    
    return {
      scenarioData,
      settingsValues,
      globalSettings,
      loading,
      error,
      isGlobalConfig,
      getOptions,
      saveConfig
    }
  }
}
</script>