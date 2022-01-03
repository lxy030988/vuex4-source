import { h, inject } from 'vue'

export const RouterLink = {
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object],
      required: true
    }
  },
  setup: (props, { slots }) => {
    const router = inject('router')
    const navigate = () => {
      // console.log('navigate', props.to)
      router.push(props.to)
    }
    return () =>
      // <a href="/">{slots.default && slots.default()}</a>
      h(
        'a',
        {
          onClick: navigate
        },
        slots.default && slots.default()
      )
  }
}
