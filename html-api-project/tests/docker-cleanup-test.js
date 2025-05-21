/**
 * Docker和Volume清理功能测试脚本
 * 
 * 测试内容：
 * 1. 测试手动触发清理API端点(/api/docker/cleanup)
 * 2. 测试清理超过指定时间的Docker容器和volume
 * 3. 验证Redis中的记录是否也被正确清理
 */

const fetch = require('node-fetch');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户
const TEST_USER = 'cleanup-test-user';

// 存储Docker ID
let testDockerId = null;

// 随机设置和输入
const testSettings = {
  TEST_MODE: 'true',
  DEBUG_LEVEL: 'verbose',
  CLEANUP_TEST: 'true'
};

const testInputs = JSON.stringify({
  testCase: 'docker-cleanup-test',
  timestamp: new Date().toISOString(),
  parameters: {
    test: 'cleanup'
  }
});

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
 * 测试1: 启动测试用Docker容器
 */
async function testStartTestDocker() {
  console.log('\n测试1: 启动测试用Docker容器');
  
  const result = await callApi('/docker/start', 'POST', {
    dockerName: 'alpine:latest',
    username: TEST_USER,
    options: {
      settings: testSettings,
      inputs: testInputs
    }
  });
  
  if (result.success) {
    testDockerId = result.data.containerId;
    console.log(`✅ 测试用Docker容器启动成功，ID: ${testDockerId}`);
    console.log(`状态: ${result.data.status}`);
    console.log(`启动时间: ${result.data.startedAt}`);
  } else {
    console.error(`❌ 测试用Docker容器启动失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试2: 验证Docker容器在Redis中的记录
 */
async function testVerifyDockerInRedis() {
  console.log('\n测试2: 验证Docker容器在Redis中的记录');
  
  if (!testDockerId) {
    console.error('❌ 无法验证Redis记录: 测试用Docker ID不存在');
    return false;
  }
  
  // 通过获取用户的Docker列表间接验证Redis记录
  const result = await callApi(`/docker/list/${TEST_USER}`);
  
  if (result.success) {
    const dockerFound = result.data.some(docker => docker.containerId === testDockerId);
    
    if (dockerFound) {
      console.log(`✅ 测试用Docker容器在Redis中的记录验证成功`);
      console.log(`用户 ${TEST_USER} 的Docker列表中包含ID为 ${testDockerId} 的容器`);
      return true;
    } else {
      console.error(`❌ 测试用Docker容器在Redis中的记录验证失败`);
      console.error(`用户 ${TEST_USER} 的Docker列表中不包含ID为 ${testDockerId} 的容器`);
      return false;
    }
  } else {
    console.error(`❌ 获取用户Docker列表失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试3: 手动触发清理API端点，但设置较长的保留时间（不清理刚创建的容器）
 */
async function testCleanupWithLongRetention() {
  console.log('\n测试3: 手动触发清理API端点（较长保留时间）');
  
  // 设置30天的保留期，确保不会清理刚创建的容器
  const result = await callApi('/docker/cleanup', 'POST', {
    maxAgeInDays: 30
  });
  
  if (result.success) {
    console.log(`✅ 清理API调用成功`);
    console.log(`清理结果: 清理了 ${result.data.cleanedCount} 个资源`);
    console.log(`截止时间: ${result.data.cutoffTime}`);
    
    // 验证我们的测试容器没有被清理
    const verifyResult = await testVerifyDockerInRedis();
    if (verifyResult) {
      console.log(`✅ 验证成功: 测试容器未被清理`);
      return true;
    } else {
      console.error(`❌ 验证失败: 测试容器被错误地清理了`);
      return false;
    }
  } else {
    console.error(`❌ 清理API调用失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试4: 手动触发清理API端点，设置较短的保留时间（应清理刚创建的容器）
 */
async function testCleanupWithShortRetention() {
  console.log('\n测试4: 手动触发清理API端点（较短保留时间）');
  
  // 设置0.0001天（约8.64秒）的保留期，确保会清理刚创建的容器
  const result = await callApi('/docker/cleanup', 'POST', {
    maxAgeInDays: 0.0001
  });
  
  if (result.success) {
    console.log(`✅ 清理API调用成功`);
    console.log(`清理结果: 清理了 ${result.data.cleanedCount} 个资源`);
    console.log(`截止时间: ${result.data.cutoffTime}`);
    
    // 验证我们的测试容器已被清理
    const listResult = await callApi(`/docker/list/${TEST_USER}`);
    
    if (listResult.success) {
      const dockerFound = listResult.data.some(docker => docker.containerId === testDockerId);
      
      if (!dockerFound) {
        console.log(`✅ 验证成功: 测试容器已被清理`);
        return true;
      } else {
        console.error(`❌ 验证失败: 测试容器未被清理`);
        return false;
      }
    } else {
      console.error(`❌ 获取用户Docker列表失败: ${listResult.error}`);
      return false;
    }
  } else {
    console.error(`❌ 清理API调用失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试5: 验证Docker容器状态（应该已被清理）
 */
async function testVerifyDockerCleaned() {
  console.log('\n测试5: 验证Docker容器状态（应该已被清理）');
  
  if (!testDockerId) {
    console.error('❌ 无法验证Docker状态: 测试用Docker ID不存在');
    return false;
  }
  
  const result = await callApi(`/docker/status/${testDockerId}`);
  
  // 如果容器已被清理，API应返回错误
  if (!result.success) {
    console.log(`✅ 验证成功: 无法获取已清理容器的状态，错误信息: ${result.error}`);
    return true;
  } else {
    console.error(`❌ 验证失败: 仍然能够获取已清理容器的状态`);
    console.error(`容器状态: ${result.data.status}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Docker和Volume清理功能测试...');
  
  // 测试1: 启动测试用Docker容器
  const test1Result = await testStartTestDocker();
  if (!test1Result) {
    console.error('测试1失败，无法继续后续测试');
    return;
  }
  
  // 等待Docker启动
  console.log('等待Docker启动...');
  await sleep(2000);
  
  // 测试2: 验证Docker容器在Redis中的记录
  const test2Result = await testVerifyDockerInRedis();
  if (!test2Result) {
    console.error('测试2失败，无法继续后续测试');
    return;
  }
  
  // 测试3: 手动触发清理API端点，但设置较长的保留时间
  const test3Result = await testCleanupWithLongRetention();
  
  // 测试4: 手动触发清理API端点，设置较短的保留时间
  const test4Result = await testCleanupWithShortRetention();
  
  // 等待清理操作完成
  console.log('等待清理操作完成...');
  await sleep(2000);
  
  // 测试5: 验证Docker容器状态（应该已被清理）
  const test5Result = await testVerifyDockerCleaned();
  
  console.log('\n所有测试完成');
  console.log('\n测试结果总结:');
  console.log(`1. 启动测试用Docker容器: ${test1Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. 验证Docker容器在Redis中的记录: ${test2Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`3. 手动触发清理API（较长保留时间）: ${test3Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`4. 手动触发清理API（较短保留时间）: ${test4Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`5. 验证Docker容器已被清理: ${test5Result ? '✅ 成功' : '❌ 失败'}`);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});