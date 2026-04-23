import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (__DEV__) {
    // 1. Check EXPO_PUBLIC_API_URL (from .env or process env)
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
      console.log(`[API Debug] Using EXPO_PUBLIC_API_URL: ${envUrl}`);
      return envUrl;
    }

    // 2. Try to get IP from Expo's debugger host (useful for wireless debugging)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost?.split(':').shift();
    
    console.log(`[API Debug] debuggerHost: ${debuggerHost}, localIp: ${localIp}`);

    if (localIp && localIp !== 'localhost' && localIp !== '127.0.0.1') {
      const resolvedUrl = `http://${localIp}:3000`;
      console.log(`[API Debug] Resolved from debuggerHost: ${resolvedUrl}`);
      return resolvedUrl;
    }

    // 3. Absolute Fallback to your PC's current Wi-Fi IP
    // This ensures it works on your physical device even if Expo doesn't report the IP.
    const pcIpFallback = 'http://192.168.29.18:3000';
    console.log(`[API Debug] Falling back to known PC IP: ${pcIpFallback}`);
    return pcIpFallback;
  }

  // Production
  return process.env.EXPO_PUBLIC_API_URL || 'https://ride-andhra-unified-db.onrender.com';
};

const API_BASE_URL = getApiUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30-second global timeout
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown endpoint';

    if (status === 401) {
      // Silently clear auth on 401 — AuthContext will redirect to login
      console.warn(`[API] 401 Unauthorized on ${url} — clearing token`);
      await AsyncStorage.removeItem('token');
    } else if (status === 403) {
      console.warn(`[API] 403 Forbidden on ${url}`);
    } else if (status >= 500) {
      console.error(`[API] Server Error ${status} on ${url}`, error.response?.data);
    } else if (!error.response) {
      // Network error (no response received)
      console.error(`[API] Network error on ${url} — check connectivity`);
    }

    return Promise.reject(error);
  },
);

export const API_URL = API_BASE_URL;
export default api;
