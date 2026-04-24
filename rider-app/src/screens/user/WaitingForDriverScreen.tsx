import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { rideAPI } from '../../api/rideAPI';
import useRideStore from '../../store/rideStore';

const { width, height } = Dimensions.get('window');

const WaitingForDriverScreen = ({ route, navigation }: any) => {
  const { ride } = route.params;
  const rideId = ride?.id;
  const { currentRide, setAlert, updateRideStatus } = useRideStore();

  const displayStatus = currentRide?.status === 'ACCEPTED'
    ? 'Driver found! En route to your location.'
    : 'Searching for a nearby driver...';

  useEffect(() => {
    if (currentRide?.status === 'ACCEPTED') {
      navigation.navigate('App');
    }
  }, [currentRide?.status, navigation]);

  const handleCancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideAPI.cancelRide(rideId);
              setAlert(null);
              updateRideStatus('CANCELLED');
              navigation.navigate('App');
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
      {/* Upper Section: Animation */}
      <View style={styles.headerSection}>
        <View style={styles.animationWrapper}>
          <LottieView
            source={{ uri: 'https://lottie.host/ab5ba586-78ca-44ea-b2e7-9a3e64781017/AByInMd7Tg.lottie' }}
            autoPlay
            loop
            speed={1.5}
            style={styles.lottie}
          />
        </View>
        <Text style={styles.statusTitle}>Finding your driver</Text>
        <Text style={styles.statusSubtitle}>This usually takes less than a minute</Text>
      </View>

      {/* Lower Section: Details */}
      <View style={styles.detailsSection}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          {/* Location Path */}
          <View style={styles.locationContainer}>
            <View style={styles.pathLine}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: '#FF5722' }]} />
            </View>
            <View style={styles.addressInfo}>
              <View style={styles.addressItem}>
                <Text style={styles.addressLabel}>PICKUP</Text>
                <Text numberOfLines={1} style={styles.addressText}>{ride.pickup_address || 'Current Location'}</Text>
              </View>
              <View style={[styles.addressItem, { marginTop: 20 }]}>
                <Text style={styles.addressLabel}>DROPOFF</Text>
                <Text numberOfLines={1} style={styles.addressText}>{ride.dropoff_address || 'Destination'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Fare Breakdown */}
          <View style={styles.fareContainer}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated Total</Text>
              <Text style={styles.fareValue}>₹{Number(ride.estimated_fare || 0).toFixed(2)}</Text>
            </View>

            {ride.super_km_discount > 0 && (
              <View style={styles.fareRow}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>SUPER KM APPLIED</Text>
                </View>
                <Text style={[styles.fareValue, { color: '#4CAF50' }]}>-₹{Number(ride.super_km_discount).toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.fareRow, { marginTop: 10 }]}>
              <Text style={styles.payableLabel}>Payable Amount</Text>
              <Text style={styles.payableValue}>₹{Number(ride.rider_payable || ride.estimated_fare || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleInfoCard}>
             <Ionicons name="car-sport" size={24} color="#FF5722" />
             <Text style={styles.vehicleInfoText}>Requesting {ride.vehicle_type?.toUpperCase() || 'Ride'}</Text>
          </View>

          <TouchableOpacity onPress={handleCancelRide} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSection: {
    height: height * 0.45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  animationWrapper: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 300,
    height: 300,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 10,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
  },
  scrollPadding: {
    paddingVertical: 30,
  },
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pathLine: {
    alignItems: 'center',
    marginRight: 15,
    paddingTop: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  line: {
    width: 2,
    height: 35,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  addressInfo: {
    flex: 1,
  },
  addressItem: {
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  fareContainer: {
    marginBottom: 25,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  fareLabel: {
    fontSize: 15,
    color: '#666',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  discountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  payableLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  payableValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  vehicleInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  vehicleInfoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WaitingForDriverScreen;