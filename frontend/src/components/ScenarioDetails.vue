<template>
  <div>
    <!-- 描述部分 -->
    <div 
      v-if="scenarioData && scenarioData.description" 
      class="my-5 p-4 bg-bgDark rounded-custom italic text-textColor border-l-4 border-primary"
    >
      {{ scenarioData.description }}
    </div>
    
    <!-- Popup设置部分 -->
    <div 
      v-if="hasPopupSettings" 
      class="my-5 p-5 bg-primary/10 border-l-4 border-primary rounded-custom"
    >
      <div 
        v-for="setting in popupSettings" 
        :key="setting.name"
        class="popup-setting"
      >
        <h3 class="text-lg font-bold">{{ setting.description }}</h3>
        
        <p>{{ setting.defaultValue || '' }}</p>
      </div>
    </div>
    
    <!-- 输入表单部分 -->
    <div class="my-6">
      <div v-if="!scenarioData || !scenarioData.inputs || scenarioData.inputs.length === 0">
        <p>此Scenario没有需要填写的输入项</p>
      </div>
      
      <div v-else>
        <div 
          v-for="input in scenarioData.inputs" 
          :key="input.name"
          class="mb-6 p-5 border border-borderColor rounded-custom bg-bgLight transition-all duration-300 hover:shadow-md hover:border-primary"
        >
          <label :for="`input-${input.name}`" class="block mb-2 font-bold">
            {{ input.label || input.name }}
            <span v-if="input.required === 'true'" class="text-accent">*</span>
          </label>
          
          <!-- 文本框 -->
          <input 
            v-if="!input.type || input.type === 'text'"
            :type="input.type || 'text'"
            :id="`input-${input.name}`"
            :name="input.name"
            :placeholder="input.placeholder || ''"
            v-model="inputValues[input.name]"
            class="form-input"
          >
          
          <!-- 文本区域 -->
          <textarea 
            v-else-if="input.type === 'textarea'"
            :id="`input-${input.name}`"
            :name="input.name"
            :placeholder="input.placeholder || ''"
            v-model="inputValues[input.name]"
            class="form-input min-h-[120px] resize-y"
          ></textarea>
          
          <!-- 文件选择 -->
          <div 
            v-else-if="input.type === 'file'"
            class="flex flex-col"
          >
            <label 
              :for="`input-${input.name}`"
              class="inline-flex items-center px-5 py-2 bg-primary text-white rounded-custom cursor-pointer mb-2 transition-all duration-300 hover:bg-primary-dark hover:shadow-md hover:-translate-y-0.5 shadow-sm"
            >
              选择文件
            </label>
            <input 
              type="file"
              :id="`input-${input.name}`"
              :name="input.name"
              class="hidden"
              @change="handleFileChange($event, input.name)"
            >
            <div class="mt-2 text-sm text-textLight">
              {{ fileNames[input.name] || '未选择文件' }}
            </div>
          </div>
          
          <!-- 下拉选择 -->
          <select 
            v-else-if="input.type === 'select'"
            :id="`input-${input.name}`"
            :name="input.name"
            v-model="inputValues[input.name]"
            class="form-input"
          >
            <option 
              v-for="option in getOptions(input.options)" 
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 按钮组 -->
    <div class="flex justify-between mt-8 gap-4">
      <button 
        @click="runScenario" 
        class="btn btn-primary"
      >
        <span class="mr-2">▶️</span>运行
      </button>
      <button 
        @click="goToConfig" 
        class="btn btn-secondary"
      >
        <span class="mr-2">⚙️</span>配置
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import ApiClient from '../utils/api-client'
import { parseYaml } from '../utils/yaml-parser'
import { getUsername, getGlobalConfig } from '../utils/storage'

export default {
  name: 'ScenarioDetails',
  props: {
    scenarioId: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const router = useRouter()
    const scenarioData = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const inputValues = ref({})
    const fileNames = ref({})
    const fileData = ref({})
    
    const hasPopupSettings = computed(() => {
      if (!scenarioData.value || !scenarioData.value.settings) return false
       
      return scenarioData.value.settings.some(
        setting => setting.showInPopup
      )
    })
    
    const popupSettings = computed(() => {
      if (!scenarioData.value || !scenarioData.value.settings) return []
      
      // 获取显示在弹窗中的设置项
      const popupSettingsList = scenarioData.value.settings.filter(setting => setting.showInPopup)
      
      // 获取用户名
      const username = getUsername() || 'default'
      
      // 获取用户在当前scenario下的设置
      const userSettings = ref({})
      
      // 异步获取用户设置并合并默认值
      ApiClient.getUserSettings(username, props.scenarioId)
        .then(result => {
          if (result.success) {
            userSettings.value = result.value || {}
            
            // 更新设置项的值，优先使用用户设置，没有则使用默认值
            popupSettingsList.forEach(setting => {
              if (userSettings.value[setting.name] !== undefined) {
                setting.defaultValue = userSettings.value[setting.name]
              }
            })
          }
        })
        .catch(err => {
          console.error('获取用户设置失败:', err)
        })
      
      return popupSettingsList
    })
    
    const loadScenarioDetails = async (id) => {
      if (!id) {
        scenarioData.value = null
        return
      }
      
      loading.value = true
      error.value = null
      
      try {
        const yamlContent = await ApiClient.getScenarioYaml(id)
        // console.log(yamlContent) ; 
        scenarioData.value = parseYaml(yamlContent)
        
        // 初始化输入值
        if (scenarioData.value && scenarioData.value.inputs) {
          scenarioData.value.inputs.forEach(input => {
            if (input.type !== 'file') {
              inputValues.value[input.name] = ''
            }
          })
        }
      } catch (err) {
        console.error('加载Scenario详细信息失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    const handleFileChange = (event, inputName) => {
      const file = event.target.files[0]
      if (file) {
        fileNames.value[inputName] = file.name
        fileData.value[inputName] = file
      } else {
        fileNames.value[inputName] = '未选择文件'
        delete fileData.value[inputName]
      }
    }
    
    const getOptions = (optionsString) => {
      if (!optionsString) return []
      return optionsString.split(',').map(option => option.trim())
    }
    
    const runScenario = async () => {
      if (!scenarioData.value) {
        alert('请先选择一个Scenario')
        return
      }
      
      try {
        // 获取用户名
        const username = getUsername() || 'default'
        
        // 获取全局配置
        const globalConfig = getGlobalConfig()
        
        // 准备请求数据
        const requestData = {
          dockerName: scenarioData.value.image || 'ubuntu:latest',
          username: username,
          scenarioId: props.scenarioId,
          options: {
            inputs: JSON.stringify(inputValues.value),
            settings: {}
          }
        }
        console.log(props.scenarioId) ; 
        
        // 获取用户在这个scenario下的设置
        const userSettingsResult = await ApiClient.getUserSettings(username, props.scenarioId) ; 
        const userSettings = userSettingsResult.success ? userSettingsResult.value || {} : {}
        // 处理settings，优先使用用户设置，没有用户设置的情况下使用默认值
        if (scenarioData.value.settings) {
          scenarioData.value.settings.forEach(setting => {
            const settingName = setting.name.toUpperCase()
            // 如果用户有自定义设置，使用用户设置；否则使用默认值
            requestData.options.settings[settingName] = 
              userSettings[setting.name] !== undefined 
                ? userSettings[setting.name] 
                : (setting.defaultValue || '')
          })
        }
        
        // 添加全局API keys（全局配置优先级更高）
        if (globalConfig.CLAUDE_API_KEY) {
          requestData.options.settings['CLAUDE_API_KEY'] = globalConfig.CLAUDE_API_KEY
        }
        if (globalConfig.DEEPSEEK_API_KEY) {
          requestData.options.settings['DEEPSEEK_API_KEY'] = globalConfig.DEEPSEEK_API_KEY
        }
        if (globalConfig.GEMINI_API_KEY) {
          requestData.options.settings['GEMINI_API_KEY'] = globalConfig.GEMINI_API_KEY
        }
        
        // 添加CHOSEN_LLM_NAME（将DEFAULT_LLM转为小写）
        if (globalConfig.DEFAULT_LLM) {
          requestData.options.settings['CHOSEN_LLM_NAME'] = globalConfig.DEFAULT_LLM.toLowerCase()
        }
        
        // 添加AWS Claude配置
        if (globalConfig.AWS_ACCESS_KEY_ID) {
          requestData.options.settings['AWS_ACCESS_KEY_ID'] = globalConfig.AWS_ACCESS_KEY_ID
        }
        if (globalConfig.AWS_SECRET_ACCESS_KEY) {
          requestData.options.settings['AWS_SECRET_ACCESS_KEY'] = globalConfig.AWS_SECRET_ACCESS_KEY
        }
        if (globalConfig.AWS_REGION) {
          requestData.options.settings['AWS_REGION'] = globalConfig.AWS_REGION
        }
        
        // 发送请求
        const result = await ApiClient.startDocker(
          requestData.dockerName,
          requestData.username,
          requestData.options,
          requestData.scenarioId
        )
        
        if (result.success) {
          alert(`Scenario已成功启动`)
        } else {
          alert(`启动失败: ${result.error}`)
        }
      } catch (err) {
        console.error('运行Scenario失败:', err)
        alert(`运行Scenario失败: ${err.message}`)
      }
    }
    
    const goToConfig = () => {
      if (!props.scenarioId) {
        alert('请先选择一个Scenario')
        return
      }
      
      router.push(`/config?scenario=${props.scenarioId}`)
    }
    
    watch(() => props.scenarioId, (newId) => {
      loadScenarioDetails(newId)
    })
    
    // 初始加载
    if (props.scenarioId) {
      loadScenarioDetails(props.scenarioId)
    }
    
    return {
      scenarioData,
      loading,
      error,
      inputValues,
      fileNames,
      fileData,
      hasPopupSettings,
      popupSettings,
      handleFileChange,
      getOptions,
      runScenario,
      goToConfig
    }
  }
}
</script>