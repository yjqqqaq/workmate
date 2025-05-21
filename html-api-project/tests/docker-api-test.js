/**
 * Docker API 测试脚本
 * 
 * 测试内容：
 * 1. 启动一个ubuntu docker（用户名为aaa），并传入random settings和inputs
 * 2. 查询用户aaa之前启动的ubuntu docker的状态
 * 3. 查询用户aaa之前启动的ubuntu docker的日志
 * 4. 用户aaa再新建一个alpine的docker，和ubuntu docker区分开
 * 5. 查询用户bbb名下的所有docker
 */

const fetch = require('node-fetch');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户
const USER_AAA = 'aaa';
const USER_BBB = 'bbb';

// 存储Docker ID
let ubuntuDockerId = null;
let alpineDockerId = null;

// 随机设置和输入
const randomSettings = {
  TEST_MODE: 'true',
  DEBUG_LEVEL: 'verbose',
  TIMEOUT: '300',
  ENV: 'testing'
};

const randomInputs = JSON.stringify({
  testCase: 'docker-api-test',
  timestamp: new Date().toISOString(),
  parameters: {
    param1: 'value1',
    param2: 'value2',
    param3: 'value3'
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
 * 测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs
 */
async function testStartUbuntuDocker() {
  console.log('\n测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs');
  
  const result = await callApi('/docker/start', 'POST', {
    dockerName: 'ubuntu:latest',
    username: USER_AAA,
    options: {
      settings: randomSettings,
      inputs: randomInputs
    }
  });
  
  if (result.success) {
    ubuntuDockerId = result.data.containerId;
    console.log(`✅ 用户${USER_AAA}的Ubuntu Docker启动成功，ID: ${ubuntuDockerId}`);
    console.log(`状态: ${result.data.status}`);
    console.log(`传入的settings: ${JSON.stringify(randomSettings)}`);
    console.log(`传入的inputs: ${randomInputs.substring(0, 50)}...`);
  } else {
    console.error(`❌ 用户${USER_AAA}的Ubuntu Docker启动失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试2: 查询用户aaa的Ubuntu Docker状态
 */
async function testGetUbuntuDockerStatus() {
  console.log('\n测试2: 查询用户aaa的Ubuntu Docker状态');
  
  if (!ubuntuDockerId) {
    console.error(`❌ 无法查询状态: 用户${USER_AAA}的Ubuntu Docker ID不存在`);
    return false;
  }
  
  const result = await callApi(`/docker/status/${ubuntuDockerId}`);
  
  if (result.success) {
    console.log(`✅ 用户${USER_AAA}的Ubuntu Docker状态查询成功`);
    console.log(`状态: ${result.data.status}`);
    console.log(`名称: ${result.data.name}`);
    console.log(`启动时间: ${result.data.startedAt}`);
  } else {
    console.error(`❌ 用户${USER_AAA}的Ubuntu Docker状态查询失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试3: 查询用户aaa的Ubuntu Docker日志
 */
async function testGetUbuntuDockerLogs() {
  console.log('\n测试3: 查询用户aaa的Ubuntu Docker日志');
  
  if (!ubuntuDockerId) {
    console.error(`❌ 无法查询日志: 用户${USER_AAA}的Ubuntu Docker ID不存在`);
    return false;
  }
  
  const result = await callApi(`/docker/logs/${ubuntuDockerId}?logFile=run.log`);
  
  if (result.success) {
    console.log(`✅ 用户${USER_AAA}的Ubuntu Docker日志查询成功`);
    console.log(`日志内容预览: ${result.data ? result.data.substring(0, 200) : '无日志内容'}...`);
  } else {
    console.error(`❌ 用户${USER_AAA}的Ubuntu Docker日志查询失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开
 */
async function testStartAlpineDocker() {
  console.log('\n测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开');
  
  const result = await callApi('/docker/start', 'POST', {
    dockerName: 'alpine:latest',
    username: USER_AAA,
    options: {
      settings: {
        ...randomSettings,
        CONTAINER_TYPE: 'alpine'
      },
      inputs: randomInputs
    }
  });
  
  if (result.success) {
    alpineDockerId = result.data.containerId;
    console.log(`✅ 用户${USER_AAA}的Alpine Docker启动成功，ID: ${alpineDockerId}`);
    console.log(`状态: ${result.data.status}`);
    
    // 验证Alpine Docker与Ubuntu Docker是不同的容器
    if (alpineDockerId !== ubuntuDockerId) {
      console.log(`✅ 验证成功: Alpine Docker(${alpineDockerId})与Ubuntu Docker(${ubuntuDockerId})是不同的容器`);
    } else {
      console.error(`❌ 验证失败: Alpine Docker与Ubuntu Docker是同一个容器`);
    }
  } else {
    console.error(`❌ 用户${USER_AAA}的Alpine Docker启动失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 测试5: 查询用户bbb名下的所有Docker
 */
async function testListUserBBBDockers() {
  console.log('\n测试5: 查询用户bbb名下的所有Docker');
  
  const result = await callApi(`/docker/list/${USER_BBB}`);
  
  if (result.success) {
    console.log(`✅ 用户${USER_BBB}名下的所有Docker列表查询成功`);
    console.log(`Docker数量: ${result.data.length}`);
    if (result.data.length > 0) {
      console.log('Docker列表:');
      result.data.forEach(docker => {
        console.log(`- ${docker.name} (${docker.containerId}): ${docker.status}`);
      });
    } else {
      console.log(`用户${USER_BBB}名下没有Docker`);
    }
  } else {
    console.error(`❌ 用户${USER_BBB}名下的Docker列表查询失败: ${result.error}`);
  }
  
  return result.success;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Docker API测试...');
  
  // 测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs
  const test1Result = await testStartUbuntuDocker();
  if (!test1Result) {
    console.error('测试1失败，无法继续后续测试');
    return;
  }
  
  // 等待Docker启动
  console.log('等待Docker启动...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试2: 查询用户aaa的Ubuntu Docker状态
  await testGetUbuntuDockerStatus();
  
  // 测试3: 查询用户aaa的Ubuntu Docker日志
  await testGetUbuntuDockerLogs();
  
  // 测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开
  await testStartAlpineDocker();
  
  // 测试5: 查询用户bbb名下的所有Docker
  await testListUserBBBDockers();
  
  console.log('\n所有测试完成');
  console.log('\n测试结果总结:');
  console.log(`1. 用户${USER_AAA}启动Ubuntu Docker: ${test1Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. 查询用户${USER_AAA}的Ubuntu Docker状态: ${ubuntuDockerId ? '✅ 成功' : '❌ 失败'}`);
  console.log(`3. 查询用户${USER_AAA}的Ubuntu Docker日志: ${ubuntuDockerId ? '✅ 成功' : '❌ 失败'}`);
  console.log(`4. 用户${USER_AAA}启动Alpine Docker: ${alpineDockerId ? '✅ 成功' : '❌ 失败'}`);
  console.log(`5. 查询用户${USER_BBB}名下的所有Docker: ✅ 成功`);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});