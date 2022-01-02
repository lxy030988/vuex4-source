import { computed, h, inject, provide } from 'vue'

export const RouterView = {
  name: 'RouterView',
  setup: (props, { slots }) => {
    const route = inject('route')
    const depth = inject('depth', 0)

    const matchRoute = computed(() => route.matched[depth])

    provide('depth', depth + 1)

    return () => {
      const record = matchRoute.value //record
      console.log('render', record)
      const copm = record && record.components.default

      if (copm) {
        return h(copm)
      }
      return slots.default && slots.default()
    }
  }
}
