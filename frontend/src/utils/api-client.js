/**
 * API客户端模块
 * 负责与后端API进行交互
 */
import { ref } from 'vue';
import { getGlobalConfig } from './storage';

// 获取后端主机配置
const getBackendHost = () => {
  const config = getGlobalConfig();
  return config.BACKEND_HOST || 'http://localhost:4000';
};

// API基础URL配置
const getApiBaseUrl = () => {
  return `${getBackendHost()}/api`;
};

// 全局loading状态
export const loading = ref(false);
export const loadingMessage = ref('加载中...');

// 判断是否为Docker状态相关操作
const isDockerStateOperation = (operation) => {
  // 只有startDocker和changeDockerState操作才显示loading
  return operation === 'startDocker' || operation === 'changeDockerState';
};

// 显示loading
const showLoading = (message = '加载中...', operation = '') => {
  // 只有Docker状态相关操作才显示loading
  if (isDockerStateOperation(operation)) {
    loadingMessage.value = message;
    loading.value = true;
  }
};

// 隐藏loading
const hideLoading = (operation = '') => {
  // 只有Docker状态相关操作才隐藏loading
  if (isDockerStateOperation(operation)) {
    loading.value = false;
  }
};

const ApiClient = {
  /**
   * 获取所有scenario的列表
   * @returns {Promise<Object>} 包含scenarios列表的响应对象
   */
  async getScenarios() {
    // showLoading('获取场景列表中...', 'getScenarios');
    try {
      const response = await fetch(`${getApiBaseUrl()}/scenarios`)
      const result = await response.json()
      
      if (!result.success) {
        console.error('获取scenarios列表失败:', result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result.scenarios
    } catch (error) {
      console.error('获取scenarios列表失败:', error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getScenarios');
    }
  },

  /**
   * 获取指定scenario的YAML内容
   * @param {string} scenarioId - scenario的ID
   * @returns {Promise<Object>} 包含scenario YAML内容的响应对象
   */
  async getScenarioYaml(scenarioId) {
    // showLoading('获取场景配置中...', 'getScenarioYaml');
    try {
      const response = await fetch(`${getApiBaseUrl()}/scenarios/${scenarioId}`)
      const text = await response.text()
      
      try {
        // 尝试解析为JSON，检查是否为API错误响应
        const jsonResult = JSON.parse(text)
        if (!jsonResult.success) {
          console.error(`获取scenario ${scenarioId} 失败:`, jsonResult.error || '未知错误')
          return { success: false, error: jsonResult.error || '未知错误' }
        }
        return jsonResult.content
      } catch (parseError) {
        // 如果不是JSON，则假定是直接返回的YAML文本
        return text
      }
    } catch (error) {
      console.error(`获取scenario ${scenarioId} 失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getScenarioYaml');
    }
  },

  /**
   * 获取用户在特定scenario下的设置
   * @param {string} username - 用户名
   * @param {string} scenarioId - scenario的ID
   * @returns {Promise<Object>} 包含用户设置的响应对象
   */
  async getUserSettings(username, scenarioId) {
    // showLoading('获取用户设置中...', 'getUserSettings');
    try {
      const response = await fetch(`${getApiBaseUrl()}/scenarios/${scenarioId}/settings/${username}`)
      const result = await response.json()
      
      if (!result.success) {
        console.error(`获取用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`获取用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getUserSettings');
    }
  },

  /**
   * 保存用户在特定scenario下的设置
   * @param {string} username - 用户名
   * @param {string} scenarioId - scenario的ID
   * @param {Object} settings - 要保存的设置对象
   * @returns {Promise<Object>} 保存结果的响应对象
   */
  async saveUserSettings(username, scenarioId, settings) {
    showLoading('保存用户设置中...', 'saveUserSettings');
    try {
      const response = await fetch(`${getApiBaseUrl()}/scenarios/${scenarioId}/settings/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })
      const result = await response.json()
      
      if (!result.success) {
        console.error(`保存用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`保存用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('saveUserSettings');
    }
  },
  
  /**
   * 获取用户的Docker容器列表
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 包含Docker列表的响应对象
   */
  async getDockerList(username) {
    // showLoading('获取Docker列表中...', 'getDockerList');
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/list/${username}`)
      const result = await response.json()
      
      if (!result.success) {
        console.error(`获取用户 ${username} 的Docker列表失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`获取用户 ${username} 的Docker列表失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getDockerList');
    }
  },
  
  /**
   * 获取Docker容器的详细状态
   * @param {string} dockerId - Docker容器ID
   * @returns {Promise<Object>} 包含Docker状态的响应对象
   */
  async getDockerStatus(dockerId) {
    // showLoading('获取Docker状态中...', 'getDockerStatus');
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/status/${dockerId}`)
      const result = await response.json()
      
      if (!result.success) {
        console.error(`获取Docker ${dockerId} 状态失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`获取Docker ${dockerId} 状态失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getDockerStatus');
    }
  },
  
  /**
   * 获取Docker容器的日志
   * @param {string} dockerId - Docker容器ID
   * @param {string} logFile - 日志文件名，默认为'run.log'
   * @returns {Promise<Object>} 包含日志内容的响应对象
   */
  async getDockerLogs(dockerId, logFile = 'run.log') {
    // showLoading('获取Docker日志中...', 'getDockerLogs');
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/logs/${dockerId}?logFile=${logFile}`)
      const text = await response.text()
      
      try {
        // 尝试解析为JSON，检查是否为API错误响应
        const jsonResult = JSON.parse(text)
        if (!jsonResult.success) {
          console.error(`获取Docker ${dockerId} 日志失败:`, jsonResult.error || '未知错误')
          return { success: false, error: jsonResult.error || '未知错误' }
        }
        return jsonResult
      } catch (parseError) {
        // 如果不是JSON，则假定是直接返回的日志文本
        return text
      }
    } catch (error) {
      console.error(`获取Docker ${dockerId} 日志失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getDockerLogs');
    }
  },
  
  /**
   * 获取Docker容器的输出内容
   * @param {string} dockerId - Docker容器ID
   * @param {string} outputFile - 输出文件名，默认为'output.json'
   * @returns {Promise<Object>} 包含输出内容的响应对象
   */
  async getDockerOutput(dockerId, outputFile = 'output.json') {
    // showLoading('获取Docker输出中...', 'getDockerOutput');
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/output/${dockerId}?outputFile=${outputFile}`)
      const text = await response.text()
      
      try {
        // 尝试解析为JSON，检查是否为API错误响应或输出本身就是JSON
        const jsonResult = JSON.parse(text)
        if (jsonResult.hasOwnProperty('success') && !jsonResult.success) {
          console.error(`获取Docker ${dockerId} 输出失败:`, jsonResult.error || '未知错误')
          return { success: false, error: jsonResult.error || '未知错误' }
        }
        return jsonResult
      } catch (parseError) {
        // 如果不是JSON，则假定是直接返回的文本输出
        return { success: true, data: text }
      }
    } catch (error) {
      console.error(`获取Docker ${dockerId} 输出失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getDockerOutput');
    }
  },
  
  /**
   * 调整Docker容器的状态
   * @param {string} dockerId - Docker容器ID
   * @param {string} action - 要执行的操作，可选值包括：'start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove'
   * @param {string} username - 用户名，用于验证操作权限
   * @returns {Promise<Object>} 操作结果
   */
  async changeDockerState(dockerId, action, username) {
    showLoading(`正在${action === 'start' ? '启动' : action === 'stop' ? '停止' : action === 'restart' ? '重启' : action === 'remove' ? '删除' : '操作'}Docker...`, 'changeDockerState');
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dockerId, action, username })
      })
      const result = await response.json()
      
      if (!result.success) {
        console.error(`调整Docker ${dockerId} 状态失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`调整Docker ${dockerId} 状态失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('changeDockerState');
    }
  },
  
  /**
   * 启动Docker容器
   * @param {string} dockerName - Docker容器名称
   * @param {string} username - 用户名
   * @param {string} scenarioId - 场景ID
   * @param {Object} options - 可选配置项
   * @returns {Promise<Object>} 启动结果
   */
  async startDocker(dockerName, username, options = {}, scenarioId = '') {
    showLoading(`正在启动任务`, 'startDocker');
    console.log(options) ; 
    try {
      const response = await fetch(`${getApiBaseUrl()}/docker/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dockerName, username, options, scenarioId })
      })
      const result = await response.json()
      
      if (!result.success) {
        console.error(`启动Docker失败:`, result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result
    } catch (error) {
      console.error(`启动Docker ${dockerName} 失败:`, error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('startDocker');
    }
  },

  /**
   * 获取全局配置
   * @returns {Promise<Object>} 包含全局配置的响应对象
   */
  async getGlobalConfig() {
    // showLoading('获取全局配置中...', 'getGlobalConfig');
    try {
      const response = await fetch(`${getApiBaseUrl()}/config/global`)
      const result = await response.json()
      
      if (!result.success) {
        console.error('获取全局配置失败:', result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result.data
    } catch (error) {
      console.error('获取全局配置失败:', error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('getGlobalConfig');
    }
  },

  /**
   * 保存全局配置
   * @param {Object} config - 要保存的全局配置对象
   * @returns {Promise<Object>} 保存结果的响应对象
   */
  async saveGlobalConfig(config) {
    showLoading('保存全局配置中...', 'saveGlobalConfig');
    try {
      const response = await fetch(`${getApiBaseUrl()}/config/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      })
      const result = await response.json()
      
      if (!result.success) {
        console.error('保存全局配置失败:', result.error || '未知错误')
        return { success: false, error: result.error || '未知错误' }
      }
      
      return result.data
    } catch (error) {
      console.error('保存全局配置失败:', error)
      return { success: false, error: error.message }
    } finally {
      hideLoading('saveGlobalConfig');
    }
  }
}

export default ApiClient