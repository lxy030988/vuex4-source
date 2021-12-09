import { createStore } from '@/vuex'

export default createStore({
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
