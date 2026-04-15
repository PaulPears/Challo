import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { MSG91_WIDGET_ID, MSG91_TOKEN_AUTH, GOOGLE_MAPS_API_KEY } from './src/config/constants';
import * as Location from 'expo-location';
import useLocationStore from './src/store/locationStore';
import api from './src/api/axiosClient';

// ─── Push Notification Handler ───────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fe7009',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Register push token with backend
    try {
      await api.put('/profile/push-token', { token });
      console.log('Push token registered successfully:', token);
    } catch (err: any) {
      console.error('Failed to register push token with backend:', err.message);
    }
    return token;
  } catch (err: any) {
    console.warn('[Push] Failed to get push token:', err.message);
  }
}

// The root of the app, which renders the main navigator.
export default function App() {
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    OTPWidget.initializeWidget(MSG91_WIDGET_ID, MSG91_TOKEN_AUTH); //Widget initialization
    console.log('MSG91 Widget Initialized');

    registerForPushNotificationsAsync();

    // Handle user tapping on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response Received:', response);
    });

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.results && data.results[0]) {
          const address = data.results[0].formatted_address;
          setCurrentLocation({
            name: "Current Location",
            address: address,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log('Initial location fetched and stored as text:', address);
        }
      } catch (error) {
        console.error('Error fetching initial location:', error);
      }
    })();

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [setCurrentLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <AppNavigator />
    </View>
  );
}