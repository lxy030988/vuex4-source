export { createWebHistory } from './history/h5'
export { createWebHash } from './history/hash'
import { RouterLink } from './router-link'

import { computed, reactive, ref, shallowRef, unref } from 'vue'

function normalizeRecord(route) {
  return {
    path: route.path,
    name: route.name,
    meta: route.meta || {},
    beforeEnter: route.beforeEnter,
    components: { default: route.component },
    children: route.children
  }
}

function createRouteMatcher(record, parent) {
  const matcher = {
    path: record.path,
    record,
    parent,
    children: []
  }
  if (parent) {
    parent.children.push(matcher)
  }
  return matcher
}

function createRouterMatcher(routes) {
  const matchers = []

  function addRoute(route, parent = null) {
    const record = normalizeRecord(route)
    // console.log('record', record)
    if (parent) {
      record.path = parent.path + record.path
    }

    const matcher = createRouteMatcher(record, parent)
    if (record.children && record.children.length) {
      record.children.forEach((child) => addRoute(child, matcher))
    }
    matchers.push(matcher)
  }
  routes.forEach((route) => addRoute(route))

  function resolve(location) {
    const matched = []

    let matcher = matchers.find((m) => {
      return m.path === location.path
    })
    while (matcher) {
      matched.push(matcher.record) //将用户的原始数据 放到mathed中
      matcher = matcher.parent
    }

    return {
      path: location.path,
      matched
    }
  }
  return { matchers, addRoute, resolve }
}

//初始化路由系统中的默认参数
const START_LOCATION_NORMALIZEN = {
  path: '/',
  // meta: {},
  // params: {},
  // query: {},
  matched: []
}

export function createRouter({ history, routes }) {
  // console.log('createRouter', history, routes)
  const matcher = createRouterMatcher(routes)
  // console.log('matcher', matcher)

  const currentRouter = shallowRef(START_LOCATION_NORMALIZEN)

  function resolve(to) {
    if (typeof to === 'string') {
      to = { path: to }
    }
    return matcher.resolve(to)
  }

  let ready
  function markAsReady() {
    if (ready) return
    ready = true
    history.listen((to, from, { isBack }) => {
      const targetLocation = resolve(to)
      const from1 = currentRouter.value

      finalizeNavigation(targetLocation, from1, true)
    })
  }

  function finalizeNavigation(to, from, replace = false) {
    if (from === START_LOCATION_NORMALIZEN || replace) {
      history.replace(to.path)
    } else {
      history.push(to.path)
    }
    currentRouter.value = to //更新最新的路径

    console.log('finalizeNavigation', currentRouter.value)
    //如果是初始化 需要注入一个listen 去更新currentRouter  这样数据变化后可以重新渲染
    markAsReady()
  }

  function pushWidthRedirect(to) {
    //通过路径匹配到对应的记录  更新currentRoute
    const targetLocation = resolve(to)
    const from = currentRouter.value
    //路由的钩子 在跳转前可以做拦截
    console.log('pushWidthRedirect', targetLocation, from)
    //根据是不是第一次来刷新 来决定是用push 还是 replace
    finalizeNavigation(targetLocation, from)
  }

  function push(to) {
    // console.log('push', to)
    return pushWidthRedirect(to)
  }

  const router = {
    push,
    replace() {},
    install(app) {
      // console.log('install', app)
      app.config.globalProperties.$router = this
      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRouter)
      })

      //将数据用计算属性再次包裹
      const reactiveRouter = {}
      for (const key in START_LOCATION_NORMALIZEN) {
        reactiveRouter[key] = computed(() => currentRouter.value[key])
      }

      app.provide('router', this)
      app.provide('route', reactive(currentRouter))

      const obj = reactive(reactiveRouter)
      // console.log(currentRouter.value, reactiveRouter, obj)

      app.component('router-link', RouterLink)
      app.component('router-view', {
        setup:
          (props, { slots }) =>
          () =>
            <div>router-view</div>
      })

      if (currentRouter.value === START_LOCATION_NORMALIZEN) {
        //默认就是初始化
        console.log(111)
        //需要通过路由系统 先做一次跳转 进行匹配
        this.push(history.location)
      }
    }
  }
  return router
}
