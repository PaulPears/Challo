import { create } from 'zustand';

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationState {
  currentLocation: LocationData | null;
  setCurrentLocation: (location: LocationData) => void;
}

const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}));

export default useLocationStore;
