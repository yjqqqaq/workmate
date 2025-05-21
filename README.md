# Agent Application Management Platform

English | [中文](README-zh.md)

A comprehensive platform for managing Agent applications, helping small teams and individual users to quickly build **shared Agent applications** and provide cloud services for Agent applications, enabling unified management and remote asynchronous execution (e.g., Agent completes code project iterations in the cloud and automatically submits PRs).

## Features
- **Asynchronous Execution of Agent Applications**: Non-blocking operations, decoupling humans from Agents
- **Multi-scenario Support**: Adaptable to various use cases and requirements, easily extend application scenarios through custom plugins
- **Private Deployment**: Full control over your data flow with local deployment

## Installation

### Docker Installation

The only requirement: [Docker](https://docs.docker.com/engine/install/). For users with Windows OS, try to install [WSL](https://learn.microsoft.com/zh-cn/windows/wsl/install) before Docker

### Getting Started
```bash
git clone https://github.com/yjqqqaq/workmate.git
cd workmate
# Start the application using docker-compose
docker-compose up --build -d
```

## Usage

1. Access the web interface at `http://<host_ip>:8008`.
2. After simple initialization setup, enter the scenario selection page.
3. After selecting a scenario, fill in the necessary configuration and input for the scenario to run in the backend.
4. View execution status in Docker history.

## Future Development Roadmap

- Adding more diverse input, output, and logs support
- Adding MCP Server support (as an Agent Sidecar)
- Adding Agent Pipeline support
- Adding Agent Cluster support

Based on the current architecture design, all these features can be easily implemented within the current framework.

For detailed information on configuring scenarios, please refer to the [Scenario Configuration Guide](/docs/scenario-configuration.md) or [Chinese Scenario Configuration Guide](/docs/scenario-configuration-zh.md).


## Acknowledgments

Special thanks to Yuan Yang for his expert technical guidance and support.

Our thanks also go to Claude-code and Docker for their outstanding work that made this project possible.