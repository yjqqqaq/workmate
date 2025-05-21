/**
 * 本地存储工具
 */

// 全局配置的localStorage键名
const GLOBAL_CONFIG_KEY = 'globalConfig';

// 默认的全局配置
const DEFAULT_GLOBAL_CONFIG = {
  DEFAULT_LLM: 'gemini',
  CLAUDE_API_KEY: '',
  DEEPSEEK_API_KEY: '',
  GEMINI_API_KEY: '',
  BACKEND_HOST: 'http://localhost:4000'
};

/**
 * 保存用户名到localStorage
 * @param {string} username - 要保存的用户名
 */
export function saveUsername(username) {
  if (username) {
    localStorage.setItem('username', username)
    console.log('用户名已保存到localStorage:', username)
  }
}

/**
 * 从localStorage获取用户名
 * @returns {string|null} 保存的用户名，如果不存在则返回null
 */
export function getUsername() {
  return localStorage.getItem('username')
}

/**
 * 保存数据到localStorage
 * @param {string} key - 键名
 * @param {any} value - 要保存的值，将被JSON序列化
 */
export function saveData(key, value) {
  if (key) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

/**
 * 从localStorage获取数据
 * @param {string} key - 键名
 * @param {any} defaultValue - 如果键不存在时返回的默认值
 * @returns {any} 解析后的值，如果解析失败则返回默认值
 */
export function getData(key, defaultValue = null) {
  const value = localStorage.getItem(key)
  if (value === null) return defaultValue
  
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error(`解析localStorage数据失败 (${key}):`, error)
    return defaultValue
  }
}

/**
 * 保存全局配置到localStorage
 * @param {Object} config - 要保存的全局配置对象
 * @returns {Object} 保存后的配置对象
 */
export function saveGlobalConfig(config) {
  if (config) {
    // 确保配置中包含所有必要的字段
    const completeConfig = {
      ...DEFAULT_GLOBAL_CONFIG,
      ...config
    };
    
    // 将DefaultLLMModel映射到DEFAULT_LLM（兼容性处理）
    if (config.DefaultLLMModel && !config.DEFAULT_LLM) {
      completeConfig.DEFAULT_LLM = config.DefaultLLMModel;
    }
    
    // 将API Keys映射到标准格式（兼容性处理）
    if (config.GeminiApiKey && !config.GEMINI_API_KEY) {
      completeConfig.GEMINI_API_KEY = config.GeminiApiKey;
    }
    if (config.ClaudeApiKey && !config.CLAUDE_API_KEY) {
      completeConfig.CLAUDE_API_KEY = config.ClaudeApiKey;
    }
    if (config.DeepSeekApiKey && !config.DEEPSEEK_API_KEY) {
      completeConfig.DEEPSEEK_API_KEY = config.DeepSeekApiKey;
    }
    
    saveData(GLOBAL_CONFIG_KEY, completeConfig)
    console.log('全局配置已保存到localStorage:', completeConfig)
    return completeConfig;
  }
  return null;
}

/**
 * 从localStorage获取全局配置
 * @returns {Object} 全局配置对象，如果不存在则返回默认配置
 */
export function getGlobalConfig() {
  const config = getData(GLOBAL_CONFIG_KEY, {});
  
  // 确保返回的配置包含所有必要的字段
  return {
    ...DEFAULT_GLOBAL_CONFIG,
    ...config
  };
}

/**
 * 更新全局配置的特定字段
 * @param {string} key - 配置字段名
 * @param {any} value - 字段值
 * @returns {Object} 更新后的完整配置对象
 */
export function updateGlobalConfigField(key, value) {
  if (key) {
    const config = getGlobalConfig();
    config[key] = value;
    const savedConfig = saveGlobalConfig(config);
    console.log(`全局配置字段 ${key} 已更新:`, value);
    return savedConfig;
  }
  return null;
}

/**
 * 检查全局配置是否包含必要的API密钥
 * @param {string} llmType - LLM类型（'claude', 'deepseek', 'gemini'）
 * @returns {boolean} 如果配置包含必要的API密钥则返回true
 */
export function hasRequiredApiKey(llmType) {
  const config = getGlobalConfig();
  
  switch(llmType.toLowerCase()) {
    case 'claude':
      return !!config.CLAUDE_API_KEY;
    case 'deepseek':
      return !!config.DEEPSEEK_API_KEY;
    case 'gemini':
      return !!config.GEMINI_API_KEY;
    default:
      return false;
  }
}

/**
 * 获取当前默认LLM类型
 * @returns {string} 默认LLM类型
 */
export function getDefaultLLM() {
  const config = getGlobalConfig();
  return config.DEFAULT_LLM || 'gemini';
}

/**
 * 设置默认LLM类型
 * @param {string} llmType - LLM类型（'claude', 'deepseek', 'gemini'）
 * @returns {Object} 更新后的完整配置对象
 */
export function setDefaultLLM(llmType) {
  return updateGlobalConfigField('DEFAULT_LLM', llmType);
}