/**
 * Scenario配置文件管理API测试脚本
 * 
 * 测试内容：
 * 1. 测试获取所有scenario列表API
 * 2. 测试获取特定scenario的yaml文件API
 */

const fetch = require('node-fetch');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

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
 * 测试1: 获取所有scenario列表
 */
async function testGetAllScenarios() {
  console.log('\n测试1: 获取所有scenario列表');
  
  const result = await callApi('/scenarios');
  
  if (result.success) {
    console.log(`✅ 获取所有scenario列表成功`);
    console.log(`scenario数量: ${result.scenarios.length}`);
    
    if (result.scenarios.length > 0) {
      console.log('scenario列表:');
      result.scenarios.forEach(scenario => {
        console.log(`- ${scenario.name} (${scenario.id}): ${scenario.description}`);
      });
    } else {
      console.log('没有找到任何scenario');
    }
  } else {
    console.error(`❌ 获取所有scenario列表失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试2: 获取特定scenario的yaml文件
 */
async function testGetSpecificScenario() {
  console.log('\n测试2: 获取特定scenario的yaml文件');
  
  // 先获取所有scenario列表，选择第一个进行测试
  const listResult = await callApi('/scenarios');
  
  if (!listResult.success || !listResult.scenarios || listResult.scenarios.length === 0) {
    console.error('❌ 无法获取scenario列表或列表为空，无法继续测试');
    return false;
  }
  
  // 选择第一个scenario进行测试
  const testScenario = listResult.scenarios[0];
  console.log(`选择scenario "${testScenario.name}" (${testScenario.id})进行测试`);
  
  // 获取特定scenario的yaml内容
  const result = await callApi(`/scenarios/${testScenario.id}`);
  
  if (result.success) {
    console.log(`✅ 获取scenario "${testScenario.name}" (${testScenario.id})的yaml内容成功`);
    console.log(`yaml内容预览: ${result.content ? result.content.substring(0, 200) : '无内容'}...`);
    
    // 验证yaml内容是否包含name和description
    if (result.content.includes('name:') && result.content.includes('description:')) {
      console.log('✅ yaml内容验证成功: 包含name和description字段');
    } else {
      console.error('❌ yaml内容验证失败: 不包含name或description字段');
    }
  } else {
    console.error(`❌ 获取scenario "${testScenario.id}"的yaml内容失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试3: 获取不存在的scenario
 */
async function testGetNonExistentScenario() {
  console.log('\n测试3: 获取不存在的scenario');
  
  const nonExistentId = 'non-existent-scenario-' + Date.now();
  console.log(`尝试获取不存在的scenario: ${nonExistentId}`);
  
  const result = await callApi(`/scenarios/${nonExistentId}`);
  
  if (!result.success) {
    console.log(`✅ 获取不存在的scenario测试通过: 服务器正确返回错误`);
    console.log(`错误信息: ${result.error}`);
  } else {
    console.error(`❌ 获取不存在的scenario测试失败: 服务器未返回预期的错误`);
  }
  
  return !result.success; // 这个测试期望失败，所以取反
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Scenario配置文件管理API测试...');
  
  // 测试1: 获取所有scenario列表
  const test1Result = await testGetAllScenarios();
  
  // 测试2: 获取特定scenario的yaml文件
  const test2Result = await testGetSpecificScenario();
  
  // 测试3: 获取不存在的scenario
  const test3Result = await testGetNonExistentScenario();
  
  console.log('\n所有测试完成');
  console.log('\n测试结果总结:');
  console.log(`1. 获取所有scenario列表: ${test1Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. 获取特定scenario的yaml文件: ${test2Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`3. 获取不存在的scenario: ${test3Result ? '✅ 成功' : '❌ 失败'}`);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});