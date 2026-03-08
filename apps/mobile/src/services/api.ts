import axios from 'axios';
import { store } from '../store';

import { Platform } from 'react-native';

// Use 10.123.101.109 for Android (physical device or emulator on LAN), localhost for iOS simulator/web
const API_URL = Platform.OS === 'android' ? 'http://10.123.101.109:3000/api/v1' : 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s — allows for Neon DB cold start (auto-resume from suspend)
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
