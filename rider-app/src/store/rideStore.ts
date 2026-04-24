import { create } from 'zustand';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  vehicle_type?: string;
  // PENDING is the initial backend status; we display it as SEARCHING locally
  status: 'PENDING' | 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  otp?: string;
  driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
    vehicle_model: string;
    rating: number;
    photo?: string;  // optional profile picture URL
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
      console.log(`[RideStore] updateRideStatus: ${newStatus}, driverDetails:`, JSON.stringify(driverDetails));

      // When a driver accepts, un-minimize so the modal pops up showing driver info
      const shouldUnMinimize = ['ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'].includes(newStatus);

      return {
        currentRide: state.currentRide
          ? {
            ...state.currentRide,
            status: newStatus,
            driver: driverDetails ?? state.currentRide.driver,
          }
          : null,
        activeAlert: state.activeAlert,
        isMinimized: shouldUnMinimize ? false : state.isMinimized,
      };
    }),
  setAlert: (alert) => set({ activeAlert: alert, isMinimized: false }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  clearRide: () => set({ currentRide: null, activeAlert: null, isMinimized: false, driverLocation: null }),
}));

export default useRideStore;
