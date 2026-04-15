import React, { useEffect, useRef } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { LoadingProvider, useLoading } from './src/hooks/LoadingContext';
import LoadingScreen from './src/screens/LoadingScreen';
import { RideRequestProvider } from './src/context/RideRequestContext';
import { SoundProvider } from './src/context/SoundContext';
import { SocketProvider } from './src/context/SocketContext';
import RideRequestModal from './src/components/RideRequestModal';
import { AuthProvider } from './src/context/AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform, View } from 'react-native';
import api from './src/config/api';

// ─── Push Notification Handler ───────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Enable sound for notifications
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ride-alerts', {
      name: 'Ride Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fe7009',
      sound: null, // Keep ride alerts silent if app handles it via SoundContext
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fe7009',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Register push token with backend
    try { await api.post('/profile/update-push-token', { token }); } catch (_) { }
    return token;
  } catch (err: any) {
    console.warn('[Push] Failed to get push token:', err.message);
  }
}

// ─── AppContent ──────────────────────────────────────────────────────────────
const AppContent = () => {
  const { isLoading, hideLoading } = useLoading();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Fallback: handle push notifications for when app is in background
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // User tapped a notification — no additional action needed since
      // SocketContext already handles real-time delivery in foreground
    });

    hideLoading();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <AppNavigator />
      {/* Global modal — renders on top of any screen */}
      <RideRequestModal onAccepted={() => { /* Navigator will show updated current ride */ }} />
    </View>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <SoundProvider>
          <RideRequestProvider>
            <SocketProvider>
              <AppContent />
            </SocketProvider>
          </RideRequestProvider>
        </SoundProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}
