import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
