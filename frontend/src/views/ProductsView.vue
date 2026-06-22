<template>
  <div class="page">
    <div class="container">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#4f46e5">{{ pagination.total || 0 }}</div>
          <div style="font-size:.875rem;color:#6b7280">Total Products</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#10b981">{{ formatCurrency(avgPrice) }}</div>
          <div style="font-size:.875rem;color:#6b7280">Average Price</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#f59e0b;text-transform:capitalize">{{ user?.role }}</div>
          <div style="font-size:.875rem;color:#6b7280">Your Role</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Product Catalog</h2>
          <router-link v-if="canManageProducts" to="/products/add" class="btn btn-primary">
            + Add Product
          </router-link>
        </div>

        <div class="search-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input
              v-model="search"
              class="form-input"
              placeholder="Search products…"
              @input="debouncedFetch"
            />
          </div>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="table-wrapper">
          <table v-if="products.length">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price (₹)</th>
                <th v-if="canEditProducts">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, i) in products" :key="product._id">
                <td>{{ (pagination.page - 1) * pagination.limit + i + 1 }}</td>
                <td><strong>{{ product.name }}</strong></td>
                <td style="color:#6b7280">{{ product.description || '—' }}</td>
                <td>{{ formatCurrency(product.price) }}</td>
                <td v-if="canEditProducts">
                  <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                    <router-link :to="`/products/${product._id}/edit`" class="btn btn-outline btn-sm">Edit</router-link>
                    <button
                      v-if="user?.role === 'admin'"
                      class="btn btn-danger btn-sm"
                      @click="confirmDelete(product)"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else-if="!loading" class="empty-state">
            <div style="font-size:3rem">📦</div>
            <p>No products found.</p>
          </div>

          <div v-if="loading" style="text-align:center;padding:2rem">
            <span class="spinner" style="width:2rem;height:2rem;border-width:4px"></span>
          </div>
        </div>

        <div v-if="pagination.pages > 1" class="pagination">
          <button class="page-btn" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">← Prev</button>
          <button
            v-for="p in pagination.pages" :key="p"
            class="page-btn" :class="{ active: p === pagination.page }"
            @click="changePage(p)"
          >{{ p }}</button>
          <button class="page-btn" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next →</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3 class="modal-title">Confirm Delete</h3>
        <p style="color:#6b7280;font-size:.875rem">
          Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="deleteProduct" :disabled="deleting">
            <span v-if="deleting" class="spinner"></span>
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { productAPI } from '@/services/api';

const user = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
});

const canManageProducts = computed(() => user.value?.role === 'admin');
const canEditProducts = computed(() => ['admin', 'employee'].includes(user.value?.role));

const products = ref([]);
const loading = ref(false);
const error = ref('');
const successMsg = ref('');
const search = ref('');
const pagination = reactive({ page: 1, pages: 1, total: 0, limit: 10 });
const deleteTarget = ref(null);
const deleting = ref(false);

const avgPrice = computed(() => {
  if (!products.value.length) return 0;
  const sum = products.value.reduce((acc, p) => acc + p.price, 0);
  return Math.round(sum / products.value.length);
});

const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

let debounceTimer;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { pagination.page = 1; fetchProducts(); }, 400);
};

const fetchProducts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = { page: pagination.page, limit: pagination.limit };
    if (search.value) params.search = search.value;
    const { data } = await productAPI.getAll(params);
    products.value = data.products;
    Object.assign(pagination, data.pagination);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products.';
  } finally {
    loading.value = false;
  }
};

const changePage = (p) => { pagination.page = p; fetchProducts(); };

const confirmDelete = (product) => { deleteTarget.value = product; };
const deleteProduct = async () => {
  deleting.value = true;
  try {
    await productAPI.delete(deleteTarget.value._id);
    successMsg.value = `${deleteTarget.value.name} has been deleted.`;
    deleteTarget.value = null;
    fetchProducts();
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed.';
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchProducts);
</script>
