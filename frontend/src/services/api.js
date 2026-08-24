import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor: attach token & tenant headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeTenantId = localStorage.getItem('activeTenantId');
  const activeTenantSlug = localStorage.getItem('activeTenantSlug');

  if (activeTenantId) {
    config.headers['x-tenant-id'] = activeTenantId;
  } else if (activeTenantSlug) {
    config.headers['x-tenant-slug'] = activeTenantSlug;
  }

  return config;
});

export default api;
