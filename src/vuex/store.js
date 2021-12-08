import { reactive } from 'vue'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collection'

function installModule(store, rootState, path = [], module) {
  if (path.length === 0) {
    //根模块
  } else {
    const parentState = path
      .slice(0, -1)
      .reduce((state, key) => state[key], rootState)
    parentState[path[path.length - 1]] = module.state
  }
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}

export default class Store {
  constructor(options) {
    //{state,getters,mutations,actions}
    this._modules = new ModuleCollection(options)
    console.log('_modules', this._modules)

    //定义状态
    installModule(this, this._modules.root.state, [], this._modules.root) //根状态

    console.log('_modules state', this._modules)
  }

  install(app, injectKey) {
    console.log(app, injectKey)
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this
  }
}
