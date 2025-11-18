import axios from 'axios';
import config from '../config';
import { getToken, removeToken, removeUser } from './storage';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      removeToken();
      removeUser();
      window.location.href = '/login';
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        message: 'Network error. Please check your connection.'
      });
    }

    return Promise.reject(error);
  }
);

export default api;