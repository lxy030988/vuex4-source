import { inject } from 'vue'

export const storeKey = 'store'

export function useStore(injectKey = storeKey) {
  return inject(injectKey)
}
