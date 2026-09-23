import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../api/axiosClient';
import PermissionRationaleModal from '../../components/PermissionRationaleModal';
import OlaMapView, { OlaMarker } from '../../components/OlaMapView';

const MapSelectionScreen = ({ route, navigation }: any) => {
  const { pickup: initialPickup, dropoff: initialDropoff } = route.params;
  const [pickup, setPickup] = useState(initialPickup?.details?.geometry?.location);
  const [dropoff, setDropoff] = useState(initialDropoff?.details?.geometry?.location);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 14.6819,
    longitude: 77.6006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { locationStatus, requestLocation, checkAllPermissions } = usePermissions();
  const [rationaleVisible, setRationaleVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (locationStatus !== 'granted') {
        const hasPermission = await requestLocation();
        if (!hasPermission) {
          // Fallback logic already in place with initial region
          return;
        }
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      console.log('Current location fetched:', location);

      if (location) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, [locationStatus]);

  console.log('Pickup:', pickup);
  console.log('Dropoff:', dropoff);
  console.log('CurrentLocation state:', currentLocation);

  const handleMapClick = (coords: { latitude: number; longitude: number }) => {
    const newLocation = { lat: coords.latitude, lng: coords.longitude };
    if (!pickup) {
      setPickup(newLocation);
      setRegion({
        ...region,
        latitude: newLocation.lat,
        longitude: newLocation.lng,
      });
    } else if (!dropoff) {
      setDropoff(newLocation);
      setRegion({
        ...region,
        latitude: newLocation.lat,
        longitude: newLocation.lng,
      });
    }
  };

  const handleConfirm = async () => {
    if (pickup && dropoff) {
      try {
        const [pickupRes, dropoffRes] = await Promise.all([
          api.get(`/maps/reverse-geocode?lat=${pickup.lat}&lng=${pickup.lng}`).catch(() => null),
          api.get(`/maps/reverse-geocode?lat=${dropoff.lat}&lng=${dropoff.lng}`).catch(() => null),
        ]);

        const pickupAddress =
          pickupRes?.data?.results?.[0]?.formatted_address ||
          pickupRes?.data?.formatted_address ||
          `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`;
        const dropoffAddress =
          dropoffRes?.data?.results?.[0]?.formatted_address ||
          dropoffRes?.data?.formatted_address ||
          `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`;

        navigation.navigate('Booking', {
          pickup: { ...pickup, address: pickupAddress },
          dropoff: { ...dropoff, address: dropoffAddress },
        });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        navigation.navigate('Booking', {
          pickup: { ...pickup, address: 'Selected Point' },
          dropoff: { ...dropoff, address: 'Selected Point' },
        });
      }
    }
  };

  const mapMarkers: OlaMarker[] = [];
  if (pickup) {
    mapMarkers.push({
      id: 'pickup',
      latitude: pickup.lat,
      longitude: pickup.lng,
      title: 'Pick-up',
      type: 'pickup',
    });
  }
  if (dropoff) {
    mapMarkers.push({
      id: 'dropoff',
      latitude: dropoff.lat,
      longitude: dropoff.lng,
      title: 'Drop-off',
      type: 'dropoff',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <OlaMapView
        style={styles.map}
        center={{ latitude: region.latitude, longitude: region.longitude }}
        markers={mapMarkers}
        onMapClick={handleMapClick}
      />
      <View style={styles.buttonContainer}>
        <Button title="Confirm Locations" onPress={handleConfirm} disabled={!pickup || !dropoff} />
      </View>
      <PermissionRationaleModal
        isVisible={rationaleVisible}
        title="Location Permission"
        description="Please provide location access to help us identify your pick-up point on the map."
        icon="map-marker-radius"
        onAllow={async () => {
          setRationaleVisible(false);
          await requestLocation();
          checkAllPermissions();
        }}
        onCancel={() => setRationaleVisible(false)}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
});

export default MapSelectionScreen;
