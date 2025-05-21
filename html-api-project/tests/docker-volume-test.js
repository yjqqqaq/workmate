/**
 * Docker Volume 测试脚本
 * 
 * 测试内容：
 * 1. 测试startDocker方法是否能正确获取Docker volumes
 * 2. 测试是否能找到包含"shared-docker-mounts"的volume
 * 3. 测试binds中的路径是否被正确替换
 * 4. 测试容器是否能成功启动
 * 5. 测试完成后清理创建的资源
 */

const fetch = require('node-fetch');
const Docker = require('dockerode');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户
const TEST_USER = 'volume-test-user';

// 存储Docker ID
let testDockerId = null;

// 随机设置和输入
const testSettings = {
  TEST_MODE: 'true',
  DEBUG_LEVEL: 'verbose',
  VOLUME_TEST: 'enabled'
};

const testInputs = JSON.stringify({
  testCase: 'docker-volume-test',
  timestamp: new Date().toISOString(),
  parameters: {
    test: 'volume-binding'
  }
});

// 直接连接Docker进行验证
const docker = new Docker({
  host: 'docker-socket-proxy',
  port: 2375
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
 * 测试1: 启动Docker容器并验证volumes
 */
async function testStartDockerWithVolumes() {
  console.log('\n测试1: 启动Docker容器并验证volumes');
  
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
    console.log(`✅ 测试容器启动成功，ID: ${testDockerId}`);
    console.log(`状态: ${result.data.status}`);
    return true;
  } else {
    console.error(`❌ 测试容器启动失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试2: 验证容器的绑定挂载
 */
async function testContainerBinds() {
  console.log('\n测试2: 验证容器的绑定挂载');
  
  if (!testDockerId) {
    console.error('❌ 无法验证绑定挂载: 测试容器ID不存在');
    return false;
  }
  
  try {
    // 获取容器详细信息
    const container = docker.getContainer(testDockerId);
    const containerInfo = await container.inspect();
    
    // 检查Binds配置
    const binds = containerInfo.HostConfig.Binds;
    
    if (!binds || binds.length === 0) {
      console.error('❌ 容器没有绑定挂载');
      return false;
    }
    
    console.log('容器绑定挂载:');
    binds.forEach(bind => console.log(`- ${bind}`));
    
    // 验证是否包含shared-docker-mounts
    const hasSharedMounts = binds.some(bind => bind.includes('shared-docker-mounts'));
    if (hasSharedMounts) {
      console.log('✅ 绑定挂载包含shared-docker-mounts');
    } else {
      console.error('❌ 绑定挂载不包含shared-docker-mounts');
      return false;
    }
    
    // 验证是否包含dockerId
    const hasDockerIdPath = binds.some(bind => bind.includes(testDockerId));
    if (hasDockerIdPath) {
      console.log(`✅ 绑定挂载包含容器ID: ${testDockerId}`);
    } else {
      console.error(`❌ 绑定挂载不包含容器ID: ${testDockerId}`);
      return false;
    }
    
    // 验证是否包含logs和input目录
    const hasLogsMount = binds.some(bind => bind.includes('/logs:/log'));
    const hasInputMount = binds.some(bind => bind.includes('/input:/workmate-input'));
    
    if (hasLogsMount) {
      console.log('✅ 绑定挂载包含logs目录');
    } else {
      console.error('❌ 绑定挂载不包含logs目录');
      return false;
    }
    
    if (hasInputMount) {
      console.log('✅ 绑定挂载包含input目录');
    } else {
      console.error('❌ 绑定挂载不包含input目录');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 验证绑定挂载失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试3: 验证容器状态
 */
async function testContainerStatus() {
  console.log('\n测试3: 验证容器状态');
  
  if (!testDockerId) {
    console.error('❌ 无法验证容器状态: 测试容器ID不存在');
    return false;
  }
  
  const result = await callApi(`/docker/status/${testDockerId}`);
  
  if (result.success) {
    console.log(`✅ 容器状态查询成功`);
    console.log(`状态: ${result.data.status}`);
    
    // 验证容器是否正在运行
    if (result.data.status === 'running') {
      console.log('✅ 容器正在运行');
      return true;
    } else {
      console.error(`❌ 容器未运行，当前状态: ${result.data.status}`);
      return false;
    }
  } else {
    console.error(`❌ 容器状态查询失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试4: 验证输入文件是否正确挂载
 */
async function testInputFileMount() {
  console.log('\n测试4: 验证输入文件是否正确挂载');
  
  if (!testDockerId) {
    console.error('❌ 无法验证输入文件: 测试容器ID不存在');
    return false;
  }
  
  try {
    // 在容器中执行命令检查文件
    const container = docker.getContainer(testDockerId);
    const exec = await container.exec({
      Cmd: ['ls', '-la', '/workmate-input'],
      AttachStdout: true,
      AttachStderr: true
    });
    
    const stream = await exec.start();
    let output = '';
    
    // 收集输出
    stream.on('data', chunk => {
      output += chunk.toString();
    });
    
    // 等待命令执行完成
    await new Promise(resolve => {
      stream.on('end', resolve);
    });
    
    console.log('容器中/workmate-input目录内容:');
    console.log(output);
    
    // 验证是否包含input.json文件
    if (output.includes('input.json')) {
      console.log('✅ 输入文件input.json已正确挂载');
      return true;
    } else {
      console.error('❌ 输入文件input.json未找到');
      return false;
    }
  } catch (error) {
    console.error(`❌ 验证输入文件挂载失败: ${error.message}`);
    return false;
  }
}

/**
 * 清理测试资源
 */
async function cleanupResources() {
  console.log('\n清理测试资源');
  
  if (!testDockerId) {
    console.log('没有需要清理的资源');
    return true;
  }
  
  const result = await callApi('/docker/state', 'POST', {
    dockerId: testDockerId,
    action: 'remove',
    username: TEST_USER
  });
  
  if (result.success) {
    console.log(`✅ 测试容器(${testDockerId})已成功删除`);
    return true;
  } else {
    console.error(`❌ 测试容器删除失败: ${result.error}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Docker Volume测试...');
  
  try {
    // 测试1: 启动Docker容器并验证volumes
    const test1Result = await testStartDockerWithVolumes();
    if (!test1Result) {
      console.error('测试1失败，无法继续后续测试');
      return;
    }
    
    // 等待Docker启动
    console.log('等待Docker启动...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试2: 验证容器的绑定挂载
    const test2Result = await testContainerBinds();
    
    // 测试3: 验证容器状态
    const test3Result = await testContainerStatus();
    
    // 测试4: 验证输入文件是否正确挂载
    const test4Result = await testInputFileMount();
    
    // 清理测试资源
    const cleanupResult = await cleanupResources();
    
    console.log('\n测试结果总结:');
    console.log(`1. 启动Docker容器并验证volumes: ${test1Result ? '✅ 成功' : '❌ 失败'}`);
    console.log(`2. 验证容器的绑定挂载: ${test2Result ? '✅ 成功' : '❌ 失败'}`);
    console.log(`3. 验证容器状态: ${test3Result ? '✅ 成功' : '❌ 失败'}`);
    console.log(`4. 验证输入文件是否正确挂载: ${test4Result ? '✅ 成功' : '❌ 失败'}`);
    console.log(`5. 清理测试资源: ${cleanupResult ? '✅ 成功' : '❌ 失败'}`);
    
    // 总体测试结果
    const allTestsPassed = test1Result && test2Result && test3Result && test4Result && cleanupResult;
    console.log(`\n总体测试结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    
    // 确保清理资源
    await cleanupResources();
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行过程中发生错误:', error);
  
  // 确保清理资源
  cleanupResources().catch(cleanupError => {
    console.error('清理资源时发生错误:', cleanupError);
  });
});