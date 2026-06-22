<template>
  <div class="page">
    <div class="container">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#4f46e5">{{ pagination.total || 0 }}</div>
          <div style="font-size:.875rem;color:#6b7280">Total Employees</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#10b981">{{ departments.length }}</div>
          <div style="font-size:.875rem;color:#6b7280">Departments</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#f59e0b">Admin</div>
          <div style="font-size:.875rem;color:#6b7280">Your Role</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Employee Directory</h2>
          <router-link to="/employees/add" class="btn btn-primary">
            + Add Employee
          </router-link>
        </div>

        <div class="search-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input
              v-model="search"
              class="form-input"
              placeholder="Search by name, department…"
              @input="debouncedFetch"
            />
          </div>
          <select v-model="filterDept" class="form-select" style="width:auto" @change="fetchEmployees">
            <option value="">All Departments</option>
            <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="table-wrapper">
          <table v-if="employees.length">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Salary (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(emp, i) in employees" :key="emp._id">
                <td>{{ (pagination.page - 1) * pagination.limit + i + 1 }}</td>
                <td><strong>{{ emp.name }}</strong></td>
                <td style="color:#6b7280">{{ emp.email }}</td>
                <td><span class="badge badge-dept">{{ emp.department }}</span></td>
                <td>{{ emp.position }}</td>
                <td>{{ formatCurrency(emp.salary) }}</td>
                <td>
                  <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                    <router-link :to="`/employees/${emp._id}/edit`" class="btn btn-outline btn-sm">Edit</router-link>
                    <button class="btn btn-danger btn-sm" @click="confirmDelete(emp)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else-if="!loading" class="empty-state">
            <div style="font-size:3rem">👥</div>
            <p>No employees found. <router-link to="/employees/add">Add the first one.</router-link></p>
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
          Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>? This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="deleteEmployee" :disabled="deleting">
            <span v-if="deleting" class="spinner"></span>
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { employeeAPI } from '@/services/api';

const employees = ref([]);
const loading = ref(false);
const error = ref('');
const successMsg = ref('');
const search = ref('');
const filterDept = ref('');
const pagination = reactive({ page: 1, pages: 1, total: 0, limit: 10 });
const deleteTarget = ref(null);
const deleting = ref(false);

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];

const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

let debounceTimer;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { pagination.page = 1; fetchEmployees(); }, 400);
};

const fetchEmployees = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = { page: pagination.page, limit: pagination.limit };
    if (search.value) params.search = search.value;
    if (filterDept.value) params.department = filterDept.value;
    const { data } = await employeeAPI.getAll(params);
    employees.value = data.employees;
    Object.assign(pagination, data.pagination);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load employees.';
  } finally {
    loading.value = false;
  }
};

const changePage = (p) => { pagination.page = p; fetchEmployees(); };

const confirmDelete = (emp) => { deleteTarget.value = emp; };
const deleteEmployee = async () => {
  deleting.value = true;
  try {
    await employeeAPI.delete(deleteTarget.value._id);
    successMsg.value = `${deleteTarget.value.name} has been deleted.`;
    deleteTarget.value = null;
    fetchEmployees();
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed.';
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchEmployees);
</script>
