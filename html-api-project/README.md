# RESTful API 接口项目

## 项目说明

这是一个基于HTML技术栈的RESTful API接口项目，提供了对Control Project的文件操作、任务执行和配置管理等功能。

## 安装和运行

1. 安装依赖：
```
cd html-api-project
npm install
```

2. 启动服务器：
```
npm start
```

3. 访问应用：
在浏览器中打开 `http://localhost:3000`

## RESTful API 接口

### 文件操作

1. **上传文件**
   - 端点：`POST /api/files`
   - 请求体：
     ```json
     {
       "fileName": "example.txt",
       "content": "文件内容"
     }
     ```
   - 响应：上传结果

2. **获取文件**
   - 端点：`GET /api/files/:fileName`
   - 响应：文件内容

### 任务执行

1. **执行任务**
   - 端点：`POST /api/tasks`
   - 请求体：
     ```json
     {
       "templateFile": "/ci-templates/step-iteration.yml",
       "inputPromptFile": "/prompts/step-iteration.md",
       "modelName": "claude"
     }
     ```
   - 响应：任务ID和Pipeline ID

2. **检查任务状态**
   - 端点：`GET /api/tasks/:jobId`
   - 响应：任务状态信息

3. **取消任务**
   - 端点：`DELETE /api/tasks/:jobId`
   - 响应：取消结果

### 配置管理

1. **测试GitLab连接**
   - 端点：`POST /api/connection`
   - 请求体：
     ```json
     {
       "gitlabUrl": "https://gitlab.example.com/project",
       "accessToken": "your-access-token"
     }
     ```
   - 响应：连接结果

2. **检查Control Project**
   - 端点：`GET /api/control-project`
   - 响应：Control Project信息

3. **创建Control Project**
   - 端点：`POST /api/control-project`
   - 响应：创建结果

## 使用示例

### 使用curl测试API

1. 测试GitLab连接：
```bash
curl -X POST http://localhost:3000/api/connection \
  -H "Content-Type: application/json" \
  -d '{"gitlabUrl":"https://gitlab.example.com/project","accessToken":"your-token"}'
```

2. 上传文件：
```bash
curl -X POST http://localhost:3000/api/files \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.txt","content":"测试内容"}'
```

3. 获取文件：
```bash
curl http://localhost:3000/api/files/test.txt
```

4. 执行任务：
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"templateFile":"/ci-templates/step-iteration.yml","inputPromptFile":"/prompts/step-iteration.md","modelName":"claude"}'
```

5. 检查任务状态：
```bash
curl http://localhost:3000/api/tasks/12345
```

6. 取消任务：
```bash
curl -X DELETE http://localhost:3000/api/tasks/12345
```

## 注意事项

- 服务器默认运行在3000端口
- 所有API响应都是JSON格式
- 错误响应会包含错误信息和适当的HTTP状态码