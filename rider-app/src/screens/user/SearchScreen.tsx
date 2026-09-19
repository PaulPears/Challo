import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '../../config/constants';
import { usePermissions } from '../../hooks/usePermissions';
import useLocationStore from '../../store/locationStore';
import PermissionRationaleModal from '../../components/PermissionRationaleModal';

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const SearchScreen = ({ navigation, route }: any) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [focusedInput, setFocusedInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const { locationStatus, requestLocation, checkAllPermissions } = usePermissions();
  const [rationaleVisible, setRationaleVisible] = useState(false);
  const { currentLocation } = useLocationStore();

  useEffect(() => {
    (async () => {
      try {
        if (locationStatus === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Location fetch error', error);
      }
    })();
  }, [locationStatus]);

  const fetchCurrentLocation = async () => {
    if (currentLocation) {
      setPickup({
        name: currentLocation.name,
        address: currentLocation.address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setPickupQuery(currentLocation.address);
      setPickupSuggestions([]);
      return;
    }

    try {
      if (locationStatus !== 'granted') {
        setRationaleVisible(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }); // Update global coords too

      // Reverse geocode use Google Maps API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        setPickup({
          name: "Current Location",
          address: address,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setPickupQuery(address);
        setPickupSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching current location:', error);
      Alert.alert('Error', 'Could not fetch current location');
    }
  };

  const searchPlaces = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    try {
      let baseUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;

      // Add location bias and origin if coordinates available
      if (currentCoords) {
        baseUrl += `&location=${currentCoords.latitude},${currentCoords.longitude}&radius=50000&origin=${currentCoords.latitude},${currentCoords.longitude}`;
      }

      const response = await fetch(baseUrl);
      const data = await response.json();

      if (data.predictions) {
        // Sort by distance (distance_meters) if available
        const sortedPredictions = data.predictions.sort((a: any, b: any) => {
          if (a.distance_meters && b.distance_meters) {
            return a.distance_meters - b.distance_meters;
          }
          return 0; // Maintain original order if distance is missing
        });

        if (type === 'pickup') {
          setPickupSuggestions(sortedPredictions);
        } else {
          setDropoffSuggestions(sortedPredictions);
        }
      }
    } catch (error) {
      console.error('Places API error:', error);
    }
  };

  const getPlaceDetails = async (placeId: string, type: 'pickup' | 'dropoff') => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.result) {
        const location: LocationData = {
          name: data.result.name,
          address: data.result.formatted_address,
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };

        if (type === 'pickup') {
          setPickup(location);
          setPickupQuery(data.result.formatted_address);
          setPickupSuggestions([]);
        } else {
          setDropoff(location);
          setDropoffQuery(data.result.formatted_address);
          setDropoffSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  const handleSuggestionPress = (suggestion: any, type: 'pickup' | 'dropoff') => {
    getPlaceDetails(suggestion.place_id, type);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Determine active suggestions based on focus
  const activeSuggestions = focusedInput === 'pickup' ? pickupSuggestions : (focusedInput === 'dropoff' ? dropoffSuggestions : []);
  const activeType = focusedInput || 'pickup'; // Default to pickup for safety if null, though logic handles empty list

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book a Ride</Text>
        <TouchableOpacity
          style={styles.headerMapButton}
          onPress={() => navigation.navigate('MapSelection', { pickup, dropoff })}
        >
          <Feather name="map" size={20} color="#1e40af" />
          <Text style={styles.headerMapButtonText}>Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.inputWrapper}>
          <View style={styles.locationPinContainer}>
            <View style={styles.startPin} />
            <View style={styles.dottedLine} />
            <View style={styles.endPin} />
          </View>
          <View style={styles.textInputContainer}>
            <View style={styles.inputFieldWrapper}>
              <View style={styles.rowInput}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Pick-up location"
                  placeholderTextColor="#9ca3af"
                  value={pickupQuery}
                  onChangeText={(text) => {
                    setPickupQuery(text);
                    searchPlaces(text, 'pickup');
                  }}
                  onFocus={() => setFocusedInput('pickup')}
                // Removed onBlur timeout to keep focus stable for list interaction
                />
                <TouchableOpacity onPress={fetchCurrentLocation} style={styles.currentLocationButton}>
                  <Feather name="crosshair" size={18} color="white" />
                  <Text style={styles.currentLocationText}>Current</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Drop-off location"
                placeholderTextColor="#9ca3af"
                value={dropoffQuery}
                onChangeText={(text) => {
                  setDropoffQuery(text);
                  searchPlaces(text, 'dropoff');
                }}
                onFocus={() => setFocusedInput('dropoff')}
              // Removed onBlur timeout to keep focus stable for list interaction
              />
            </View>
          </View>
        </View>
      </View>

      {/* Suggestions List Section */}
      <View style={styles.suggestionsContainer}>
        <ScrollView keyboardShouldPersistTaps="handled">

          {activeSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={suggestion.place_id}
              style={[
                styles.suggestionItem,
                index === activeSuggestions.length - 1 && styles.lastSuggestionItem
              ]}
              onPress={() => handleSuggestionPress(suggestion, activeType)}
            >
              <View style={styles.suggestionIconContainer}>
                <Feather name="map-pin" size={18} color="#4b5563" />
              </View>
              <View style={styles.suggestionText}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionMainText} numberOfLines={1}>
                    {suggestion.structured_formatting.main_text}
                  </Text>
                  {suggestion.distance_meters && (
                    <Text style={styles.distanceText}>
                      {formatDistance(suggestion.distance_meters)}
                    </Text>
                  )}
                </View>
                <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                  {suggestion.structured_formatting.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!pickup || !dropoff) && styles.buttonDisabled
          ]}
          onPress={() => {
            if (pickup && dropoff) {
              navigation.navigate('Booking', {
                pickup: { lat: pickup.latitude, lng: pickup.longitude, address: pickup.address },
                dropoff: { lat: dropoff.latitude, lng: dropoff.longitude, address: dropoff.address },
                preferredVehicle: route?.params?.preferredVehicle
              });
            }
          }}
          disabled={!pickup || !dropoff}
        >
          <Text style={styles.buttonText}>Book a Ride</Text>
        </TouchableOpacity>
      </View>
      <PermissionRationaleModal
        isVisible={rationaleVisible}
        title="Location Access Required"
        description="We need your location to find the best pickup point for your ride."
        icon="map-marker-radius"
        onAllow={async () => {
          setRationaleVisible(false);
          await requestLocation();
          checkAllPermissions();
        }}
        onCancel={() => setRationaleVisible(false)}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  headerMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  headerMapButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
  },
  locationPinContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 12,
  },
  startPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  dottedLine: {
    width: 1,
    height: 48,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginVertical: 4,
  },
  endPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  textInputContainer: {
    flex: 1,
  },
  inputFieldWrapper: {
    justifyContent: 'center',
    minHeight: 48,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    marginLeft: 8,
    elevation: 1,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  currentLocationText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1e40af',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 1,
    borderRadius: 8,
    marginVertical: 4,
    elevation: 2,
  },
  lastSuggestionItem: {
    marginBottom: 16, // Add some bottom spacing for the last item
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#059669', // Green color for distance
    fontWeight: '600',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6b7280',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;