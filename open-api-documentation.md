# HTML-API-Project OpenAPI 文档

## 基本信息

```yaml
openapi: 3.0.0
info:
  title: HTML-API-Project API
  description: HTML-API-Project 的 RESTful API 接口文档
  version: 1.0.0
servers:
  - url: http://localhost:3000
    description: 本地开发服务器
```

## 接口路径

```yaml
paths:
  /api/docker/start:
    post:
      summary: 启动Docker容器
      description: 启动指定名称的Docker容器，并可选择性地提供输入数据和环境变量设置。
      tags:
        - Docker管理
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - dockerName
              properties:
                dockerName:
                  type: string
                  description: Docker容器名称（例如：ubuntu:latest, alpine:latest）
                username:
                  type: string
                  description: 用户名，用于分组存储Docker信息
                scenarioId:
                  type: string
                  description: 场景ID，可选
                options:
                  type: object
                  description: 可选配置项
                  properties:
                    inputs:
                      type: string
                      description: 字符串，将被存入input.json文件并挂载到容器的/workmate-input目录
                    settings:
                      type: object
                      description: 键值对对象，每个键值对将转换为容器的环境变量，键名会被转换为大写
      responses:
        '200':
          description: 成功启动Docker容器
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      containerId:
                        type: string
                        example: "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9"
                      containerName:
                        type: string
                        example: "ubuntu-abc123"
                      name:
                        type: string
                        example: "ubuntu:latest"
                      status:
                        type: string
                        example: "running"
                      startedAt:
                        type: string
                        format: date-time
                        example: "2023-05-15T10:30:45.123Z"
                      username:
                        type: string
                        example: "aaa"
                      createdAt:
                        type: string
                        format: date-time
                        example: "2023-05-15T10:30:45.000Z"
                      volumeName:
                        type: string
                        example: "volume-ubuntu-abc123"
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少Docker容器名称"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "启动Docker容器失败"

  /api/docker/logs/{dockerId}:
    get:
      summary: 获取Docker日志
      description: 获取指定Docker容器的日志文件内容。
      tags:
        - Docker管理
      parameters:
        - name: dockerId
          in: path
          required: true
          description: Docker容器ID
          schema:
            type: string
        - name: logFile
          in: query
          required: false
          description: 指定要读取的日志文件名，默认为'run.log'
          schema:
            type: string
            default: run.log
      responses:
        '200':
          description: 成功获取日志
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: string
                    example: "日志文件内容..."
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少Docker ID"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取Docker日志失败"

  /api/docker/output/{dockerId}:
    get:
      summary: 获取Docker输出
      description: 获取指定Docker容器的输出文件内容。
      tags:
        - Docker管理
      parameters:
        - name: dockerId
          in: path
          required: true
          description: Docker容器ID
          schema:
            type: string
        - name: outputFile
          in: query
          required: false
          description: 指定要读取的输出文件名，默认为'output.json'
          schema:
            type: string
            default: output.json
      responses:
        '200':
          description: 成功获取输出
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    description: 输出内容，可能是JSON对象或字符串
                  scenarioOutputs:
                    type: object
                    description: 场景输出配置，可选
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少Docker ID"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取Docker输出失败"

  /api/docker/list/{username}:
    get:
      summary: 获取用户的Docker列表
      description: 获取指定用户的Docker容器列表。
      tags:
        - Docker管理
      parameters:
        - name: username
          in: path
          required: true
          description: 用户名
          schema:
            type: string
      responses:
        '200':
          description: 成功获取Docker列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        containerId:
                          type: string
                          example: "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9"
                        containerName:
                          type: string
                          example: "ubuntu-abc123"
                        name:
                          type: string
                          example: "ubuntu:latest"
                        status:
                          type: string
                          example: "running"
                        startedAt:
                          type: string
                          format: date-time
                          example: "2023-05-15T10:30:45.123Z"
                        username:
                          type: string
                          example: "aaa"
                        createdAt:
                          type: string
                          format: date-time
                          example: "2023-05-15T10:30:45.000Z"
                        volumeName:
                          type: string
                          example: "volume-ubuntu-abc123"
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少用户名"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取用户Docker列表失败"

  /api/docker/status/{dockerId}:
    get:
      summary: 获取Docker容器状态
      description: 获取指定Docker容器的详细状态信息。
      tags:
        - Docker管理
      parameters:
        - name: dockerId
          in: path
          required: true
          description: Docker容器ID
          schema:
            type: string
      responses:
        '200':
          description: 成功获取Docker状态
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      id:
                        type: string
                        example: "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9"
                      name:
                        type: string
                        example: "ubuntu-abc123"
                      status:
                        type: string
                        example: "running"
                      startedAt:
                        type: string
                        format: date-time
                        example: "2023-05-15T10:30:45.123Z"
                      exitCode:
                        type: integer
                        nullable: true
                        example: null
                      error:
                        type: string
                        nullable: true
                        example: null
                      restartCount:
                        type: integer
                        example: 0
                      platform:
                        type: string
                        example: "linux"
                      driver:
                        type: string
                        example: "overlay2"
                      sizeRw:
                        type: integer
                        example: 12345
                      sizeRootFs:
                        type: integer
                        example: 123456
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少Docker ID"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取Docker状态失败"

  /api/docker/state:
    post:
      summary: 调整Docker容器状态
      description: 调整指定Docker容器的状态，如启动、停止、重启等。
      tags:
        - Docker管理
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - dockerId
                - action
                - username
              properties:
                dockerId:
                  type: string
                  description: Docker容器ID
                action:
                  type: string
                  description: 要执行的操作，可选值包括：'start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove'
                  enum: ['start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove']
                username:
                  type: string
                  description: 用户名，用于验证操作权限
      responses:
        '200':
          description: 成功调整Docker状态
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      action:
                        type: string
                        example: "stop"
                      dockerId:
                        type: string
                        example: "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9"
                      status:
                        type: string
                        example: "stopped"
                      timestamp:
                        type: string
                        format: date-time
                        example: "2023-05-15T12:30:45.123Z"
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少必要参数：dockerId, action, username"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "调整Docker状态失败"

  /api/docker/cleanup:
    post:
      summary: 手动触发Docker资源清理
      description: 手动触发Docker资源清理，删除超过指定天数未使用的容器和卷。
      tags:
        - Docker管理
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                maxAgeInDays:
                  type: number
                  description: 可选，最大保留天数，默认为1天
                  default: 1
      responses:
        '200':
          description: 成功清理Docker资源
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      containersRemoved:
                        type: integer
                        example: 5
                      volumesRemoved:
                        type: integer
                        example: 3
                      cutoffDate:
                        type: string
                        format: date-time
                        example: "2023-05-14T00:00:00.000Z"
                      timestamp:
                        type: string
                        format: date-time
                        example: "2023-05-15T12:30:45.123Z"
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "无效的maxAgeInDays参数，必须为正数"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "清理Docker资源失败"

  /api/scenarios:
    get:
      summary: 获取所有scenario
      description: 获取所有scenario的name和description。
      tags:
        - Scenario配置文件管理
      responses:
        '200':
          description: 成功获取所有scenario
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  scenarios:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          example: "feature-request"
                        name:
                          type: string
                          example: "功能请求"
                        description:
                          type: string
                          example: "用于提交新功能请求的场景"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取scenario列表失败"

  /api/scenarios/{scenarioId}:
    get:
      summary: 获取指定scenario
      description: 获取指定scenario的完整YAML文件内容。
      tags:
        - Scenario配置文件管理
      parameters:
        - name: scenarioId
          in: path
          required: true
          description: scenario的ID（文件名，不含扩展名）
          schema:
            type: string
      responses:
        '200':
          description: 成功获取指定scenario
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  content:
                    type: string
                    example: "YAML文件内容..."
        '404':
          description: 未找到指定scenario
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "未找到指定的scenario"
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少scenario ID"

  /api/user-settings:
    post:
      summary: 保存用户在特定scenario下的设置
      description: 保存用户在特定scenario下的设置。
      tags:
        - 用户设置
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - scenarioId
                - settings
              properties:
                username:
                  type: string
                  description: 用户名
                scenarioId:
                  type: string
                  description: scenario的ID
                settings:
                  type: object
                  description: 用户设置内容
      responses:
        '200':
          description: 成功保存用户设置
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    description: 保存结果
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少必要参数：username, scenarioId, settings"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "保存用户设置失败"

  /api/user-settings/{username}/{scenarioId}:
    get:
      summary: 获取用户在特定scenario下的设置
      description: 获取用户在特定scenario下的设置。
      tags:
        - 用户设置
      parameters:
        - name: username
          in: path
          required: true
          description: 用户名
          schema:
            type: string
        - name: scenarioId
          in: path
          required: true
          description: scenario的ID
          schema:
            type: string
      responses:
        '200':
          description: 成功获取用户设置
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    description: 用户设置内容
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少必要参数：username, scenarioId"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取用户设置失败"

  /api/scenarios/{scenarioId}/settings/{username}:
    get:
      summary: 获取指定用户对特定scenario的配置设置
      description: 获取指定用户对特定scenario的配置设置（替代端点）。
      tags:
        - 用户设置
      parameters:
        - name: scenarioId
          in: path
          required: true
          description: scenario的ID
          schema:
            type: string
        - name: username
          in: path
          required: true
          description: 用户名
          schema:
            type: string
      responses:
        '200':
          description: 成功获取用户设置
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    description: 用户设置内容
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少必要参数：scenarioId, username"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "获取用户设置失败"
    post:
      summary: 保存指定用户对特定scenario的配置设置
      description: 保存指定用户对特定scenario的配置设置（替代端点）。
      tags:
        - 用户设置
      parameters:
        - name: scenarioId
          in: path
          required: true
          description: scenario的ID
          schema:
            type: string
        - name: username
          in: path
          required: true
          description: 用户名
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - settings
              properties:
                settings:
                  type: object
                  description: 用户设置内容
      responses:
        '200':
          description: 成功保存用户设置
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    description: 保存结果
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "缺少必要参数：scenarioId, username, settings"
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "保存用户设置失败"
```

## 组件定义

```yaml
components:
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          description: 错误信息
    DockerContainer:
      type: object
      properties:
        containerId:
          type: string
          example: "f8fece3319628a3b86facbaf39e7e59211aeb2fdedd4a40629f6a818cbb3d5f9"
        containerName:
          type: string
          example: "ubuntu-abc123"
        name:
          type: string
          example: "ubuntu:latest"
        status:
          type: string
          example: "running"
        startedAt:
          type: string
          format: date-time
          example: "2023-05-15T10:30:45.123Z"
        username:
          type: string
          example: "aaa"
        createdAt:
          type: string
          format: date-time
          example: "2023-05-15T10:30:45.000Z"
        volumeName:
          type: string
          example: "volume-ubuntu-abc123"
    Scenario:
      type: object
      properties:
        id:
          type: string
          example: "feature-request"
        name:
          type: string
          example: "功能请求"
        description:
          type: string
          example: "用于提交新功能请求的场景"
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## 安全定义

```yaml
security:
  - BearerAuth: []
```

## 标签定义

```yaml
tags:
  - name: Docker管理
    description: Docker容器管理相关接口
  - name: Scenario配置文件管理
    description: 场景配置文件管理相关接口
  - name: 用户设置
    description: 用户设置相关接口
```