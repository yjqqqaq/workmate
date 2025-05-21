#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API文档测试脚本

测试内容：
1. 获取所有scenario的API
2. 获取指定scenario的API
3. Docker管理相关的API（启动Docker容器、获取Docker日志等）

作者：API测试工程师
日期：2023-06-01
"""

import json
import time
import requests
from datetime import datetime

# API基础URL
API_BASE_URL = 'http://localhost:4000/api'

# 测试用户
USER_TEST = 'test_user'

# 存储Docker ID
docker_id = None

# 随机设置和输入
test_settings = {
    "TEST_MODE": "true",
    "DEBUG_LEVEL": "verbose",
    "TIMEOUT": "300",
    "ENV": "testing"
}

test_inputs = json.dumps({
    "testCase": "api-documentation-test",
    "timestamp": datetime.now().isoformat(),
    "parameters": {
        "param1": "value1",
        "param2": "value2",
        "param3": "value3"
    }
})

def call_api(endpoint, method='GET', body=None, params=None):
    """
    发送API请求
    
    Args:
        endpoint: API端点
        method: HTTP方法
        body: 请求体
        params: 查询参数
        
    Returns:
        响应对象
    """
    headers = {'Content-Type': 'application/json'}
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=body)
        else:
            raise ValueError(f"不支持的HTTP方法: {method}")
        
        return response.json()
    except Exception as error:
        print(f"API请求失败: {str(error)}")
        return {"success": False, "error": str(error)}

def print_test_header(test_name):
    """打印测试标题"""
    print(f"\n{'='*80}")
    print(f"测试: {test_name}")
    print(f"{'='*80}")

def print_test_result(test_name, success, message=None):
    """打印测试结果"""
    status = "✅ 成功" if success else "❌ 失败"
    print(f"{status} - {test_name}")
    if message:
        print(f"  {message}")

def test_get_all_scenarios():
    """测试获取所有scenario的API"""
    print_test_header("获取所有scenario")
    
    result = call_api('/scenarios')
    
    success = result.get('success', False)
    if success:
        scenarios = result.get('data', [])
        print_test_result("获取所有scenario", True, f"获取到 {len(scenarios)} 个scenario")
        
        # 打印scenario详情
        for scenario in scenarios:
            print(f"- ID: {scenario.get('id')}")
            print(f"  名称: {scenario.get('name')}")
            print(f"  描述: {scenario.get('description')}")
    else:
        print_test_result("获取所有scenario", False, f"错误: {result.get('error')}")
    
    return success

def test_get_specific_scenario():
    """测试获取指定scenario的API"""
    print_test_header("获取指定scenario")
    
    # 先获取所有scenario
    all_scenarios = call_api('/scenarios')
    if not all_scenarios.get('success', False):
        print_test_result("获取指定scenario", False, "无法获取scenario列表")
        return False
    
    # 获取第一个scenario的ID
    scenarios = all_scenarios.get('data', [])
    if not scenarios:
        print_test_result("获取指定scenario", False, "scenario列表为空")
        return False
    
    scenario_id = scenarios[0].get('id')
    print(f"测试获取scenario ID: {scenario_id}")
    
    # 获取指定scenario的YAML内容
    result = call_api(f'/scenarios/{scenario_id}')
    
    success = result.get('success', False)
    if success:
        content = result.get('data', '')
        content_preview = content[:100] + '...' if len(content) > 100 else content
        print_test_result("获取指定scenario", True, f"成功获取scenario '{scenario_id}'的内容")
        print(f"内容预览: {content_preview}")
    else:
        print_test_result("获取指定scenario", False, f"错误: {result.get('error')}")
    
    return success

def test_start_docker():
    """测试启动Docker容器的API"""
    global docker_id
    
    print_test_header("启动Docker容器")
    
    result = call_api('/docker/start', 'POST', {
        "dockerName": "alpine:latest",
        "username": USER_TEST,
        "options": {
            "settings": test_settings,
            "inputs": test_inputs
        }
    })
    
    success = result.get('success', False)
    if success:
        docker_id = result['data']['containerId']
        print_test_result("启动Docker容器", True, f"Docker ID: {docker_id}")
        print(f"状态: {result['data']['status']}")
        print(f"名称: {result['data']['name']}")
        print(f"启动时间: {result['data']['startedAt']}")
    else:
        print_test_result("启动Docker容器", False, f"错误: {result.get('error')}")
    
    return success

def test_get_docker_status():
    """测试获取Docker容器状态的API"""
    print_test_header("获取Docker容器状态")
    
    if not docker_id:
        print_test_result("获取Docker容器状态", False, "Docker ID不存在，无法测试")
        return False
    
    result = call_api(f'/docker/status/{docker_id}')
    
    success = result.get('success', False)
    if success:
        print_test_result("获取Docker容器状态", True, f"状态: {result['data']['status']}")
        print(f"名称: {result['data']['name']}")
        print(f"ID: {result['data']['id']}")
    else:
        print_test_result("获取Docker容器状态", False, f"错误: {result.get('error')}")
    
    return success

def test_get_docker_logs():
    """测试获取Docker日志的API"""
    print_test_header("获取Docker日志")
    
    if not docker_id:
        print_test_result("获取Docker日志", False, "Docker ID不存在，无法测试")
        return False
    
    # 等待一段时间让容器生成日志
    print("等待Docker容器生成日志...")
    time.sleep(2)
    
    result = call_api(f'/docker/logs/{docker_id}', params={"logFile": "run.log"})
    
    success = result.get('success', False)
    if success:
        logs = result.get('data', '')
        logs_preview = logs[:200] + '...' if len(logs) > 200 else logs
        print_test_result("获取Docker日志", True, "成功获取日志")
        print(f"日志预览: {logs_preview}")
    else:
        print_test_result("获取Docker日志", False, f"错误: {result.get('error')}")
    
    return success

def test_list_user_dockers():
    """测试获取用户Docker列表的API"""
    print_test_header("获取用户Docker列表")
    
    result = call_api(f'/docker/list/{USER_TEST}')
    
    success = result.get('success', False)
    if success:
        dockers = result.get('data', [])
        print_test_result("获取用户Docker列表", True, f"获取到 {len(dockers)} 个Docker容器")
        
        if dockers:
            print("Docker列表:")
            for docker in dockers:
                print(f"- {docker['name']} ({docker['containerId']}): {docker['status']}")
    else:
        print_test_result("获取用户Docker列表", False, f"错误: {result.get('error')}")
    
    return success

def test_docker_state_change():
    """测试调整Docker容器状态的API"""
    print_test_header("调整Docker容器状态")
    
    if not docker_id:
        print_test_result("调整Docker容器状态", False, "Docker ID不存在，无法测试")
        return False
    
    # 测试停止Docker容器
    result = call_api('/docker/state', 'POST', {
        "dockerId": docker_id,
        "action": "stop",
        "username": USER_TEST
    })
    
    success = result.get('success', False)
    if success:
        print_test_result("调整Docker容器状态", True, f"操作: {result['data']['action']}, 状态: {result['data']['status']}")
    else:
        print_test_result("调整Docker容器状态", False, f"错误: {result.get('error')}")
    
    return success

def run_all_tests():
    """运行所有测试"""
    print("\n开始API文档测试...\n")
    
    # 记录测试结果
    results = {}
    
    # 测试Scenario API
    results["获取所有scenario"] = test_get_all_scenarios()
    results["获取指定scenario"] = test_get_specific_scenario()
    
    # 测试Docker管理API
    results["启动Docker容器"] = test_start_docker()
    
    # 如果Docker启动成功，继续测试其他Docker API
    if results["启动Docker容器"]:
        # 等待Docker启动
        print("\n等待Docker容器启动...")
        time.sleep(3)
        
        results["获取Docker容器状态"] = test_get_docker_status()
        results["获取Docker日志"] = test_get_docker_logs()
        results["获取用户Docker列表"] = test_list_user_dockers()
        results["调整Docker容器状态"] = test_docker_state_change()
    
    # 打印测试结果总结
    print("\n" + "="*80)
    print("测试结果总结")
    print("="*80)
    
    for test_name, success in results.items():
        status = "✅ 成功" if success else "❌ 失败"
        print(f"{status} - {test_name}")
    
    # 计算成功率
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
    
    print("\n" + "-"*80)
    print(f"测试完成: {success_count}/{total_count} 通过 ({success_rate:.1f}%)")
    print("-"*80)

if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {str(e)}")