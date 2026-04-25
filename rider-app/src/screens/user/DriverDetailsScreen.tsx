import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Alert } from 'react-native';
import { rideAPI } from '../../api/rideAPI';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import useRideStore from '../../store/rideStore';

const { width, height } = Dimensions.get('window');

const DriverDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { ride } = route.params || {};
  const { currentRide } = useRideStore();
  const activeRide = ride || currentRide;

  const [driverLocation, setDriverLocation] = useState({
    latitude: 14.6819,
    longitude: 77.6006,
  });

  const getVehicleEmoji = (model: string) => {
    const type = model?.toLowerCase();
    if (type?.includes('auto')) return '🛺';
    if (type?.includes('luxury_bike') || type?.includes('premium')) return '🏍️';
    if (type?.includes('bike-lite') || type?.includes('bike_lite')) return '🛵';
    if (type?.includes('bike')) return '🏍️';
    if (type?.includes('cab') || type?.includes('car')) return '🚘';
    return '🚗';
  };

  const handleCall = () => {
    if (activeRide?.driver?.phone) {
      Linking.openURL(`tel:${activeRide.driver.phone}`);
    }
  };

  const handleMessage = () => {
    if (activeRide?.driver?.phone) {
      Linking.openURL(`sms:${activeRide.driver.phone}`);
    }
  };

  const handleCancelRide = async () => {
    const rideId = activeRide?.id || currentRide?.id;
    if (!rideId) return;

    const status = activeRide?.status || currentRide?.status;
    const isStarted = status === 'STARTED' || status === 'IN_PROGRESS';
    
    Alert.alert(
      isStarted ? 'Cancel Active Ride?' : 'Cancel Ride',
      isStarted 
        ? 'Your ride has already started. Cancelling now may result in full fare charges. Are you sure?' 
        : 'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rideAPI.cancelRide(rideId);
              useRideStore.getState().clearRide();
              navigation.dispatch(CommonActions.reset({
                index: 0,
                routes: [{ name: 'UserNavigator' }],
              }));
            } catch (error) {
              console.error('Failed to cancel ride:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={driverLocation}
          title="Driver Location"
        >
          <View style={styles.driverMarker}>
            <Text style={{ fontSize: 24 }}>{getVehicleEmoji(activeRide?.driver?.vehicle_model || 'cab')}</Text>
          </View>
        </Marker>
      </MapView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <FontAwesome name="arrow-left" size={20} color="#1f2937" />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />

        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>
              {activeRide?.driver?.name?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>

          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{activeRide?.driver?.name || 'Driver'}</Text>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleEmoji}>{getVehicleEmoji(activeRide?.driver?.vehicle_model || 'cab')}</Text>
              <Text style={styles.vehicleText}>
                {activeRide?.driver?.vehicle_model} • {activeRide?.driver?.vehicle_number}
              </Text>
            </View>
            {activeRide?.driver?.rating && (
              <View style={styles.ratingRow}>
                <FontAwesome name="star" size={14} color="#fbbf24" />
                <Text style={styles.ratingText}>{activeRide.driver.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
              <FontAwesome name="phone" size={20} color="#FF5722" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleMessage}>
              <FontAwesome name="comment" size={20} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripSection}>
          <View style={styles.addressRow}>
            <FontAwesome name="circle" size={10} color="#22c55e" style={styles.addressIcon} />
            <Text style={styles.addressText} numberOfLines={1}>
              {activeRide?.pickup_address || 'Pickup Location'}
            </Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.addressRow}>
            <FontAwesome name="map-marker" size={10} color="#ef4444" style={styles.addressIcon} />
            <Text style={styles.addressText} numberOfLines={1}>
              {activeRide?.dropoff_address || 'Drop-off Location'}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {activeRide?.status === 'ACCEPTED' ? 'Driver is on the way' :
              activeRide?.status === 'ARRIVED' ? 'Driver has arrived' :
                activeRide?.status === 'STARTED' ? 'Trip in progress' : 'Searching...'}
          </Text>
        </View>

        {(activeRide?.status === 'ACCEPTED' || activeRide?.status === 'ARRIVED' || activeRide?.status === 'STARTED' || activeRide?.status === 'IN_PROGRESS') && (
          <TouchableOpacity 
            style={styles.cancelRideBtn}
            onPress={handleCancelRide}
          >
            <Text style={styles.cancelRideText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  vehicleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressIcon: {
    width: 16,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  verticalLine: {
    width: 1,
    height: 12,
    backgroundColor: '#d1d5db',
    marginLeft: 7,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  cancelRideBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  cancelRideText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DriverDetailsScreen;
