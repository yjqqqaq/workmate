/**
 * 运行页面测试脚本
 * 使用纯JavaScript实现，不依赖任何测试框架
 * 测试内容：
 * 1. 测试scenario选择功能
 * 2. 测试动态表单生成功能
 * 3. 测试运行按钮功能
 * 4. 测试配置信息显示功能
 */

// 模拟DOM环境
const document = createMockDocument();
// 模拟localStorage
const localStorage = createMockLocalStorage();
// 模拟fetch API
global.fetch = mockFetch;
// 模拟alert
global.alert = mockAlert;

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// 测试入口函数
async function runTests() {
  console.log('开始运行页面测试...\n');
  
  try {
    // 测试scenario选择功能
    await testScenarioSelection();
    
    // 测试动态表单生成功能
    await testDynamicFormGeneration();
    
    // 测试运行按钮功能
    await testRunButtonFunctionality();
    
    // 测试配置信息显示功能
    await testConfigInfoDisplay();
    
    // 输出测试结果摘要
    printTestSummary();
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

/**
 * 测试scenario选择功能
 */
async function testScenarioSelection() {
  console.log('测试1: scenario选择功能');
  
  // 模拟用户名输入和提交
  const username = 'testuser';
  document.getElementById('username').value = username;
  document.getElementById('userForm').dispatchEvent(new Event('submit'));
  
  // 验证localStorage中保存了用户名
  assert(
    localStorage.getItem('username') === username,
    '用户名应该保存到localStorage中'
  );
  
  // 验证scenario部分显示
  assert(
    document.getElementById('scenarioSection').style.display === 'block',
    'Scenario部分应该显示'
  );
  
  // 模拟API返回的scenario列表
  const mockScenarios = [
    { id: 'feature-request', name: '功能请求' },
    { id: 'bug-report', name: '缺陷报告' },
    { id: 'code-review', name: '代码审查' }
  ];
  
  // 设置mock fetch响应
  setMockFetchResponse(`http://localhost:3000/api/scenarios`, {
    status: 200,
    body: mockScenarios
  });
  
  // 等待scenario列表加载完成
  await waitForScenarioListLoaded();
  
  // 验证下拉框中的选项数量
  const selectElement = document.getElementById('scenarioSelect');
  assert(
    selectElement.options.length === mockScenarios.length + 1, // +1 是因为有一个默认的"请选择"选项
    `下拉框应该包含${mockScenarios.length + 1}个选项`
  );
  
  // 模拟选择第一个scenario
  selectElement.value = mockScenarios[0].id;
  selectElement.dispatchEvent(new Event('change'));
  
  // 设置mock fetch响应 - scenario详情
  const mockScenarioYaml = `
name: 功能请求
description: 用于提交新功能请求的场景
image: ubuntu:latest
inputs:
  - name: title
    label: 功能标题
    type: text
    placeholder: 请输入功能标题
    required: true
  - name: description
    label: 功能描述
    type: textarea
    placeholder: 请详细描述您需要的功能
    required: true
  - name: priority
    label: 优先级
    type: select
    options: 高,中,低
    required: true
settings:
  notification:
    defaultValue: email
    showInPopup: true
  autoAssign:
    defaultValue: true
    showInPopup: true
`;
  
  setMockFetchResponse(`http://localhost:3000/api/scenarios/${mockScenarios[0].id}`, {
    status: 200,
    body: mockScenarioYaml
  });
  
  // 等待scenario详情加载完成
  await waitForScenarioDetailsLoaded();
  
  // 验证描述是否显示
  const descriptionElement = document.getElementById('scenarioDescription');
  assert(
    descriptionElement.textContent === '用于提交新功能请求的场景',
    '应该显示正确的scenario描述'
  );
  
  console.log('测试1完成: scenario选择功能\n');
}

/**
 * 测试动态表单生成功能
 */
async function testDynamicFormGeneration() {
  console.log('测试2: 动态表单生成功能');
  
  // 验证表单输入项数量
  const inputsContainer = document.getElementById('scenarioInputs');
  const inputItems = inputsContainer.querySelectorAll('.input-item');
  
  assert(
    inputItems.length === 3,
    '应该生成3个输入项'
  );
  
  // 验证文本输入框
  const titleInput = document.getElementById('input-title');
  assert(
    titleInput && titleInput.type === 'text',
    '应该生成文本输入框'
  );
  
  // 验证文本区域
  const descriptionInput = document.getElementById('input-description');
  assert(
    descriptionInput && descriptionInput.tagName.toLowerCase() === 'textarea',
    '应该生成文本区域'
  );
  
  // 验证下拉选择框
  const priorityInput = document.getElementById('input-priority');
  assert(
    priorityInput && priorityInput.tagName.toLowerCase() === 'select',
    '应该生成下拉选择框'
  );
  
  // 验证下拉选择框选项
  assert(
    priorityInput.options.length === 3,
    '下拉选择框应该有3个选项'
  );
  
  // 验证必填项标记
  const requiredMarks = document.querySelectorAll('.required-mark');
  assert(
    requiredMarks.length === 3,
    '应该有3个必填项标记'
  );
  
  console.log('测试2完成: 动态表单生成功能\n');
}

/**
 * 测试运行按钮功能
 */
async function testRunButtonFunctionality() {
  console.log('测试3: 运行按钮功能');
  
  // 填写表单
  document.getElementById('input-title').value = '测试功能';
  document.getElementById('input-description').value = '这是一个测试功能描述';
  document.getElementById('input-priority').value = '高';
  
  // 设置mock fetch响应 - 运行scenario
  const mockRunResponse = {
    success: true,
    data: {
      containerId: 'abc123',
      name: 'ubuntu-test',
      status: 'running',
      startedAt: new Date().toISOString()
    }
  };
  
  setMockFetchResponse(`http://localhost:3000/api/docker/start`, {
    status: 200,
    body: mockRunResponse
  });
  
  // 点击运行按钮
  document.getElementById('runButton').click();
  
  // 等待运行完成
  await waitForRunCompleted();
  
  // 验证是否发送了正确的请求数据
  const lastRequest = getLastFetchRequest();
  assert(
    lastRequest && lastRequest.url === 'http://localhost:3000/api/docker/start',
    '应该向正确的URL发送请求'
  );
  
  assert(
    lastRequest.method === 'POST',
    '应该使用POST方法'
  );
  
  const requestBody = JSON.parse(lastRequest.body);
  assert(
    requestBody.dockerName === 'ubuntu:latest',
    '应该使用正确的Docker镜像'
  );
  
  assert(
    requestBody.username === 'testuser',
    '应该使用正确的用户名'
  );
  
  const inputData = JSON.parse(requestBody.options.inputs);
  assert(
    inputData.title === '测试功能' &&
    inputData.description === '这是一个测试功能描述' &&
    inputData.priority === '高',
    '应该发送正确的表单数据'
  );
  
  // 验证是否显示成功消息
  const lastAlert = getLastAlert();
  assert(
    lastAlert && lastAlert.includes('Scenario已成功启动'),
    '应该显示成功消息'
  );
  
  console.log('测试3完成: 运行按钮功能\n');
}

/**
 * 测试配置信息显示功能
 */
async function testConfigInfoDisplay() {
  console.log('测试4: 配置信息显示功能');
  
  // 验证popup设置是否显示
  const popupSettingsElement = document.getElementById('scenarioPopupSettings');
  assert(
    popupSettingsElement.style.display === 'block',
    'Popup设置应该显示'
  );
  
  // 验证popup设置内容
  const settingElements = popupSettingsElement.querySelectorAll('.popup-setting');
  assert(
    settingElements.length === 2,
    '应该显示2个popup设置'
  );
  
  // 验证设置名称
  const settingTitles = Array.from(settingElements).map(el => 
    el.querySelector('h3').textContent
  );
  
  assert(
    settingTitles.includes('notification') && settingTitles.includes('autoAssign'),
    '应该显示正确的设置名称'
  );
  
  // 验证设置值
  const notificationSetting = Array.from(settingElements).find(
    el => el.querySelector('h3').textContent === 'notification'
  );
  
  assert(
    notificationSetting && notificationSetting.querySelector('p').textContent === 'email',
    'notification设置应该显示正确的值'
  );
  
  const autoAssignSetting = Array.from(settingElements).find(
    el => el.querySelector('h3').textContent === 'autoAssign'
  );
  
  assert(
    autoAssignSetting && autoAssignSetting.querySelector('p').textContent === 'true',
    'autoAssign设置应该显示正确的值'
  );
  
  // 测试配置按钮
  document.getElementById('configButton').click();
  
  // 验证是否跳转到配置页面
  assert(
    window.location.href === 'config.html?scenario=feature-request',
    '应该跳转到正确的配置页面'
  );
  
  console.log('测试4完成: 配置信息显示功能\n');
}

// ===== 辅助函数 =====

/**
 * 断言函数
 * @param {boolean} condition - 断言条件
 * @param {string} message - 断言消息
 */
function assert(condition, message) {
  testResults.total++;
  
  if (condition) {
    testResults.passed++;
    testResults.details.push({
      result: 'PASS',
      message: message
    });
    console.log(`  ✓ ${message}`);
  } else {
    testResults.failed++;
    testResults.details.push({
      result: 'FAIL',
      message: message
    });
    console.log(`  ✗ ${message}`);
  }
}

/**
 * 打印测试结果摘要
 */
function printTestSummary() {
  console.log('\n===== 测试结果摘要 =====');
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log('========================\n');
  
  if (testResults.failed > 0) {
    console.log('失败的测试:');
    testResults.details
      .filter(detail => detail.result === 'FAIL')
      .forEach(detail => {
        console.log(`  - ${detail.message}`);
      });
  }
}

/**
 * 等待scenario列表加载完成
 */
async function waitForScenarioListLoaded() {
  // 模拟异步加载
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * 等待scenario详情加载完成
 */
async function waitForScenarioDetailsLoaded() {
  // 模拟异步加载
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * 等待运行完成
 */
async function waitForRunCompleted() {
  // 模拟异步操作
  return new Promise(resolve => setTimeout(resolve, 100));
}

// ===== 模拟DOM环境 =====

/**
 * 创建模拟文档对象
 */
function createMockDocument() {
  // 模拟DOM元素存储
  const elements = {};
  
  // 创建基本DOM结构
  createMockElement('userForm', 'form');
  createMockElement('username', 'input', { type: 'text' });
  createMockElement('error-message', 'div');
  createMockElement('scenarioSection', 'section', { style: { display: 'none' } });
  createMockElement('scenarioSelect', 'select');
  createMockElement('scenarioDescription', 'div', { style: { display: 'none' } });
  createMockElement('scenarioPopupSettings', 'div', { style: { display: 'none' } });
  createMockElement('scenarioInputs', 'div');
  createMockElement('runButton', 'button');
  createMockElement('configButton', 'button');
  
  // 添加默认选项到scenarioSelect
  const defaultOption = createMockElement('', 'option');
  defaultOption.value = '';
  defaultOption.textContent = '-- 请选择 --';
  elements['scenarioSelect'].appendChild(defaultOption);
  
  // 模拟document对象
  return {
    addEventListener: function(event, callback) {
      // 模拟DOMContentLoaded事件
      if (event === 'DOMContentLoaded') {
        setTimeout(callback, 0);
      }
    },
    getElementById: function(id) {
      return elements[id] || null;
    },
    createElement: function(tagName) {
      return createMockElement('', tagName.toLowerCase());
    },
    querySelectorAll: function(selector) {
      // 简单的选择器实现
      if (selector === '.input-item') {
        return Object.values(elements).filter(el => el.className === 'input-item');
      }
      if (selector === '.required-mark') {
        return Object.values(elements).filter(el => el.className === 'required-mark');
      }
      if (selector === '.popup-setting') {
        return Object.values(elements).filter(el => el.className === 'popup-setting');
      }
      return [];
    }
  };
  
  /**
   * 创建模拟DOM元素
   * @param {string} id - 元素ID
   * @param {string} tagName - 标签名
   * @param {Object} props - 元素属性
   */
  function createMockElement(id, tagName, props = {}) {
    const element = {
      id: id,
      tagName: tagName.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      style: {
        display: 'block'
      },
      className: '',
      children: [],
      options: [],
      files: [],
      attributes: {},
      addEventListener: function(event, callback) {
        this.eventListeners = this.eventListeners || {};
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(callback);
      },
      dispatchEvent: function(event) {
        if (this.eventListeners && this.eventListeners[event.type]) {
          this.eventListeners[event.type].forEach(callback => {
            // 阻止默认行为
            event.preventDefault = function() {};
            callback.call(this, event);
          });
        }
      },
      setAttribute: function(name, value) {
        this.attributes[name] = value;
      },
      getAttribute: function(name) {
        return this.attributes[name];
      },
      appendChild: function(child) {
        this.children.push(child);
        if (this.tagName === 'SELECT' && child.tagName === 'OPTION') {
          this.options.push(child);
        }
        return child;
      },
      querySelectorAll: function(selector) {
        if (selector === 'h3') {
          return this.children.filter(child => child.tagName === 'H3');
        }
        if (selector === 'p') {
          return this.children.filter(child => child.tagName === 'P');
        }
        return [];
      },
      querySelector: function(selector) {
        const results = this.querySelectorAll(selector);
        return results.length > 0 ? results[0] : null;
      }
    };
    
    // 应用属性
    if (props.style) {
      Object.assign(element.style, props.style);
    }
    
    if (props.type) {
      element.type = props.type;
    }
    
    if (id) {
      elements[id] = element;
    }
    
    return element;
  }
}

/**
 * 创建模拟localStorage
 */
function createMockLocalStorage() {
  const storage = {};
  
  return {
    getItem: function(key) {
      return storage[key] || null;
    },
    setItem: function(key, value) {
      storage[key] = value;
    },
    removeItem: function(key) {
      delete storage[key];
    },
    clear: function() {
      Object.keys(storage).forEach(key => {
        delete storage[key];
      });
    }
  };
}

// ===== 模拟网络请求 =====

// 存储模拟响应
const mockResponses = {};
// 存储请求历史
const fetchHistory = [];

/**
 * 模拟fetch函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 */
async function mockFetch(url, options = {}) {
  const requestOptions = {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || null
  };
  
  // 记录请求
  fetchHistory.push({
    url,
    ...requestOptions
  });
  
  // 查找匹配的模拟响应
  const response = mockResponses[url];
  
  if (!response) {
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' }),
      text: async () => 'Not Found'
    };
  }
  
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => {
      if (typeof response.body === 'string') {
        try {
          return JSON.parse(response.body);
        } catch (e) {
          return { error: 'Invalid JSON' };
        }
      }
      return response.body;
    },
    text: async () => {
      if (typeof response.body === 'object') {
        return JSON.stringify(response.body);
      }
      return response.body;
    }
  };
}

/**
 * 设置模拟fetch响应
 * @param {string} url - 请求URL
 * @param {Object} response - 响应对象
 */
function setMockFetchResponse(url, response) {
  mockResponses[url] = response;
}

/**
 * 获取最后一次fetch请求
 */
function getLastFetchRequest() {
  return fetchHistory.length > 0 ? fetchHistory[fetchHistory.length - 1] : null;
}

// ===== 模拟浏览器API =====

// 存储alert历史
const alertHistory = [];
// 模拟window.location
global.window = {
  location: {
    href: ''
  }
};

/**
 * 模拟alert函数
 * @param {string} message - 提示消息
 */
function mockAlert(message) {
  alertHistory.push(message);
  console.log(`  [Alert] ${message}`);
}

/**
 * 获取最后一次alert消息
 */
function getLastAlert() {
  return alertHistory.length > 0 ? alertHistory[alertHistory.length - 1] : null;
}

/**
 * 模拟Event类
 */
class Event {
  constructor(type) {
    this.type = type;
    this.defaultPrevented = false;
  }
  
  preventDefault() {
    this.defaultPrevented = true;
  }
}

// 全局Event类
global.Event = Event;

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
});