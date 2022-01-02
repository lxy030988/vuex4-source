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

export function createRouterMatcher(routes) {
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
      matched.unshift(matcher.record) //将用户的原始数据 放到mathed中
      matcher = matcher.parent
    }

    return {
      path: location.path,
      matched
    }
  }
  return { matchers, addRoute, resolve }
}
