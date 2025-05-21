# RESTful API 接口文档

本文档详细描述了项目中实现的所有API接口，包括请求方法、URL、参数和返回值格式。

## 目录

- [Docker管理](#docker管理)
  - [启动Docker容器](#启动docker容器)
  - [获取Docker日志](#获取docker日志)
  - [获取用户的Docker列表](#获取用户的docker列表)
  - [获取Docker容器状态](#获取docker容器状态)
  - [调整Docker容器状态](#调整docker容器状态)
  - [手动触发Docker资源清理](#手动触发docker资源清理)
- [Scenario配置文件管理](#scenario配置文件管理)
  - [获取所有scenario](#获取所有scenario)
  - [获取指定scenario](#获取指定scenario)

## Docker管理

### 启动Docker容器

启动指定名称的Docker容器，并可选择性地提供输入数据和环境变量设置。

- **URL**: `/api/docker/start`
- **方法**: `POST`
- **请求体参数**:
  - `dockerName`: Docker容器名称（例如：ubuntu:latest, alpine:latest）
  - `username`: 用户名，用于分组存储Docker信息
  - `options`: 可选JSON对象，包含以下字段：
    - `inputs`: 字符串，将被存入input.json文件并挂载到容器的/workmate-input目录
    - `settings`: 键值对对象，每个键值对将转换为容器的环境变量，键名会被转换为大写

- **返回值**:
  ```json
  {
    "success": true,
    "data": {
      "containerId": "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
      "containerName": "ubuntu-abc123",
      "name": "ubuntu:latest",
      "status": "running",
      "startedAt": "2023-05-15T10:30:45.123Z",
      "username": "aaa",
      "createdAt": "2023-05-15T10:30:45.000Z",
      "volumeName": "volume-ubuntu-abc123"
    }
  }
  ```

- **用例**:
  - 允许用户名为aaa启动一个ubuntu docker，并传入random settings和inputs
  - 允许用户名为aaa再新建一个alpine的docker，和ubuntu docker区分开

### 获取Docker日志

获取指定Docker容器的日志文件内容。

- **URL**: `/api/docker/logs/:dockerId`
- **方法**: `GET`
- **路径参数**:
  - `dockerId`: Docker容器ID
- **查询参数**:
  - `logFile`: 可选，指定要读取的日志文件名，默认为'run.log'

- **返回值**:
  ```json
  {
    "success": true,
    "data": "日志文件内容..."
  }
  ```

- **用例**:
  - 允许用户名为aaa查询之前启动的ubuntu docker的log

### 获取用户的Docker列表

获取指定用户的Docker容器列表。

- **URL**: `/api/docker/list/:username`
- **方法**: `GET`
- **路径参数**:
  - `username`: 用户名

- **返回值**:
  ```json
  {
    "success": true,
    "data": [
      {
        "containerId": "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
        "containerName": "ubuntu-abc123",
        "name": "ubuntu:latest",
        "status": "running",
        "startedAt": "2023-05-15T10:30:45.123Z",
        "username": "aaa",
        "createdAt": "2023-05-15T10:30:45.000Z",
        "volumeName": "volume-ubuntu-abc123"
      },
      {
        "containerId": "a7bece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
        "containerName": "alpine-def456",
        "name": "alpine:latest",
        "status": "running",
        "startedAt": "2023-05-15T11:30:45.123Z",
        "username": "aaa",
        "createdAt": "2023-05-15T11:30:45.000Z",
        "volumeName": "volume-alpine-def456"
      }
    ]
  }
  ```

- **用例**:
  - 允许用户名为bbb查询名下的所有docker
  - 允许用户名为aaa查询名下的所有docker

### 获取Docker容器状态

获取指定Docker容器的详细状态信息。

- **URL**: `/api/docker/status/:dockerId`
- **方法**: `GET`
- **路径参数**:
  - `dockerId`: Docker容器ID

- **返回值**:
  ```json
  {
    "success": true,
    "data": {
      "id": "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
      "name": "ubuntu-abc123",
      "status": "running",
      "startedAt": "2023-05-15T10:30:45.123Z",
      "exitCode": null,
      "error": null,
      "restartCount": 0,
      "platform": "linux",
      "driver": "overlay2",
      "sizeRw": 12345,
      "sizeRootFs": 123456
    }
  }
  ```

- **用例**:
  - 允许用户名为aaa查询之前启动的ubuntu docker的状态

### 调整Docker容器状态

调整指定Docker容器的状态，如启动、停止、重启等。

- **URL**: `/api/docker/state`
- **方法**: `POST`
- **请求体参数**:
  - `dockerId`: Docker容器ID
  - `action`: 要执行的操作，可选值包括：'start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove'
  - `username`: 用户名，用于验证操作权限

- **返回值**:
  ```json
  {
    "success": true,
    "data": {
      "action": "stop",
      "dockerId": "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
      "status": "stopped",
      "timestamp": "2023-05-15T12:30:45.123Z"
    }
  }
  ```

- **用例**:
  - 测试aaa用户获取docker列表并停止当前的第一个docker（权限验证）
  - 测试bbb用户停止aaa用户的docker（权限验证，预期失败）

### 手动触发Docker资源清理

手动触发Docker资源清理，删除超过指定天数未使用的容器和卷。

- **URL**: `/api/docker/cleanup`
- **方法**: `POST`
- **请求体参数**:
  - `maxAgeInDays`: 可选，最大保留天数，默认为1天

- **返回值**:
  ```json
  {
    "success": true,
    "data": {
      "containersRemoved": 5,
      "volumesRemoved": 3,
      "cutoffDate": "2023-05-14T00:00:00.000Z",
      "timestamp": "2023-05-15T12:30:45.123Z"
    }
  }
  ```

- **用例**:
  - 清理超过3天未使用的所有Docker容器和卷
  - 在系统维护时手动触发资源回收

## Scenario配置文件管理

### 获取所有scenario

获取所有scenario的name和description。

- **URL**: `/api/scenarios`
- **方法**: `GET`
- **返回值**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "feature-request",
        "name": "功能请求",
        "description": "用于提交新功能请求的场景"
      },
      {
        "id": "bug-report",
        "name": "缺陷报告",
        "description": "用于报告软件缺陷的场景"
      },
      {
        "id": "code-review",
        "name": "代码审查",
        "description": "用于代码审查的场景"
      }
    ]
  }
  ```

- **用例**:
  - 获取所有可用的scenario配置信息，用于前端展示

### 获取指定scenario

获取指定scenario的完整YAML文件内容。

- **URL**: `/api/scenarios/:scenarioId`
- **方法**: `GET`
- **路径参数**:
  - `scenarioId`: scenario的ID（文件名，不含扩展名）
- **返回值**:
  ```json
  {
    "success": true,
    "data": "YAML文件内容..."
  }
  ```

- **用例**:
  - 获取特定scenario的完整配置，用于前端解析和展示

### 启动Docker

启动指定名称的Docker容器。

- **函数名**: `startDocker`
- **参数**:
  - `dockerName`: Docker容器名称
  - `options`: 可选JSON对象，包含以下字段：
    - `inputs`: 字符串，将被存入input.json文件并挂载到容器的/workmate-input目录
    - `settings`: 键值对对象，每个键值对将转换为容器的环境变量，键名会被转换为大写

- **返回值**:
  ```json
  {
    "success": true,
    "data": {
      "containerId": "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9",
      "containerName": "ubuntu-abc123",
      "name": "ubuntu:latest",
      "status": "running",
      "startedAt": "2023-05-15T10:30:45.123Z",
      "username": "aaa",
      "createdAt": "2023-05-15T10:30:45.000Z",
      "volumeName": "volume-ubuntu-abc123"
    }
  }
  ```

### 获取Docker日志

读取指定Docker容器的日志文件。

- **函数名**: `getDockerLogs`
- **参数**:
  - `dockerId`: Docker容器ID
  - `logFile`: 可选参数，指定要读取的日志文件名，默认为'run.log'

- **返回值**:
  ```json
  {
    "success": true,
    "data": "日志文件内容..."
  }
  ```