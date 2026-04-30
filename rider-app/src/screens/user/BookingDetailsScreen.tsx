import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Linking, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import useRideStore from '../../store/rideStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { rideAPI } from '../../api/rideAPI';

const BookingDetailsScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { rideId } = route.params;
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const rideDetails = await rideAPI.getRideDetails(rideId);
        setRide(rideDetails);
      } catch (error) {
        console.error('Failed to fetch ride details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  const handleCancelRide = async () => {
    if (!ride) return;

    const status = (ride.status || '').toUpperCase();
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
              await rideAPI.cancelRide(ride.id);
              if (useRideStore.getState().currentRide?.id === ride.id) {
                useRideStore.getState().clearRide();
              }
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

  if (loading) {
    return <ActivityIndicator size="large" color="#FF5722" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
        </View>
        <View style={styles.content}>
          <Text>Failed to load booking details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.rideType}>{(ride.vehicle_type || ride.vehicleType || 'Ride').replace(/_/g, ' ')} Ride</Text>
              <Text style={styles.rideDate}>{
                new Date(ride.created_at || ride.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' +
                new Date(ride.created_at || ride.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              }</Text>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.rideFare}>
                  {Number(ride.super_km_applied) > 0 ? 'Total Paid: ' : 'Trip Fare: '}
                  ₹ {Number(ride.rider_payable || ride.final_fare || ride.estimated_fare || 0).toFixed(2)}
                </Text>
                {Number(ride.super_km_discount) > 0 && (
                  <View style={styles.superKmHeaderBadge}>
                    <Text style={styles.superKmHeaderText}>SUPER KM APPLIED</Text>
                  </View>
                )}
                {Number(ride.super_coins_applied) > 0 && (
                  <View style={[styles.superKmHeaderBadge, { borderColor: '#FCD34D', backgroundColor: '#FFFBEB', marginTop: 4 }]}>
                    <Text style={[styles.superKmHeaderText, { color: '#B45309' }]}>COINS APPLIED 🪙</Text>
                  </View>
                )}
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={styles.metricValue}>{ride.actual_distance_km || ride.estimated_distance_km || ride.distance || '0'} km</Text>
                </View>
                <View style={[styles.metricItem, { marginLeft: 20 }]}>
                  <Text style={styles.metricLabel}>Duration</Text>
                  <Text style={styles.metricValue}>{ride.actual_duration_min || ride.estimated_duration_min || ride.duration || '0'} min</Text>
                </View>
              </View>
            </View>
            <View style={styles.rideStatusContainer}>
              <Image
                source={
                  (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('cab') || (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('car') ? require('../../../assets/cab_icon.png') :
                    (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('bike_lite') || (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('bike-lite') ? require('../../../assets/bike_lite_icon.png') :
                      (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('luxury_bike') || (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('premium') ? require('../../../assets/premium_bike.png') :
                        (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('bike') ? require('../../../assets/bike_icon.png') :
                          (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('auto') ? require('../../../assets/auto_icon.png') :
                            (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('parcel') ? require('../../../assets/parcel_icon.png') :
                              require('../../../assets/cab_icon.png')
                }
                style={{ width: 60, height: 60, marginBottom: 8 }}
                resizeMode="contain"
              />
              <View style={[styles.statusBadge,
              (ride.status || '').toLowerCase() === 'completed' ? styles.completedStatus :
                (ride.status || '').toLowerCase() === 'cancelled' ? styles.cancelledStatus :
                  (ride.status || '').toLowerCase() === 'in_progress' || (ride.status || '').toLowerCase() === 'started' ? styles.inProgressStatus :
                    (ride.status || '').toLowerCase() === 'accepted' ? styles.acceptedStatus :
                      styles.pendingStatus
              ]}>
                <Text style={[
                  (ride.status || '').toLowerCase() === 'completed' ? styles.completedStatustext :
                    (ride.status || '').toLowerCase() === 'cancelled' ? styles.cancelledStatustext :
                      (ride.status || '').toLowerCase() === 'in_progress' || (ride.status || '').toLowerCase() === 'started' ? styles.inProgressStatustext :
                        (ride.status || '').toLowerCase() === 'accepted' ? styles.acceptedStatustext :
                          styles.pendingStatustext
                ]}>{ride.status?.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>

          {ride.otp && (ride.status === 'SEARCHING' || ride.status === 'ACCEPTED' || ride.status === 'ARRIVED' || ride.status === 'PENDING') && (
            <View style={styles.otpDetailContainer}>
              <Text style={styles.otpDetailLabel}>TRIP PIN (OTP)</Text>
              <Text style={styles.otpDetailValue}>{ride.otp}</Text>
              <Text style={styles.otpDetailSub}>Share this PIN with your driver to start the trip</Text>
            </View>
          )}

          <View style={styles.addressDetails}>
            <Text style={styles.addressTitle}>Address details</Text>
            <Text style={styles.rideId}>Ride ID #{ride.id?.substring(0, 13)}...</Text>
            <View style={styles.routeContainer}>
              <View style={styles.locationPinContainer}>
                <View style={styles.startPin} />
                <View style={styles.dottedLine} />
                <View style={styles.endPin} />
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.address}>{ride.pickup_address || ride.pickupLocation || 'Pickup Location'}</Text>
                <Text style={styles.address}>{ride.dropoff_address || ride.dropoffLocation || 'Drop-off Location'}</Text>
              </View>
            </View>
          </View>


          <TouchableOpacity
            style={styles.helpContainer}
            onPress={() => Linking.openURL('tel:8374277617')}
            activeOpacity={0.4}
          >
            <FontAwesome name="headphones" size={24} color="white" />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Contact Us</Text>
              <Text style={styles.helpSubtitle}>Speak with our Customer Support </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="white" />
          </TouchableOpacity>

          {/* Fare Summary Section */}
          <View style={[styles.fareBreakdownCard, { marginBottom: 16 }]}>
            <Text style={styles.summaryTitle}>Fare Summary</Text>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabelSmall}>Trip Total</Text>
              <Text style={styles.fareValueSmall}>₹ {Number(ride.final_fare || ride.estimated_fare || 0).toFixed(2)}</Text>
            </View>

            {Number(ride.super_km_discount) > 0 && (
              <View style={[styles.fareRow, { marginTop: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.fareLabelSmall, { color: '#10b981', fontWeight: 'bold' }]}>Super KM Savings</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>PROMO</Text>
                  </View>
                </View>
                <Text style={[styles.fareValueSmall, { color: '#10b981', fontWeight: 'bold' }]}>- ₹ {Number(ride.super_km_discount).toFixed(2)}</Text>
              </View>
            )}

            {Number(ride.super_coins_applied) > 0 && (
              <View style={[styles.fareRow, { marginTop: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.fareLabelSmall, { color: '#F59E0B', fontWeight: 'bold' }]}>Super Coin Savings</Text>
                  <View style={[styles.savingsBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.savingsText, { color: '#B45309' }]}>COINS</Text>
                  </View>
                </View>
                <Text style={[styles.fareValueSmall, { color: '#F59E0B', fontWeight: 'bold' }]}>- ₹ {Number(ride.super_coins_applied).toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={styles.totalValueText}>₹ {Number(ride.rider_payable || ride.final_fare || 0).toFixed(2)}</Text>
            </View>

            {Number(ride.super_km_applied) > 0 && (
              <View style={styles.offerBadgeContainer}>
                <Text style={styles.offerText}>🚀 {ride.super_km_applied} KM applied from your Super KM balance</Text>
              </View>
            )}

            {Number(ride.super_coins_applied) > 0 && (
              <View style={[styles.offerBadgeContainer, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={[styles.offerText, { color: '#92400E' }]}>🪙 {Number(ride.super_coins_applied).toFixed(0)} Super Coins used for this ride</Text>
              </View>
            )}

            {ride.status === 'completed' && (
              <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0369A1', marginBottom: 8, textTransform: 'uppercase' }}>Rewards Earned</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#0369A1' }}>🪙 Super Coins (3%)</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0EA5E9' }}>+ {Math.floor((ride.final_fare || 0) * 0.03)} Coins</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#0369A1' }}>🚀 Super KM (5%)</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0EA5E9' }}>+ {(Number(ride.actual_distance_km || 0) * 0.05).toFixed(2)} KM</Text>
                </View>
              </View>
            )}
          </View>

          {ride.status === 'completed' && (
            <View style={{ backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FFE082' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>🪙</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#F57F17' }}>Ride Completed!</Text>
                  <Text style={{ color: '#F57F17', fontWeight: '500' }}>You earned {Math.floor((ride.final_fare || ride.finalFare || 0) * 0.03)} Super Coins!</Text>
                  {Number(ride.actual_distance_km || 0) > 0 && (
                    <Text style={{ color: '#0EA5E9', fontWeight: '500', fontSize: 13, marginTop: 2 }}>+ Earned {(Number(ride.actual_distance_km) * 0.05).toFixed(2)} Super KM distance reward!</Text>
                  )}
                </View>
              </View>

              {ride.driver_id && (
                <TouchableOpacity
                  style={{ backgroundColor: '#FF9800', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}
                  onPress={async () => {
                    try {
                      const { default: axiosClient } = await import('../../api/axiosClient');
                      await axiosClient.post('/users/favorites', { driver_id: ride.driver_id });
                      import('react-native').then(({ Alert }) => Alert.alert('Success', 'Added to favorite drivers!'));
                    } catch (e) {
                      import('react-native').then(({ Alert }) => Alert.alert('Error', 'Could not add favorite'));
                    }
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 8 }}>❤️</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Add Driver to Favorites</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {ride.status && ['PENDING', 'SEARCHING', 'ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS'].includes(ride.status.toUpperCase()) && (
            <TouchableOpacity
              style={styles.cancelActiveRideBtn}
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelActiveRideText}>Cancel Active Ride</Text>
            </TouchableOpacity>
          )}

        </View>



      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rideType: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: '#111827',
  },
  rideDate: {
    color: '#6B7280',
    marginVertical: 4,
  },
  pricezero: {
    color: 'red',
    textDecorationStyle: 'solid',

  },

  totalFare: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#10b981',
  },
  rideFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rideStatusContainer: {
    alignItems: 'center',
  },
  vehicleImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  vehicleEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedStatus: {
    backgroundColor: 'white',
  },
  cancelledStatus: {
    backgroundColor: 'white',
  },
  inProgressStatus: {
    backgroundColor: 'white',
  },
  acceptedStatus: {
    backgroundColor: 'white',
  },
  pendingStatus: {
    backgroundColor: 'white',
  },
  completedStatustext: {
    color: 'green',
    fontWeight: 'bold',
    backgroundColor: '#cce5cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    fontSize: 14,
  },
  cancelledStatustext: {
    color: 'red',
    fontWeight: 'bold',
    backgroundColor: '#ffcccc',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'capitalize',
    fontSize: 14,
  },
  inProgressStatustext: {
    color: 'blue',
    fontWeight: 'bold',
    backgroundColor: '#cce5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    fontSize: 14,
  },
  acceptedStatustext: {
    color: 'orange',
    fontWeight: 'bold',
    backgroundColor: '#ffe5cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    fontSize: 14,
  },
  pendingStatustext: {
    color: '#cccc00',
    fontWeight: 'bold',
    backgroundColor: '#ffffcc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    fontSize: 14,
  },

  addressDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  addressTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
    fontSize: 16,
  },
  rideId: {
    color: '#6b7280',
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  locationPinContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  startPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  dottedLine: {
    width: 1,
    height: 40,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginVertical: 4,
  },
  endPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: 'white',
  },
  addressContainer: {
    flex: 1,
  },
  address: {
    marginBottom: 24,
    color: '#374151',
    fontSize: 14,
  },
  rideStats: {
    color: '#6b7280',
    marginTop: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8e2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontWeight: 'bold',

    fontSize: 16,
    color: 'white',
  },
  helpSubtitle: {
    color: 'white',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
    fontSize: 16,
  },
  fareBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fareLabelSmall: {
    fontSize: 14,
    color: '#6B7280',
  },
  fareValueSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  savingsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  savingsText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  superKmHeaderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  superKmHeaderText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  offerBadgeContainer: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  offerText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimer: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  otpDetailContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  otpDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369A1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  otpDetailValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0EA5E9',
    letterSpacing: 4,
  },
  otpDetailSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  cancelActiveRideBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelActiveRideText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingDetailsScreen;
