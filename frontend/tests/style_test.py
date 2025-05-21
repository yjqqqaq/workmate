#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
前端页面样式和功能测试脚本
用于测试前端页面的样式是否符合要求（配色简约清晰，适合PC web使用，长宽比约为16:9）
"""

import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class FrontendStyleTest(unittest.TestCase):
    """前端页面样式测试类"""

    @classmethod
    def setUpClass(cls):
        """测试前的准备工作"""
        # 设置Chrome选项
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # 无头模式
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')  # 设置窗口大小为16:9

        # 初始化WebDriver
        cls.driver = webdriver.Chrome(options=chrome_options)
        
        # 设置隐式等待时间
        cls.driver.implicitly_wait(10)
        
        # 基础URL（根据实际情况修改）
        cls.base_url = "http://localhost:3000"

    @classmethod
    def tearDownClass(cls):
        """测试结束后的清理工作"""
        cls.driver.quit()

    def test_page_title(self):
        """测试页面标题"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        self.assertEqual("Scenario运行页面", self.driver.title)

    def test_color_scheme(self):
        """测试页面配色方案"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 获取主要元素的颜色
        header = self.driver.find_element(By.TAG_NAME, "header")
        header_bg_color = header.value_of_css_property("background-image")
        
        # 检查是否使用了渐变色
        self.assertIn("linear-gradient", header_bg_color)
        
        # 检查主体背景色
        body = self.driver.find_element(By.TAG_NAME, "body")
        body_bg_color = body.value_of_css_property("background-color")
        self.assertIn("rgb", body_bg_color)  # 确保有背景色
        
        # 检查按钮颜色
        button = self.driver.find_element(By.CLASS_NAME, "btn")
        button_bg_color = button.value_of_css_property("background-color")
        self.assertIn("rgb", button_bg_color)  # 确保按钮有背景色

    def test_responsive_design(self):
        """测试响应式设计"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 测试不同窗口大小下的响应
        window_sizes = [
            (1920, 1080),  # 16:9 大屏
            (1366, 768),   # 16:9 笔记本
            (768, 1024)    # 平板竖屏
        ]
        
        for width, height in window_sizes:
            self.driver.set_window_size(width, height)
            time.sleep(1)  # 等待响应式变化
            
            # 检查主容器是否适应窗口大小
            main_element = self.driver.find_element(By.TAG_NAME, "main")
            main_width = main_element.size['width']
            
            # 确保主容器宽度适应窗口
            self.assertLessEqual(main_width, width)

    def test_aspect_ratio(self):
        """测试页面长宽比例是否接近16:9"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 设置窗口大小为16:9
        self.driver.set_window_size(1600, 900)  # 16:9比例
        time.sleep(1)
        
        # 获取主要内容区域的尺寸
        main_element = self.driver.find_element(By.TAG_NAME, "main")
        width = main_element.size['width']
        height = main_element.size['height']
        
        # 计算长宽比
        aspect_ratio = width / height
        
        # 检查长宽比是否接近16:9 (约1.78)
        self.assertGreater(aspect_ratio, 1.5)  # 确保是横向布局
        self.assertLess(abs(aspect_ratio - 1.78), 0.5)  # 允许一定误差范围

    def test_layout_structure(self):
        """测试页面布局结构"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 检查页面主要结构元素是否存在
        self.assertTrue(self.driver.find_element(By.TAG_NAME, "header").is_displayed())
        self.assertTrue(self.driver.find_element(By.TAG_NAME, "main").is_displayed())
        self.assertTrue(self.driver.find_element(By.TAG_NAME, "footer").is_displayed())
        
        # 检查导航菜单
        nav_items = self.driver.find_elements(By.CSS_SELECTOR, ".main-nav a")
        self.assertGreaterEqual(len(nav_items), 3)  # 至少有3个导航项
        
        # 检查表单元素
        self.assertTrue(self.driver.find_element(By.ID, "userForm").is_displayed())

    def test_form_functionality(self):
        """测试表单功能"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 输入用户名
        username_input = self.driver.find_element(By.ID, "username")
        username_input.clear()
        username_input.send_keys("test_user")
        
        # 提交表单
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "#userForm .btn")
        submit_button.click()
        
        # 等待场景部分显示
        try:
            WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "scenarioSection"))
            )
            scenario_visible = True
        except:
            scenario_visible = False
            
        self.assertTrue(scenario_visible, "提交表单后场景部分应该显示")

    def test_font_readability(self):
        """测试字体可读性"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 检查主要文本元素的字体大小和行高
        body = self.driver.find_element(By.TAG_NAME, "body")
        font_size = body.value_of_css_property("font-size")
        line_height = body.value_of_css_property("line-height")
        
        # 确保字体大小和行高有合理的值
        self.assertNotEqual(font_size, "0px")
        self.assertNotEqual(line_height, "normal")  # 应该有明确的行高设置

    def test_shadow_and_depth(self):
        """测试阴影和深度效果"""
        self.driver.get(f"{self.base_url}/frontend/index.html")
        
        # 检查主要容器是否有阴影效果
        main_element = self.driver.find_element(By.TAG_NAME, "main")
        box_shadow = main_element.value_of_css_property("box-shadow")
        
        # 确保有阴影效果
        self.assertNotEqual(box_shadow, "none")


if __name__ == "__main__":
    unittest.main()