<template>
  <div class="page">
    <div class="container" style="max-width:640px">
      <div style="margin-bottom:1.25rem">
        <router-link to="/products" style="color:#4f46e5;font-size:.875rem">← Back to Products</router-link>
      </div>
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Add New Product</h2>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="apiErrors.length" class="alert alert-error">
          <ul style="list-style:disc;padding-left:1rem">
            <li v-for="e in apiErrors" :key="e.field">{{ e.field }}: {{ e.message }}</li>
          </ul>
        </div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input v-model.trim="form.name" class="form-input" :class="{ error: errors.name }" placeholder="Wireless Headphones" />
            <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model.trim="form.description" class="form-input" rows="3" placeholder="Optional product description"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Price (₹) *</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-input" :class="{ error: errors.price }" placeholder="1999" />
            <p v-if="errors.price" class="form-error">{{ errors.price }}</p>
          </div>

          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem">
            <router-link to="/products" class="btn btn-outline">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Creating…' : 'Create Product' }}
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
import { productAPI } from '@/services/api';

const router = useRouter();
const form = reactive({ name: '', description: '', price: '' });
const errors = reactive({});
const error = ref('');
const apiErrors = ref([]);
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name) errors.name = 'Name is required.';
  if (form.price === '' || form.price === null) errors.price = 'Price is required.';
  else if (Number(form.price) < 0) errors.price = 'Price must be a positive number.';
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  apiErrors.value = [];
  try {
    await productAPI.create(form);
    router.push('/products');
  } catch (err) {
    if (err.response?.data?.errors) {
      apiErrors.value = err.response.data.errors;
    } else {
      error.value = err.response?.data?.message || 'Failed to create product.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
