<template>
  <div id="app">
    <AppNavbar v-if="isAuthenticated" />
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AppNavbar from '@/components/AppNavbar.vue';

const isAuthenticated = computed(() => !!localStorage.getItem('token'));
</script>
