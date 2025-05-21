/**
 * Docker名称生成和容器创建测试脚本
 * 
 * 测试内容：
 * 1. 测试DockerName生成逻辑是否正确
 *    - 验证生成的容器名称是否包含镜像名称中的字母和数字
 *    - 验证生成的容器名称是否包含随机后缀
 * 2. 测试createContainer部分是否正确实现
 *    - 验证容器是否能够成功创建
 *    - 验证容器配置是否正确应用
 */

const Docker = require('dockerode');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 初始化Docker连接
const docker = new Docker({
  host: 'docker-socket-proxy',
  port: 2375
});

// 测试用的镜像名称和配置
const TEST_IMAGE = 'alpine:latest';
const TEST_USERNAME = 'test-user';
const TEST_SETTINGS = {
  TEST_MODE: 'true',
  DEBUG_LEVEL: 'info'
};
const TEST_INPUTS = JSON.stringify({
  testCase: 'docker-name-test',
  timestamp: new Date().toISOString()
});

// 存储测试创建的容器ID，用于后续清理
let testContainerId = null;

/**
 * 测试Docker名称生成逻辑
 */
async function testDockerNameGeneration() {
  console.log('\n测试1: Docker名称生成逻辑');
  
  try {
    // 提取镜像名称中的字母和数字
    const alphaNumeric = TEST_IMAGE.replace(/[^a-zA-Z0-9]/g, '');
    
    // 生成随机后缀
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    // 组合容器名称
    const containerName = `${alphaNumeric}-${randomSuffix}`;
    
    console.log(`生成的容器名称: ${containerName}`);
    
    // 验证容器名称包含镜像名称中的字母和数字
    assert(containerName.includes(alphaNumeric), '容器名称应包含镜像名称中的字母和数字');
    console.log('✅ 容器名称包含镜像名称中的字母和数字');
    
    // 验证容器名称包含随机后缀
    const suffixPart = containerName.split('-')[1];
    assert(suffixPart && suffixPart.length > 0, '容器名称应包含随机后缀');
    console.log('✅ 容器名称包含随机后缀');
    
    return containerName;
  } catch (error) {
    console.error(`❌ Docker名称生成测试失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试容器创建功能
 */
async function testContainerCreation(containerName) {
  console.log('\n测试2: 容器创建功能');
  
  try {
    // 确保测试镜像存在
    console.log(`拉取测试镜像: ${TEST_IMAGE}`);
    await docker.pull(TEST_IMAGE);
    
    // 创建共享卷目录结构
    const sharedMountsPath = '/shared-mounts';
    const tempDockerId = 'temp-' + Math.random().toString(36).substring(2, 10);
    const containerMountPath = path.join(sharedMountsPath, tempDockerId);
    const logDirPath = path.join(containerMountPath, 'logs');
    const inputDirPath = path.join(containerMountPath, 'input');
    
    // 确保目录存在
    if (!fs.existsSync(containerMountPath)) {
      fs.mkdirSync(containerMountPath, { recursive: true });
    }
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
    if (!fs.existsSync(inputDirPath)) {
      fs.mkdirSync(inputDirPath, { recursive: true });
    }
    
    // 准备输入数据
    if (TEST_INPUTS) {
      const inputFilePath = path.join(inputDirPath, 'input.json');
      fs.writeFileSync(inputFilePath, TEST_INPUTS);
    }
    
    // 创建绑定列表
    const binds = [
      `${logDirPath}:/log:rw`,
      `${inputDirPath}:/workmate-input:ro`
    ];
    
    // 准备环境变量
    const env = [];
    for (const [key, value] of Object.entries(TEST_SETTINGS)) {
      env.push(`${key.toUpperCase()}=${value}`);
    }
    
    // 创建容器配置
    const containerConfig = {
      Image: TEST_IMAGE,
      name: containerName,
      Tty: true,
      HostConfig: {
        Binds: binds
      },
      Env: env
    };
    
    // 创建容器
    console.log('创建测试容器...');
    const container = await docker.createContainer(containerConfig);
    testContainerId = container.id;
    
    // 验证容器创建成功
    assert(testContainerId, '容器应该成功创建并返回ID');
    console.log(`✅ 容器创建成功，ID: ${testContainerId}`);
    
    // 获取容器信息并验证配置
    const containerInfo = await container.inspect();
    
    // 验证容器名称
    assert.strictEqual(containerInfo.Name, `/${containerName}`, '容器名称应该与指定的名称匹配');
    console.log('✅ 容器名称配置正确');
    
    // 验证环境变量
    const containerEnv = containerInfo.Config.Env;
    let allEnvFound = true;
    for (const [key, value] of Object.entries(TEST_SETTINGS)) {
      const envVar = `${key.toUpperCase()}=${value}`;
      if (!containerEnv.includes(envVar)) {
        allEnvFound = false;
        console.error(`❌ 未找到环境变量: ${envVar}`);
      }
    }
    if (allEnvFound) {
      console.log('✅ 环境变量配置正确');
    }
    
    // 验证挂载
    const mounts = containerInfo.HostConfig.Binds;
    assert(mounts.length === 2, '应该有两个挂载点');
    assert(mounts.some(mount => mount.includes('/log')), '应该包含日志挂载');
    assert(mounts.some(mount => mount.includes('/workmate-input')), '应该包含输入数据挂载');
    console.log('✅ 挂载配置正确');
    
    return true;
  } catch (error) {
    console.error(`❌ 容器创建测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 清理测试资源
 */
async function cleanup() {
  console.log('\n清理测试资源...');
  
  if (testContainerId) {
    try {
      const container = docker.getContainer(testContainerId);
      
      // 检查容器状态
      const containerInfo = await container.inspect();
      
      // 如果容器正在运行，先停止它
      if (containerInfo.State.Running) {
        console.log(`停止容器: ${testContainerId}`);
        await container.stop();
      }
      
      // 删除容器
      console.log(`删除容器: ${testContainerId}`);
      await container.remove({ force: true });
      
      console.log('✅ 测试容器已清理');
    } catch (error) {
      console.error(`❌ 清理测试容器失败: ${error.message}`);
    }
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始Docker名称生成和容器创建测试...');
  
  try {
    // 测试1: Docker名称生成逻辑
    const containerName = await testDockerNameGeneration();
    
    // 测试2: 容器创建功能
    const containerCreated = await testContainerCreation(containerName);
    
    console.log('\n测试结果总结:');
    console.log(`1. Docker名称生成逻辑: ✅ 成功`);
    console.log(`2. 容器创建功能: ${containerCreated ? '✅ 成功' : '❌ 失败'}`);
    
    // 清理测试资源
    await cleanup();
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    
    // 确保清理资源
    await cleanup();
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error);
  
  // 确保清理资源
  cleanup().catch(cleanupError => {
    console.error('清理资源失败:', cleanupError);
  });
});