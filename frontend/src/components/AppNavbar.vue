<template>
  <nav class="navbar">
    <div class="container navbar-inner">
      <router-link class="navbar-brand" :to="homeLink">RBAC - CRUDAPP</router-link>
      <div class="navbar-links" v-if="user">
        <router-link v-if="user.role === 'admin'" to="/dashboard" class="nav-link">Employees</router-link>
        <router-link to="/products" class="nav-link">Products</router-link>
      </div>
      <div class="navbar-user">
        <span>{{ user?.name }}</span>
        <span class="badge" :class="badgeClass">{{ user?.role }}</span>
        <button class="btn btn-outline btn-sm" @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
});

const homeLink = computed(() => (user.value?.role === 'admin' ? '/dashboard' : '/products'));

const badgeClass = computed(() => {
  if (user.value?.role === 'admin') return 'badge-admin';
  if (user.value?.role === 'employee') return 'badge-employee';
  return 'badge-user';
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>
