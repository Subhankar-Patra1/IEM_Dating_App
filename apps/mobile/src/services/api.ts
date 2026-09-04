import axios from 'axios';
import { store } from '../store';

import { Platform } from 'react-native';

// Use Ngrok Tunnel URL for stable development networking
const API_URL = 'https://injunctive-efrain-undecomposed.ngrok-free.dev/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s — allows for Neon DB cold start (auto-resume from suspend)
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response || error.code === 'ECONNABORTED') {
      console.warn('[Offline Mode]: Network Error detected, falling back to cached cache layers strategy...');
      // Logic for pushing failed requests to an AsyncStorage offline-queue
    }
    return Promise.reject(error);
  }
);
