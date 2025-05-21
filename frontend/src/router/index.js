import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/config',
    name: 'Config',
    component: () => import('../views/Config.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router