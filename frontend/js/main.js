/**
 * 前端主要JavaScript文件
 * 实现用户名输入、Scenario选择和运行功能
 */

// API基础URL
const API_BASE_URL = 'http://localhost:4000';

// 当前选中的scenario
let currentScenario = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载完成');
    init();
});

/**
 * 初始化函数
 */
function init() {
    // 在控制台输出欢迎信息
    console.log('欢迎使用前端项目');
    
    // 检查localStorage中是否已有用户名，如果有则自动填充
    loadUsername();
    
    // 添加事件监听器
    addEventListeners();
}

/**
 * 从localStorage加载用户名
 */
function loadUsername() {
    const savedUsername = localStorage.getItem('username');
    
    if (savedUsername) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = savedUsername;
            console.log('已从localStorage加载用户名:', savedUsername);
        }
        
        // 如果已有用户名，自动显示scenario部分
        showScenarioSection();
    }
}

/**
 * 保存用户名到localStorage
 * @param {string} username - 要保存的用户名
 */
function saveUsername(username) {
    if (username) {
        localStorage.setItem('username', username);
        console.log('用户名已保存到localStorage:', username);
    }
}

/**
 * 验证表单
 * @param {string} username - 要验证的用户名
 * @returns {boolean} 验证结果
 */
function validateForm(username) {
    const errorElement = document.getElementById('error-message');
    
    // 清除之前的错误信息
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // 验证用户名不能为空
    if (!username || username.trim() === '') {
        if (errorElement) {
            errorElement.textContent = '用户名不能为空！';
        }
        return false;
    }
    
    return true;
}

/**
 * 添加事件监听器
 */
function addEventListeners() {
    // 为用户表单添加提交事件监听器
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            // 阻止表单默认提交行为
            event.preventDefault();
            
            // 获取用户名输入
            const usernameInput = document.getElementById('username');
            const username = usernameInput ? usernameInput.value : '';
            
            // 验证表单
            if (validateForm(username)) {
                // 保存用户名到localStorage
                saveUsername(username);
                
                // 显示scenario部分
                showScenarioSection();
            }
        });
    }
    
    // 为scenario选择下拉框添加change事件监听器
    const scenarioSelect = document.getElementById('scenarioSelect');
    if (scenarioSelect) {
        scenarioSelect.addEventListener('change', function() {
            const selectedScenarioId = this.value;
            if (selectedScenarioId) {
                loadScenarioDetails(selectedScenarioId);
            } else {
                clearScenarioDetails();
            }
        });
    }
    
    // 为运行按钮添加点击事件监听器
    const runButton = document.getElementById('runButton');
    if (runButton) {
        runButton.addEventListener('click', function() {
            runScenario();
        });
    }
    
    // 为配置按钮添加点击事件监听器
    const configButton = document.getElementById('configButton');
    if (configButton) {
        configButton.addEventListener('click', function() {
            const selectedScenarioId = document.getElementById('scenarioSelect').value;
            if (selectedScenarioId) {
                // 跳转到配置页面，可以根据实际需求修改
                window.location.href = `config.html?scenario=${selectedScenarioId}`;
            } else {
                showMessage('请先选择一个Scenario');
            }
        });
    }
}

/**
 * 显示Scenario部分
 */
function showScenarioSection() {
    const scenarioSection = document.getElementById('scenarioSection');
    if (scenarioSection) {
        scenarioSection.style.display = 'block';
        
        // 加载scenario列表
        loadScenarioList();
    }
}

/**
 * 加载Scenario列表
 */
async function loadScenarioList() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scenarios`);
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const scenarios = await response.json();
        
        // 填充下拉框
        const scenarioSelect = document.getElementById('scenarioSelect');
        if (scenarioSelect) {
            // 清除现有选项（保留第一个默认选项）
            while (scenarioSelect.options.length > 1) {
                scenarioSelect.remove(1);
            }
            
            // 添加新选项
            scenarios.forEach(scenario => {
                const option = document.createElement('option');
                option.value = scenario.id;
                option.textContent = scenario.name;
                scenarioSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载Scenario列表失败:', error);
        showMessage(`加载Scenario列表失败: ${error.message}`);
    }
}

/**
 * 加载Scenario详细信息
 * @param {string} scenarioId - Scenario ID
 */
async function loadScenarioDetails(scenarioId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scenarios/${scenarioId}`);
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const yamlContent = await response.text();
        
        // 解析YAML内容
        const scenarioData = parseYaml(yamlContent);
        currentScenario = scenarioData;
        
        // 显示描述
        const descriptionElement = document.getElementById('scenarioDescription');
        if (descriptionElement && scenarioData.description) {
            descriptionElement.textContent = scenarioData.description;
            descriptionElement.style.display = 'block';
        } else if (descriptionElement) {
            descriptionElement.style.display = 'none';
        }
        
        // 显示popup设置
        displayPopupSettings(scenarioData);
        
        // 生成输入表单
        generateInputForm(scenarioData);
        
    } catch (error) {
        console.error('加载Scenario详细信息失败:', error);
        showMessage(`加载Scenario详细信息失败: ${error.message}`);
    }
}

/**
 * 简单解析YAML内容
 * @param {string} yamlContent - YAML内容字符串
 * @returns {Object} 解析后的对象
 */
function parseYaml(yamlContent) {
    // 这是一个简化的YAML解析器，仅用于演示
    // 实际项目中应使用专业的YAML解析库
    const result = {};
    const lines = yamlContent.split('\n');
    
    let currentSection = null;
    let currentItem = null;
    let inInputs = false;
    let inSettings = false;
    
    for (const line of lines) {
        // 跳过空行和注释
        if (!line.trim() || line.trim().startsWith('#')) continue;
        
        // 检测顶级键
        if (!line.startsWith(' ') && !line.startsWith('\t')) {
            const match = line.match(/^(\w+):\s*(.*)$/);
            if (match) {
                currentSection = match[1];
                
                if (currentSection === 'inputs') {
                    result.inputs = [];
                    inInputs = true;
                    inSettings = false;
                    continue;
                } else if (currentSection === 'settings') {
                    result.settings = {};
                    inInputs = false;
                    inSettings = true;
                    continue;
                } else {
                    inInputs = false;
                    inSettings = false;
                }
                
                if (match[2].trim()) {
                    result[currentSection] = match[2].trim();
                } else {
                    result[currentSection] = null;
                }
            }
        } 
        // 处理inputs部分
        else if (inInputs) {
            if (line.match(/^\s*-\s*name:/)) {
                if (currentItem) {
                    result.inputs.push(currentItem);
                }
                currentItem = {};
                const nameMatch = line.match(/name:\s*(.+)$/);
                if (nameMatch) {
                    currentItem.name = nameMatch[1].trim();
                }
            } else if (currentItem) {
                const propMatch = line.match(/^\s+(\w+):\s*(.+)$/);
                if (propMatch) {
                    currentItem[propMatch[1]] = propMatch[2].trim();
                }
            }
        }
        // 处理settings部分
        else if (inSettings) {
            const settingMatch = line.match(/^\s+(\w+):/);
            if (settingMatch) {
                const settingName = settingMatch[1];
                result.settings[settingName] = {};
                
                // 读取设置的属性
                const indentation = line.match(/^(\s+)/)[1].length;
                let i = lines.indexOf(line) + 1;
                while (i < lines.length && 
                       lines[i].match(/^(\s+)/) && 
                       lines[i].match(/^(\s+)/)[1].length > indentation) {
                    const propMatch = lines[i].match(/^\s+(\w+):\s*(.+)$/);
                    if (propMatch) {
                        result.settings[settingName][propMatch[1]] = propMatch[2].trim();
                    }
                    i++;
                }
            }
        }
    }
    
    // 添加最后一个input项
    if (inInputs && currentItem) {
        result.inputs.push(currentItem);
    }
    
    return result;
}

/**
 * 显示popup设置
 * @param {Object} scenarioData - Scenario数据
 */
function displayPopupSettings(scenarioData) {
    const popupSettingsElement = document.getElementById('scenarioPopupSettings');
    if (!popupSettingsElement) return;
    
    // 清空现有内容
    popupSettingsElement.innerHTML = '';
    
    // 检查是否有需要在popup中显示的设置
    if (scenarioData.settings) {
        let hasPopupSettings = false;
        
        for (const [key, setting] of Object.entries(scenarioData.settings)) {
            if (setting.showInPopup === 'true') {
                hasPopupSettings = true;
                
                const settingElement = document.createElement('div');
                settingElement.className = 'popup-setting';
                
                const titleElement = document.createElement('h3');
                titleElement.textContent = key;
                settingElement.appendChild(titleElement);
                
                const valueElement = document.createElement('p');
                valueElement.textContent = setting.defaultValue || '';
                settingElement.appendChild(valueElement);
                
                popupSettingsElement.appendChild(settingElement);
            }
        }
        
        // 如果有popup设置，显示容器
        if (hasPopupSettings) {
            popupSettingsElement.style.display = 'block';
        } else {
            popupSettingsElement.style.display = 'none';
        }
    } else {
        popupSettingsElement.style.display = 'none';
    }
}

/**
 * 生成输入表单
 * @param {Object} scenarioData - Scenario数据
 */
function generateInputForm(scenarioData) {
    const inputsContainer = document.getElementById('scenarioInputs');
    if (!inputsContainer) return;
    
    // 清空现有内容
    inputsContainer.innerHTML = '';
    
    // 检查是否有输入字段
    if (!scenarioData.inputs || scenarioData.inputs.length === 0) {
        inputsContainer.innerHTML = '<p>此Scenario没有需要填写的输入项</p>';
        return;
    }
    
    // 为每个输入字段创建表单元素
    scenarioData.inputs.forEach(input => {
        const inputItem = document.createElement('div');
        inputItem.className = 'input-item';
        
        // 创建标签
        const label = document.createElement('label');
        label.setAttribute('for', `input-${input.name}`);
        label.textContent = input.label || input.name;
        if (input.required === 'true') {
            const requiredMark = document.createElement('span');
            requiredMark.className = 'required-mark';
            requiredMark.textContent = ' *';
            requiredMark.style.color = 'red';
            label.appendChild(requiredMark);
        }
        inputItem.appendChild(label);
        
        // 根据类型创建输入元素
        let inputElement;
        
        switch (input.type) {
            case 'textarea':
                inputElement = document.createElement('textarea');
                inputElement.id = `input-${input.name}`;
                inputElement.name = input.name;
                inputElement.placeholder = input.placeholder || '';
                break;
                
            case 'file':
                const fileContainer = document.createElement('div');
                fileContainer.className = 'file-input-container';
                
                const fileLabel = document.createElement('label');
                fileLabel.className = 'file-input-label';
                fileLabel.setAttribute('for', `input-${input.name}`);
                fileLabel.textContent = '选择文件';
                
                inputElement = document.createElement('input');
                inputElement.type = 'file';
                inputElement.id = `input-${input.name}`;
                inputElement.name = input.name;
                inputElement.style.display = 'none';
                
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.id = `filename-${input.name}`;
                fileName.textContent = '未选择文件';
                
                // 添加文件选择事件
                inputElement.addEventListener('change', function() {
                    if (this.files.length > 0) {
                        fileName.textContent = this.files[0].name;
                    } else {
                        fileName.textContent = '未选择文件';
                    }
                });
                
                fileContainer.appendChild(fileLabel);
                fileContainer.appendChild(inputElement);
                fileContainer.appendChild(fileName);
                
                inputItem.appendChild(fileContainer);
                break;
                
            case 'select':
                inputElement = document.createElement('select');
                inputElement.id = `input-${input.name}`;
                inputElement.name = input.name;
                inputElement.className = 'select-input';
                
                // 添加选项
                if (input.options) {
                    const options = input.options.split(',');
                    options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.trim();
                        optionElement.textContent = option.trim();
                        inputElement.appendChild(optionElement);
                    });
                }
                break;
                
            default: // 默认为text类型
                inputElement = document.createElement('input');
                inputElement.type = input.type || 'text';
                inputElement.id = `input-${input.name}`;
                inputElement.name = input.name;
                inputElement.placeholder = input.placeholder || '';
                break;
        }
        
        // 如果不是file类型，直接添加到容器
        if (input.type !== 'file') {
            inputItem.appendChild(inputElement);
        }
        
        // 添加到输入容器
        inputsContainer.appendChild(inputItem);
    });
}

/**
 * 清除Scenario详细信息
 */
function clearScenarioDetails() {
    currentScenario = null;
    
    // 清除描述
    const descriptionElement = document.getElementById('scenarioDescription');
    if (descriptionElement) {
        descriptionElement.textContent = '';
        descriptionElement.style.display = 'none';
    }
    
    // 清除popup设置
    const popupSettingsElement = document.getElementById('scenarioPopupSettings');
    if (popupSettingsElement) {
        popupSettingsElement.innerHTML = '';
        popupSettingsElement.style.display = 'none';
    }
    
    // 清除输入表单
    const inputsContainer = document.getElementById('scenarioInputs');
    if (inputsContainer) {
        inputsContainer.innerHTML = '';
    }
}

/**
 * 运行Scenario
 */
async function runScenario() {
    if (!currentScenario) {
        showMessage('请先选择一个Scenario');
        return;
    }
    
    try {
        // 收集输入数据
        const inputData = {};
        const fileData = {};
        
        if (currentScenario.inputs) {
            for (const input of currentScenario.inputs) {
                const inputElement = document.getElementById(`input-${input.name}`);
                
                if (inputElement) {
                    if (input.type === 'file') {
                        if (inputElement.files.length > 0) {
                            fileData[input.name] = inputElement.files[0];
                        }
                    } else {
                        inputData[input.name] = inputElement.value;
                    }
                }
            }
        }
        
        // 获取用户名
        const username = localStorage.getItem('username') || 'default';
        
        // 准备请求数据
        const requestData = {
            dockerName: currentScenario.image || 'ubuntu:latest',
            username: username,
            options: {
                inputs: JSON.stringify(inputData),
                settings: currentScenario.settings ? 
                    Object.fromEntries(
                        Object.entries(currentScenario.settings)
                            .map(([key, value]) => [key, value.defaultValue || ''])
                    ) : {}
            }
        };
        
        // 发送请求
        const response = await fetch(`${API_BASE_URL}/api/docker/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`Scenario已成功启动！Docker ID: ${result.data.containerId}`);
        } else {
            showMessage(`启动失败: ${result.error}`);
        }
        
    } catch (error) {
        console.error('运行Scenario失败:', error);
        showMessage(`运行Scenario失败: ${error.message}`);
    }
}

/**
 * 显示消息
 * @param {string} message - 要显示的消息
 */
function showMessage(message) {
    alert(message);
}