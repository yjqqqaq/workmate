/**
 * 简单的RESTful API服务器
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('redis');
const scenarioManager = require('./scenario-manager');
const app = express();
const port = 3000;

// Redis客户端
const redisClient = createClient({
  url: 'redis://redis:6379'
});

// 连接Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis连接成功');
  } catch (err) {
    console.error('Redis连接失败:', err);
  }
})();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../')); // 提供静态文件访问

// API路由
const apiRouter = express.Router();

// 启动Docker容器
apiRouter.post('/docker/start', async (req, res) => {
  const { dockerName, options, username, scenarioId } = req.body;
  
  if (!dockerName) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少Docker容器名称' 
    });
  }
  
  try {
    const result = await API.startDocker(dockerName, options, username, scenarioId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取Docker日志
apiRouter.get('/docker/logs/:dockerId', async (req, res) => {
  const { dockerId } = req.params;
  const { logFile = 'run.log' } = req.query;
  
  if (!dockerId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少Docker ID' 
    });
  }
  
  try {
    const result = await API.getDockerLogs(dockerId, logFile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取Docker输出
apiRouter.get('/docker/output/:dockerId', async (req, res) => {
  const { dockerId } = req.params;
  const { outputFile = 'output.json' } = req.query;
  
  if (!dockerId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少Docker ID' 
    });
  }
  
  try {
    const result = await API.getDockerOutput(dockerId, outputFile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取用户的Docker列表
apiRouter.get('/docker/list/:username', async (req, res) => {
  const { username } = req.params;
  
  if (!username) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少用户名' 
    });
  }
  
  try {
    const result = await API.getUserDockers(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取Docker容器状态
apiRouter.get('/docker/status/:dockerId', async (req, res) => {
  const { dockerId } = req.params;
  
  if (!dockerId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少Docker ID' 
    });
  }
  
  try {
    const result = await API.getDockerStatus(dockerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 调整Docker容器状态
apiRouter.post('/docker/state', async (req, res) => {
  const { dockerId, action, username } = req.body;
  
  if (!dockerId || !action || !username) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：dockerId, action, username' 
    });
  }
  
  // 验证action是否有效
  const validActions = ['start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ 
      success: false, 
      error: `不支持的操作: ${action}，有效操作包括: ${validActions.join(', ')}` 
    });
  }
  
  try {
    const result = await API.updateDockerState(dockerId, action, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动触发Docker资源清理
apiRouter.post('/docker/cleanup', async (req, res) => {
  const { maxAgeInDays = 1 } = req.body;
  
  // 验证maxAgeInDays是否为有效数字
  const ageInDays = Number(maxAgeInDays);
  if (isNaN(ageInDays) || ageInDays <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: '无效的maxAgeInDays参数，必须为正数' 
    });
  }
  
  try {
    console.log(`手动触发Docker资源清理，最大保留天数: ${ageInDays}`);
    const result = await API.cleanupDockerResources(ageInDays);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有scenario的name和description
apiRouter.get('/scenarios', async (req, res) => {
  try {
    const scenarios = await scenarioManager.getAllScenarios();
    res.json({
      success: true,
      scenarios
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 获取指定scenario的完整YAML内容
apiRouter.get('/scenarios/:scenarioId', async (req, res) => {
  const { scenarioId } = req.params;
  
  if (!scenarioId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少scenario ID' 
    });
  }
  
  try {
    const yamlContent = await scenarioManager.getScenarioYaml(scenarioId);
    res.json({
      success: true,
      content: yamlContent
    });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 保存用户在特定scenario下的设置
apiRouter.post('/user-settings', async (req, res) => {
  const { username, scenarioId, settings } = req.body;
  
  if (!username || !scenarioId || !settings) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：username, scenarioId, settings' 
    });
  }
  
  try {
    const result = await API.saveUserSettings(username, scenarioId, settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取用户在特定scenario下的设置
apiRouter.get('/user-settings/:username/:scenarioId', async (req, res) => {
  const { username, scenarioId } = req.params;
  
  if (!username || !scenarioId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：username, scenarioId' 
    });
  }
  
  try {
    const result = await API.getUserSettings(username, scenarioId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取指定用户对特定scenario的配置设置
apiRouter.get('/scenarios/:scenarioId/settings/:username', async (req, res) => {
  const { scenarioId, username } = req.params;
  
  if (!scenarioId || !username) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：scenarioId, username' 
    });
  }
  
  try {
    const result = await API.getUserSettings(username, scenarioId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存指定用户对特定scenario的配置设置
apiRouter.post('/scenarios/:scenarioId/settings/:username', async (req, res) => {
  const { scenarioId, username } = req.params;
  const { settings } = req.body;
  
  if (!scenarioId || !username || !settings) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：scenarioId, username, settings' 
    });
  }
  
  try {
    const result = await API.saveUserSettings(username, scenarioId, settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 注册API路由
app.use('/api', apiRouter);

// 全局API对象
global.API = require('./api.js');

// 启动定时清理任务
const initCleanupTask = async () => {
  try {
    // 默认每天午夜执行一次清理任务
    const cleanupJob = API.initCleanupScheduler('0 0 * * *');
    console.log('Docker和Volume定时清理任务已启动');
    
    // 也可以手动触发一次清理（用于测试）
    // await API.cleanupDockerResources(1);
  } catch (error) {
    console.error('初始化Docker和Volume定时清理任务失败:', error);
  }
};

// 启动服务器
app.listen(port, () => {
  console.log(`RESTful API服务器运行在 http://localhost:${port}`);
  
  // 初始化定时清理任务
  initCleanupTask();
});