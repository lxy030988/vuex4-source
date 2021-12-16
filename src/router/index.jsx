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
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
