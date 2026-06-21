import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useRideRequest } from './RideRequestContext';
import { useSound } from './SoundContext';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';
import { showRideAlertNotification } from '../utils/rideAlertNotification';
import * as Location from 'expo-location';
import { calculateDistance } from '../utils/locationUtils';

interface SocketContextType {
  isConnected: boolean;
  socket: any | null;
}

const SocketContext = createContext<SocketContextType>({ isConnected: false, socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { setRideRequest } = useRideRequest();
  const { playAlert, stopAlert } = useSound();
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
        transports: ['polling', 'websocket'],
        forceNew: true,
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
        // We use an internal event to notify the RideRequestContext or we can handle it directly here,
        // but since we need access to the CURRENT rideRequest state, we can't easily access it inside this closure
        // without a ref. So we emit a custom window/document event or use a state updater.
        // Actually, we can dispatch an event or call a method on the context.
        setRideRequest((currentRequest: any) => {
            if (currentRequest && currentRequest.rideId === data.rideId) {
                if (data.status !== 'PENDING') {
                    console.log('[Socket] Ride is no longer PENDING, clearing request modal.');
                    stopAlert();
                    cancelRideAlertNotification();
                    Vibration.cancel();
                    // clear it
                    return null;
                }
            }
            return currentRequest;
        });
      });
    };
    
    const handleNewRide = async (ride: any) => {
      console.log('[Socket] RECEIVED NEW RIDE EVENT:', ride.id);

      // ─── Stale Ride Guard ─────────────────────────────────────────────────
      const AGE_LIMIT_MS = 30 * 60 * 1000;
      const rideCreatedAt = ride.created_at || ride.requested_at;
      if (rideCreatedAt) {
        const rideAgeMs = Date.now() - new Date(rideCreatedAt).getTime();
        if (rideAgeMs > AGE_LIMIT_MS) {
          console.log(`[Socket] Discarding stale ride (${Math.round(rideAgeMs / 60000)} min old):`, ride.id);
          return;
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      // Calculate driver-to-pickup distance using current GPS position
      let driverToPickupDistance: number | undefined = undefined;
      try {
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (loc) {
          driverToPickupDistance = calculateDistance(
            loc.coords.latitude,
            loc.coords.longitude,
            Number(ride.pickup_latitude || ride.pickupLatitude || 0),
            Number(ride.pickup_longitude || ride.pickupLongitude || 0)
          );
          console.log('[Socket] Driver-to-pickup distance:', driverToPickupDistance?.toFixed(2), 'km');
        }
      } catch (e) {
        console.warn('[Socket] Could not get location for distance calc:', e);
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
        driverToPickupDistance,
        riderName: ride.rider?.name || ride.user?.name || 'Rider',
        riderPhone: ride.rider?.phone_number || ride.user?.phone_number,
      });

      console.log('[Socket] Context updated with rideRequest. Starting alert and vibration.');
      playAlert('RIDE_REQUEST');
      // Fire a local notification on the loud notification channel (uses ring stream, not media)
      showRideAlertNotification(
        Number(ride.estimated_fare || ride.fare || 0),
        ride.pickup_address || ride.pickupLocation || 'Unknown pickup',
        driverToPickupDistance
      );
      Vibration.vibrate([0, 800, 400, 800, 400, 800], true);
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
