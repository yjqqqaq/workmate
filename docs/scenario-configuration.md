# Scenario Configuration Guide

English | [中文](/docs/scenario-configuration-zh.md)

This document provides comprehensive instructions for creating and configuring scenarios in the Agent management platform.

## Creating a Scenario Configuration File

A scenario configuration file defines how your scenario will be executed and what resources it requires. The system loads these configuration files to set up and run your scenarios.

### Configuration File Format

Scenario configurations should be written in YAML format with the following structure:

```yaml
name: "My Scenario"
description: "This scenario demonstrates a sample workflow"
docker:
  image: "my-scenario-image:latest"
inputs:
  - name: "inputParameter1"
    description: "Description of the first input parameter"
    type: textarea
    required: true
  - name: "inputParameter2"
    description: "Description of the second input parameter"
    type: text
    default: 42
  - name: "inputParameter2"
    description: "Description of the second input parameter"
    type: file
settings:
  - name: "SETTING_1"
    description: "Description of the first setting"
    required: true
    showInPopup: true
    defaultValue: SETTING_1_DEFAULT_VALUE
  - name: "SETTING_2"
    description: "Description of the second setting"
    default: false
outputs:
  - name: "outputParameter1"
    description: "Description of the first output parameter"
    type: link
  - name: "outputParameter2"
    description: "Description of the second output parameter"
    type: textarea
```

### Key Components

- **name**: A unique identifier for your scenario
- **description**: A brief explanation of what the scenario does
- **docker**: Configuration for the Docker container that will run your scenario
- **inputs**: Definition of input parameters that users should provide
- **settings**: Configuration settings that affect scenario behavior
- **outputs**: Definition of output parameters that users can obtain from this scenario docker

## Example: How to build a Docker Image for Scenarios

Your scenario will run inside a Docker container. The scenario inputs you define in the Yaml file, such as text types, will be combined into a JSON file and mounted to the Docker container at `/workmate/input/input.json`. You need to export your output files and log files within the container to `/workmate/logs/run.log` and `/workmate/outputs/output.json` respectively.

Below is a simple Docker build file suitable for this platform.
### Dockerfile Example

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# NO NEED to set up workmate integration directories
# DO NOT RUN: RUN mkdir -p /workmate/input /workmate/logs /workmate/outputs
# Platform will mount /workmate for you.

# Set execution permissions
RUN chmod +x /app/run.sh

# Entry point script
ENTRYPOINT ["/app/run.sh"]
```

### Entry Point Script (run.sh)

```bash
#!/bin/sh

# Read input from the standard location
INPUT_FILE="/workmate/input/input.json"

# Set up logging
LOG_FILE="/workmate/logs/run.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting scenario execution at $(date)"

# Run your application with the input file
node /app/index.js --input="$INPUT_FILE" --output="/workmate/outputs/output.json"

echo "Scenario execution completed at $(date)"
```

## Input and Output Handling

### Input Processing

- Input parameters defined in your scenario configuration are passed to your container as a JSON file
- The input file is always located at: `/app/workmate/input/input.json`
- Your application should read this file to access input parameters

Example input.json:
```json
{
  "inputParameter1": "value1",
  "inputParameter2": 42
}
```

### Settings as Environment Variables

- Settings defined in your scenario configuration are passed as environment variables, with each letter converted to uppercase during transmission. Currently, we set all settings to be strings only, with more diverse settings configurations to be available in the future.
- Your application can access these variables directly from the environment
- Example: A setting named `aBcdefg` can be accessed as the environment variable `ABCDEFG`

### Logging

- All logs should be written to: `/app/workmate/logs/run.log`
- Both stdout and stderr are automatically redirected to this file
- Structured logging is recommended for better readability and parsing

### Output Generation

- Your scenario should write its string or link outputs to: `/workmate/outputs/output.json`
- Your scenario should write other file type outputs to the `/workmate/outputs` folder
- The output should be a valid JSON object
- Example output structure:

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

## Best Practices

1. **Error Handling**: Implement robust error handling and provide clear error messages
2. **Validation**: Validate all inputs before processing
3. **Resource Management**: Be mindful of memory and CPU usage
4. **Idempotency**: Design your scenario to be idempotent when possible
5. **Versioning**: Clearly version your scenarios and Docker images
6. **Detailed Description**: Provide detailed descriptions in your Yaml configuration

By following these guidelines, you can create diverse scenarios that integrate seamlessly with the Agent management platform and provide a consistent experience for users.