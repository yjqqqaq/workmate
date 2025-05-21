#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scenario API 测试脚本

测试内容：
1. 获取所有scenario的列表
2. 获取指定scenario的YAML内容
3. 测试异常情况处理
"""

import json
import requests

# API基础URL
API_BASE_URL = 'http://localhost:4000/api'

# 已知的scenario ID列表
SCENARIO_IDS = ['feature-request', 'bug-report', 'code-review']

def call_api(endpoint, method='GET', body=None):
    """
    发送API请求
    
    Args:
        endpoint: API端点
        method: HTTP方法
        body: 请求体
        
    Returns:
        响应对象
    """
    headers = {'Content-Type': 'application/json'}
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=body)
        else:
            raise ValueError(f"不支持的HTTP方法: {method}")
        
        return response.json()
    except Exception as error:
        print(f"API请求失败: {str(error)}")
        return {"success": False, "error": str(error)}


def test_get_all_scenarios():
    """测试1: 获取所有scenario的列表"""
    print('\n测试1: 获取所有scenario的列表')
    
    result = call_api('/scenarios')
    
    if result.get('success'):
        scenarios = result.get('scenarios', [])
        print(f"✅ 获取所有scenario列表成功，共 {len(scenarios)} 个scenario")
        
        # 验证是否包含所有已知的scenario
        found_ids = [s.get('id') for s in scenarios]
        for scenario_id in SCENARIO_IDS:
            if scenario_id in found_ids:
                print(f"✅ 找到scenario: {scenario_id}")
            else:
                print(f"❌ 未找到scenario: {scenario_id}")
        
        # 打印scenario详情
        for scenario in scenarios:
            print(f"- ID: {scenario.get('id')}")
            print(f"  名称: {scenario.get('name')}")
            print(f"  描述: {scenario.get('description')}")
    else:
        print(f"❌ 获取scenario列表失败: {result.get('error')}")
    
    return result.get('success', False)


def test_get_scenario_yaml():
    """测试2: 获取指定scenario的YAML内容"""
    print('\n测试2: 获取指定scenario的YAML内容')
    
    all_success = True
    
    # 测试获取每个已知scenario的YAML内容
    for scenario_id in SCENARIO_IDS:
        print(f"\n获取scenario '{scenario_id}'的YAML内容:")
        
        result = call_api(f'/scenarios/{scenario_id}')
        
        if result.get('success'):
            content = result.get('content', '')
            content_preview = content[:100] + '...' if len(content) > 100 else content
            print(f"✅ 获取scenario '{scenario_id}'的YAML内容成功")
            print(f"内容预览: {content_preview}")
            
            # 验证YAML内容是否包含必要字段
            if 'name:' in content and 'description:' in content:
                print(f"✅ YAML内容包含必要字段 'name' 和 'description'")
            else:
                print(f"❌ YAML内容缺少必要字段 'name' 或 'description'")
                all_success = False
        else:
            print(f"❌ 获取scenario '{scenario_id}'的YAML内容失败: {result.get('error')}")
            all_success = False
    
    return all_success


def test_scenario_not_found():
    """测试3: 测试请求不存在的scenario"""
    print('\n测试3: 测试请求不存在的scenario')
    
    non_existent_id = 'non-existent-scenario'
    result = call_api(f'/scenarios/{non_existent_id}')
    
    if not result.get('success'):
        print(f"✅ 请求不存在的scenario '{non_existent_id}'返回了预期的错误")
        print(f"错误信息: {result.get('error')}")
        return True
    else:
        print(f"❌ 请求不存在的scenario '{non_existent_id}'未返回错误")
        return False


def test_invalid_scenario_id():
    """测试4: 测试使用无效的scenario ID（包含路径遍历尝试）"""
    print('\n测试4: 测试使用无效的scenario ID（包含路径遍历尝试）')
    
    invalid_id = '../server'  # 尝试路径遍历
    result = call_api(f'/scenarios/{invalid_id}')
    
    if not result.get('success'):
        print(f"✅ 使用无效的scenario ID '{invalid_id}'返回了预期的错误")
        print(f"错误信息: {result.get('error')}")
        return True
    else:
        print(f"❌ 使用无效的scenario ID '{invalid_id}'未返回错误")
        return False


def run_all_tests():
    """运行所有测试"""
    print('开始Scenario API测试...')
    
    # 测试1: 获取所有scenario的列表
    test1_result = test_get_all_scenarios()
    
    # 测试2: 获取指定scenario的YAML内容
    test2_result = test_get_scenario_yaml()
    
    # 测试3: 测试请求不存在的scenario
    test3_result = test_scenario_not_found()
    
    # 测试4: 测试使用无效的scenario ID
    test4_result = test_invalid_scenario_id()
    
    print('\n所有测试完成')
    print('\n测试结果总结:')
    print(f"1. 获取所有scenario的列表: {'✅ 成功' if test1_result else '❌ 失败'}")
    print(f"2. 获取指定scenario的YAML内容: {'✅ 成功' if test2_result else '❌ 失败'}")
    print(f"3. 测试请求不存在的scenario: {'✅ 成功' if test3_result else '❌ 失败'}")
    print(f"4. 测试使用无效的scenario ID: {'✅ 成功' if test4_result else '❌ 失败'}")


if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"测试过程中发生错误: {str(e)}")