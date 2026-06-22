<template>
  <div class="auth-wrapper">
    <div class="container">
      <div class="auth-card card" style="margin: 0 auto;">
        <div style="margin-bottom:1.5rem">
          <h1 class="auth-title">Sign in to RBAC - CRUDAPP</h1>
          <p class="auth-sub">Choose your role and enter your credentials.</p>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="form-group">
            <label class="form-label">Sign in as</label>
            <div class="role-options">
              <label v-for="r in roles" :key="r.value" class="role-option" :class="{ active: form.role === r.value }">
                <input type="radio" v-model="form.role" :value="r.value" class="role-radio" />
                <span class="role-label">{{ r.label }}</span>
                <span class="role-desc">{{ r.desc }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="you@example.com"
              autocomplete="email"
            />
            <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:.5rem" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
          </button>
        </form>

        <p style="text-align:center;margin-top:1rem;font-size:.875rem;color:#6b7280">
          Don't have an account?
          <router-link to="/register" style="color:#4f46e5;font-weight:500">Register</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '@/services/api';

const router = useRouter();
const roles = [
  { value: 'admin', label: 'Admin', desc: 'Manage employees & products' },
  { value: 'employee', label: 'Employee', desc: 'Edit products & prices' },
  { value: 'user', label: 'User', desc: 'View products & prices' },
];
const form = reactive({ email: '', password: '', role: 'user' });
const errors = reactive({});
const error = ref('');
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.email) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.';
  if (!form.password) errors.password = 'Password is required.';
  if (!form.role) errors.role = 'Please select a role.';
  return Object.keys(errors).length === 0;
};

const homeForRole = (role) => (role === 'admin' ? '/dashboard' : '/products');

const handleLogin = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  try {
    const { data } = await authAPI.login(form);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push(homeForRole(data.user.role));
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
