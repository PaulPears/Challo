
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { usePermissions } from '../../hooks/usePermissions';
import { GOOGLE_MAPS_API_KEY } from '../../config/constants';
import PermissionRationaleModal from '../../components/PermissionRationaleModal';

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

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    const newLocation = { lat: coordinate.latitude, lng: coordinate.longitude };
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
        // Reverse geocode both points to get addresses
        const [pickupRes, dropoffRes] = await Promise.all([
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pickup.lat},${pickup.lng}&key=${GOOGLE_MAPS_API_KEY}`),
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${dropoff.lat},${dropoff.lng}&key=${GOOGLE_MAPS_API_KEY}`)
        ]);

        const pickupData = await pickupRes.json();
        const dropoffData = await dropoffRes.json();

        const pickupAddress = pickupData.results[0]?.formatted_address || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`;
        const dropoffAddress = dropoffData.results[0]?.formatted_address || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`;

        navigation.navigate('Booking', {
          pickup: { ...pickup, address: pickupAddress },
          dropoff: { ...dropoff, address: dropoffAddress }
        });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        navigation.navigate('Booking', {
          pickup: { ...pickup, address: 'Selected Point' },
          dropoff: { ...dropoff, address: 'Selected Point' }
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        onPress={handleMapPress}
        region={region}
      >
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pick-up"
            draggable
            onDragEnd={(e) => setPickup({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
            pinColor="green"
          />
        )}
        {dropoff && (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title="Drop-off"
            draggable
            onDragEnd={(e) => setDropoff({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
            pinColor="red"
          />
        )}
      </MapView>
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
