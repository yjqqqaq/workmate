import yaml from 'js-yaml';

/**
 * 解析YAML内容
 * @param {string} yamlContent - YAML内容字符串
 * @returns {Object} 解析后的对象
 */
export function parseYaml(yamlContent) {
  try {
    // 使用js-yaml库解析YAML内容
    const result = yaml.load(yamlContent);
    
    // 确保返回的结果是一个对象
    if (result === null || typeof result !== 'object') {
      return {};
    }
    
    return result;
  } catch (error) {
    console.error('YAML解析错误:', error.message);
    // 返回空对象作为默认值
    return {};
  }
}