<template>
  <div class="page">
    <div class="container" style="max-width:640px">
      <div style="margin-bottom:1.25rem">
        <router-link to="/dashboard" style="color:#4f46e5;font-size:.875rem">← Back to Dashboard</router-link>
      </div>
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Edit Employee</h2>
        </div>

        <div v-if="fetchError" class="alert alert-error">{{ fetchError }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div v-if="fetchLoading" style="text-align:center;padding:2rem">
          <span class="spinner" style="width:2rem;height:2rem;border-width:4px"></span>
        </div>

        <form v-else @submit.prevent="handleSubmit" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input v-model.trim="form.name" class="form-input" :class="{ error: errors.name }" />
              <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input v-model.trim="form.email" type="email" class="form-input" :class="{ error: errors.email }" />
              <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select v-model="form.department" class="form-select">
                <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Position *</label>
              <input v-model.trim="form.position" class="form-input" :class="{ error: errors.position }" />
              <p v-if="errors.position" class="form-error">{{ errors.position }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Salary (₹) *</label>
              <input v-model.number="form.salary" type="number" min="0" class="form-input" :class="{ error: errors.salary }" />
              <p v-if="errors.salary" class="form-error">{{ errors.salary }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input v-model.trim="form.phone" class="form-input" />
            </div>
          </div>

          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem">
            <router-link to="/dashboard" class="btn btn-outline">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { employeeAPI } from '@/services/api';

const route = useRoute();
const router = useRouter();
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];
const form = reactive({ name: '', email: '', department: '', position: '', salary: '', phone: '' });
const errors = reactive({});
const error = ref('');
const fetchError = ref('');
const successMsg = ref('');
const fetchLoading = ref(true);
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name) errors.name = 'Name is required.';
  if (!form.email) errors.email = 'Email is required.';
  if (!form.position) errors.position = 'Position is required.';
  if (form.salary === '') errors.salary = 'Salary is required.';
  return Object.keys(errors).length === 0;
};

const fetchEmployee = async () => {
  try {
    const { data } = await employeeAPI.getOne(route.params.id);
    Object.assign(form, {
      name: data.employee.name,
      email: data.employee.email,
      department: data.employee.department,
      position: data.employee.position,
      salary: data.employee.salary,
      phone: data.employee.phone || '',
    });
  } catch (err) {
    fetchError.value = err.response?.data?.message || 'Failed to load employee.';
  } finally {
    fetchLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  try {
    await employeeAPI.update(route.params.id, form);
    successMsg.value = 'Employee updated successfully.';
    setTimeout(() => router.push('/dashboard'), 1200);
  } catch (err) {
    error.value = err.response?.data?.message || 'Update failed.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEmployee);
</script>
