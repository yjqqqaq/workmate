/**
 * API 接口封装
 */
const Docker = require('dockerode');
const e = require('express');
const { createClient } = require('redis');
const schedule = require('node-schedule');

const API = {
    // 基础配置
    config: {
        apiBaseUrl: 'http://localhost:3001',
        gitlabUrl: '',
        apiUrl: '',
        accessToken: '',
        controlProjectId: null
    },
    
    // Docker相关依赖
    docker: null,
    
    // Redis客户端
    redisClient: null,
    
    // 初始化Redis客户端
    async initRedisClient() {
        if (!this.redisClient) {
            this.redisClient = createClient({
                url: 'redis://redis:6379'
            });
            
            try {
                await this.redisClient.connect();
                console.log('API模块Redis连接成功');
            } catch (err) {
                console.error('API模块Redis连接失败:', err);
                throw err;
            }
        }
        return this.redisClient;
    },
    
    // 读取Docker日志
    async getDockerLogs(dockerId, logFile = 'run.log') {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 从Redis获取子docker对应的volume信息
            const volumeKey = `docker:${dockerId}`;
            const {volumeName, containerName} = await this.redisClient.hGetAll(volumeKey) ; 
            // const volumeName = await this.redisClient.hget(volumeKey, 'volumeName');
            // const containerName = await this.redisClient.hget(volumeKey, 'containerName') ; 
            
            if (!volumeName) {
                throw new Error(`未找到Docker ${dockerId}对应的volume信息`);
            }
            
            console.log(`获取到Docker ${dockerId}的volume: ${volumeName}`);
            
            
            sharedVolumeName = await this.getSharedVolumeName() ; 
            // 使用共享卷路径
            const sharedMountsPath = '/shared-mounts';
            const containerMountPath = path.join(sharedMountsPath, containerName);
            const logDirPath = path.join(containerMountPath, 'logs');
            
            // 确保目录存在
            if (!fs.existsSync(logDirPath)) {
                fs.mkdirSync(logDirPath, { recursive: true, mode: 0o777 });
                console.log(`创建日志目录: ${logDirPath}`);
            }
            
            // 创建一个busybox容器来复制日志
            try {
                // 生成唯一的容器名称
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const busyboxName = `copy-logs-${dockerId}-${randomSuffix}`;
                
                console.log(`创建busybox容器 ${busyboxName} 来复制日志文件`);
                
                // 创建busybox容器
                const busyboxContainer = await this.docker.createContainer({
                    Image: 'busybox:latest',
                    name: busyboxName,
                    Cmd: ['sh', '-c', `cp -f /source/logs/${logFile} /dest/${containerName}/logs/ 2>/dev/null || echo "日志文件不存在"`],
                    HostConfig: {
                        Binds: [
                            `${volumeName}:/source`,
                            `${sharedVolumeName}:/dest`
                        ],
                        AutoRemove: true
                    }
                });
                
                // 启动busybox容器并等待完成
                await busyboxContainer.start();
                
                // 等待容器完成复制操作
                const stream = await busyboxContainer.wait();
                const data = await stream;
                
                console.log(`Busybox容器退出状态码: ${data.StatusCode}`);
                
                // 即使状态码不为0也继续，因为可能是日志文件不存在的情况
            } catch (copyError) {
                console.error(`使用Busybox复制日志文件失败: ${copyError.message}`);
                // 不抛出错误，继续尝试读取文件（如果存在）
            }
            
            // 读取复制后的日志文件
            const logPath = path.join(logDirPath, logFile);
            
            // 检查文件是否存在
            if (!fs.existsSync(logPath)) {
                throw new Error(`日志文件 ${logPath} 不存在或无法复制`);
            }
            
            // 读取日志文件内容
            const logContent = fs.readFileSync(logPath, 'utf8');
            
            return {
                success: true,
                data: logContent
            };
        } catch (error) {
            console.error(`获取Docker日志失败: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // 读取Docker输出
    async getDockerOutput(dockerId, outputFile = 'output.json') {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 从Redis获取子docker对应的volume信息和scenarioID
            const volumeKey = `docker:${dockerId}`;
            const dockerInfo = await this.redisClient.hGetAll(volumeKey);
            const {volumeName, containerName, scenarioId} = dockerInfo;
            
            if (!volumeName) {
                throw new Error(`未找到Docker ${dockerId}对应的volume信息`);
            }
            
            console.log(`获取到Docker ${dockerId}的volume: ${volumeName}, scenarioId: ${scenarioId || '无'}`);
            
            sharedVolumeName = await this.getSharedVolumeName();
            // 使用共享卷路径
            const sharedMountsPath = '/shared-mounts';
            const containerMountPath = path.join(sharedMountsPath, containerName);
            const outputDirPath = path.join(containerMountPath, 'outputs');
            
            // 确保目录存在
            if (!fs.existsSync(outputDirPath)) {
                fs.mkdirSync(outputDirPath, { recursive: true, mode: 0o777 });
                console.log(`创建输出目录: ${outputDirPath}`);
            }
            
            // 创建一个busybox容器来复制输出文件
            try {
                // 生成唯一的容器名称
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const busyboxName = `copy-outputs-${dockerId}-${randomSuffix}`;
                
                console.log(`创建busybox容器 ${busyboxName} 来复制输出文件`);
                
                // 创建busybox容器
                const busyboxContainer = await this.docker.createContainer({
                    Image: 'busybox:latest',
                    name: busyboxName,
                    Cmd: ['sh', '-c', `cp -f /source/outputs/${outputFile} /dest/${containerName}/outputs/ 2>/dev/null || echo "输出文件不存在"`],
                    HostConfig: {
                        Binds: [
                            `${volumeName}:/source`,
                            `${sharedVolumeName}:/dest`
                        ],
                        AutoRemove: true
                    }
                });
                
                // 启动busybox容器并等待完成
                await busyboxContainer.start();
                
                // 等待容器完成复制操作
                const stream = await busyboxContainer.wait();
                const data = await stream;
                
                console.log(`Busybox容器退出状态码: ${data.StatusCode}`);
                
                // 即使状态码不为0也继续，因为可能是输出文件不存在的情况
            } catch (copyError) {
                console.error(`使用Busybox复制输出文件失败: ${copyError.message}`);
                // 不抛出错误，继续尝试读取文件（如果存在）
            }
            
            // 读取复制后的输出文件
            const outputPath = path.join(outputDirPath, outputFile);
            
            // 检查文件是否存在
            if (!fs.existsSync(outputPath)) {
                throw new Error(`输出文件 ${outputPath} 不存在或无法复制`);
            }
            
            // 读取输出文件内容
            const outputContent = fs.readFileSync(outputPath, 'utf8');
            
            // 如果有scenarioId，获取对应的scenario配置
            let scenarioOutputs = null;
            if (scenarioId) {
                try {
                    const scenarioManager = require('./scenario-manager');
                    const scenarioYaml = await scenarioManager.getScenarioYaml(scenarioId);
                    
                    // 简单解析YAML以获取outputs配置
                    const yaml = require('js-yaml');
                    const scenarioConfig = yaml.load(scenarioYaml);
                    if (scenarioConfig && scenarioConfig.outputs) {
                        scenarioOutputs = scenarioConfig.outputs;
                    }
                } catch (scenarioError) {
                    console.error(`获取scenario配置失败: ${scenarioError.message}`);
                    // 继续处理，不影响输出内容的返回
                }
            }
            
            // 尝试解析JSON
            try {
                const outputData = JSON.parse(outputContent);
                
                // 如果有scenario输出配置，根据配置处理输出
                if (scenarioOutputs) {
                    const processedOutput = {
                        success: true,
                        data: outputData,
                        scenarioOutputs: scenarioOutputs
                    };
                    return processedOutput;
                }
                
                return {
                    success: true,
                    data: outputData
                };
            } catch (jsonError) {
                // 如果不是有效的JSON，则返回原始内容
                // 如果有scenario输出配置，也一并返回
                if (scenarioOutputs) {
                    return {
                        success: true,
                        data: outputContent,
                        warning: '输出内容不是有效的JSON格式',
                        scenarioOutputs: scenarioOutputs
                    };
                }
                
                return {
                    success: true,
                    data: outputContent,
                    warning: '输出内容不是有效的JSON格式'
                };
            }
        } catch (error) {
            console.error(`获取Docker输出失败: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // 获取用户的Docker列表
    async getUserDockers(username) {
        try {
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 从Redis获取用户的Docker列表
            const key = `user:${username}:dockers`;
            const dockerIds = await this.redisClient.sMembers(key);
            
            // 如果没有找到Docker列表，返回空数组
            if (!dockerIds || dockerIds.length === 0) {
                return {
                    success: true,
                    data: []
                };
            }
            
            // 获取每个Docker的详细信息
            const dockerDetails = [];
            for (const dockerId of dockerIds) {
                try {                 
                    const dockerKey = `docker:${dockerId}`;
                    const dockerInfo = await this.redisClient.hGetAll(dockerKey);
                    const updatedInfo = await this.docker.getContainer(dockerId).inspect() ;    

                    
            // 检查退出状态
                    let exitStatus = "Success";
                    if (updatedInfo.State.Status === "exited" && updatedInfo.State.ExitCode !== 0) {
                        exitStatus = "Failure";
                    }
                    
                    if (Object.keys(dockerInfo).length > 0) {
                        dockerDetails.push({...dockerInfo, status: updatedInfo.State.Status,
                        exitStatus: exitStatus,
                        exitCode: updatedInfo.State.ExitCode});
                    }
                } catch (error) { 
                    console.log(`获取${dockerId}容器当前状态的时候遇到错误：${error}`) ; 
                }
            }
            
            return {
                success: true,
                data: dockerDetails
            };
        } catch (error) {
            console.error('获取用户Docker列表失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    async getSharedVolumeName() {
        let sharedVolumeName = '/shared-docker-mounts';
            try {
                const volumes = await this.docker.listVolumes();
                console.log('获取Docker volumes列表成功');
                
                // 查找包含"shared-docker-mounts"的volume
                const sharedVolume = volumes.Volumes.find(volume => 
                    volume.Name.includes('shared-docker-mounts'));
                
                if (sharedVolume) {
                    console.log(`找到共享卷: ${sharedVolume.Name}`);
                    sharedVolumeName = sharedVolume.Name;
                } else {
                    console.log('未找到包含shared-docker-mounts的卷，使用默认路径');
                }
            } catch (error) {
                console.error('获取Docker volumes列表失败:', error.message);
            } 
        return sharedVolumeName ; 
    },
    // 启动Docker容器
    async startDocker(imageName, options = {}, username = 'default', scenarioId = '') {
        try {
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            
            // 获取Docker volumes列表
            
            sharedVolumeName = await this.getSharedVolumeName() ; 
            
            //pull 容器
            try { 
                await this.docker.pull(imageName) ; 
                await this.docker.pull('busybox') ; 
            } catch (error) { 
                throw new Error(`无法拉取镜像 ${imageName}: ${error.message}`);
            }
            
            
            
            const alphaNumeric = imageName.replace(/[^a-zA-Z0-9\-]/g, '');
            const randomSuffix = Math.random().toString(36).substring(2, 12);
            const containerName = `${alphaNumeric}-${randomSuffix}`;
            
            // 使用共享卷路径
            const sharedMountsPath = '/shared-mounts';
            
            // 第一步：在主docker的volume中，对应子docker的文件夹中，把需要mount到子docker的内容准备好
            // 为当前容器创建专属目录
            const containerMountPath = path.join(sharedMountsPath, containerName);
            const logDirPath = path.join(containerMountPath, 'logs');
            const inputDirPath = path.join(containerMountPath, 'input');
            const outputDirPath = path.join(containerMountPath, 'outputs');
            
            // 确保目录存在，添加适当的权限设置
            try {
                if (!fs.existsSync(containerMountPath)) {
                    fs.mkdirSync(containerMountPath, { recursive: true, mode: 0o777 });
                    console.log(`创建容器挂载目录: ${containerMountPath}`);
                }
                
                if (!fs.existsSync(logDirPath)) {
                    fs.mkdirSync(logDirPath, { recursive: true, mode: 0o777 });
                    console.log(`创建日志目录: ${logDirPath}`);
                }
                
                if (!fs.existsSync(inputDirPath)) {
                    fs.mkdirSync(inputDirPath, { recursive: true, mode: 0o777 });
                    console.log(`创建输入目录: ${inputDirPath}`);
                }
                
                if (!fs.existsSync(outputDirPath)) {
                    fs.mkdirSync(outputDirPath, { recursive: true, mode: 0o777 });
                    console.log(`创建输出目录: ${outputDirPath}`);
                }
            } catch (dirError) {
                console.error(`创建目录失败: ${dirError.message}`);
                throw new Error(`无法创建必要的目录: ${dirError.message}`);
            }
            
            // 处理输入数据
            if (options.inputs) {
                // 写入输入数据到共享卷中的文件
                const inputFilePath = path.join(inputDirPath, 'input.json');
                fs.writeFileSync(inputFilePath, options.inputs);
                console.log(`写入输入数据到: ${inputFilePath}`);
            }
            
            // 第二步：创建一个临时的volume，volume的名字就用volume+子docker的id
            const tempVolumeName = `volume-${containerName}`;
            try {
                await this.docker.createVolume({
                    Name: tempVolumeName,
                    Driver: 'local'
                });
                console.log(`创建临时卷成功: ${tempVolumeName}`);
                
                // 将临时卷信息存储到Redis
                const volumeKey = `docker:${containerName}:volume`;
                await this.redisClient.set(volumeKey, tempVolumeName);
                console.log(`临时卷信息已存储到Redis: ${volumeKey} -> ${tempVolumeName}`);
            } catch (volumeError) {
                console.error(`创建临时卷失败: ${volumeError.message}`);
                throw new Error(`无法创建临时卷: ${volumeError.message}`);
            }
            
            // 第三步：创建一个busybox超小型docker，把主docker的volume和临时volume都mount到busybox，把需要mount的内容复制过去
            try {
                
                // 创建busybox容器
                const busyboxContainer = await this.docker.createContainer({
                    Image: 'busybox',
                    name: `copy-to-volume-${containerName}`,
                    Cmd: ['sh', '-c', `cp -r /source/${containerName}/* /dest/ && chmod -R 777 /dest/`],
                    HostConfig: {
                        Binds: [
                            `${sharedVolumeName}:/source`,
                            `${tempVolumeName}:/dest`
                        ],
                        AutoRemove: true
                    }
                });
                
                // 启动busybox容器并等待完成
                await busyboxContainer.start();
                
                // 等待容器完成复制操作
                const stream = await busyboxContainer.wait();
                const data = await stream;
                
                if (data.StatusCode !== 0) {
                    throw new Error(`Busybox容器退出状态码非0: ${data.StatusCode}`);
                }
                
                console.log(`Busybox容器成功将文件从共享卷复制到临时卷`);
            } catch (copyError) {
                console.error(`使用Busybox复制文件失败: ${copyError.message}`);
                throw new Error(`无法复制文件到临时卷: ${copyError.message}`);
            }
            
            // 创建绑定列表
            const binds = [`${tempVolumeName}:/workmate`];

            let container;

            //createContainer
            try {
                // 生成容器名称：从镜像名称中提取字母和数字，并添加随机后缀
                
                // 创建容器配置
                const containerConfig = {
                    Image: imageName,
                    name: containerName,
                    Tty: true,
                    HostConfig: {
                        Binds: binds,
                        NetworkMode: 'host',
                    }
                };
                
                // 如果有环境变量设置，添加到配置中
                if (options.settings) {
                    const env = [];
                    for (const [key, value] of Object.entries(options.settings)) {
                        env.push(`${key.toUpperCase()}=${value}`);
                    }
                    containerConfig.Env = env;
                }
            
                // console.log(containerConfig.Env) ; 
                // 创建容器
                container = await this.docker.createContainer(containerConfig);
            } catch (error) {
                throw new Error(`创建容器遇到错误:${error.message}`) ; 
            } 
            
            // 获取容器ID
            await container.start();
            
            // 获取最新容器信息
            
            const updatedInfo = await container.inspect();
            const dockerId = updatedInfo.Id;
            
            // 创建Docker信息对象
            const dockerInfo = {
                containerId: updatedInfo.Id,
                containerName: containerName,
                name: imageName,
                status: updatedInfo.State.Status,
                startedAt: updatedInfo.State.StartedAt,
                username: username,
                createdAt: new Date().toISOString(),
                volumeName: tempVolumeName, // 添加卷信息
                scenarioId: scenarioId // 添加scenarioID信息
            };
            
            // 将Docker信息存储到Redis
            // 1. 将Docker ID添加到用户的Docker集合中
            const userDockerKey = `user:${username}:dockers`;
            await this.redisClient.sAdd(userDockerKey, updatedInfo.Id);
            
            // 2. 将Docker详细信息存储为哈希表
            const dockerKey = `docker:${updatedInfo.Id}`;
            await this.redisClient.hSet(dockerKey, dockerInfo);
            
            console.log(`Docker信息已存储到Redis，用户: ${username}, Docker ID: ${updatedInfo.Id}`);
            
            return {
                success: true,
                data: dockerInfo
            };
        } catch (error) {
            console.error('Docker容器创建/启动错误:', error.message);
            return {
                success: false,
                error: `Docker容器操作失败: ${error.message}`
            };
        }
    },
    
    // 获取Docker容器状态
    async getDockerStatus(dockerId) {
        try {
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            // 获取容器
            const container = this.docker.getContainer(dockerId);
            const containerInfo = await container.inspect();
            
                             
            const dockerKey = `docker:${dockerId}`;
            const dockerInfo = await this.redisClient.hGetAll(dockerKey);

            // 检查退出状态
            let exitStatus = "Success";
            if (containerInfo.State.Status === "exited" && containerInfo.State.ExitCode !== 0) {
                exitStatus = "Failure";
            }

            let returnData = {
                ...dockerInfo, 
                status: containerInfo.State.Status,
                exitStatus: exitStatus,
                exitCode: containerInfo.State.ExitCode
            };
            
            const scenarioId = dockerInfo.scenarioId;
            if (scenarioId) {
                try {
                    const scenarioManager = require('./scenario-manager');
                    const scenarioYaml = await scenarioManager.getScenarioYaml(scenarioId);
                    
                    // 简单解析YAML以获取outputs配置
                    const yaml = require('js-yaml');
                    const scenarioConfig = yaml.load(scenarioYaml);
                    returnData = {...returnData, scenarioName: scenarioConfig.name} ; 
                } catch (scenarioError) {
                    console.error(`获取scenario配置失败: ${scenarioError.message}`);
                    // 继续处理，不影响输出内容的返回
                }
            }
            return {
                success: true,
                data: returnData
            };
        } catch (error) {
            console.error('获取Docker状态失败:', error.message);
            return {
                success: false,
                error: `获取Docker状态失败: ${error.message}`
            };
        }
    },
    
    // 调整Docker容器状态
    async updateDockerState(dockerId, action, username) {
        try {
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 验证用户权限（检查该Docker是否属于该用户）
            const userDockerKey = `user:${username}:dockers`;
            const isUserDocker = await this.redisClient.sIsMember(userDockerKey, dockerId);
            
            if (!isUserDocker) {
                throw new Error(`用户 ${username} 无权操作Docker ${dockerId}`);
            }
            
            // 获取容器
            const container = this.docker.getContainer(dockerId);
            
            // 根据action执行相应操作
            let result;
            switch (action) {
                case 'start':
                    result = await container.start();
                    break;
                case 'stop':
                    result = await container.stop();
                    break;
                case 'restart':
                    result = await container.restart();
                    break;
                case 'pause':
                    result = await container.pause();
                    break;
                case 'unpause':
                    result = await container.unpause();
                    break;
                case 'kill':
                    result = await container.kill();
                    break;
                case 'remove':
                    result = await container.remove({ force: true });
                    // 从Redis中删除该Docker信息
                    await this.redisClient.sRem(userDockerKey, dockerId);
                    await this.redisClient.del(`docker:${dockerId}`);
                    break;
                default:
                    throw new Error(`不支持的操作: ${action}`);
            }
            
            // 获取更新后的容器信息（如果容器未被删除）
            let updatedInfo = null;
            if (action !== 'remove') {
                updatedInfo = await container.inspect();
                
                // 更新Redis中的Docker状态
                const dockerKey = `docker:${dockerId}`;
                await this.redisClient.hSet(dockerKey, 'status', updatedInfo.State.Status);
            }
            
            return {
                success: true,
                data: {
                    action,
                    containerId: dockerId,
                    status: updatedInfo ? updatedInfo.State.Status : 'removed'
                }
            };
        } catch (error) {
            console.error(`Docker ${action} 操作失败:`, error.message);
            return {
                success: false,
                error: `Docker ${action} 操作失败: ${error.message}`
            };
        }
    },
    
    // 初始化定时清理任务
    initCleanupScheduler(interval = '0 0 * * *') {
        console.log('初始化Docker和Volume定时清理任务');
        
        // 默认每天午夜执行一次清理任务
        this.cleanupJob = schedule.scheduleJob(interval, async () => {
            try {
                console.log('开始执行Docker和Volume定时清理任务');
                const result = await this.cleanupDockerResources();
                console.log(`清理任务完成: ${result.success ? '成功' : '失败'}, 清理了 ${result.data?.cleanedCount || 0} 个资源`);
            } catch (error) {
                console.error('执行清理任务时发生错误:', error);
            }
        });
        
        console.log(`Docker和Volume定时清理任务已设置，执行间隔: ${interval}`);
        return this.cleanupJob;
    },
    
    // 清理Docker资源（容器和卷）
    async cleanupDockerResources(maxAgeInDays = 1) {
        try {
            // 初始化Docker连接（如果尚未初始化）
            if (!this.docker) {
                this.docker = new Docker({
                    host: 'docker-socket-proxy',
                    port: 2375
                });
            }
            
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            console.log(`开始清理超过 ${maxAgeInDays} 天未使用的Docker资源`);
            
            // 计算截止时间（当前时间减去最大保留天数）
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - maxAgeInDays);
            const cutoffTimeStr = cutoffTime.toISOString();
            
            console.log(`清理截止时间: ${cutoffTimeStr}`);
            
            // 获取所有用户
            const userKeys = await this.redisClient.keys('user:*:dockers');
            let cleanedCount = 0;
            
            // 遍历每个用户的Docker列表
            for (const userKey of userKeys) {
                const username = userKey.split(':')[1];
                console.log(`检查用户 ${username} 的Docker资源`);
                
                // 获取用户的Docker ID列表
                const dockerIds = await this.redisClient.sMembers(userKey);
                
                // 遍历每个Docker ID
                for (const dockerId of dockerIds) {
                    try {
                        // 获取Docker详细信息
                        const dockerKey = `docker:${dockerId}`;
                        const dockerInfo = await this.redisClient.hGetAll(dockerKey);
                        
                        // 如果没有找到Docker信息，跳过
                        if (!dockerInfo || Object.keys(dockerInfo).length === 0) {
                            console.log(`未找到Docker ${dockerId} 的信息，跳过`);
                            continue;
                        }
                        
                        // 检查Docker是否超过最大保留时间
                        const startedAt = dockerInfo.startedAt || dockerInfo.createdAt;
                        
                        if (startedAt && startedAt < cutoffTimeStr) {
                            console.log(`Docker ${dockerId} (${dockerInfo.name}) 已超过保留时间，开始清理`);
                            
                            try {
                                // 获取容器
                                const container = this.docker.getContainer(dockerId);
                                
                                // 检查容器是否存在
                                try {
                                    await container.inspect();
                                    
                                    // 停止并删除容器
                                    console.log(`停止容器 ${dockerId}`);
                                    try {
                                        await container.stop();
                                    } catch (stopError) {
                                        // 容器可能已经停止，忽略错误
                                        console.log(`停止容器时出现非致命错误: ${stopError.message}`);
                                    }
                                    
                                    console.log(`删除容器 ${dockerId}`);
                                    await container.remove({ force: true });
                                } catch (inspectError) {
                                    console.log(`容器 ${dockerId} 不存在或无法访问: ${inspectError.message}`);
                                }
                                
                                // 删除相关的volume
                                if (dockerInfo.volumeName) {
                                    try {
                                        console.log(`删除卷 ${dockerInfo.volumeName}`);
                                        const volume = this.docker.getVolume(dockerInfo.volumeName);
                                        await volume.remove();
                                    } catch (volumeError) {
                                        console.log(`删除卷时出现非致命错误: ${volumeError.message}`);
                                    }
                                }
                                
                                // 从Redis中删除Docker信息
                                console.log(`从Redis中删除Docker ${dockerId} 的信息`);
                                await this.redisClient.sRem(userKey, dockerId);
                                await this.redisClient.del(dockerKey);
                                
                                // 删除volume信息
                                const volumeKey = `docker:${dockerId}:volume`;
                                await this.redisClient.del(volumeKey);
                                
                                cleanedCount++;
                                console.log(`Docker ${dockerId} 清理完成`);
                            } catch (cleanupError) {
                                console.error(`清理Docker ${dockerId} 时出错: ${cleanupError.message}`);
                            }
                        } else {
                            console.log(`Docker ${dockerId} (${dockerInfo.name}) 未超过保留时间，保留`);
                        }
                    } catch (dockerError) {
                        console.error(`处理Docker ${dockerId} 时出错: ${dockerError.message}`);
                    }
                }
            }
            
            console.log(`清理任务完成，共清理了 ${cleanedCount} 个Docker资源`);
            
            return {
                success: true,
                data: {
                    cleanedCount,
                    cutoffTime: cutoffTimeStr
                }
            };
        } catch (error) {
            console.error('清理Docker资源时发生错误:', error);
            return {
                success: false,
                error: `清理Docker资源失败: ${error.message}`
            };
        }
    },

    // 保存用户在特定scenario下的设置
    async saveUserSettings(username, scenarioId, settings) {
        try {
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 构建Redis键名
            const key = `user:${username}:scenario:${scenarioId}:settings`;
            
            // 将设置保存到Redis
            await this.redisClient.set(key, JSON.stringify(settings));
            
            console.log(`已保存用户 ${username} 在场景 ${scenarioId} 下的设置`);
            
            return {
                success: true,
                message: '设置保存成功'
            };
        } catch (error) {
            console.error(`保存用户设置失败: ${error.message}`);
            return {
                success: false,
                error: `保存用户设置失败: ${error.message}`
            };
        }
    },
    
    // 获取用户在特定scenario下的设置
    async getUserSettings(username, scenarioId) {
        try {
            // 确保Redis客户端已初始化
            await this.initRedisClient();
            
            // 构建Redis键名
            const key = `user:${username}:scenario:${scenarioId}:settings`;
            
            // 从Redis获取设置
            const settingsStr = await this.redisClient.get(key);
            
            // 如果没有找到设置，返回空对象
            if (!settingsStr) {
                return {
                    success: true,
                    value: {}
                };
            }
            
            // 解析设置并返回
            const settings = JSON.parse(settingsStr);
            
            return {
                success: true,
                value: settings
            };
        } catch (error) {
            console.error(`获取用户设置失败: ${error.message}`);
            return {
                success: false,
                error: `获取用户设置失败: ${error.message}`
            };
        }
    }
};
  
module.exports = API;