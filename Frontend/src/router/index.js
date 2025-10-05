// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Home', component: HomePage },
    {
      path: '/comfort-insights',
      name: 'ComfortInsights',
      component: () => import('../views/ComfortInsights.vue')
    },
    {
      path: '/seasonal-comfort',
      name: 'SeasonalComfort',
      component: () => import('../views/SeasonalComfort.vue')
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('../views/About.vue')
    },
    {
      path: '/shade-quest',
      name: 'ShadeQuest',
      component: () => import('../views/CoolRoute.vue')
    },
    {
      path: '/comfort-matters',
      name: 'ComfortMatters',
      component: () => import('../views/ComfortMatters.vue')
    },
    // ✅ 新页面：附近饮水点
    {
      path: '/nearby-fountains',
      name: 'NearbyFountains',
      component: () => import('../views/NearbyFountainsPage.vue')
    },
    // ✅ 重定向到综合设施页面
    {
      path: '/nearby-amenities',
      redirect: { name: 'NearbyFountains' }
    },
    // 可选别名，老链接可跳转
    { path: '/water/nearby', redirect: { name: 'NearbyFountains' } }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

export default router
