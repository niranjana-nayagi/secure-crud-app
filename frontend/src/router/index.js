import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import DashboardView from '@/views/DashboardView.vue';
import ProductsView from '@/views/ProductsView.vue';
import AddEmployeeView from '@/views/AddEmployeeView.vue';
import EditEmployeeView from '@/views/EditEmployeeView.vue';
import AddProductView from '@/views/AddProductView.vue';
import EditProductView from '@/views/EditProductView.vue';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

const homeForRole = (role) => (role === 'admin' ? '/dashboard' : '/products');

const routes = [
  {
    path: '/',
    redirect: () => {
      const user = getUser();
      if (!localStorage.getItem('token') || !user) return '/login';
      return homeForRole(user.role);
    },
  },
  { path: '/login', component: LoginView, meta: { guest: true } },
  { path: '/register', component: RegisterView, meta: { guest: true } },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/products', component: ProductsView, meta: { requiresAuth: true, roles: ['admin', 'user', 'employee'] } },
  { path: '/employees/add', component: AddEmployeeView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/employees/:id/edit', component: EditEmployeeView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/products/add', component: AddProductView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/products/:id/edit', component: EditProductView, meta: { requiresAuth: true, roles: ['admin', 'employee'] } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = getUser();

  if (to.meta.requiresAuth && !token) return next('/login');

  if (to.meta.guest && token) return next(homeForRole(user?.role));

  if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
    return next(homeForRole(user.role));
  }

  next();
});

export default router;
