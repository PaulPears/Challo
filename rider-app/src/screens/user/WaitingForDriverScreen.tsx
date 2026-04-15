import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import socket from '../../api/socket';
import { rideAPI } from '../../api/rideAPI';
import useRideStore from '../../store/rideStore';
import useUserStore from '../../store/userStore';

const WaitingForDriverScreen = ({ route, navigation }: any) => {
  const { ride } = route.params;
  const rideId = ride?.id;
  const { currentRide, activeAlert, setAlert, updateRideStatus } = useRideStore();

  // Use store status if available, otherwise default
  const displayStatus = currentRide?.status === 'ACCEPTED'
    ? 'Driver found! En route to your location.'
    : 'Searching for a nearby driver...';

  useEffect(() => {
    // Navigate away when ride is accepted
    if (currentRide?.status === 'ACCEPTED') {
      navigation.navigate('App');
    }
  }, [currentRide?.status, navigation]);

  const handleCancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideAPI.cancelRide(rideId);
              setAlert(null); // Ensure no modal sticks around
              updateRideStatus('CANCELLED');
              navigation.navigate('App'); // Return cleanly to home map
            } catch (error) {
              console.error('Failed to cancel ride:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.heading}>Waiting for Driver</Text>

          <View style={styles.animationContainer}>
            <LottieView
              source={{ uri: 'https://lottie.host/ab5ba586-78ca-44ea-b2e7-9a3e64781017/AByInMd7Tg.lottie' }}
              autoPlay
              loop
              speed={2}
              style={{ width: 250, height: 250 }}
            />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>

          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#FF5722" />
            <Text style={styles.statusText}>{displayStatus}</Text>
          </View>

          {ride && (
            <View style={styles.rideDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>From</Text>
                <Text style={styles.detailValue}>{ride.pickup_address || ride.pickupLocation || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>To</Text>
                <Text style={styles.detailValue}>{ride.dropoff_address || ride.dropoffLocation || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Estimated Fare</Text>
                <Text style={styles.detailValue}>₹{ride.estimated_fare || ride.fare || '0.00'}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleCancelRide}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    height: 250,
    width: 250,
  },
  searchingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
  },
  rideDetails: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WaitingForDriverScreen;