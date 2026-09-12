
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { rideAPI } from '../../api/rideAPI';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionRationaleModal from '../../components/PermissionRationaleModal';

const BookARideScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { locationStatus, requestLocation, checkAllPermissions } = usePermissions();
  const [rationaleVisible, setRationaleVisible] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      const results = await rideAPI.searchLocations(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location: any) => {
    if (focusedInput === 'pickup') {
      setPickupLocation(location.name);
    } else if (focusedInput === 'dropoff') {
      setDropoffLocation(location.name);
    }
    setSearchQuery('');
    setSearchResults([]);
    setFocusedInput(null);
  };

  const handleGetCurrentLocation = async () => {
    if (locationStatus !== 'granted') {
      setRationaleVisible(true);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync(location.coords);
    if (address.length > 0) {
      setPickupLocation(`${address[0].name}, ${address[0].city}, ${address[0].region}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Request A Ride</Text>
      {focusedInput && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.resultItem} onPress={() => handleSelectLocation(item)}>
                <Text>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <Pressable style={styles.currentLocationButton} onPress={handleGetCurrentLocation}>
        <Text>Use Current Location</Text>
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Pickup Location"
        value={pickupLocation}
        onFocus={() => setFocusedInput('pickup')}
      />
      <TextInput
        style={styles.input}
        placeholder="Drop-off Location"
        value={dropoffLocation}
        onFocus={() => setFocusedInput('dropoff')}
      />
      <PermissionRationaleModal
        isVisible={rationaleVisible}
        title="Location Access"
        description="We need your location to help you set the pickup point correctly."
        icon="map-marker-radius"
        onAllow={async () => {
          setRationaleVisible(false);
          await requestLocation();
          checkAllPermissions();
        }}
        onCancel={() => setRationaleVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1,
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentLocationButton: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});

export default BookARideScreen;
