
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserTabNavigator from './UserTabNavigator';
import SearchScreen from '../screens/user/SearchScreen';
import MapSelectionScreen from '../screens/user/MapSelectionScreen';
import BookingScreen from '../screens/user/BookingScreen';
import BookingDetailsScreen from '../screens/user/BookingDetailsScreen';
import WaitingForDriverScreen from '../screens/user/WaitingForDriverScreen';
import DriverDetailsScreen from '../screens/user/DriverDetailsScreen';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import socket from '../api/socket';
import useRideStore from '../store/rideStore';
import useNotificationStore from '../store/notificationStore';
import RideStatusModal from '../components/RideStatusModal';
import RideStatusBar from '../components/RideStatusBar';

const Stack = createStackNavigator();

const UserNavigator = () => {
  const { setAlert, updateRideStatus, currentRide } = useRideStore();
  const { addNotification } = useNotificationStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Global socket listeners
    const rideChannel = currentRide?.id ? `ride-${currentRide.id}` : 'ride_update';
    console.log(`[Socket] Subscribing to channel: ${rideChannel}`);

    const handleRideUpdate = (data: any) => {
      console.log(`[Socket] Ride update received on ${rideChannel}:`, data);

      const status = (data.status || data.type || '').toUpperCase();
      const rideInfo = data.ride || {};
      const driverData = data.driver || {
        name: rideInfo.driverName,
        vehicle_model: rideInfo.vehicleModel,
        vehicle_number: rideInfo.vehiclePlateNumber,
        rating: rideInfo.driverRating,
        phone: rideInfo.driverPhone
      };

      if (status === 'ACCEPTED' || status === 'RIDE_ACCEPTED') {
        setAlert({
          type: 'RIDE_ACCEPTED',
          title: 'Ride Confirmed! 🚕',
          message: `Your ride has been accepted by ${driverData?.name || 'a driver'}.`,
          data: data
        });
        updateRideStatus('ACCEPTED', driverData);
        navigation.navigate('App');
      } else if (status === 'ARRIVED' || status === 'DRIVER_ARRIVED') {
        setAlert({
          type: 'DRIVER_ARRIVED',
          title: 'Driver Arrived! 📍',
          message: 'Your driver is at the pickup location.',
          data: data
        });
        updateRideStatus('ARRIVED');
      } else if (status === 'STARTED' || status === 'IN_PROGRESS' || status === 'RIDE_STARTED') {
        updateRideStatus('STARTED');
      } else if (status === 'COMPLETED' || status === 'RIDE_COMPLETED') {
        updateRideStatus('COMPLETED');
        setAlert(null);
      } else if (status === 'CANCELLED' || status === 'RIDE_CANCELLED') {
        updateRideStatus('CANCELLED');
        setAlert({
          type: 'RIDE_CANCELLED',
          title: 'Ride Cancelled',
          message: 'This ride has been cancelled.',
          data: data
        });
      }
    };

    const handleNotification = (data: any) => {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: data.title,
        message: data.message,
        icon: data.icon || 'bell',
      });
    };

    const handleLocationUpdate = (location: any) => {
      console.log('[Socket] Driver location update:', location);
      useRideStore.getState().setDriverLocation(location);
    };

    socket.on(rideChannel, handleRideUpdate);
    socket.on('notification', handleNotification);

    let locationChannel: string | null = null;
    if (currentRide?.id) {
      locationChannel = `ride-location-${currentRide.id}`;
      socket.on(locationChannel, handleLocationUpdate);
    }

    return () => {
      console.log(`[Socket] Cleaning up listeners for ${rideChannel}`);
      socket.off(rideChannel, handleRideUpdate);
      socket.off('notification', handleNotification);
      if (locationChannel) {
        socket.off(locationChannel, handleLocationUpdate);
      }
    };
  }, [currentRide?.id, navigation]);

  return (
    <>
      <Stack.Navigator>
        <Stack.Screen name="App" component={UserTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Book a Ride' }} />
        <Stack.Screen name="MapSelection" component={MapSelectionScreen} options={{ title: 'Select Locations' }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Booking Details' }} />

        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WaitingForDriver" component={WaitingForDriverScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DriverDetails" component={DriverDetailsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <RideStatusModal />
      <RideStatusBar />
    </>
  );
};

export default UserNavigator;
