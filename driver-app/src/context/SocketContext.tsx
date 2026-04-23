import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Vibration, Alert } from 'react-native';
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
        console.log('[Socket] Ride update received:', data.status, 'for ride:', data.rideId);
      });
    };
    
    const handleNewRide = (ride: any) => {
      console.log('[Socket] RECEIVED NEW RIDE EVENT:', ride.id);

      // ─── Stale Ride Guard ─────────────────────────────────────────────────
      // Discard any ride older than 30 minutes — prevents "replay" of old
      // test/simulator rides flooding new driver logins.
      const AGE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
      const rideCreatedAt = ride.created_at || ride.requested_at;
      if (rideCreatedAt) {
        const rideAgeMs = Date.now() - new Date(rideCreatedAt).getTime();
        if (rideAgeMs > AGE_LIMIT_MS) {
          console.log(`[Socket] Discarding stale ride (${Math.round(rideAgeMs / 60000)} min old):`, ride.id);
          return;
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      if (__DEV__) {
        // More descriptive debug alert
        Alert.alert(
          '🔔 DEBUG: New Ride!',
          `Ride ID: ${ride.id.substring(0, 8)}...\n\nFrom: ${ride.pickup_address || 'Unknown'}\nTo: ${ride.dropoff_address || 'Unknown'}\n\nCheck logs for full object.`,
          [{ text: 'Dismiss' }]
        );
      }

      setRideRequest({
        rideId: ride.id,
        pickupLocation: ride.pickup_address || ride.pickupLocation || ride.pickup_location || 'Unknown pickup',
        pickupLatitude: Number(ride.pickup_latitude || ride.pickupLatitude || 0),
        pickupLongitude: Number(ride.pickup_longitude || ride.pickupLongitude || 0),
        dropoffLocation: ride.dropoff_address || ride.dropoffLocation || ride.dropoff_location || 'Unknown dropoff',
        dropoffLatitude: Number(ride.dropoff_latitude || ride.dropoff_latitude || 0),
        dropoffLongitude: Number(ride.dropoff_longitude || ride.dropoff_longitude || 0),
        fare: Number(ride.estimated_fare || ride.fare || 0),
        distance: ride.estimated_distance_km || ride.distance,
        duration: ride.estimated_duration_min || ride.duration,
        riderName: ride.rider?.name || ride.user?.name || 'Rider',
        riderPhone: ride.rider?.phone_number || ride.user?.phone_number,
      });

      console.log('[Socket] Context updated with rideRequest. Starting alert and vibration.');
      playAlert('RIDE_REQUEST');
      Vibration.vibrate([0, 800, 400, 800], true); // slightly longer vibration
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
