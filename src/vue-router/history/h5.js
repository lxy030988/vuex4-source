function buildState(back, current, forward, replace = false, computedScroll = false) {
  return {
    back,
    current,
    forward,
    replace,
    scroll: computedScroll ? { left: window.pageXOffset, top: window.pageYOffset } : null,
    position: window.history.length - 1
  }
}
function createCurrnetLocation(base) {
  const { pathname, search, hash } = window.location

  const index = base.indexOf('#')
  if (index > -1) {
    return base.slice(1) || '/'
  }
  return pathname + search + hash
}
function useHistoryStateNavigation(base) {
  const currentLocation = {
    value: createCurrnetLocation(base)
  }
  const historyState = {
    value: window.history.state
  }

  //第一次刷新页面 没有任何状态  自己去维护一个状态（后退后是哪个路径、当前是哪个路径、要去哪个路径、push replace 跳转、跳转后滚动条位置）
  if (!historyState.value) {
    changeLocation(currentLocation.value, buildState(null, currentLocation.value, null, true), true)
  }

  function changeLocation(to, state, replace) {
    const index = base.indexOf('#')
    const url = index > -1 ? base + to : to
    window.history[replace ? 'replaceState' : 'pushState'](state, null, url)
    historyState.value = state
  }

  function push(to, data) {
    //跳转前
    const currentState = Object.assign({}, historyState.value, {
      forward: to,
      scroll: { left: window.pageXOffset, top: window.pageYOffset }
    })
    //本质没有跳转 只是更新了状态 后续在vue中可以详细监控到状态的变化
    changeLocation(currentState.current, currentState, true)

    //跳转后
    const state = Object.assign(
      {},
      buildState(currentLocation.value, to, null),
      { position: currentState.position + 1 },
      data
    )
    changeLocation(to, state, false)
    currentLocation.value = to
  }
  function replace(to, data) {
    const state = Object.assign({}, buildState(historyState.value.back, to, historyState.value.forward, true), data)
    changeLocation(to, state, true)

    currentLocation.value = to
  }

  return {
    location: currentLocation,
    state: historyState,
    push,
    replace
  }
}

function useHistoryListeners(base, historyState, location) {
  let listens = []
  window.addEventListener('popstate', ({ state }) => {
    console.log('popstate', state, historyState, location)
    const to = createCurrnetLocation(base)
    const from = location.value
    const fromState = historyState.value

    location.value = to
    historyState.value = state

    let isBack = state.position - fromState.position < 0
    // console.log('isBack', isBack)

    listens.forEach((fn) => fn(to, from, { isBack }))
  })

  function listen(cb) {
    listens.push(cb)
  }
  return { listen }
}

export function createWebHistory(base = '') {
  const historyNavigation = useHistoryStateNavigation(base)

  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location)

  const router = Object.assign({}, historyNavigation, historyListeners)
  Object.defineProperty(router, 'location', {
    get: () => historyNavigation.location.value
  })
  return router
}
