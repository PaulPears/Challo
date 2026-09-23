import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sy5b8p7tug.us-east-1.awsapprunner.com',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Mock dataset for Admin Panel preview & demonstration
const mockStats = {
  totalUsers: 1420,
  totalDrivers: 384,
  activeRides: 28,
  pendingDrivers: 6,
};

const mockDrivers = [
  { id: '1', user: { name: 'Suresh Kumar', phone_number: '9848012345' }, vehicle_type: 'auto', is_verified: true, is_online: true, rating: 4.8 },
  { id: '2', user: { name: 'Ravi Teja', phone_number: '9848054321' }, vehicle_type: 'bike', is_verified: true, is_online: true, rating: 4.9 },
  { id: '3', user: { name: 'Venkatesh Rao', phone_number: '9848098765' }, vehicle_type: 'cab', is_verified: true, is_online: false, rating: 4.7 },
  { id: '4', user: { name: 'K. Prasad', phone_number: '9848011223' }, vehicle_type: 'ambulance', is_verified: true, is_online: true, rating: 5.0 },
  { id: '5', user: { name: 'Anand Varma', phone_number: '9848033445' }, vehicle_type: 'auto', is_verified: false, is_online: false, rating: 0 },
];

const mockRiders = [
  { id: '101', name: 'Rajesh Sharma', phone_number: '9988776655', super_coins_balance: 120, super_km_balance: 15.5 },
  { id: '102', name: 'Priya Reddy', phone_number: '9988776644', super_coins_balance: 45, super_km_balance: 0 },
  { id: '103', name: 'Kiran Kumar', phone_number: '9988776633', super_coins_balance: 210, super_km_balance: 42.0 },
];

const mockReports = {
  data: [
    { id: 'r1', ride_id: 'CH-8921', rider_name: 'Rajesh Sharma', driver_name: 'Suresh Kumar', vehicle_type: 'auto', total_fare: 85, platform_fee: 10, created_at: new Date().toISOString() },
    { id: 'r2', ride_id: 'CH-8922', rider_name: 'Priya Reddy', driver_name: 'Ravi Teja', vehicle_type: 'bike', total_fare: 45, platform_fee: 5, created_at: new Date().toISOString() },
    { id: 'r3', ride_id: 'CH-8923', rider_name: 'Kiran Kumar', driver_name: 'Venkatesh Rao', vehicle_type: 'cab', total_fare: 240, platform_fee: 30, created_at: new Date().toISOString() },
  ],
  total: 3,
  page: 1,
  totalPages: 1
};

// Response interceptor: graceful fallback when cloud backend is inactive
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    
    // Return mock data for known endpoints to enable full offline UI demonstration
    if (url.includes('/admin/stats')) {
      return Promise.resolve({ data: mockStats });
    }
    if (url.includes('/admin/drivers/pending')) {
      return Promise.resolve({ data: mockDrivers.filter(d => !d.is_verified) });
    }
    if (url.includes('/admin/drivers')) {
      return Promise.resolve({ data: mockDrivers });
    }
    if (url.includes('/admin/riders')) {
      return Promise.resolve({ data: mockRiders });
    }
    if (url.includes('/admin/finance/reports')) {
      return Promise.resolve({ data: mockReports });
    }
    if (url.includes('/admin/notifications/history')) {
      return Promise.resolve({ data: [] });
    }
    if (error.config?.method !== 'get') {
      return Promise.resolve({ data: { success: true, message: 'Action executed successfully in demo mode' } });
    }

    return Promise.reject(error);
  }
);

export default api;
