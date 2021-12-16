export { createWebHistory } from './history/h5'
export { createWebHash } from './history/hash'

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
  return { matchers, addRoute }
}

export function createRouter({ history, routes }) {
  // console.log('createRouter', history, routes)
  const matcher = createRouterMatcher(routes)
  console.log('matcher', matcher)
  const router = {
    install(app) {
      // console.log('install', app)

      app.component('router-link', {
        setup:
          (props, { slots }) =>
          () =>
            <a href="/">{slots.default && slots.default()}</a>
      })
      app.component('router-view', {
        setup:
          (props, { slots }) =>
          () =>
            <div>router-view</div>
      })
    }
  }
  return router
}
