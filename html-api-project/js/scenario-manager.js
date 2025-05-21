/**
 * Scenario配置文件管理模块
 */
const fs = require('fs');
const path = require('path');

// Scenario配置文件目录
const SCENARIOS_DIR = path.join(__dirname, '../scenarios');

/**
 * 获取所有scenario的列表（包含name和description）
 * @returns {Promise<Array>} 包含所有scenario基本信息的数组
 */
async function getAllScenarios() {
  try {
    // 确保scenarios目录存在
    if (!fs.existsSync(SCENARIOS_DIR)) {
      console.error(`Scenarios目录不存在: ${SCENARIOS_DIR}`);
      return [];
    }

    // 读取目录中的所有yaml文件
    const files = fs.readdirSync(SCENARIOS_DIR).filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml')
    );

    // 提取每个scenario的name和description
    const scenarios = [];
    for (const file of files) {
      const filePath = path.join(SCENARIOS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 简单解析YAML以提取name和description
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*(.+)$/m);
      
      if (nameMatch && descMatch) {
        scenarios.push({
          id: path.basename(file, path.extname(file)),
          name: nameMatch[1].trim(),
          description: descMatch[1].trim()
        });
      }
    }

    return scenarios;
  } catch (error) {
    console.error('获取scenarios列表失败:', error);
    throw new Error(`获取scenarios列表失败: ${error.message}`);
  }
}

/**
 * 获取指定scenario的完整YAML内容
 * @param {string} scenarioId - scenario的ID（文件名，不含扩展名）
 * @returns {Promise<string>} scenario的YAML内容
 */
async function getScenarioYaml(scenarioId) {
  try {
    // 安全检查：防止路径遍历攻击
    if (scenarioId.includes('/') || scenarioId.includes('\\')) {
      throw new Error('无效的scenario ID');
    }

    // 尝试查找.yaml和.yml扩展名
    let filePath = path.join(SCENARIOS_DIR, `${scenarioId}.yaml`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(SCENARIOS_DIR, `${scenarioId}.yml`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`找不到scenario: ${scenarioId}`);
      }
    }

    // 读取YAML文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`获取scenario ${scenarioId} 失败:`, error);
    throw new Error(`获取scenario失败: ${error.message}`);
  }
}

module.exports = {
  getAllScenarios,
  getScenarioYaml
};