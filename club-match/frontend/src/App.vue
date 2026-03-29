<template>
  <div id="app-root">
    <!-- Toast 通知 -->
    <div class="toast-container">
      <transition-group name="toast-anim">
        <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
          {{ t.message }}
        </div>
      </transition-group>
    </div>

    <!-- 主路由 -->
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'

const toasts = ref([])

function showToast(message, type = 'info', duration = 3000) {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }, duration)
}

provide('showToast', showToast)
</script>

<style>
.toast-anim-enter-active { animation: slideInRight 0.3s ease; }
.toast-anim-leave-active { animation: slideInRight 0.25s ease reverse; }
</style>
