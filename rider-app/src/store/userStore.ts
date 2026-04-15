
import { create } from 'zustand';
import { getRating } from '../api/authAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'rider' | 'driver' | 'admin';
  accessToken?: string;
  rating?: number; // Add rating property
  super_coins_balance?: number;
  rider_pin?: string; // Add rider_pin property
  isNewUser?: boolean; // Add isNewUser property
}

// Define the shape of the store
interface UserState {
  user: User | null;
  // Simulate login by setting a user. In a real app, this would involve a token.
  setUser: (user: User) => void;
  // Simulate logout
  clearUser: () => void;
  fetchUserRating: () => Promise<void>; // Add fetchUserRating
  fetchUserProfile: () => Promise<void>;
}

const useUserStore = create<UserState>((set, get) => ({
  user: null, // Initially, no user is logged in
  setUser: (user) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user)).catch(err =>
      console.error('Failed to save user to storage', err)
    );
  },
  clearUser: () => {
    set({ user: null });
    AsyncStorage.removeItem('user').catch(err =>
      console.error('Failed to remove user from storage', err)
    );
  },
  fetchUserRating: async () => {
    const currentUser = get().user;
    if (currentUser) {
      try {
        const { rating } = await getRating();
        set((state) => ({
          user: state.user ? { ...state.user, rating } : null,
        }));
      } catch (error) {
        console.error('Failed to fetch user rating:', error);
      }
    }
  },
  fetchUserProfile: async () => {
    const currentUser = get().user;
    if (currentUser) {
      try {
        const { getMe } = await import('../api/authAPI');
        const data = await getMe();
        if (data.profile) {
           set((state) => ({
             user: state.user ? { ...state.user, super_coins_balance: data.profile.super_coins_balance, rating: data.profile.rating } : null,
           }));
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
  },
}));

export default useUserStore;
