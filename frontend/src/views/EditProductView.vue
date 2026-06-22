<template>
  <div class="page">
    <div class="container" style="max-width:640px">
      <div style="margin-bottom:1.25rem">
        <router-link to="/products" style="color:#4f46e5;font-size:.875rem">← Back to Products</router-link>
      </div>
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Edit Product</h2>
        </div>

        <div v-if="fetchError" class="alert alert-error">{{ fetchError }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div v-if="fetchLoading" style="text-align:center;padding:2rem">
          <span class="spinner" style="width:2rem;height:2rem;border-width:4px"></span>
        </div>

        <form v-else @submit.prevent="handleSubmit" novalidate>
          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input v-model.trim="form.name" class="form-input" :class="{ error: errors.name }" />
            <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model.trim="form.description" class="form-input" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Price (₹) *</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-input" :class="{ error: errors.price }" />
            <p v-if="errors.price" class="form-error">{{ errors.price }}</p>
          </div>

          <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem">
            <router-link to="/products" class="btn btn-outline">Cancel</router-link>
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
import { productAPI } from '@/services/api';

const route = useRoute();
const router = useRouter();
const form = reactive({ name: '', description: '', price: '' });
const errors = reactive({});
const error = ref('');
const fetchError = ref('');
const successMsg = ref('');
const fetchLoading = ref(true);
const loading = ref(false);

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name) errors.name = 'Name is required.';
  if (form.price === '') errors.price = 'Price is required.';
  return Object.keys(errors).length === 0;
};

const fetchProduct = async () => {
  try {
    const { data } = await productAPI.getOne(route.params.id);
    Object.assign(form, {
      name: data.product.name,
      description: data.product.description || '',
      price: data.product.price,
    });
  } catch (err) {
    fetchError.value = err.response?.data?.message || 'Failed to load product.';
  } finally {
    fetchLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!validate()) return;
  loading.value = true;
  error.value = '';
  try {
    await productAPI.update(route.params.id, form);
    successMsg.value = 'Product updated successfully.';
    setTimeout(() => router.push('/products'), 1200);
  } catch (err) {
    error.value = err.response?.data?.message || 'Update failed.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProduct);
</script>
