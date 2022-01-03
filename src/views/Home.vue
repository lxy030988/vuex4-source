<template>
  <div>home</div>
  <div>
    <router-link to="/a">a</router-link>
    <router-link to="/b">b</router-link>
  </div>

  <router-view></router-view>
</template>
<script>
export default {
  mounted() {
    console.log('home mounted')
  },
  async beforeRouteEnter(to, from, next) {
    console.log('beforeRouteEnter', to, from)
  },
  async beforeRouteLeave(to, from, next) {
    console.log('beforeRouteLeave', to, from)
  },
  async beforeRouteUpdate(to, from, next) {
    console.log('beforeRouteUpdate', to, from)
  }
}
</script>
