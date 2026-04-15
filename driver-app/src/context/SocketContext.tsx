import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useRideRequest } from './RideRequestContext';
import { useSound } from './SoundContext';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

interface SocketContextType {
  isConnected: boolean;
  socket: any | null;
}

const SocketContext = createContext<SocketContextType>({ isConnected: false, socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { setRideRequest } = useRideRequest();
  const { playAlert } = useSound();
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    if (!io) return;

    let socket: any = null;

    const connect = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user?.id) {
        console.log('[Socket] Disconnecting: No token/user');
        if (socketRef.current) socketRef.current.disconnect();
        return;
      }

      console.log(`[Socket] Connecting for user: ${user.id} at ${API_URL}`);

      socket = io(API_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Prioritize websocket for mobile stability
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected!', socket.id);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason: string) => {
        console.warn('[Socket] Disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err: any) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      // Listen for ride requests broadcasted to ALL drivers
      socket.on('new-ride', (ride: any) => {
        console.log('[Socket] New ride (broadcast):', ride.id);
        handleNewRide(ride);
      });

      // Listen for ride requests targeted to SPECIFIC driver
      socket.on(`new-ride-driver-${user.id}`, (ride: any) => {
        console.log('[Socket] New ride (targeted):', ride.id);
        handleNewRide(ride);
      });
      
      // Generic ride notifications
      socket.on('ride-update', (data: any) => {
        console.log('[Socket] Ride update:', data.status);
      });
    };

    const handleNewRide = (ride: any) => {
      setRideRequest({
        rideId: ride.id,
        pickupLocation: ride.pickup_address || ride.pickupLocation || ride.pickup_location || 'Unknown pickup',
        pickupLatitude: Number(ride.pickup_latitude || ride.pickupLatitude || 0),
        pickupLongitude: Number(ride.pickup_longitude || ride.pickupLongitude || 0),
        dropoffLocation: ride.dropoff_address || ride.dropoffLocation || ride.dropoff_location || 'Unknown dropoff',
        dropoffLatitude: Number(ride.dropoff_latitude || ride.dropoffLatitude || 0),
        dropoffLongitude: Number(ride.dropoff_longitude || ride.dropoffLongitude || 0),
        fare: Number(ride.estimated_fare || ride.fare || 0),
        distance: ride.estimated_distance_km || ride.distance,
        duration: ride.estimated_duration_min || ride.duration,
        riderName: ride.rider?.name || ride.user?.name,
        riderPhone: ride.rider?.phone_number || ride.user?.phone_number,
      });
      playAlert('RIDE_REQUEST');
    };

    connect();

    return () => {
      if (socketRef.current) {
        console.log('[Socket] Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]); // Re-connect whenever the user identity changes

  return (
    <SocketContext.Provider value={{ isConnected, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
