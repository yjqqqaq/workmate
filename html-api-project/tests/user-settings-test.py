#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
用户Scenario设置管理API测试脚本

测试内容：
1. 保存用户在特定scenario下的设置（POST /api/user-settings）
2. 获取用户在特定scenario下的设置（GET /api/user-settings/:username/:scenarioId）
3. 测试边界情况，如不存在的用户或scenario
"""

import json
import time
import requests
from datetime import datetime

# API基础URL
API_BASE_URL = 'http://localhost:4000/api'

# 测试用户
TEST_USERNAME = 'test-user'
TEST_SCENARIO_ID = 'feature-request'
NON_EXISTENT_SCENARIO_ID = f'non-existent-scenario-{int(time.time())}'

# 测试设置
TEST_SETTINGS = {
    "theme": "dark",
    "fontSize": 14,
    "language": "zh-CN",
    "notifications": {
        "email": True,
        "push": False
    },
    "customFields": {
        "field1": "value1",
        "field2": "value2"
    }
}

def call_api(endpoint, method='GET', body=None):
    """
    发送API请求
    
    Args:
        endpoint (str): API端点
        method (str): HTTP方法
        body (dict): 请求体
        
    Returns:
        dict: 响应对象
    """
    url = f"{API_BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=body)
        else:
            raise ValueError(f"不支持的HTTP方法: {method}")
        
        return response.json()
    except Exception as e:
        print(f"API请求失败: {str(e)}")
        return {"success": False, "error": str(e)}

def test_save_user_settings():
    """
    测试1: 保存用户在特定scenario下的设置
    """
    print("\n测试1: 保存用户在特定scenario下的设置")
    
    result = call_api('/user-settings', 'POST', {
        "username": TEST_USERNAME,
        "scenarioId": TEST_SCENARIO_ID,
        "settings": TEST_SETTINGS
    })
    
    if result.get('success'):
        print(f"✅ 保存用户{TEST_USERNAME}在scenario {TEST_SCENARIO_ID}下的设置成功")
        print(f"消息: {result.get('message')}")
    else:
        print(f"❌ 保存用户设置失败: {result.get('error')}")
    
    return result.get('success', False)

def test_get_user_settings():
    """
    测试2: 获取用户在特定scenario下的设置
    """
    print("\n测试2: 获取用户在特定scenario下的设置")
    
    result = call_api(f'/user-settings/{TEST_USERNAME}/{TEST_SCENARIO_ID}')
    
    if result.get('success'):
        print(f"✅ 获取用户{TEST_USERNAME}在scenario {TEST_SCENARIO_ID}下的设置成功")
        print(f"设置内容: {json.dumps(result.get('value'))}")
        
        # 验证返回的设置是否与保存的设置一致
        settings_match = json.dumps(result.get('value')) == json.dumps(TEST_SETTINGS)
        if settings_match:
            print("✅ 验证成功: 返回的设置与保存的设置一致")
        else:
            print("❌ 验证失败: 返回的设置与保存的设置不一致")
    else:
        print(f"❌ 获取用户设置失败: {result.get('error')}")
    
    return result.get('success', False)

def test_get_non_existent_settings():
    """
    测试3: 获取不存在的用户scenario设置
    """
    print("\n测试3: 获取不存在的用户scenario设置")
    
    result = call_api(f'/user-settings/{TEST_USERNAME}/{NON_EXISTENT_SCENARIO_ID}')
    
    if result.get('success'):
        print(f"✅ 获取不存在的scenario设置请求成功处理")
        print(f"返回的设置: {json.dumps(result.get('value'))}")
        
        # 验证返回的是空对象
        is_empty_object = len(result.get('value', {})) == 0
        if is_empty_object:
            print("✅ 验证成功: 返回了空对象")
        else:
            print("❌ 验证失败: 返回的不是空对象")
    else:
        print(f"❌ 获取不存在的scenario设置请求处理失败: {result.get('error')}")
    
    return result.get('success', False)

def test_save_settings_with_invalid_params():
    """
    测试4: 使用无效参数保存设置
    """
    print("\n测试4: 使用无效参数保存设置")
    
    # 缺少scenarioId参数
    result = call_api('/user-settings', 'POST', {
        "username": TEST_USERNAME,
        "settings": TEST_SETTINGS
    })
    
    if not result.get('success'):
        print(f"✅ 使用无效参数保存设置请求被正确拒绝")
        print(f"错误信息: {result.get('error')}")
    else:
        print(f"❌ 使用无效参数保存设置请求被错误地接受了")
    
    return not result.get('success', True)  # 这个测试期望失败，所以取反

def run_all_tests():
    """
    运行所有测试
    """
    print("开始用户Scenario设置管理API测试...")
    
    # 测试1: 保存用户在特定scenario下的设置
    test1_result = test_save_user_settings()
    
    # 测试2: 获取用户在特定scenario下的设置
    test2_result = test_get_user_settings()
    
    # 测试3: 获取不存在的用户scenario设置
    test3_result = test_get_non_existent_settings()
    
    # 测试4: 使用无效参数保存设置
    test4_result = test_save_settings_with_invalid_params()
    
    print("\n所有测试完成")
    print("\n测试结果总结:")
    print(f"1. 保存用户在特定scenario下的设置: {'✅ 成功' if test1_result else '❌ 失败'}")
    print(f"2. 获取用户在特定scenario下的设置: {'✅ 成功' if test2_result else '❌ 失败'}")
    print(f"3. 获取不存在的用户scenario设置: {'✅ 成功' if test3_result else '❌ 失败'}")
    print(f"4. 使用无效参数保存设置: {'✅ 成功' if test4_result else '❌ 失败'}")

if __name__ == "__main__":
    run_all_tests()