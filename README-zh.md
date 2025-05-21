# Agent 应用管理平台


[English](README.md) | 中文

一个用于管理 Agent 应用的综合平台，帮助小型团队用户和个人用户快速构建**共享Agent应用**并提供Agent应用的云服务，实现Agent应用的统一管理和远程异步执行（例如Agent在云端自行完成代码项目迭代并自动提交PR）。

## 功能特点
- **异步执行Agent应用**：非阻塞操作，解耦人与Agent
- **多场景支持**：适应各种用例和需求，通过自定义插件轻松扩展应用场景
- **私有部署**：通过本地部署完全控制您的数据流

## 安装

### Docker 安装

唯一要求：[Docker](https://docs.docker.com/engine/install/)。对于 Windows 操作系统的用户，请在安装 Docker 之前尝试安装 [WSL](https://learn.microsoft.com/zh-cn/windows/wsl/install)

### 快速开始
```bash
# 使用 docker-compose 启动应用
docker-compose up --build -d
```

## 使用方法

1. 通过 `http://<host_ip>:8008` 访问 Web 界面。
2. 经过简单的初始化设置后，进入场景选择页面。
3. 选择场景后，填写场景必要的配置和输入，即可在后端运行。
4. 在Docker历史中查看执行情况。

## 未来开发路线图

- 添加更多样化的输入、输出和日志支持
- 添加 MCP 服务器支持（作为 Agent Sidecar）
- 添加 Agent Pipeline 支持
- 添加 Agent Cluster 支持

基于目前的架构设计，所有这些功能都可以在当前框架内轻松实现。

有关配置场景的详细信息，请参阅[场景配置指南](/docs/scenario-configuration.md)或[中文场景配置指南](/docs/scenario-configuration-zh.md)。
