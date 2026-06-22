<template>
  <div class="auth-wrapper">
    <div class="container">
      <div class="auth-card card" style="margin: 0 auto;">
        <div style="margin-bottom:1.5rem">
          <h1 class="auth-title">Create an account</h1>
          <p class="auth-sub">Join RBAC - CRUDAPP.</p>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <form @submit.prevent="handleRegister" novalidate>
          <div class="form-group">
            <label class="form-label">Register as</label>
            <div class="role-options">
              <label class="role-option" :class="{ active: form.role === 'user' }">
                <input type="radio" v-model="form.role" value="user" class="role-radio" />
                <span class="role-label">User</span>
                <span class="role-desc">View products and prices</span>
              </label>
              <label class="role-option" :class="{ active: form.role === 'employee' }">
                <input type="radio" v-model="form.role" value="employee" class="role-radio" />
                <span class="role-label">Employee</span>
                <span class="role-desc">Only if your email was added by an admin</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input v-model.trim="form.name" type="text" class="form-input" :class="{ error: errors.name }" placeholder="John Doe" />
            <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input v-model.trim="form.email" type="email" class="form-input" :class="{ error: errors.email }" placeholder="you@example.com" />
            <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input v-model="form.password" type="password" class="form-input" :class="{ error: errors.password }" placeholder="Min 8 chars, uppercase + number" />
            <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:.5rem" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Creating account…' : 'Create account' }}</span>
          </button>
        </form>

        <p style="text-align:center;margin-top:1rem;font-size:.875rem;color:#6b7280">
          Already have an account?
          <router-link to="/login" style="color:#4f46e5;font-weight:500">Sign in</router-link>
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
const form = reactive({ name: '', email: '', password: '', role: 'user' });
const errors = reactive({});
const error = ref('');
const success = ref('');
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name) errors.name = 'Name is required.';
  if (!form.email) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.';
  if (!form.password) errors.password = 'Password is required.';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errors.password = 'Must contain uppercase, lowercase, and a number.';
  return Object.keys(errors).length === 0;
};

const homeForRole = (role) => (role === 'admin' ? '/dashboard' : '/products');

const handleRegister = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  try {
    const { data } = await authAPI.register(form);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push(homeForRole(data.user.role));
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed.';
  } finally {
    loading.value = false;
  }
};
</script>
