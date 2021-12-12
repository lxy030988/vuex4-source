<template>
  <h1 @click="add">{{ $store.state.count }}</h1>
  <div @click="asyncAdd">{{ double }}</div>
  <button @click="$store.state.count++">错误修改</button>
  <hr />
  <div @click="adda">a模块 {{ acount }}</div>
  <hr />
  <div @click="addb">b模块 {{ bcount }}</div>
  <div @click="addd">d模块 {{ dcount }}</div>
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
const acount = computed(() => store.state.aModule.count)
const bcount = computed(() => store.state.bModule.count)
const dcount = computed(() => store.state.aModule.dModule.count)
const adda = () => {
  store.commit('aModule/add', 1)
}

const addb = () => {
  store.commit('bModule/add', 2)
}
const addd = () => {
  store.commit('aModule/dModule/add', 3)
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
