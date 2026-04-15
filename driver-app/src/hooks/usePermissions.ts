import { useState, useCallback, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'permanently_denied';

export const usePermissions = () => {
    const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
    const [backgroundLocationStatus, setBackgroundLocationStatus] = useState<PermissionStatus>('undetermined');
    const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('undetermined');
    const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('undetermined');

    const checkAllPermissions = useCallback(async () => {
        try {
            // Check Notification
            const { status: notifStatus } = await Notifications.getPermissionsAsync();
            setNotificationStatus(notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'undetermined');

            // Check Location
            const { status: locStatus, canAskAgain: locCanAsk } = await Location.getForegroundPermissionsAsync();
            setLocationStatus(locStatus === 'granted' ? 'granted' : !locCanAsk && locStatus !== 'undetermined' ? 'permanently_denied' : 'denied');

            // Check Background Location (Android)
            if (Platform.OS === 'android') {
                const { status: bgStatus, canAskAgain: bgCanAsk } = await Location.getBackgroundPermissionsAsync();
                setBackgroundLocationStatus(bgStatus === 'granted' ? 'granted' : !bgCanAsk && bgStatus !== 'undetermined' ? 'permanently_denied' : 'denied');
            }

            // Check Camera
            const { status: camStatus, canAskAgain: camCanAsk } = await ImagePicker.getCameraPermissionsAsync();
            setCameraStatus(camStatus === 'granted' ? 'granted' : !camCanAsk && camStatus !== 'undetermined' ? 'permanently_denied' : 'denied');
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

    const requestBackgroundLocation = async () => {
        // Must have foreground first
        if (locationStatus !== 'granted') {
            const fgGranted = await requestLocation();
            if (!fgGranted) return false;
        }

        const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
        if (status === 'granted') {
            setBackgroundLocationStatus('granted');
            return true;
        }

        if (!canAskAgain) {
            showSettingsAlert('Background Location', 'Please select "Allow all the time" in app settings to enable background tracking.');
            setBackgroundLocationStatus('permanently_denied');
        } else {
            setBackgroundLocationStatus('denied');
        }
        return false;
    };

    const requestNotifications = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationStatus(status === 'granted' ? 'granted' : 'denied');
        return status === 'granted';
    };

    const requestCamera = async () => {
        const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === 'granted') {
            setCameraStatus('granted');
            return true;
        }

        if (!canAskAgain) {
            showSettingsAlert('Camera');
            setCameraStatus('permanently_denied');
        } else {
            setCameraStatus('denied');
        }
        return false;
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
        backgroundLocationStatus,
        notificationStatus,
        cameraStatus,
        checkAllPermissions,
        requestLocation,
        requestBackgroundLocation,
        requestNotifications,
        requestCamera,
        isCriticalGranted: locationStatus === 'granted' && notificationStatus === 'granted'
    };
};
