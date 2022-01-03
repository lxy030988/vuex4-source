import { createRouter, createWebHistory } from '@/vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      { path: 'a', component: { render: () => <h1>页面a</h1> } },
      { path: 'b', component: { render: () => <h1>页面b</h1> } }
    ],
    beforeEnter(to, form, next) {
      console.log('beforeEnterHome', to, form)
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, form, next) => {
  console.log('beforeEach', to, form)
})

router.beforeResolve((to, form, next) => {
  console.log('beforeResolve', to, form)
})

router.afterEach((to, form, next) => {
  console.log('afterEach', to, form)
})

export default router
