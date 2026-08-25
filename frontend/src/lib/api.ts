import axios from 'axios';

// Fail loudly in production builds if the API URL is not configured instead of
// silently pointing at localhost.
const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL && import.meta.env.PROD) {
  throw new Error('VITE_API_URL must be configured for production builds');
}
const resolvedBaseUrl = BASE_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login (except on login page/request itself)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
