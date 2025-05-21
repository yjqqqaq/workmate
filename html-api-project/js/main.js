/**
 * 主要JavaScript文件，处理UI交互
 */
document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的配置
    const config = API.loadConfig();
    
    // 填充表单字段
    if (config.gitlabUrl) {
        document.getElementById('gitlabUrl').value = config.gitlabUrl;
    }
    if (config.accessToken) {
        document.getElementById('accessToken').value = config.accessToken;
    }
    
    // 显示通知
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.classList.add('error');
        } else if (type === 'warning') {
            notification.classList.add('warning');
        }
        
        notification.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // 测试GitLab连接
    document.getElementById('testConnectionBtn').addEventListener('click', async () => {
        const gitlabUrl = document.getElementById('gitlabUrl').value.trim();
        const accessToken = document.getElementById('accessToken').value.trim();
        
        if (!gitlabUrl || !accessToken) {
            showNotification('请填写GitLab URL和访问令牌', 'error');
            return;
        }
        
        const result = await API.testGitlabConnection(gitlabUrl, accessToken);
        
        if (result.success) {
            showNotification('连接成功！');
        } else {
            showNotification(`连接失败: ${result.error}`, 'error');
        }
    });
    
    // 检查Control Project
    document.getElementById('checkControlProjectBtn').addEventListener('click', async () => {
        const result = await API.checkControlProject();
        
        if (result.success) {
            const controlProjectResult = document.getElementById('controlProjectResult');
            
            if (result.exists) {
                controlProjectResult.textContent = JSON.stringify(result.data, null, 2);
                showNotification('Control Project已存在');
            } else {
                controlProjectResult.textContent = '未找到Control Project';
                showNotification('未找到Control Project', 'warning');
            }
        } else {
            showNotification(`检查失败: ${result.error}`, 'error');
        }
    });
    
    // 创建Control Project
    document.getElementById('createControlProjectBtn').addEventListener('click', async () => {
        const result = await API.createControlProject();
        
        if (result.success) {
            const controlProjectResult = document.getElementById('controlProjectResult');
            controlProjectResult.textContent = JSON.stringify(result.data, null, 2);
            showNotification('Control Project创建成功');
        } else {
            showNotification(`创建失败: ${result.error}`, 'error');
        }
    });
    
    // 上传文件到Control Project
    document.getElementById('uploadFileBtn').addEventListener('click', async () => {
        const fileName = document.getElementById('fileName').value.trim();
        const fileContent = document.getElementById('fileContent').value;
        
        if (!fileName) {
            showNotification('请输入文件名', 'error');
            return;
        }
        
        const result = await API.uploadFileToControlProject(fileName, fileContent);
        
        if (result.success) {
            showNotification(`文件 ${fileName} 上传成功`);
        } else {
            showNotification(`上传失败: ${result.error}`, 'error');
        }
    });
    
    // 获取Control Project文件
    document.getElementById('getFileBtn').addEventListener('click', async () => {
        const fileName = document.getElementById('getFileName').value.trim();
        
        if (!fileName) {
            showNotification('请输入文件名', 'error');
            return;
        }
        
        const result = await API.getFileFromControlProject(fileName);
        
        if (result.success) {
            const fileResult = document.getElementById('fileResult');
            fileResult.textContent = result.data;
            showNotification(`文件 ${fileName} 获取成功`);
        } else {
            showNotification(`获取失败: ${result.error}`, 'error');
        }
    });
    
    // 执行任务
    document.getElementById('executeTaskBtn').addEventListener('click', async () => {
        const templateFile = document.getElementById('templateFile').value.trim();
        const inputPromptFile = document.getElementById('inputPromptFile').value.trim();
        const modelName = document.getElementById('modelName').value;
        
        if (!templateFile || !inputPromptFile) {
            showNotification('请填写模板文件和输入提示文件', 'error');
            return;
        }
        
        // 构建完整的文件URL
        const baseUrl = API.config.apiBaseUrl;
        const fullTemplateUrl = templateFile.startsWith('http') ? templateFile : `${baseUrl}${templateFile}`;
        const fullInputPromptUrl = inputPromptFile.startsWith('http') ? inputPromptFile : `${baseUrl}${inputPromptFile}`;
        
        const result = await API.executeTask(fullTemplateUrl, fullInputPromptUrl, modelName);
        
        if (result.success) {
            document.getElementById('jobId').value = result.data.jobId;
            showNotification(`任务已启动，作业ID: ${result.data.jobId}`);
        } else {
            showNotification(`执行失败: ${result.error}`, 'error');
        }
    });
    
    // 检查任务状态
    document.getElementById('checkJobStatusBtn').addEventListener('click', async () => {
        const jobId = document.getElementById('jobId').value.trim();
        
        if (!jobId) {
            showNotification('请输入任务ID', 'error');
            return;
        }
        
        const result = await API.checkJobStatus(jobId);
        
        if (result.success) {
            const jobStatusResult = document.getElementById('jobStatusResult');
            jobStatusResult.textContent = JSON.stringify(result.data, null, 2);
            showNotification(`任务状态: ${result.data.status}`);
        } else {
            showNotification(`检查失败: ${result.error}`, 'error');
        }
    });
    
    // 取消任务
    document.getElementById('cancelJobBtn').addEventListener('click', async () => {
        const jobId = document.getElementById('cancelJobId').value.trim();
        
        if (!jobId) {
            showNotification('请输入任务ID', 'error');
            return;
        }
        
        const result = await API.cancelJob(jobId);
        
        if (result.success) {
            showNotification('任务已取消');
        } else {
            showNotification(`取消失败: ${result.error}`, 'error');
        }
    });
});