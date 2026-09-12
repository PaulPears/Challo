
import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import UserTabNavigator from './UserTabNavigator';
import SearchScreen from '../screens/user/SearchScreen';
import MapSelectionScreen from '../screens/user/MapSelectionScreen';
import BookingScreen from '../screens/user/BookingScreen';
import BookingDetailsScreen from '../screens/user/BookingDetailsScreen';
import WaitingForDriverScreen from '../screens/user/WaitingForDriverScreen';
import DriverDetailsScreen from '../screens/user/DriverDetailsScreen';
import SosScreen from '../screens/user/SosScreen';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSocket } from '../context/SocketContext';
import useRideStore from '../store/rideStore';
import useNotificationStore from '../store/notificationStore';
import useUserStore from '../store/userStore';
import RideStatusModal from '../components/RideStatusModal';
import RideStatusBar from '../components/RideStatusBar';
import axiosClient from '../api/axiosClient';

const Stack = createStackNavigator();

// NOTE: setNotificationHandler is defined once in App.tsx — do NOT add it here.

/** Post a real OS notification that appears in the Android status bar / tray */
const sendLocalNotification = async (title: string, body: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { target: 'rider' },
      },
      // channelId must live in the trigger (not content) in expo-notifications v55.
      // TIME_INTERVAL with 1 second is effectively immediate on Android.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
        channelId: 'ride-updates',
      },
    });
  } catch (e) {
    console.warn('[Notifications] sendLocalNotification failed:', e);
  }
};

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
        const title = 'Ride Confirmed! 🚕';
        const message = `Your ride has been accepted by ${driverData?.name || 'a driver'}.`;
        sendLocalNotification(title, message);
        setAlert({ type: 'RIDE_ACCEPTED', title, message, data });
        updateRideStatus('ACCEPTED', driverData);
        navigation.navigate('DriverDetails', { ride: { ...currentRide, status: 'ACCEPTED', driver: driverData } });
      } else if (status === 'ARRIVED' || status === 'DRIVER_ARRIVED') {
        const title = 'Driver Arrived! 📍';
        const message = 'Your driver is at the pickup location.';
        sendLocalNotification(title, message);
        setAlert({ type: 'DRIVER_ARRIVED', title, message, data });
        updateRideStatus('ARRIVED');
      } else if (status === 'IN_PROGRESS' || status === 'STARTED' || status === 'RIDE_STARTED') {
        const title = 'Trip Started! 🚗';
        const message = 'Your ride is in progress. Have a safe journey.';
        sendLocalNotification(title, message);
        updateRideStatus('STARTED');
        setAlert({ type: 'RIDE_STARTED', title, message, data });
      } else if (status === 'COMPLETED' || status === 'RIDE_COMPLETED') {
        const title = 'Ride Completed! 🏁';
        const message = 'Thank you for riding with Challo. We hope you had a great trip!';
        sendLocalNotification(title, message);
        updateRideStatus('COMPLETED');
        setAlert({ type: 'RIDE_COMPLETED', title, message, data });
        // Reset the stack so pressing back does NOT go back to WaitingForDriver
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'UserNavigator' }] }));
      } else if (status === 'CANCELLED' || status === 'RIDE_CANCELLED') {
        const title = 'Ride Cancelled';
        const message = 'This ride has been cancelled.';
        sendLocalNotification(title, message);
        updateRideStatus('CANCELLED');
        setAlert({ type: 'RIDE_CANCELLED', title, message, data });
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'UserNavigator' }] }));
      }
    };

    const handleNotification = (data: any) => {
      const isNewRideRequest = (data.title || '').toLowerCase().includes('new ride request') ||
        (data.message || '').toLowerCase().includes('new ride request');

      if (isNewRideRequest) return;

      // Fire a real OS notification so it appears in the status bar
      if (data.title || data.message) {
        sendLocalNotification(data.title || 'Challo', data.message || '');
      }

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

    const handleRideSync = (data: any) => {
      console.log('[Socket] Initial ride sync received:', data);
      if (data.ride) {
        const status = (data.ride.status || '').toUpperCase();
        const driverObj = data.ride.driver || {};
        const driverData = {
          name: driverObj.name || data.ride.driverName,
          vehicle_model: driverObj.vehicle_model || data.ride.vehicleModel,
          vehicle_number: driverObj.vehicle_number || data.ride.vehiclePlateNumber,
          rating: driverObj.rating || data.ride.driverRating,
          phone: driverObj.phone_number || data.ride.phone || data.ride.driverPhone,
          photo: driverObj.profile_image || data.ride.avatar || data.ride.driverPhoto,
        };
        updateRideStatus(status, driverData);
      }
    };

    if (rideChannel) {
      socket.on(rideChannel, handleRideUpdate);
    }
    socket.on('notification', handleNotification);
    socket.on('driver-location-update', handleLocationUpdate);
    socket.on('ride-sync', handleRideSync);

    return () => {
      if (rideChannel) {
        socket.off(rideChannel, handleRideUpdate);
      }
      socket.off('notification', handleNotification);
      socket.off('driver-location-update', handleLocationUpdate);
      socket.off('ride-sync', handleRideSync);
    };
  }, [socket, currentRide?.id]);

  // ─── Polling Fallback ──────────────────────────────────────────────────────
  // Poll every 10 seconds if a ride is active to recover from dropped sockets
  useEffect(() => {
    if (!currentRide?.id) return;
    const terminalStatuses = ['COMPLETED', 'CANCELLED'];
    if (terminalStatuses.includes(currentRide.status)) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await axiosClient.get(`/rides/${currentRide.id}`);
        if (res.data) {
          const backendStatus = (res.data.status || '').toUpperCase();
          const mappedStatus = backendStatus === 'IN_PROGRESS' ? 'STARTED' : backendStatus;
          
          if (mappedStatus && mappedStatus !== currentRide.status) {
            console.log(`[Sync] Status mismatch detected. Store: ${currentRide.status}, Backend: ${mappedStatus}. Updating...`);
            
            const driverObj = res.data.driver || {};
            const driverData = {
              name: driverObj.name || res.data.driverName,
              vehicle_model: driverObj.vehicle_model || res.data.vehicleModel,
              vehicle_number: driverObj.vehicle_number || res.data.vehiclePlateNumber,
              rating: driverObj.rating || res.data.driverRating,
              phone: driverObj.phone_number || res.data.phone || res.data.driverPhone,
              photo: driverObj.profile_image || res.data.avatar || res.data.driverPhoto,
            };

            updateRideStatus(mappedStatus, driverData);

            if (mappedStatus === 'ACCEPTED') {
              setAlert({
                type: 'RIDE_ACCEPTED',
                title: 'Ride Confirmed! 🚕',
                message: `Your ride has been accepted by ${driverData.name || 'a driver'}.`,
              });
              navigation.navigate('DriverDetails', { ride: { ...currentRide, status: 'ACCEPTED', driver: driverData } });
            } else if (mappedStatus === 'ARRIVED') {
              setAlert({
                type: 'DRIVER_ARRIVED',
                title: 'Driver Arrived! 📍',
                message: 'Your driver is at the pickup location.',
              });
            } else if (mappedStatus === 'STARTED') {
              setAlert({
                type: 'RIDE_STARTED',
                title: 'Trip Started! 🚗',
                message: 'Your ride is in progress. Have a safe journey.',
              });
            } else if (mappedStatus === 'COMPLETED') {
              setAlert({
                type: 'RIDE_COMPLETED',
                title: 'Ride Completed! 🏁',
                message: 'Thank you for riding with Challo.',
              });
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'UserNavigator' }] }));
            } else if (mappedStatus === 'CANCELLED') {
              setAlert({
                type: 'RIDE_CANCELLED',
                title: 'Ride Cancelled',
                message: 'This ride has been cancelled.',
              });
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'UserNavigator' }] }));
            }
          }
        }
      } catch (error) {
        console.log('[Sync] Background sync failed:', error);
      }
    }, 10000);

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
        <Stack.Screen name="Sos" component={SosScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <RideStatusModal />
      <RideStatusBar />
    </>
  );
};

export default UserNavigator;
