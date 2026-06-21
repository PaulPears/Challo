import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const RIDE_ALERT_CHANNEL_ID = 'ride-alerts-v3';
const RIDE_ALERT_NOTIFICATION_ID = 'ride-request-alert';

/**
 * Sets up the Android notification channel for ride alerts.
 * Must be called on app startup (in App.tsx or SoundProvider).
 * High importance = plays sound on the notification/ring audio stream (LOUD).
 */
export const setupRideAlertChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(RIDE_ALERT_CHANNEL_ID, {
    name: 'Ride Alerts',
    description: 'Plays a loud alert when a new ride request comes in.',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'ride_alert.mp3',     // Must match filename in assets/sounds/
    vibrationPattern: [0, 500, 300, 500, 300, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,             // Override Do-Not-Disturb for ride alerts
    enableLights: true,
    lightColor: '#fe7009',
  });
};

/**
 * Fires a local notification with the ride alert sound.
 * This uses Android's notification stream — independent of media volume.
 */
export const showRideAlertNotification = async (fare: number, pickup: string, distance?: number) => {
  let bodyText = `Earn ₹${fare.toFixed(2)} · ${pickup}`;
  if (typeof distance === 'number') {
    bodyText = `Earn ₹${fare.toFixed(2)} · Pickup ${distance.toFixed(1)} km away`;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: RIDE_ALERT_NOTIFICATION_ID,
    content: {
      title: '🚖 New Ride Request!',
      body: bodyText,
      sound: 'ride_alert.mp3',
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,       // keeps notification in shade until explicitly dismissed
      autoDismiss: false, // do not dismiss when user taps — driver must act in app
      data: { type: 'ride-request' },
    },
    trigger: {
      channelId: RIDE_ALERT_CHANNEL_ID,
    },
  });
};

/**
 * Cancels the ride alert notification (call on accept/reject).
 */
export const cancelRideAlertNotification = async () => {
  await Notifications.cancelScheduledNotificationAsync(RIDE_ALERT_NOTIFICATION_ID).catch(() => {});
  await Notifications.dismissNotificationAsync(RIDE_ALERT_NOTIFICATION_ID).catch(() => {});
};
