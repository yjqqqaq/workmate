import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import './utils/alert-service' // 导入alert服务，替换原生alert
import { initTheme } from './utils/theme-service' // 导入主题服务
import formState from './store/formState' // 导入表单状态管理

// 初始化主题
initTheme()

// 创建应用实例
const app = createApp(App)

// 将formState注册为全局属性，方便在任何组件中访问
app.config.globalProperties.$formState = formState

// 挂载应用
app.use(router).mount('#app')