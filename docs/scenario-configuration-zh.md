# 场景配置指南


[English](/docs/scenario-configuration.md) | 中文

本文档提供了在Agent管理平台中创建和配置场景的全面说明。

## 创建场景配置文件

场景配置文件定义了场景将如何执行以及它需要哪些资源。系统加载这些配置文件来设置和运行您的场景。

### 配置文件格式

场景配置应以 YAML 格式编写，具有以下结构：

```yaml
name: "我的场景"
description: "此场景演示了一个示例工作流"
docker:
  image: "my-scenario-image:latest"
inputs:
  - name: "inputParameter1"
    description: "第一个输入参数的描述"
    type: textarea
    required: true
  - name: "inputParameter2"
    description: "第二个输入参数的描述"
    type: text
    default: 42
  - name: "inputParameter2"
    description: "第二个输入参数的描述"
    type: file
settings:
  - name: "SETTING_1"
    description: "第一个设置的描述"
    required: true
    showInPopup: true
    defaultValue: SETTING_1_DEFAULT_VALUE
  - name: "SETTING_2"
    description: "第二个设置的描述"
    default: false
outputs:
  - name: "outputParameter1"
    description: "第一个输出参数的描述"
    type: link
  - name: "outputParameter2"
    description: "第二个输出参数的描述"
    type: textarea
```

### 关键组件

- **name**：场景的唯一标识符
- **description**：对场景功能的简要说明
- **docker**：运行场景的 Docker 容器配置
- **inputs**：用户应提供的输入参数定义
- **settings**：影响场景行为的配置设置
- **outputs**：用户可以从此场景 docker 获取的输出参数定义

## 示例：如何为场景构建 Docker 镜像

您的场景将在 Docker 容器内运行。您在Yaml文件中所定义的场景inputs，其中的text等类型会组合成一个json文件，挂载到Docker容器的`/workmate/input/input.json`文件。您需要将您的输出文件和log文件，在容器内分别导出到`/workmate/logs/run.log`和`/workmate/outputs/output.json`

以下提供一个简单的适用于本平台的Docker构建文件。
### Dockerfile 示例

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制应用代码
COPY . .

# 无需设置 workmate 集成目录
# 不要运行：RUN mkdir -p /workmate/input /workmate/logs /workmate/outputs
# 平台将挂载 /workmate 给您。

# 设置执行权限
RUN chmod +x /app/run.sh

# 入口点脚本
ENTRYPOINT ["/app/run.sh"]
```

### 入口点脚本 (run.sh)

```bash
#!/bin/sh

# 从标准位置读取输入
INPUT_FILE="/workmate/input/input.json"

# 设置日志记录
LOG_FILE="/workmate/logs/run.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "场景执行开始于 $(date)"

# 使用输入文件运行您的应用
node /app/index.js --input="$INPUT_FILE" --output="/workmate/outputs/output.json"

echo "场景执行完成于 $(date)"
```

## 输入和输出处理

### 输入处理

- 场景配置中定义的输入参数作为 JSON 文件传递给您的容器
- 输入文件始终位于：`/app/workmate/input/input.json`
- 您的应用应读取此文件以访问输入参数

示例 input.json：
```json
{
  "inputParameter1": "value1",
  "inputParameter2": 42
}
```

### 设置作为环境变量

- 场景配置中定义的settings作为环境变量传递，在传递时会把每个字母都变成大写。目前我们设置所有的settings只能是字符串，后续会开放更加多样化的settings配置。
- 您的应用可以直接从环境中访问这些变量
- 示例：名为 `aBcdefg` 的设置可以作为环境变量 `ABCDEFG` 访问

### 日志记录

- 所有日志应写入：`/app/workmate/logs/run.log`
- stdout 和 stderr 都会自动重定向到此文件
- 建议使用结构化日志以提高可读性和解析能力

### 输出生成

- 您的场景应将其字符串或链接等输出写入：`/workmate/outputs/output.json`
- 您的场景应将其他的文件类型的输出写入：`/workmate/outputs`文件夹下
- 输出应为有效的 JSON 对象
- 示例输出结构：

```json
{
  "status": "success",
  "results": {
    "key1": "value1",
    "key2": "value2"
  },
  "executionTime": 1234,
  "linkExample": "https://example.com"
}
```

## 最佳实践

1. **错误处理**：实现强大的错误处理并提供清晰的错误消息
2. **验证**：在处理前验证所有输入
3. **资源管理**：注意内存和 CPU 使用情况
4. **幂等性**：尽可能设计您的场景为幂等的
5. **版本控制**：清晰地为您的场景和 Docker 镜像进行版本控制
6. **详细描述**：在Yaml配置中提供详细的描述

通过遵循这些指南，您可以创建与Agent管理平台无缝集成并为用户提供一致体验的多样化场景。
