import { createStore } from '@/vuex'

function plugin1(store) {
  const localState = localStorage.getItem('vuex-state')
  if (localState) {
    store.replaceState(JSON.parse(localState))
  }
  // console.log('plugin1', store)
  store.subscribe((mutation, state) => {
    //状态发生变化 会执行此回调 调用mutation的时候
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}

export default createStore({
  plugins: [plugin1],
  strict: true, //严格模式
  state: {
    count: 0
  },
  getters: {
    double(state) {
      // console.log('double', state)
      return state.count * 2
    }
  },
  mutations: {
    add(state, payload) {
      state.count += payload
    }
  },
  actions: {
    asyncAdd({ commit }, payload) {
      setTimeout(() => {
        commit('add', payload)
      }, 1000)
    }
  },
  modules: {
    aModule: {
      namespaced: true,
      state: {
        count: 0
      },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      },
      modules: {
        cModule: {
          namespaced: true,
          state: {
            count: 22
          },
          mutations: {
            add(state, payload) {
              state.count += payload
            }
          }
        }
      }
    },
    bModule: {
      namespaced: true,
      state: {
        count: 10
      },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      }
    }
  }
})
