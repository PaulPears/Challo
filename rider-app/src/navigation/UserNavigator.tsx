
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
      // Robust driver data extraction
      const driverObj = rideInfo.driver || data.driver || {};
      const driverData = {
        name: driverObj.name || rideInfo.driverName,
        vehicle_model: driverObj.vehicle_model || rideInfo.vehicleModel,
        vehicle_number: driverObj.vehicle_number || rideInfo.vehiclePlateNumber,
        rating: driverObj.rating || rideInfo.driverRating,
        phone: driverObj.phone_number || driverObj.phone || rideInfo.driverPhone,
        photo: driverObj.profile_image || driverObj.avatar || rideInfo.driverPhoto,
      };

      if (status === 'ACCEPTED' || status === 'RIDE_ACCEPTED') {
        setAlert({
          type: 'RIDE_ACCEPTED',
          title: 'Ride Confirmed! 🚕',
          message: `Your ride has been accepted by ${driverData?.name || 'a driver'}.`,
          data: data
        });
        updateRideStatus('ACCEPTED', driverData);
        navigation.navigate('DriverDetails', { ride: { ...currentRide, status: 'ACCEPTED', driver: driverData } });
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
        setAlert({
          type: 'RIDE_STARTED',
          title: 'Trip Started! 🚗',
          message: 'Your ride is in progress. Have a safe journey.',
          data: data
        });
      } else if (status === 'COMPLETED' || status === 'RIDE_COMPLETED') {
        updateRideStatus('COMPLETED');
        setAlert({
          type: 'RIDE_COMPLETED',
          title: 'Ride Completed! 🏁',
          message: 'Thank you for riding with RideAndhra. We hope you had a great trip!',
          data: data
        });
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

  // ─── Background State Synchronizer (Polling Fallback) ───────────────────
  useEffect(() => {
    if (!currentRide?.id) return;
    
    // Only poll for "active" statuses that might change without user action
    const activeStatuses = ['SEARCHING', 'ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS'];
    if (!activeStatuses.includes(currentRide.status)) return;

    const syncInterval = setInterval(async () => {
      try {
        const { rideAPI } = await import('../api/rideAPI');
        const latestRide = await rideAPI.getRideById(currentRide.id);
        
        if (latestRide) {
          const newStatus = (latestRide.status || '').toUpperCase();
          
          if (newStatus !== currentRide.status && newStatus !== 'IN_PROGRESS' || (newStatus === 'IN_PROGRESS' && currentRide.status !== 'STARTED')) {
            console.log(`[Sync] Detected state mismatch! Remote: ${newStatus}, Local: ${currentRide.status}`);
            
            const driverData = latestRide.driver ? {
              name: latestRide.driver.name,
              vehicle_model: latestRide.driver.vehicle_model,
              vehicle_number: latestRide.driver.vehicle_number,
              rating: latestRide.driver.rating,
              phone: latestRide.driver.phone_number,
            } : undefined;

            const mappedStatus = newStatus === 'IN_PROGRESS' ? 'STARTED' : newStatus;
            updateRideStatus(mappedStatus, driverData);

            // Handle specific navigation/alert transitions if missed
            if (mappedStatus === 'ACCEPTED') {
               setAlert({
                  type: 'RIDE_ACCEPTED',
                  title: 'Ride Confirmed! 🚕',
                  message: `Your ride has been accepted by ${driverData?.name || 'a driver'}.`,
               });
            } else if (mappedStatus === 'STARTED') {
               setAlert({
                  type: 'RIDE_STARTED',
                  title: 'Trip Started! 🚗',
                  message: 'Your ride is in progress. Have a safe journey.',
               });
            } else if (mappedStatus === 'ARRIVED') {
               setAlert({
                  type: 'DRIVER_ARRIVED',
                  title: 'Driver Arrived! 📍',
                  message: 'Your driver is at the pickup location.',
               });
            } else if (mappedStatus === 'COMPLETED') {
               setAlert({
                  type: 'RIDE_COMPLETED',
                  title: 'Ride Completed! 🏁',
                  message: 'Thank you for riding with RideAndhra.',
               });
            } else if (mappedStatus === 'CANCELLED') {
               setAlert({
                  type: 'RIDE_CANCELLED',
                  title: 'Ride Cancelled',
                  message: 'This ride has been cancelled.',
               });
            }
          }
        }
      } catch (error) {
        console.log('[Sync] Background sync failed:', error);
      }
    }, 10000); // 10 seconds fallback

    return () => clearInterval(syncInterval);
  }, [currentRide?.id, currentRide?.status]);

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
