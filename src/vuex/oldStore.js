import { reactive } from 'vue'
import { forEachValue } from './utils'
import { storeKey } from './injectKey'

export default class Store {
  constructor(options) {
    this._state = reactive({ data: options.state })

    this.getters = {}
    forEachValue(options.getters, (fn, key) => {
      Object.defineProperty(this.getters, key, {
        enumerable: true,
        get: () => fn(this.state)
      })
    })

    this._mutations = Object.create(null)
    forEachValue(options.mutations, (fn, key) => {
      this._mutations[key] = (payload) => {
        fn.call(this, this.state, payload)
      }
    })

    this._actions = Object.create(null)
    forEachValue(options.actions, (fn, key) => {
      this._actions[key] = (payload) => {
        fn.call(this, this, payload)
      }
    })
  }
  commit = (key, payload) => {
    this._mutations[key](payload)
  }
  dispatch = (key, payload) => {
    this._actions[key](payload)
  }
  get state() {
    return this._state.data
  }
  install(app, injectKey) {
    console.log(app, injectKey)
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this
  }
}
