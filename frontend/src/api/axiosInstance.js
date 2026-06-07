import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinicToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message || error.message || 'Request failed';
    if (status === 401) {
      localStorage.removeItem('clinicToken');
      localStorage.removeItem('clinicUser');
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    } else {
      message.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
