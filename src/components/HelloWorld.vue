<template>
  <h1 @click="add">{{ $store.state.count }}</h1>
  <div @click="asyncAdd">{{ double }}</div>
  <!-- <button @click="$store.state.count++">错误修改</button> -->
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from '@/vuex'
defineProps({
  msg: String
})

const store = useStore('lxy')
console.log('store', store)
// const count = 1
const count = computed(() => store.state.count)
const double = computed(() => store.getters.double)
const add = () => {
  store.commit('add', 1)
}
const asyncAdd = () => {
  store.dispatch('asyncAdd', 1)
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
