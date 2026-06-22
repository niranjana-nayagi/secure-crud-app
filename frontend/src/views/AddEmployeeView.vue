<template>
  <div class="page">
    <div class="container" style="max-width:640px">
      <div style="margin-bottom:1.25rem">
        <router-link to="/dashboard" style="color:#4f46e5;font-size:.875rem">← Back to Dashboard</router-link>
      </div>
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Add New Employee</h2>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="apiErrors.length" class="alert alert-error">
          <ul style="list-style:disc;padding-left:1rem">
            <li v-for="e in apiErrors" :key="e.field">{{ e.field }}: {{ e.message }}</li>
          </ul>
        </div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input v-model.trim="form.name" class="form-input" :class="{ error: errors.name }" placeholder="Jane Doe" />
              <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input v-model.trim="form.email" type="email" class="form-input" :class="{ error: errors.email }" placeholder="jane@company.com" />
              <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select v-model="form.department" class="form-select" :class="{ error: errors.department }">
                <option value="">Select department</option>
                <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
              </select>
              <p v-if="errors.department" class="form-error">{{ errors.department }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Position *</label>
              <input v-model.trim="form.position" class="form-input" :class="{ error: errors.position }" placeholder="e.g. Senior Developer" />
              <p v-if="errors.position" class="form-error">{{ errors.position }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Salary (₹) *</label>
              <input v-model.number="form.salary" type="number" min="0" class="form-input" :class="{ error: errors.salary }" placeholder="500000" />
              <p v-if="errors.salary" class="form-error">{{ errors.salary }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input v-model.trim="form.phone" class="form-input" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem">
            <router-link to="/dashboard" class="btn btn-outline">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Creating…' : 'Create Employee' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { employeeAPI } from '@/services/api';

const router = useRouter();
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];
const form = reactive({ name: '', email: '', department: '', position: '', salary: '', phone: '' });
const errors = reactive({});
const error = ref('');
const apiErrors = ref([]);
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name) errors.name = 'Name is required.';
  if (!form.email) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.';
  if (!form.department) errors.department = 'Department is required.';
  if (!form.position) errors.position = 'Position is required.';
  if (form.salary === '' || form.salary === null) errors.salary = 'Salary is required.';
  else if (Number(form.salary) < 0) errors.salary = 'Salary must be a positive number.';
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  apiErrors.value = [];
  try {
    await employeeAPI.create(form);
    router.push('/dashboard');
  } catch (err) {
    if (err.response?.data?.errors) {
      apiErrors.value = err.response.data.errors;
    } else {
      error.value = err.response?.data?.message || 'Failed to create employee.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
