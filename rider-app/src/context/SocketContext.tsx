import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { API_URL } from '../config/constants';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    // Only connect when a user is logged in
    if (!user?.id || !user?.accessToken) {
      if (socketRef.current) {
        console.log('[Socket] User logged out — disconnecting rider socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Avoid reconnecting if already connected for the same user
    if (socketRef.current?.connected) {
      return;
    }

    const connect = async () => {
      const token = user.accessToken || (await AsyncStorage.getItem('accessToken'));
      if (!token) {
        console.warn('[Socket] No token available — cannot connect rider socket');
        return;
      }

      console.log(`[Socket] Connecting rider socket for user: ${user.id}`);

      const socket = io(API_URL, {
        auth: { token },               // ✅ Authenticated connection
        transports: ['polling', 'websocket'], // Allow upgrade from polling to websocket
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Rider socket connected:', socket.id);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.warn('[Socket] Rider socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket] Rider socket connection error:', err.message);
      });
    };

    connect();

    return () => {
      if (socketRef.current) {
        console.log('[Socket] Cleaning up rider socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user?.id, user?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
