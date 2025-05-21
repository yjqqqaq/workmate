/**
 * Docker 权限问题修复测试脚本
 * 
 * 测试内容：
 * 1. 测试startDocker方法是否能够成功创建目录结构
 * 2. 验证创建的目录是否具有正确的权限
 * 3. 测试Docker容器是否能够成功启动
 * 4. 测试完成后清理创建的资源
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户
const TEST_USER = 'permission-test-user';

// 存储Docker ID
let testDockerId = null;

// 随机设置和输入
const testSettings = {
  TEST_MODE: 'true',
  DEBUG_LEVEL: 'verbose',
  PERMISSION_TEST: 'true'
};

const testInputs = JSON.stringify({
  testCase: 'docker-permission-test',
  timestamp: new Date().toISOString(),
  data: {
    test: 'permission-test'
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
 * 测试1: 启动Docker容器并验证目录创建
 */
async function testStartDockerAndDirectoryCreation() {
  console.log('\n测试1: 启动Docker容器并验证目录创建');
  
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
    console.log(`✅ 用户${TEST_USER}的Docker容器启动成功，ID: ${testDockerId}`);
    console.log(`状态: ${result.data.status}`);
    
    // 验证目录是否创建成功
    const containerMountPath = path.join('/shared-mounts', testDockerId);
    const logDirPath = path.join(containerMountPath, 'logs');
    const inputDirPath = path.join(containerMountPath, 'input');
    
    let dirCheckSuccess = true;
    
    if (!fs.existsSync(containerMountPath)) {
      console.error(`❌ 容器挂载目录未创建: ${containerMountPath}`);
      dirCheckSuccess = false;
    } else {
      console.log(`✅ 容器挂载目录创建成功: ${containerMountPath}`);
    }
    
    if (!fs.existsSync(logDirPath)) {
      console.error(`❌ 日志目录未创建: ${logDirPath}`);
      dirCheckSuccess = false;
    } else {
      console.log(`✅ 日志目录创建成功: ${logDirPath}`);
    }
    
    if (!fs.existsSync(inputDirPath)) {
      console.error(`❌ 输入目录未创建: ${inputDirPath}`);
      dirCheckSuccess = false;
    } else {
      console.log(`✅ 输入目录创建成功: ${inputDirPath}`);
    }
    
    return { success: result.success, dirCheckSuccess };
  } else {
    console.error(`❌ 用户${TEST_USER}的Docker容器启动失败: ${result.error}`);
    return { success: false, dirCheckSuccess: false };
  }
}

/**
 * 测试2: 验证目录权限
 */
async function testDirectoryPermissions() {
  console.log('\n测试2: 验证目录权限');
  
  if (!testDockerId) {
    console.error('❌ 无法验证目录权限: Docker ID不存在');
    return false;
  }
  
  try {
    const containerMountPath = path.join('/shared-mounts', testDockerId);
    const logDirPath = path.join(containerMountPath, 'logs');
    const inputDirPath = path.join(containerMountPath, 'input');
    
    // 检查目录权限
    const containerMountStats = fs.statSync(containerMountPath);
    const logDirStats = fs.statSync(logDirPath);
    const inputDirStats = fs.statSync(inputDirPath);
    
    // 将权限转换为八进制字符串并检查
    const containerMountMode = (containerMountStats.mode & 0o777).toString(8);
    const logDirMode = (logDirStats.mode & 0o777).toString(8);
    const inputDirMode = (inputDirStats.mode & 0o777).toString(8);
    
    console.log(`容器挂载目录权限: ${containerMountMode}`);
    console.log(`日志目录权限: ${logDirMode}`);
    console.log(`输入目录权限: ${inputDirMode}`);
    
    // 验证权限是否正确（应为777或类似的可读写执行权限）
    const hasCorrectPermissions = 
      containerMountMode >= '755' && 
      logDirMode >= '755' && 
      inputDirMode >= '755';
    
    if (hasCorrectPermissions) {
      console.log('✅ 所有目录都具有正确的权限');
    } else {
      console.error('❌ 一个或多个目录权限不足');
    }
    
    // 测试写入权限
    const testFilePath = path.join(logDirPath, 'permission-test.log');
    fs.writeFileSync(testFilePath, 'Permission test content');
    console.log(`✅ 成功写入测试文件: ${testFilePath}`);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log(`✅ 成功删除测试文件: ${testFilePath}`);
    
    return hasCorrectPermissions;
  } catch (error) {
    console.error(`❌ 验证目录权限时出错: ${error.message}`);
    return false;
  }
}

/**
 * 测试3: 验证Docker容器状态
 */
async function testDockerContainerStatus() {
  console.log('\n测试3: 验证Docker容器状态');
  
  if (!testDockerId) {
    console.error('❌ 无法验证Docker容器状态: Docker ID不存在');
    return false;
  }
  
  const result = await callApi(`/docker/status/${testDockerId}`);
  
  if (result.success) {
    console.log(`✅ Docker容器状态查询成功`);
    console.log(`状态: ${result.data.status}`);
    console.log(`名称: ${result.data.name}`);
    
    // 验证容器是否正在运行
    const isRunning = result.data.status === 'running';
    if (isRunning) {
      console.log('✅ Docker容器正在运行');
    } else {
      console.error(`❌ Docker容器未运行，当前状态: ${result.data.status}`);
    }
    
    return isRunning;
  } else {
    console.error(`❌ Docker容器状态查询失败: ${result.error}`);
    return false;
  }
}

/**
 * 测试4: 清理资源
 */
async function testCleanup() {
  console.log('\n测试4: 清理资源');
  
  if (!testDockerId) {
    console.log('⚠️ 无需清理: 没有创建Docker容器');
    return true;
  }
  
  // 停止并删除Docker容器
  const result = await callApi('/docker/state', 'POST', {
    dockerId: testDockerId,
    action: 'remove',
    username: TEST_USER
  });
  
  if (result.success) {
    console.log(`✅ Docker容器清理成功，ID: ${testDockerId}`);
    
    // 验证目录是否仍然存在（应该存在，因为我们只删除了容器）
    const containerMountPath = path.join('/shared-mounts', testDockerId);
    if (fs.existsSync(containerMountPath)) {
      console.log(`✅ 容器挂载目录仍然存在: ${containerMountPath}`);
    } else {
      console.log(`⚠️ 容器挂载目录已被删除: ${containerMountPath}`);
    }
    
    return true;
  } else {
    console.error(`❌ Docker容器清理失败: ${result.error}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Docker权限测试...');
  
  // 测试1: 启动Docker容器并验证目录创建
  const test1Result = await testStartDockerAndDirectoryCreation();
  if (!test1Result.success) {
    console.error('测试1失败，无法继续后续测试');
    return;
  }
  
  // 等待Docker启动
  console.log('等待Docker启动...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试2: 验证目录权限
  const test2Result = await testDirectoryPermissions();
  
  // 测试3: 验证Docker容器状态
  const test3Result = await testDockerContainerStatus();
  
  // 测试4: 清理资源
  const test4Result = await testCleanup();
  
  console.log('\n所有测试完成');
  console.log('\n测试结果总结:');
  console.log(`1. 启动Docker容器并验证目录创建: ${test1Result.success ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   目录检查: ${test1Result.dirCheckSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. 验证目录权限: ${test2Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`3. 验证Docker容器状态: ${test3Result ? '✅ 成功' : '❌ 失败'}`);
  console.log(`4. 清理资源: ${test4Result ? '✅ 成功' : '❌ 失败'}`);
  
  // 总体结果
  const overallSuccess = test1Result.success && test1Result.dirCheckSuccess && 
                         test2Result && test3Result && test4Result;
  
  console.log(`\n总体结果: ${overallSuccess ? '✅ 测试通过' : '❌ 测试失败'}`);
  
  if (overallSuccess) {
    console.log('\n✅ 权限问题修复验证成功！目录创建、权限设置和Docker容器启动都正常工作。');
  } else {
    console.log('\n❌ 权限问题修复验证失败！请检查错误信息并修复问题。');
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});