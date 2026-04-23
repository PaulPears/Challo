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
import { Platform, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import api from './src/config/api';

// ─── Push Notification Handler ───────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Enable sound for notifications
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Global Notification Handler logic remains here

import { ConfigProvider, useAppConfig } from './src/context/ConfigContext';
import UpdateModal from './src/components/UpdateModal';

// ─── AppContent ──────────────────────────────────────────────────────────────
const AppContent = () => {
  const { isLoading: contextLoading, hideLoading } = useLoading();
  const { config, version, isOutdated, isLoading: configLoading } = useAppConfig();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!configLoading) {
      hideLoading();
    }

    if (!configLoading) {
      hideLoading();
    }

  }, [configLoading, hideLoading]);

  if (contextLoading || configLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <AppNavigator />
      {/* Global modal — renders on top of any screen */}
      <RideRequestModal onAccepted={() => { /* Navigator will show updated current ride */ }} />
      
      {/* Forced Update Modal */}
      <UpdateModal 
        visible={isOutdated} 
        currentVersion={version}
        requiredVersion={config?.min_driver_app_version || '1.0.0'}
        onUpdate={() => {}}
      />
    </View>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LoadingProvider>
        <ConfigProvider>
          <AuthProvider>
            <SoundProvider>
              <RideRequestProvider>
                <SocketProvider>
                  <AppContent />
                </SocketProvider>
              </RideRequestProvider>
            </SoundProvider>
          </AuthProvider>
        </ConfigProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
}
