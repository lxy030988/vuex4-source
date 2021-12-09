import { reactive } from 'vue'
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
    parentState[path[path.length - 1]] = module.state
  }

  //state
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
  //getters
  module.forEachGetter((getter, key) => {
    store._getters[key] = () => {
      return getter(getNestedState(store.state, path))
    }
  })
  //mutations
  module.forEachMutation((mutation, key) => {
    const entry = store._mutations[key] || (store._mutations[key] = [])
    //store.commit('add',payload)
    entry.push((payload) => {
      mutation.call(store, getNestedState(store.state, path), payload)
    })
  })
  //actions
  module.forEachAction((action, key) => {
    const entry = store._actions[key] || (store._actions[key] = [])
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
}

export default class Store {
  constructor(options) {
    //{state,getters,mutations,actions}
    this._modules = new ModuleCollection(options)
    // console.log('_modules', this._modules)

    this._getters = Object.create(null)
    this._mutations = Object.create(null)
    this._actions = Object.create(null)

    //定义状态
    installModule(this, this._modules.root.state, [], this._modules.root) //根状态

    resetState(this, this._modules.root.state)

    console.log('_modules state', this._modules)
    console.log('Store', this)
  }

  get state() {
    return this._state.data
  }

  commit = (key, payload) => {
    const entry = this._mutations[key]
    if (entry && entry.length) {
      entry.forEach((handler) => handler(payload))
    }
  }
  dispatch = (key, payload) => {
    const entry = this._actions[key]
    return Promise.all(entry.map((handler) => handler(payload)))
  }

  install(app, injectKey) {
    console.log(app, injectKey)
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this
  }
}
