import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('venderra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('venderra_token');
      localStorage.removeItem('venderra_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const formatCurrency = (amount, currency = 'UGX') => {
  if (currency === 'UGX') {
    return `UGX ${Number(amount).toLocaleString('en-UG')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-UG', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
