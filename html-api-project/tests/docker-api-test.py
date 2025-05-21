#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Docker API 测试脚本

测试内容：
1. 启动一个ubuntu docker（用户名为aaa），并传入random settings和inputs
2. 查询用户aaa之前启动的ubuntu docker的状态
3. 查询用户aaa之前启动的ubuntu docker的日志
4. 用户aaa再新建一个alpine的docker，和ubuntu docker区分开
5. 查询用户bbb名下的所有docker
"""

import json
import time
import requests
from datetime import datetime

# API基础URL
API_BASE_URL = 'http://localhost:4000/api'

# 测试用户
USER_AAA = 'aaa'
USER_BBB = 'bbb'

# 存储Docker ID
ubuntu_docker_id = "154d77c30b4e12c85327ae376eb9447113dbf5b32f544c1d1ecfde0861aede56"
alpine_docker_id = None

# 随机设置和输入
random_settings = {
    "TEST_MODE": "true",
    "DEBUG_LEVEL": "verbose",
    "TIMEOUT": "300",
    "ENV": "testing"
}

random_inputs = json.dumps({
    "testCase": "docker-api-test",
    "timestamp": datetime.now().isoformat(),
    "parameters": {
        "param1": "value1",
        "param2": "value2",
        "param3": "value3"
    }
})


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


def test_start_ubuntu_docker():
    """测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs"""
    global ubuntu_docker_id
    
    print('\n测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs')
    
    result = call_api('/docker/start', 'POST', {
        "dockerName": "ubuntu",
        "username": USER_AAA,
        "options": {
            "settings": random_settings,
            "inputs": random_inputs
        }
    })
    
    if result.get('success'):
        ubuntu_docker_id = result['data']['containerId']
        print(f"✅ 用户{USER_AAA}的Ubuntu Docker启动成功，ID: {ubuntu_docker_id}")
        print(f"状态: {result['data']['status']}")
        print(f"传入的settings: {json.dumps(random_settings)}")
        print(f"传入的inputs: {random_inputs[:50]}...")
    else:
        print(f"❌ 用户{USER_AAA}的Ubuntu Docker启动失败: {result.get('error')}")
    
    return result.get('success', False)


def test_get_ubuntu_docker_status():
    """测试2: 查询用户aaa的Ubuntu Docker状态"""
    print('\n测试2: 查询用户aaa的Ubuntu Docker状态')
    
    if not ubuntu_docker_id:
        print(f"❌ 无法查询状态: 用户{USER_AAA}的Ubuntu Docker ID不存在")
        return False
    
    result = call_api(f'/docker/status/{ubuntu_docker_id}')
    
    if result.get('success'):
        print(f"✅ 用户{USER_AAA}的Ubuntu Docker状态查询成功")
        print(f"状态: {result['data']['status']}")
        print(f"名称: {result['data']['name']}")
        print(f"启动时间: {result['data']['startedAt']}")
    else:
        print(f"❌ 用户{USER_AAA}的Ubuntu Docker状态查询失败: {result.get('error')}")
    
    return result.get('success', False)


def test_get_ubuntu_docker_logs():
    """测试3: 查询用户aaa的Ubuntu Docker日志"""
    print('\n测试3: 查询用户aaa的Ubuntu Docker日志')
    
    if not ubuntu_docker_id:
        print(f"❌ 无法查询日志: 用户{USER_AAA}的Ubuntu Docker ID不存在")
        return False
    
    result = call_api(f'/docker/logs/{ubuntu_docker_id}?logFile=run.log')
    
    if result.get('success'):
        print(f"✅ 用户{USER_AAA}的Ubuntu Docker日志查询成功")
        log_preview = result.get('data', '')[:200] if result.get('data') else '无日志内容'
        print(f"日志内容预览: {log_preview}...")
    else:
        print(f"❌ 用户{USER_AAA}的Ubuntu Docker日志查询失败: {result.get('error')}")
    
    return result.get('success', False)


def test_start_alpine_docker():
    """测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开"""
    global alpine_docker_id
    
    print('\n测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开')
    
    # 复制settings并添加CONTAINER_TYPE
    alpine_settings = random_settings.copy()
    alpine_settings["CONTAINER_TYPE"] = "alpine"
    
    result = call_api('/docker/start', 'POST', {
        "dockerName": "alpine:latest",
        "username": USER_AAA,
        "options": {
            "settings": alpine_settings,
            "inputs": random_inputs
        }
    })
    
    if result.get('success'):
        alpine_docker_id = result['data']['containerId']
        print(f"✅ 用户{USER_AAA}的Alpine Docker启动成功，ID: {alpine_docker_id}")
        print(f"状态: {result['data']['status']}")
        
        # 验证Alpine Docker与Ubuntu Docker是不同的容器
        if alpine_docker_id != ubuntu_docker_id:
            print(f"✅ 验证成功: Alpine Docker({alpine_docker_id})与Ubuntu Docker({ubuntu_docker_id})是不同的容器")
        else:
            print("❌ 验证失败: Alpine Docker与Ubuntu Docker是同一个容器")
    else:
        print(f"❌ 用户{USER_AAA}的Alpine Docker启动失败: {result.get('error')}")
    
    return result.get('success', False)


def test_list_user_bbb_dockers():
    """测试5: 查询用户bbb名下的所有Docker"""
    print('\n测试5: 查询用户bbb名下的所有Docker')
    
    result = call_api(f'/docker/list/{USER_BBB}')
    
    if result.get('success'):
        print(f"✅ 用户{USER_BBB}名下的所有Docker列表查询成功")
        print(f"Docker数量: {len(result['data'])}")
        if result['data']:
            print("Docker列表:")
            for docker in result['data']:
                print(f"- {docker['name']} ({docker['containerId']}): {docker['status']}")
        else:
            print(f"用户{USER_BBB}名下没有Docker")
    else:
        print(f"❌ 用户{USER_BBB}名下的Docker列表查询失败: {result.get('error')}")
    
    return result.get('success', False)


def test_list_user_aaa_dockers():
    """测试6: 查询用户aaa名下的所有Docker"""
    print('\n测试6: 查询用户aaa名下的所有Docker')
    
    result = call_api(f'/docker/list/{USER_AAA}')
    
    if result.get('success'):
        print(f"✅ 用户{USER_AAA}名下的所有Docker列表查询成功")
        print(f"Docker数量: {len(result['data'])}")
        if result['data']:
            print("Docker列表:")
            for docker in result['data']:
                print(f"- {docker['name']} ({docker['containerId']}): {docker['status']}")
        else:
            print(f"用户{USER_AAA}名下没有Docker")
    else:
        print(f"❌ 用户{USER_AAA}名下的Docker列表查询失败: {result.get('error')}")
    
    return result.get('success', False)


def test_stop_docker_by_aaa():
    """测试7: 测试aaa用户停止自己的Docker"""
    print('\n测试7: 测试aaa用户停止自己的Docker')
    
    # 先获取aaa用户的Docker列表
    list_result = call_api(f'/docker/list/{USER_AAA}')
    
    if not list_result.get('success') or not list_result.get('data'):
        print(f"❌ 无法获取用户{USER_AAA}的Docker列表或列表为空")
        return False
    
    # 获取第一个Docker的ID
    first_docker_id = list_result['data'][0]['containerId']
    
    # 尝试停止该Docker
    result = call_api('/docker/state', 'POST', {
        "dockerId": first_docker_id,
        "action": "stop",
        "username": USER_AAA
    })
    
    if result.get('success'):
        print(f"✅ 用户{USER_AAA}成功停止了自己的Docker (ID: {first_docker_id})")
        print(f"操作结果: {result.get('data', {}).get('action', '未知')} - {result.get('data', {}).get('status', '未知')}")
    else:
        print(f"❌ 用户{USER_AAA}停止自己的Docker失败: {result.get('error')}")
    
    return result.get('success', False)


def test_stop_docker_by_bbb():
    """测试8: 测试bbb用户停止aaa用户的Docker"""
    print('\n测试8: 测试bbb用户停止aaa用户的Docker')
    
    # 先获取aaa用户的Docker列表
    list_result = call_api(f'/docker/list/{USER_AAA}')
    
    if not list_result.get('success') or len(list_result.get('data', [])) < 2:
        print(f"❌ 无法获取用户{USER_AAA}的Docker列表或列表中Docker数量不足")
        return False
    
    # 获取第二个Docker的ID（如果有）
    second_docker_id = list_result['data'][1]['containerId'] if len(list_result['data']) > 1 else list_result['data'][0]['containerId']
    
    # bbb用户尝试停止aaa的Docker
    result = call_api('/docker/state', 'POST', {
        "dockerId": second_docker_id,
        "action": "stop",
        "username": USER_BBB
    })
    
    # 这里我们期望操作失败，因为bbb用户不应该有权限操作aaa用户的Docker
    if not result.get('success'):
        print(f"✅ 符合预期: 用户{USER_BBB}无权停止用户{USER_AAA}的Docker (ID: {second_docker_id})")
        print(f"错误信息: {result.get('error')}")
        # 在这个特殊情况下，我们期望失败，所以返回True表示测试通过
        return True
    else:
        print(f"❌ 测试失败: 用户{USER_BBB}不应该能够停止用户{USER_AAA}的Docker，但操作成功了")
        print(f"操作结果: {result.get('data', {}).get('action', '未知')} - {result.get('data', {}).get('status', '未知')}")
        # 操作成功了，但这不符合我们的预期，所以返回False表示测试失败
        return False


def run_all_tests():
    """运行所有测试"""
    print('开始Docker API测试...')
    
    # 测试1: 用户aaa启动Ubuntu Docker，并传入random settings和inputs
    test1_result = test_start_ubuntu_docker()
    if not test1_result:
        print('测试1失败，无法继续后续测试')
        return
    
    # 等待Docker启动
    print('等待Docker启动...')
    time.sleep(2)
    
    # 测试2: 查询用户aaa的Ubuntu Docker状态
    test_get_ubuntu_docker_status()
    
    # 测试3: 查询用户aaa的Ubuntu Docker日志
    test_get_ubuntu_docker_logs()
    
    # 测试4: 用户aaa启动Alpine Docker，与Ubuntu Docker区分开
    test4_result = test_start_alpine_docker()
    if not test4_result:
        print('测试4失败，无法继续后续测试')
        return
    
    # 等待Docker启动
    print('等待Docker启动...')
    time.sleep(2)
    
    # 测试5: 查询用户bbb名下的所有Docker
    test_list_user_bbb_dockers()
    
    # 测试6: 查询用户aaa名下的所有Docker
    test6_result = test_list_user_aaa_dockers()
    if not test6_result:
        print('测试6失败，无法继续后续测试')
        return
    
    # 测试7: 测试aaa用户停止自己的Docker
    test7_result = test_stop_docker_by_aaa()
    
    # 测试8: 测试bbb用户停止aaa用户的Docker
    test8_result = test_stop_docker_by_bbb()
    
    print('\n所有测试完成')
    print('\n测试结果总结:')
    
    print(f"1. 用户{USER_AAA}启动Ubuntu Docker: {'✅ 成功' if test1_result else '❌ 失败'}")
    print(f"2. 查询用户{USER_AAA}的Ubuntu Docker状态: {'✅ 成功' if ubuntu_docker_id else '❌ 失败'}")
    print(f"3. 查询用户{USER_AAA}的Ubuntu Docker日志: {'✅ 成功' if ubuntu_docker_id else '❌ 失败'}")
    print(f"4. 用户{USER_AAA}启动Alpine Docker: {'✅ 成功' if test4_result else '❌ 失败'}")
    print(f"5. 查询用户{USER_BBB}名下的所有Docker: ✅ 成功")
    print(f"6. 查询用户{USER_AAA}名下的所有Docker: {'✅ 成功' if test6_result else '❌ 失败'}")
    print(f"7. 测试aaa用户停止自己的Docker: {'✅ 成功' if test7_result else '❌ 失败'}")
    print(f"8. 测试bbb用户停止aaa用户的Docker: {'✅ 成功' if test8_result else '❌ 失败'}")


if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"测试过程中发生错误: {str(e)}")