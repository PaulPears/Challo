import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

type DriverStatus = 'LOADING' | 'UNAUTHENTICATED' | 'UNREGISTERED' | 'PENDING' | 'APPROVED';

export const DEMO_CAPTAIN = {
  id: 'demo-captain-001',
  name: 'Challo Captain Demo',
  phoneNumber: '9876543210',
  roles: ['driver'],
  driver_id: 'demo-driver-001',
  is_verified: true,
  vehicle_type: 'bike',
  rating: 4.9,
  wallet_balance: 1850,
  is_active: true,
  email: 'captain.demo@challo.in',
  todayEarnings: 840,
  todayRides: 6,
};

interface AuthContextType {
  driverStatus: DriverStatus;
  user: any;
  checkAuth: () => Promise<void>;
  loginAsDemo: (customPhone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('LOADING');

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setDriverStatus('UNAUTHENTICATED');
        return;
      }

      // Instant bypass for Demo Mode
      if (token.startsWith('demo_')) {
        const storedUser = await AsyncStorage.getItem('user');
        setUser(storedUser ? JSON.parse(storedUser) : DEMO_CAPTAIN);
        setDriverStatus('APPROVED');
        return;
      }

      const response = await api.get('/profile');
      const userData = response.data;
      setUser(userData);

      const hasDriverRole = userData.roles && userData.roles.includes('driver');
      const hasDriverRecord = userData.driver_id !== null;
      const isApproved = userData.is_verified === true;

      if (!hasDriverRecord) {
        setDriverStatus('UNREGISTERED');
      } else if (isApproved) {
        setDriverStatus('APPROVED');
      } else {
        setDriverStatus('PENDING');
      }
    } catch (error) {
      console.error('Auth Check Failed:', error);
      // If demo token, stay approved even on network fail
      const token = await AsyncStorage.getItem('token');
      if (token && token.startsWith('demo_')) {
        setUser(DEMO_CAPTAIN);
        setDriverStatus('APPROVED');
      } else {
        setDriverStatus('UNAUTHENTICATED');
      }
    }
  };

  const loginAsDemo = async (customPhone?: string) => {
    const demoToken = 'demo_token_' + Date.now();
    const demoUser = {
      ...DEMO_CAPTAIN,
      phoneNumber: customPhone || DEMO_CAPTAIN.phoneNumber,
    };
    await AsyncStorage.setItem('token', demoToken);
    await AsyncStorage.setItem('user', JSON.stringify(demoUser));
    await AsyncStorage.setItem('isDemo', 'true');
    setUser(demoUser);
    setDriverStatus('APPROVED');
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isDemo');
    setUser(null);
    setDriverStatus('UNAUTHENTICATED');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ driverStatus, user, checkAuth, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
