import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

type DriverStatus = 'LOADING' | 'UNAUTHENTICATED' | 'UNREGISTERED' | 'PENDING' | 'APPROVED';

interface AuthContextType {
  driverStatus: DriverStatus;
  user: any;
  checkAuth: () => Promise<void>;
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
      setDriverStatus('UNAUTHENTICATED');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
    setDriverStatus('UNAUTHENTICATED');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ driverStatus, user, checkAuth, logout }}>
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
