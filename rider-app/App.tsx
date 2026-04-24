import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { MSG91_WIDGET_ID, MSG91_TOKEN_AUTH, GOOGLE_MAPS_API_KEY } from './src/config/constants';
import * as Location from 'expo-location';
import useLocationStore from './src/store/locationStore';
import useUserStore from './src/store/userStore';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import api from './src/api/axiosClient';

// ─── Push Notification Handler ───────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

import { ConfigProvider, useAppConfig } from './src/context/ConfigContext';
import UpdateModal from './src/components/UpdateModal';
import { SocketProvider } from './src/context/SocketContext';

import LoadingScreen from './src/screens/LoadingScreen';

function AppContent() {
  const { config, version, isOutdated, isLoading } = useAppConfig();
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);
  const { user } = useUserStore();
  
  // Initialize Push Notifications
  usePushNotifications(user?.id || null);

  useEffect(() => {
    OTPWidget.initializeWidget(MSG91_WIDGET_ID, MSG91_TOKEN_AUTH); //Widget initialization
    console.log('MSG91 Widget Initialized');

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

  }, [setCurrentLocation]);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <AppNavigator />
      <UpdateModal
        visible={isOutdated}
        currentVersion={version}
        requiredVersion={config?.min_rider_app_version || '1.0.0'}
      />
    </View>
  );
}

// The root of the app, which renders the main navigator.
export default function App() {
  return (
    <ConfigProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </ConfigProvider>
  );
}