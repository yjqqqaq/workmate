import { reactive } from 'vue';

// 创建一个响应式状态对象
const state = reactive({
  isVisible: false,
  message: '',
  title: '提示',
  type: 'info',
});

// Alert服务
const alertService = {
  // 显示普通提示
  show(message, title = '提示') {
    state.message = message;
    state.title = title;
    state.type = 'info';
    state.isVisible = true;
    
    return new Promise(resolve => {
      const checkVisibility = setInterval(() => {
        if (!state.isVisible) {
          clearInterval(checkVisibility);
          resolve();
        }
      }, 100);
    });
  },
  
  // 显示成功提示
  success(message, title = '成功') {
    state.message = message;
    state.title = title;
    state.type = 'success';
    state.isVisible = true;
    
    return new Promise(resolve => {
      const checkVisibility = setInterval(() => {
        if (!state.isVisible) {
          clearInterval(checkVisibility);
          resolve();
        }
      }, 100);
    });
  },
  
  // 显示错误提示
  error(message, title = '错误') {
    state.message = message;
    state.title = title;
    state.type = 'error';
    state.isVisible = true;
    
    return new Promise(resolve => {
      const checkVisibility = setInterval(() => {
        if (!state.isVisible) {
          clearInterval(checkVisibility);
          resolve();
        }
      }, 100);
    });
  },
  
  // 关闭提示
  close() {
    state.isVisible = false;
  },
  
  // 获取状态
  getState() {
    return state;
  }
};

// 创建全局alert函数，替代原生alert
window.alert = function(message) {
  alertService.show(message);
};

export default alertService;