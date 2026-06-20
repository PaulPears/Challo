// src/context/RideRequestContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of a ride request (matches backend notification payload)
export interface RideRequest {
  rideId: string;
  pickupLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLocation: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  fare: number;
  distance?: number;
  duration?: number;
  driverToPickupDistance?: number;
  userId?: string;
  riderName?: string;
  riderPhone?: string;
}

// Define the context shape
interface RideRequestContextType {
  rideRequest: RideRequest | null;
  setRideRequest: (request: RideRequest | null) => void;
  clearRideRequest: () => void;
}

// Create the context
const RideRequestContext = createContext<RideRequestContextType | undefined>(undefined);

// Create the provider component
export const RideRequestProvider = ({ children }: { children: ReactNode }) => {
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);

  const clearRideRequest = () => {
    setRideRequest(null);
  };

  return (
    <RideRequestContext.Provider value={{ rideRequest, setRideRequest, clearRideRequest }}>
      {children}
    </RideRequestContext.Provider>
  );
};

// Create a custom hook for easy context access
export const useRideRequest = () => {
  const context = useContext(RideRequestContext);
  if (context === undefined) {
    throw new Error('useRideRequest must be used within a RideRequestProvider');
  }
  return context;
};
