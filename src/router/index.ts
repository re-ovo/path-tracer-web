import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NProgress from "nprogress";
import 'nprogress/nprogress.css'

const nProgress = NProgress.configure({ showSpinner: false })

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/works',
            name: 'works',
            children: [
                {
                    path: 'first-week',
                    name: 'first-week',
                    component: () => import('../views/works/first-week.vue')
                }
            ]
        },
        {
            path: '/:catchAll(.*)',
            name: '404',
            component: () => import('../views/404.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    nProgress.start()
    next()
})

router.afterEach(() => {
    nProgress.done()
})

export default router
