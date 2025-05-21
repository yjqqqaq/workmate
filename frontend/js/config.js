/**
 * 配置页面主要JavaScript文件
 * 实现场景配置的动态生成和保存功能
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('配置页面已加载完成');
    init();
});

// 全局变量
let currentScenario = null;
let yamlContent = null;

/**
 * 初始化函数
 */
async function init() {
    // 从URL获取参数
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || localStorage.getItem('username');
    const scenarioId = urlParams.get('scenarioId');
    
    // 验证必要参数
    if (!username || !scenarioId) {
        showError('缺少必要参数：用户名或场景ID');
        return;
    }
    
    // 保存用户名到localStorage
    localStorage.setItem('username', username);
    
    // 加载场景信息和用户配置
    await loadScenarioInfo(scenarioId);
    await loadUserSettings(username, scenarioId);
    
    // 添加表单提交事件监听器
    addFormSubmitListener(username, scenarioId);
}

/**
 * 加载场景信息
 * @param {string} scenarioId - 场景ID
 */
async function loadScenarioInfo(scenarioId) {
    try {
        // 获取场景YAML内容
        const response = await ApiClient.getScenarioYaml(scenarioId);
        
        if (!response.success) {
            showError(`加载场景信息失败: ${response.error}`);
            return;
        }
        
        // 保存YAML内容
        yamlContent = response.content;
        
        // 解析YAML内容
        parseYamlContent(yamlContent);
        
        // 更新页面标题和描述
        updateScenarioHeader();
        
        // 生成设置表单
        generateSettingsForm();
    } catch (error) {
        showError(`加载场景信息时发生错误: ${error.message}`);
    }
}

/**
 * 解析YAML内容
 * @param {string} content - YAML内容字符串
 */
function parseYamlContent(content) {
    try {
        // 简单解析YAML内容
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*(.+)$/m);
        
        currentScenario = {
            name: nameMatch ? nameMatch[1].trim() : '未知场景',
            description: descMatch ? descMatch[1].trim() : '无描述',
            settings: {}
        };
        
        // 提取settings部分
        const settingsMatch = content.match(/settings:([^]*?)(\n\w|$)/);
        if (settingsMatch) {
            const settingsContent = settingsMatch[1];
            
            // 解析每个设置项
            const settingRegex = /\s+(\w+):\s*\n\s+defaultValue:\s*(.+)\n\s+showInPopup:\s*(true|false)/g;
            let match;
            
            while ((match = settingRegex.exec(settingsContent)) !== null) {
                const key = match[1];
                const defaultValue = match[2].trim();
                const showInPopup = match[3] === 'true';
                
                currentScenario.settings[key] = {
                    defaultValue,
                    showInPopup
                };
            }
        }
        
        console.log('解析的场景信息:', currentScenario);
    } catch (error) {
        console.error('解析YAML内容失败:', error);
        showError(`解析场景配置失败: ${error.message}`);
    }
}

/**
 * 更新场景标题和描述
 */
function updateScenarioHeader() {
    const titleElement = document.getElementById('scenario-title');
    const descriptionElement = document.getElementById('config-description');
    
    if (titleElement && currentScenario) {
        titleElement.textContent = `${currentScenario.name} 配置`;
    }
    
    if (descriptionElement && currentScenario) {
        descriptionElement.textContent = currentScenario.description;
    }
}

/**
 * 生成设置表单
 */
function generateSettingsForm() {
    const settingsContainer = document.getElementById('settings-container');
    
    if (!settingsContainer || !currentScenario || !currentScenario.settings) {
        return;
    }
    
    // 清空容器
    settingsContainer.innerHTML = '';
    
    // 遍历设置项并创建表单元素
    Object.entries(currentScenario.settings).forEach(([key, setting]) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        // 创建标签
        const label = document.createElement('label');
        label.setAttribute('for', `setting-${key}`);
        label.textContent = key;
        
        // 创建输入框
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('id', `setting-${key}`);
        input.setAttribute('name', key);
        input.setAttribute('value', setting.defaultValue || '');
        input.setAttribute('data-default', setting.defaultValue || '');
        
        // 将元素添加到表单组
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        
        // 将表单组添加到容器
        settingsContainer.appendChild(formGroup);
    });
}

/**
 * 加载用户设置
 * @param {string} username - 用户名
 * @param {string} scenarioId - 场景ID
 */
async function loadUserSettings(username, scenarioId) {
    try {
        const response = await ApiClient.getUserSettings(username, scenarioId);
        
        if (!response.success) {
            console.warn(`获取用户设置失败: ${response.error}`);
            return;
        }
        
        const settings = response.value;
        
        // 如果有保存的设置，填充到表单中
        if (settings && Object.keys(settings).length > 0) {
            Object.entries(settings).forEach(([key, value]) => {
                const input = document.getElementById(`setting-${key}`);
                if (input) {
                    input.value = value;
                }
            });
            
            console.log('已加载用户设置:', settings);
        } else {
            console.log('没有找到保存的用户设置，使用默认值');
        }
    } catch (error) {
        console.error('加载用户设置时发生错误:', error);
    }
}

/**
 * 添加表单提交事件监听器
 * @param {string} username - 用户名
 * @param {string} scenarioId - 场景ID
 */
function addFormSubmitListener(username, scenarioId) {
    const configForm = document.getElementById('configForm');
    
    if (configForm) {
        configForm.addEventListener('submit', async function(event) {
            // 阻止表单默认提交行为
            event.preventDefault();
            
            // 收集设置值
            const settings = {};
            
            if (currentScenario && currentScenario.settings) {
                Object.keys(currentScenario.settings).forEach(key => {
                    const input = document.getElementById(`setting-${key}`);
                    if (input) {
                        settings[key] = input.value;
                    }
                });
            }
            
            // 保存设置
            try {
                const response = await ApiClient.saveUserSettings(username, scenarioId, settings);
                
                if (response.success) {
                    showMessage('配置保存成功！');
                } else {
                    showError(`保存配置失败: ${response.error}`);
                }
            } catch (error) {
                showError(`保存配置时发生错误: ${error.message}`);
            }
        });
    }
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
    console.error(message);
    alert(`错误: ${message}`);
}

/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showMessage(message) {
    console.log(message);
    alert(message);
}