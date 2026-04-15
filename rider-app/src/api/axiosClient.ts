
import axios from 'axios';
import useUserStore from '../store/userStore';
import jwtDecode from 'jwt-decode';

import { API_URL } from '../config/constants';

// TODO: Replace with your actual backend URL
const BASE_URL = API_URL;

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  let token = useUserStore.getState().user?.accessToken;

  // Fallback to AsyncStorage if token not in store
  if (!token) {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedToken = await AsyncStorage.getItem('accessToken');
      token = storedToken || undefined; // Convert null to undefined
      if (token) {
        console.log('   📦 Retrieved token from AsyncStorage as fallback');
      }
    } catch (error) {
      console.error('   ❌ Failed to get token from AsyncStorage:', error);
    }
  }

  console.log('🔍 Axios Request Interceptor:');
  console.log('   URL:', config.url);
  console.log('   Method:', config.method);
  console.log('   Token exists:', !!token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;

    // Prominent log for simulation
    console.log('--------------------------------------------------');
    console.log('🚀 SIMULATION_TOKEN:', token);
    console.log('Use this token with: node simulate-ride.js --token=' + token);
    console.log('--------------------------------------------------');

    try {
      const decoded: any = jwtDecode(token);
      console.log('   Decoded Token:', JSON.stringify(decoded, null, 2));
      console.log('   Roles in token:', decoded.roles);
    } catch (error) {
      console.error('   Failed to decode token:', error);
    }
  } else {
    console.log('   ⚠️ No token found in userStore or AsyncStorage!');
  }

  return config;
});

// Add response interceptor to log errors
axiosClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized Error:');
      console.error('   URL:', error.config?.url);
      console.error('   Method:', error.config?.method);
      console.error('   Response:', error.response?.data);
      console.error('   Headers sent:', error.config?.headers);
    } else if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden Error:');
      console.error('   URL:', error.config?.url);
      console.error('   Method:', error.config?.method);
      console.error('   Response:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
