
import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserTabNavigator from './UserTabNavigator';
import SearchScreen from '../screens/user/SearchScreen';
import MapSelectionScreen from '../screens/user/MapSelectionScreen';
import BookingScreen from '../screens/user/BookingScreen';
import BookingDetailsScreen from '../screens/user/BookingDetailsScreen';
import WaitingForDriverScreen from '../screens/user/WaitingForDriverScreen';
import DriverDetailsScreen from '../screens/user/DriverDetailsScreen';
import { useNavigation } from '@react-navigation/native';
import { useSocket } from '../context/SocketContext';
import useRideStore from '../store/rideStore';
import useNotificationStore from '../store/notificationStore';
import RideStatusModal from '../components/RideStatusModal';
import RideStatusBar from '../components/RideStatusBar';

const Stack = createStackNavigator();

const UserNavigator = () => {
  const { socket } = useSocket();
  const { setAlert, updateRideStatus, currentRide } = useRideStore();
  const { addNotification } = useNotificationStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!socket) {
      console.log('[Socket] No socket available yet — waiting for connection');
      return;
    }

    // ─── Channel for THIS specific ride (or a fallback stub) ─────────────────
    const rideChannel = currentRide?.id ? `ride-${currentRide.id}` : null;
    console.log(`[Socket] UserNavigator: ${rideChannel ? `Listening on ${rideChannel}` : 'No active ride — skipping ride channel'}`);

    const handleRideUpdate = (data: any) => {
      console.log(`[Socket] Ride update received:`, JSON.stringify(data));

      const status = (data.status || data.type || '').toUpperCase();
      const rideInfo = data.ride || {};
      const driverData = data.driver || {
        name: rideInfo.driverName || rideInfo.driver?.name,
        vehicle_model: rideInfo.vehicleModel || rideInfo.driver?.vehicle_model,
        vehicle_number: rideInfo.vehiclePlateNumber || rideInfo.driver?.vehicle_number,
        rating: rideInfo.driverRating || rideInfo.driver?.rating,
        phone: rideInfo.driverPhone || rideInfo.driver?.phone_number,
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
      } else if (status === 'IN_PROGRESS' || status === 'STARTED' || status === 'RIDE_STARTED') {
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

    // ─── Subscribe ──────────────────────────────────────────────────────────
    socket.on('notification', handleNotification);

    if (rideChannel) {
      socket.on(rideChannel, handleRideUpdate);

      // Join the room so backend's room-targeted emit reaches us
      console.log(`[Socket] Joining room: ${rideChannel}`);
      socket.emit('join-ride', currentRide!.id);

      const locationChannel = `ride-location-${currentRide!.id}`;
      socket.on(locationChannel, handleLocationUpdate);
    }

    return () => {
      // ─── Cleanup ──────────────────────────────────────────────────────────
      socket.off('notification', handleNotification);
      if (rideChannel) {
        console.log(`[Socket] Unsubscribing from ${rideChannel}`);
        socket.off(rideChannel, handleRideUpdate);
        socket.emit('leave-ride', currentRide!.id);
        const locationChannel = `ride-location-${currentRide!.id}`;
        socket.off(locationChannel, handleLocationUpdate);
      }
    };
  }, [socket, currentRide?.id, navigation]);

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
