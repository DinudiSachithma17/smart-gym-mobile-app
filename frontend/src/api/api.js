import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your PC's local IP address when testing with Expo Go
// Example: 'http://192.168.1.5:5000/api'
const BASE_URL = 'http://192.168.8.124:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
