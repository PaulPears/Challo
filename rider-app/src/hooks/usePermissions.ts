import { useState, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'permanently_denied';

export const usePermissions = () => {
    const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
    const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('undetermined');

    const checkAllPermissions = useCallback(async () => {
        try {
            // Check Notification
            const { status: notifStatus } = await Notifications.getPermissionsAsync();
            setNotificationStatus(notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'undetermined');

            // Check Location
            const { status: locStatus, canAskAgain: locCanAsk } = await Location.getForegroundPermissionsAsync();
            setLocationStatus(locStatus === 'granted' ? 'granted' : !locCanAsk && locStatus !== 'undetermined' ? 'permanently_denied' : 'denied');
        } catch (error) {
            console.error('[usePermissions] Error checking permissions:', error);
        }
    }, []);

    useEffect(() => {
        checkAllPermissions();
    }, [checkAllPermissions]);

    const requestLocation = async () => {
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setLocationStatus('granted');
            return true;
        }

        if (!canAskAgain) {
            showSettingsAlert('Location');
            setLocationStatus('permanently_denied');
        } else {
            setLocationStatus('denied');
        }
        return false;
    };

    const requestNotifications = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationStatus(status === 'granted' ? 'granted' : 'denied');
        return status === 'granted';
    };

    const showSettingsAlert = (permName: string, customMsg?: string) => {
        Alert.alert(
            `${permName} Permission Required`,
            customMsg || `${permName} permission is permanently denied. Please enable it in system settings to use this feature.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
        );
    };

    return {
        locationStatus,
        notificationStatus,
        checkAllPermissions,
        requestLocation,
        requestNotifications,
        isReady: locationStatus === 'granted'
    };
};
