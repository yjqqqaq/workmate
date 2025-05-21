import { reactive } from 'vue';

// 创建一个响应式状态对象
const state = reactive({
  isVisible: false,
  message: '',
  title: '任务通知',
  type: 'info',
  dockerId: '',
});

// 通知服务
const notificationService = {
  // 显示通知
  show(message, title = '任务通知', dockerId = '', type = 'info') {
    state.message = message;
    state.title = title;
    state.type = type;
    state.dockerId = dockerId;
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
  
  // 显示成功通知
  success(message, title = '任务完成', dockerId = '') {
    return this.show(message, title, dockerId, 'success');
  },
  
  // 关闭通知
  close() {
    state.isVisible = false;
  },
  
  // 获取状态
  getState() {
    return state;
  }
};

export default notificationService;