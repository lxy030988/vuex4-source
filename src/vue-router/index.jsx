export { createWebHistory } from './history/h5'
export { createWebHash } from './history/hash'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
import { createRouterMatcher } from './matcher'
import { computed, reactive, ref, shallowRef, unref } from 'vue'

//初始化路由系统中的默认参数
const START_LOCATION_NORMALIZEN = {
  path: '/',
  // meta: {},
  // params: {},
  // query: {},
  matched: []
}

function useCallback() {
  const handlers = []
  function add(handler) {
    handlers.push(handler)
  }

  return {
    add,
    list: () => handlers
  }
}

export function createRouter({ history, routes }) {
  // console.log('createRouter', history, routes)
  const matcher = createRouterMatcher(routes)
  // console.log('matcher', matcher)

  const currentRouter = shallowRef(START_LOCATION_NORMALIZEN)

  const beforeGuards = useCallback()
  const beforeResolveGuards = useCallback()
  const afterGuards = useCallback()

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

  function extractChangingRecords(to, from) {
    const leavingRecords = []
    const updatingRecords = []
    const enteringRecords = []

    const len = Math.max(from.matched.length, to.matched.length)
    for (let i = 0; i < len; i++) {
      const recordFrom = from.matched[i]
      if (recordFrom) {
        if (to.matched.find((record) => record.path === recordFrom.path)) {
          updatingRecords.push(recordFrom)
        } else {
          leavingRecords.push(recordFrom)
        }
      }
      const recordTo = to.matched[i]
      if (recordTo) {
        if (!from.matched.find((record) => record.path === recordTo.path)) {
          enteringRecords.push(recordTo)
        }
      }
    }

    return [leavingRecords, updatingRecords, enteringRecords]
  }

  function guardToPromiseFn(guard, to, from, record) {
    return () =>
      new Promise((resolve, reject) => {
        const guardReturn = guard.call(record, to, from, resolve)
        return Promise.resolve(guardReturn).then(resolve)
      })
  }

  function extractComponentsGuards(matched, guardType, to, from) {
    const guards = []

    for (const record of matched) {
      let rawComponent = record.components.default
      const guard = rawComponent[guardType]
      if (guard) {
        guards.push(guardToPromiseFn(guard, to, from, record))
      }
    }

    return guards
  }

  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve())
  }

  async function navigate(to, from) {
    //在做导航的时候 要知道哪个组件是进入  哪个组件是离开  哪个组件是更新
    // /home/a/b
    // /home/a/c

    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from)

    // console.log('navigate', leavingRecords, updatingRecords, enteringRecords)
    let guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeRouteLeave', to, from)
    console.log('guards', guards)

    return runGuardQueue(guards)
      .then(() => {
        guards = []

        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from, guard))
        }
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from)
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []

        for (const record of to.matched) {
          if (record.beforeEnter) {
            guards.push(guardToPromiseFn(record.beforeEnter, to, from, record))
          }
        }
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from)
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []

        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from, guard))
        }
        return runGuardQueue(guards)
      })
  }

  function pushWidthRedirect(to) {
    //通过路径匹配到对应的记录  更新currentRoute
    const targetLocation = resolve(to)
    const from = currentRouter.value
    //路由的钩子 在跳转前可以做拦截
    console.log('pushWidthRedirect', targetLocation, from)
    navigate(targetLocation, from)
      .then(() => {
        //根据是不是第一次来刷新 来决定是用push 还是 replace
        finalizeNavigation(targetLocation, from)
      })
      .then(() => {
        for (const guard of afterGuards.list()) {
          guard(to, from)
        }
      })
  }

  function push(to) {
    // console.log('push', to)
    return pushWidthRedirect(to)
  }

  const router = {
    push,
    beforeEach: beforeGuards.add,
    afterEach: afterGuards.add,
    beforeResolve: beforeResolveGuards.add,
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
      app.provide('route', reactive(reactiveRouter))

      const obj = reactive(reactiveRouter)

      app.component('router-link', RouterLink)
      app.component('router-view', RouterView)

      if (currentRouter.value === START_LOCATION_NORMALIZEN) {
        //默认就是初始化
        console.log(111)
        //需要通过路由系统 先做一次跳转 进行匹配
        this.push(history.location)
      }

      console.log('gouzi', beforeGuards.list())
    }
  }
  return router
}
