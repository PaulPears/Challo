import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../config/api';
import { navigationRef } from '../utils/NavigationService';

export const usePushNotifications = (userId: string | null) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!userId) return;
        try {
            const response = await api.get('/notifications/unread-count');
            const count = response.data.count || 0;
            setUnreadCount(count);
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('[PushNotifications] Failed to fetch unread count:', error);
        }
    };

    const saveTokenToBackend = async (token: string) => {
        try {
            await api.put('/profile/push-token', { token });
            console.log('[PushNotifications] Token saved to backend successfully:', token);
        } catch (error) {
            console.error('[PushNotifications] Failed to save token to backend:', error);
        }
    };

    const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
        // ── 1. Create Android notification channels ──────────────────────────
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
            });
            await Notifications.setNotificationChannelAsync('ride-requests', {
                name: 'Ride Requests',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 200, 500],
                sound: 'default',
                lightColor: '#FF7009',
                enableVibrate: true,
                showBadge: true,
            });
        }

        // ── 2. Request permissions ────────────────────────────────────────────
        let token: string | undefined;
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('[PushNotifications] Permission not granted. Cannot get push token.');
                return undefined;
            }

            // ── 3. Get Expo Push Token ────────────────────────────────────────
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            if (!projectId) {
                console.warn('[PushNotifications] No EAS projectId found. Check app.config.js extra.eas.projectId');
                return undefined;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            token = tokenData.data;
            console.log('[PushNotifications] Expo push token generated:', token);
        } catch (e: any) {
            // Gracefully fail on emulators / simulators
            console.warn('[PushNotifications] Could not get push token (physical device required):', e.message);
        }

        return token;
    };

    // ── Main effect: run once when userId is available ────────────────────────
    useEffect(() => {
        if (!userId) return;

        // 🔑 CRITICAL: Register device and save token to backend
        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
                saveTokenToBackend(token);
            }
        });

        // Fetch initial unread count
        fetchUnreadCount();

        // Listen for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log('[PushNotifications] Received in foreground:', notification.request.content.title);
            fetchUnreadCount();
        });

        // Listen for notification taps (from background / killed state)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('[PushNotifications] User tapped notification:', response.notification.request.content.title);
            const data = response.notification.request.content.data;
            fetchUnreadCount();

            if (data?.type === 'RIDE_REQUEST' || data?.rideId) {
                // Navigate to Main/Home (which corresponds to Tab Navigator -> 'Home' screen)
                // In our AppNavigator, 'Main' is the HomeTabs
                // @ts-ignore
                navigationRef.current?.navigate('Main', { screen: 'Home' });
            }
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [userId]);

    return { expoPushToken, unreadCount, fetchUnreadCount };
};
