import { reactive, watch } from 'vue'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collection'
import { isPromise, forEachValue } from './utils'

//根据路径 获取store上的最新状态
function getNestedState(state, path) {
  return path.reduce((rstate, key) => rstate[key], state)
}

function installModule(store, rootState, path = [], module) {
  if (path.length === 0) {
    //根模块
  } else {
    const parentState = path
      .slice(0, -1)
      .reduce((state, key) => state[key], rootState)

    store._withCommit(() => {
      parentState[path[path.length - 1]] = module.state
    })
  }

  const namespaced = store._modules.getNamespaced(path)
  // console.log('namespaced', namespaced)

  //state
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
  //getters
  module.forEachGetter((getter, key) => {
    store._getters[namespaced + key] = () => {
      return getter(getNestedState(store.state, path))
    }
  })
  //mutations
  module.forEachMutation((mutation, key) => {
    const entry =
      store._mutations[namespaced + key] ||
      (store._mutations[namespaced + key] = [])
    //store.commit('add',payload)
    entry.push((payload) => {
      mutation.call(store, getNestedState(store.state, path), payload)
    })
  })
  //actions
  module.forEachAction((action, key) => {
    const entry =
      store._actions[namespaced + key] ||
      (store._actions[namespaced + key] = [])
    //store.dispatch('add',payload)
    entry.push((payload) => {
      const res = action.call(store, store, payload)
      //res是不是一个promise
      if (isPromise(res)) {
        return res
      }
      return Promise.resolve(res)
    })
  })
}

function resetState(store, state) {
  store._state = reactive({ data: state })
  store.getters = {}
  forEachValue(store._getters, (fn, key) => {
    Object.defineProperty(store.getters, key, {
      enumerable: true,
      get: () => fn(store._state)
    })
  })
  if (store.strict) {
    enableStrictMode(store)
  }
}

function enableStrictMode(store) {
  watch(
    () => store._state.data,
    () => {
      console.assert(store._commiting, '不能在mutation外修改状态')
    },
    { deep: true, flush: 'sync' } //默认是异步监控,改成同步监控
  )
}

export default class Store {
  constructor(options) {
    //{state,getters,mutations,actions}
    this._modules = new ModuleCollection(options)
    // console.log('_modules', this._modules)

    this._getters = Object.create(null)
    this._mutations = Object.create(null)
    this._actions = Object.create(null)

    this.strict = options.strict || false
    //调用的时候 知道是mutation，必须是同步代码
    this._commiting = false
    /**
     * 实现
     * 在mutation之前添加一个状态 _commiting = true
     * 调用mutation，会更改状态
     * 监控这个状态 为true 同步更改
     * 否则报错
     */

    //定义状态
    installModule(this, this._modules.root.state, [], this._modules.root) //根状态

    resetState(this, this._modules.root.state)

    // console.log('_modules state', this._modules)
    // console.log('Store', this)
    this._subscribes = []
    options.plugins.forEach((plugin) => plugin(this))
  }

  registerModule(path, rawModule) {
    if (typeof path === 'string') {
      path = [path]
    }
    //在原有模块基础上新增一个模块
    const module = this._modules.register(rawModule, path)
    //把模块安装上
    installModule(this, this.state, path, module)
    //重置容器
    resetState(this, this.state)
  }

  subscribe(fn) {
    this._subscribes.push(fn)
  }

  replaceState(newState) {
    this._withCommit(() => {
      this._state.data = newState
    })
  }

  _withCommit(fn) {
    //切片
    const commiting = this._commiting
    this._commiting = true
    fn()
    this._commiting = commiting
  }

  get state() {
    return this._state.data
  }

  commit = (key, payload) => {
    const entry = this._mutations[key]
    if (entry && entry.length) {
      this._withCommit(() => {
        entry.forEach((handler) => handler(payload))
      })
      this._subscribes.forEach((subscribe) =>
        subscribe({ key, payload }, this.state)
      )
    }
  }
  dispatch = (key, payload) => {
    const entry = this._actions[key]
    return Promise.all(entry.map((handler) => handler(payload)))
  }

  install(app, injectKey) {
    // console.log(app, injectKey)
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this
  }
}
