/**
 * 用户Scenario设置管理API测试脚本
 * 
 * 测试内容：
 * 1. 保存用户在特定scenario下的设置（POST /api/user-settings）
 * 2. 获取用户在特定scenario下的设置（GET /api/user-settings/:username/:scenarioId）
 * 3. 测试边界情况，如不存在的用户或scenario
 */

const fetch = require('node-fetch');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户
const TEST_USERNAME = 'test-user';
const TEST_SCENARIO_ID = 'feature-request';
const NON_EXISTENT_SCENARIO_ID = 'non-existent-scenario-' + Date.now();

// 测试设置
const TEST_SETTINGS = {
  theme: 'dark',
  fontSize: 14,
  language: 'zh-CN',
  notifications: {
    email: true,
    push: false
  },
  customFields: {
    field1: 'value1',
    field2: 'value2'
  }
};

/**
 * 发送API请求
 * @param {string} endpoint - API端点
 * @param {string} method - HTTP方法
 * @param {object} body - 请求体
 * @returns {Promise<object>} - 响应对象
 */
async function callApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error(`API请求失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 测试1: 保存用户在特定scenario下的设置
 */
async function testSaveUserSettings() {
  console.log('\n测试1: 保存用户在特定scenario下的设置');
  
  const result = await callApi('/user-settings', 'POST', {
    username: TEST_USERNAME,
    scenarioId: TEST_SCENARIO_ID,
    settings: TEST_SETTINGS
  });
  
  if (result.success) {
    console.log(`✅ 保存用户${TEST_USERNAME}在scenario ${TEST_SCENARIO_ID}下的设置成功`);
    console.log(`消息: ${result.message}`);
  } else {
    console.error(`❌ 保存用户设置失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试2: 获取用户在特定scenario下的设置
 */
async function testGetUserSettings() {
  console.log('\n测试2: 获取用户在特定scenario下的设置');
  
  const result = await callApi(`/user-settings/${TEST_USERNAME}/${TEST_SCENARIO_ID}`);
  
  if (result.success) {
    console.log(`✅ 获取用户${TEST_USERNAME}在scenario ${TEST_SCENARIO_ID}下的设置成功`);
    console.log(`设置内容: ${JSON.stringify(result.value)}`);
    
    // 验证返回的设置是否与保存的设置一致
    const settingsMatch = JSON.stringify(result.value) === JSON.stringify(TEST_SETTINGS);
    if (settingsMatch) {
      console.log('✅ 验证成功: 返回的设置与保存的设置一致');
    } else {
      console.error('❌ 验证失败: 返回的设置与保存的设置不一致');
    }
  } else {
    console.error(`❌ 获取用户设置失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试3: 获取不存在的用户scenario设置
 */
async function testGetNonExistentSettings() {
  console.log('\n测试3: 获取不存在的用户scenario设置');
  
  const result = await callApi(`/user-settings/${TEST_USERNAME}/${NON_EXISTENT_SCENARIO_ID}`);
  
  if (result.success) {
    console.log(`✅ 获取不存在的scenario设置请求成功处理`);
    console.log(`返回的设置: ${JSON.stringify(result.value)}`);
    
    // 验证返回的是空对象
    const isEmptyObject = Object.keys(result.value).length === 0;
    if (isEmptyObject) {
      console.log('✅ 验证成功: 返回了空对象');
    } else {
      console.error('❌ 验证失败: 返回的不是空对象');
    }
  } else {
    console.error(`❌ 获取不存在的scenario设置请求处理失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试4: 使用无效参数保存设置
 */
async function testSaveSettingsWithInvalidParams() {
  console.log('\n测试4: 使用无效参数保存设置');
  
  // 缺少scenarioId参数
  const result = await callApi('/user-settings', 'POST', {
    username: TEST_USERNAME,
    settings: TEST_SETTINGS
  });
  
  if (!result.success) {
    console.log(`✅ 使用无效参数保存设置请求被正确拒绝`);
    console.log(`错误信息: ${result.error}`);
  } else {
    console.error(`❌ 使用无效参数保存设置请求被错误地接受了`);
  }
  
  return !result.success; // 这个测试期望失败，所以取反
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始用户Scenario设置管理API测试...');
  
  // 测试1: 保存用户在特定scenario下的设置
  const test1Result = await testSaveUserSettings();
  
  // 测试2: 获取用户在特定scenario下的设置
  const test2Result = await testGetUserSettings();
  
  // 测试3: 获取不存在的用户scenario设置
  const test3Result = await testGetNonExistentSettings();
  
  // 测试4: 使用无效参数保存设置
  const test4Result = await testSaveSettingsWithInvalidParams();
  
  console.log('\n所有测试完成');
  console.log('\n测试结果总结:');
  console.log(`1. 保存用户在特定scenario下的设置: ${test1Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. 获取用户在特定scenario下的设置: ${test2Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`3. 获取不存在的用户scenario设置: ${test3Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`4. 使用无效参数保存设置: ${test4Result ? '✅ 成功' : '❌ 失败'}`);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});