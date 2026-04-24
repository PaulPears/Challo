import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axiosClient from '../api/axiosClient';

export const usePushNotifications = (userId: string | null) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!userId) return;
        try {
            const response = await axiosClient.get('/notifications/unread-count');
            const count = response.data.count || 0;
            setUnreadCount(count);
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('[PushNotifications] Failed to fetch unread count:', error);
        }
    };

    const saveTokenToBackend = async (token: string) => {
        try {
            await axiosClient.put('/profile/push-token', { token, role: 'rider' });
            console.log('[Push] Rider token stored successfully:', token);
        } catch (error) {
            console.error('[Push] Failed to store rider token:', error);
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
                console.warn('[Push] Permission not granted');
                return undefined;
            }

            // ── 3. Get Expo Push Token ────────────────────────────────────────
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            if (!projectId) {
                console.warn('[Push] No EAS projectId found. Check app.config.js extra.eas.projectId');
                return undefined;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            token = tokenData.data;
            console.log('[Push] Token generated:', token);
        } catch (e: any) {
            console.log('[Push] Note: Push tokens are only available on physical devices.', e.message);
        }

        return token;
    };

    // ── Main effect: run once when userId is available ────────────────────────
    useEffect(() => {
        if (!userId) return;

        // 🔑 CRITICAL: Register device and save push token to the backend
        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
                saveTokenToBackend(token);
            }
        });

        // Fetch initial unread notification count
        fetchUnreadCount();

        // Listen for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data;
            // Ignore notifications meant for the driver app
            if (data?.target === 'driver') {
                console.log('[Notification] Ignoring driver-targeted notification in Rider app');
                return;
            }
            console.log('[Notification] Received foreground:', notification.request.content.title);
            fetchUnreadCount();
        });

        // Listen for notification taps (from background or killed state)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            if (data?.target === 'driver') {
                 return;
            }
            console.log('[Notification] Response received:', response.notification.request.content.title);
            fetchUnreadCount();
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [userId]);

    return { expoPushToken, unreadCount, fetchUnreadCount };
};
