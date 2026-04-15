import { create } from 'zustand';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  status: 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
    vehicle_model: string;
    rating: number;
  };
}

interface RideAlert {
  type: 'RIDE_ACCEPTED' | 'DRIVER_ARRIVED' | 'RIDE_STARTED' | 'RIDE_COMPLETED' | 'RIDE_CANCELLED';
  title: string;
  message: string;
  data?: any;
}

interface RideState {
  currentRide: Ride | null;
  activeAlert: RideAlert | null;
  isMinimized: boolean;
  driverLocation: { latitude: number; longitude: number } | null;
  setRide: (ride: Ride) => void;
  updateRideStatus: (status: Ride['status'], driverDetails?: Ride['driver']) => void;
  setAlert: (alert: RideAlert | null) => void;
  setMinimized: (isMinimized: boolean) => void;
  setDriverLocation: (location: { latitude: number; longitude: number } | null) => void;
  clearRide: () => void;
}

const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  activeAlert: null,
  isMinimized: false,
  driverLocation: null,
  setRide: (ride) => set({ currentRide: ride, isMinimized: false }),
  updateRideStatus: (status, driverDetails) =>
    set((state) => {
      const newStatus = status.toUpperCase() as Ride['status'];
      console.log(`[RideStore] updateRideStatus: ${newStatus}`);
      const finished = newStatus === 'COMPLETED' || newStatus === 'CANCELLED';

      return {
        currentRide: state.currentRide
          ? {
            ...state.currentRide,
            status: newStatus,
            driver: driverDetails || state.currentRide.driver
          }
          : null,
        activeAlert: state.activeAlert,
        isMinimized: state.isMinimized
      };
    }),
  setAlert: (alert) => set({ activeAlert: alert, isMinimized: false }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  clearRide: () => set({ currentRide: null, activeAlert: null, isMinimized: false, driverLocation: null }),
}));

export default useRideStore;
