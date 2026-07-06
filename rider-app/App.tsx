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
// shouldShowBanner + shouldShowList are required for the notification to appear
// in the Android status bar / notification tray (expo-notifications v55+)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
      // ── 1. Notification permission (asked on first launch) ─────────────────
      // Must be requested before any notification is ever sent.
      // Android 13+ (API 33+) requires POST_NOTIFICATIONS at runtime.
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('[Notifications] User denied notification permission');
          } else {
            console.log('[Notifications] Permission granted');
          }
        }

        // Create the Android high-importance channel up-front so it exists
        // before any local notification is posted (otherwise the OS drops it).
        if (Platform.OS === 'android') {
          // Channel for local ride status alerts
          await Notifications.setNotificationChannelAsync('ride-updates', {
            name: 'Ride Updates',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            showBadge: true,
          });
          // Channel for general remote push notifications (e.g. from admin panel)
          await Notifications.setNotificationChannelAsync('default', {
            name: 'General Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            showBadge: true,
          });
          console.log('[Notifications] Android channels "ride-updates" and "default" ready');
        }
      } catch (e) {
        console.warn('[Notifications] Setup error:', e);
      }

      // ── 2. Location permission ─────────────────────────────────────────────
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