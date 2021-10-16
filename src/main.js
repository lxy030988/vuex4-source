import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
const app = createApp(App)
// app.config.globalProperties.$store
app.use(store, 'lxy').mount('#app')
