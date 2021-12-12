import Module from './module'
import { forEachValue } from '../utils'

export default class ModuleCollection {
  constructor(rootModule) {
    this.root = null
    this.register(rootModule)
  }
  register(rawModule, path = []) {
    const module = new Module(rawModule)

    if (path.length == 0) {
      //根模块
      this.root = module
    } else {
      // [a] [b] [a[c]]
      const parent = path.slice(0, -1).reduce((module, current) => {
        return module.getChild(current)
      }, this.root)
      parent.addChild(path[path.length - 1], module)
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(rawChildModule, path.concat(key))
      })
    }

    return module
  }
  getNamespaced(path) {
    let module = this.root
    return path.reduce((res, key) => {
      module = module.getChild(key)
      return res + (module.namespaced ? key + '/' : '')
    }, '')
  }
}
