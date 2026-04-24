
import axiosClient from './axiosClient';

// TODO: Connect to actual backend endpoints

// This is a dummy implementation that simulates API calls.
// In the future, this will make real HTTP requests.

export const rideAPI = {
  getAvailableRides: async () => {
    console.log('Fetching available rides...');
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, you would do:
    // const response = await axiosClient.get('/rides');
    // return response.data;

    // For now, return mock data
    return [
      { id: '1', from: 'Koti', to: 'Gachibowli', driver: 'Ramesh', price: 250 },
      { id: '2', from: 'Secunderabad', to: 'Hitec City', driver: 'Suresh', price: 300 },
    ];
  },

  getRideDetails: async (id: string) => {
    const response = await axiosClient.get(`/rides/${id}`);
    return response.data;
  },

  searchLocations: async (query: string) => {
    console.log(`Searching for location: ${query}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // const response = await axiosClient.get(`/locations?q=${query}`);
    // return response.data;
    const locations = [
      { id: '1', name: 'Koti, Hyderabad' },
      { id: '2', name: 'Gachibowli, Hyderabad' },
      { id: '3', name: 'Hitec City, Hyderabad' },
      { id: '4', name: 'Secunderabad, Hyderabad' },
    ];
    if (!locations) {
      return [];
    }
    return locations.filter(location => location.name.toLowerCase().includes(query.toLowerCase()));
  },

  createRide: async (rideData: any) => {
    const response = await axiosClient.post('/rides', rideData);
    return response.data;
  },

  getFare: async (distance: number, duration: number, lat?: number, lng?: number, destLat?: number, destLng?: number, superKmBalance?: number) => {
    const response = await axiosClient.post('/rides/fare-estimate', { distance, duration, lat, lng, destLat, destLng, superKmBalance });
    return response.data;
  },

  cancelRide: async (id: string) => {
    const response = await axiosClient.patch(`/rides/${id}/cancel`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await axiosClient.get('/rides/my-rides');
    return response.data;
  },
};
