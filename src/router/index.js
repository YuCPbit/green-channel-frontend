// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from '@/api/auth'
import workstudyRoutes from './workstudy'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/views/403.vue')
    },
    ...workstudyRoutes
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const user = await getCurrentUser()

    if (to.meta.requiresAuth && !user) {
        next('/login')
    } else if (to.path === '/login' && user) {
        next('/')
    } else {
        next()
    }
})

export default router