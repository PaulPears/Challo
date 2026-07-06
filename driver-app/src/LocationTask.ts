import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import api from './config/api';
import { DeviceEventEmitter } from 'react-native';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const location = locations[0];
      const payload = {
        online: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };
      try {
        await api.put('/profile/driver/status', payload);
        console.log('Background location updated:', location.coords.latitude, location.coords.longitude);
        DeviceEventEmitter.emit('onBackgroundLocationUpdated', Date.now());
      } catch (e) {
        console.error('Failed to update background location:', e);
      }
    }
  }
});
