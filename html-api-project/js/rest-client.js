/**
 * RESTful API客户端
 */
const RestClient = {
  baseUrl: 'http://localhost:3000/api',
  
  // 设置基础URL
  setBaseUrl(url) {
    this.baseUrl = url;
  },
  
  // Control Project 文件操作
  async uploadFile(fileName, content) {
    try {
      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, content })
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async getFile(fileName) {
    try {
      const response = await fetch(`${this.baseUrl}/files/${encodeURIComponent(fileName)}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 任务执行
  async executeTask(templateFile, inputPromptFile, modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateFile, inputPromptFile, modelName })
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async checkJobStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${jobId}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async cancelJob(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${jobId}`, {
        method: 'DELETE'
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 配置管理
  async testConnection(gitlabUrl, accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gitlabUrl, accessToken })
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async checkControlProject() {
    try {
      const response = await fetch(`${this.baseUrl}/control-project`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async createControlProject() {
    try {
      const response = await fetch(`${this.baseUrl}/control-project`, {
        method: 'POST'
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};