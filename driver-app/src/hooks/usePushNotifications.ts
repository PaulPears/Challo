import { useState, useEffect, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../config/api';
import { navigationRef } from '../utils/NavigationService';

import { useRideRequest } from '../context/RideRequestContext';
import { useSound } from '../context/SoundContext';

export const usePushNotifications = (userId: string | null) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const { setRideRequest } = useRideRequest();
    const { playAlert } = useSound();

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
            await api.put('/profile/push-token', { token, role: 'driver' });
            console.log('[PushNotifications] Driver token saved to backend successfully:', token);
        } catch (error) {
            console.error('[PushNotifications] Failed to save driver token to backend:', error);
        }
    };

    const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
        // ── 1. Create Android notification channels ──────────────────────────
        if (Platform.OS === 'android') {
            // Default channel
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });

            // High-priority Ride Alert channel with custom sound
            await Notifications.setNotificationChannelAsync('ride-alerts', {
                name: 'Ride Alerts',
                description: 'Critical alerts for incoming ride requests',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 200, 500, 200, 500],
                lightColor: '#FF7009',
                enableVibrate: true,
                showBadge: true,
                sound: 'ride_alert.mp3',  // Custom sound bundled in res/raw
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,  // Override Do Not Disturb for ride alerts
            });

            const channels = await Notifications.getNotificationChannelsAsync();
            console.log('[PushNotifications] Registered Channels:', channels.map(c => c.id));
        }

        // ── 2. Request permissions ────────────────────────────────────────────
        let token: string | undefined;
        try {
            // On Android 13+ (API 33+) we must explicitly request POST_NOTIFICATIONS
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const { status: existingAndroid } = await Notifications.getPermissionsAsync();
                if (existingAndroid !== 'granted') {
                    const { status: androidStatus } = await Notifications.requestPermissionsAsync({
                        android: {},
                    });
                    if (androidStatus !== 'granted') {
                        console.warn('[PushNotifications] POST_NOTIFICATIONS permission denied on Android 13+');
                    }
                }
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('[PushNotifications] Permission not granted. Cannot get push token.');
                Alert.alert(
                    'Notifications Required',
                    'You must enable push notifications to receive new ride alerts when the app is closed. Please enable them in your device settings.',
                    [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ],
                    { cancelable: false }
                );
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
            const data = notification.request.content.data;
            if (data?.type === 'RIDE_REQUEST' || data?.rideId) {
                playAlert('RIDE_REQUEST');
            }
            fetchUnreadCount();
        });

        // Listen for notification taps (from background / killed state)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('[PushNotifications] User tapped notification:', response.notification.request.content.title);
            const data = response.notification.request.content.data;
            fetchUnreadCount();

            if (data?.type === 'RIDE_REQUEST' || data?.rideId) {
                // If the app was closed, we need to populate the RideRequestContext
                // so the modal appears on the Home screen.
                if (data.rideId) {
                    // Try to fetch ride details from backend or use data from payload
                    api.get(`/rides/${data.rideId}`).then(res => {
                        const ride = res.data;
                        if (ride) {
                            setRideRequest({
                                rideId: ride.id,
                                pickupLocation: ride.pickup_address,
                                pickupLatitude: ride.pickup_latitude,
                                pickupLongitude: ride.pickup_longitude,
                                dropoffLocation: ride.dropoff_address,
                                dropoffLatitude: ride.dropoff_latitude,
                                dropoffLongitude: ride.dropoff_longitude,
                                fare: ride.estimated_fare || ride.fare,
                                distance: ride.estimated_distance_km,
                                duration: ride.estimated_duration_min,
                                riderName: ride.rider?.name || ride.user?.name || 'Rider',
                                riderPhone: ride.rider?.phone_number || ride.user?.phone_number,
                            });
                        }
                    }).catch(err => {
                        console.error('[Push] Failed to fetch ride details on tap:', err);
                    });
                }

                // Navigate to Main/Home
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
