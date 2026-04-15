import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { rideAPI } from '../../api/rideAPI';

const BookingDetailsScreen = ({ navigation, route }: any) => {
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

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.rideType}>{(ride.vehicle_type || ride.vehicleType || 'Ride').replace(/_/g, ' ')} Ride</Text>
              <Text style={styles.rideDate}>{
                new Date(ride.created_at || ride.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' +
                new Date(ride.created_at || ride.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              }</Text>
              <Text style={styles.rideFare}>Estimated Fare: ₹ {ride.final_fare || ride.finalFare || ride.estimated_fare || ride.fare} </Text>
              
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
                      (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('bike') ? require('../../../assets/bike_icon.png') :
                        (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('auto') ? require('../../../assets/auto_icon.png') :
                          (ride.vehicle_type || ride.vehicleType)?.toLowerCase().includes('parcel') ? require('../../../assets/parcel_icon.png') :
                            require('../../../assets/cab_icon.png')
                }
                style={{ width: 60, height: 60, marginBottom: 8 }}
                resizeMode="contain"
              />
              <View style={[styles.statusBadge,
              ride.status === 'completed' ? styles.completedStatus :
                ride.status === 'cancelled' ? styles.cancelledStatus :
                  ride.status === 'in_progress' ? styles.inProgressStatus :
                    ride.status === 'accepted' ? styles.acceptedStatus :
                      styles.pendingStatus
              ]}>
                <Text style={[
                  ride.status === 'completed' ? styles.completedStatustext :
                    ride.status === 'cancelled' ? styles.cancelledStatustext :
                      ride.status === 'in_progress' ? styles.inProgressStatustext :
                        ride.status === 'accepted' ? styles.acceptedStatustext :
                          styles.pendingStatustext
                ]}>{ride.status?.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>

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

          {ride.status === 'completed' && (
            <View style={{ marginTop: 16, backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FFE082' }}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                 <Text style={{fontSize: 24, marginRight: 8}}>🪙</Text>
                 <View>
                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#F57F17' }}>Ride Completed!</Text>
                   <Text style={{ color: '#F57F17', fontWeight: '500' }}>You earned {Math.floor((ride.finalFare || ride.fare || 0) * 0.1)} Super Coins!</Text>
                 </View>
              </View>
              
              {ride.driver_id && (
                <TouchableOpacity 
                   style={{ backgroundColor: '#FF9800', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}
                   onPress={async () => {
                     try {
                        const { default: axiosClient } = await import('../../api/axiosClient');
                        await axiosClient.post('/users/favorites', { driver_id: ride.driver_id });
                        import('react-native').then(({Alert}) => Alert.alert('Success', 'Added to favorite drivers!'));
                     } catch(e) {
                        import('react-native').then(({Alert}) => Alert.alert('Error', 'Could not add favorite'));
                     }
                   }}
                >
                  <Text style={{fontSize: 16, marginRight: 8}}>❤️</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Add Driver to Favorites</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>



        <Text style={styles.disclaimer}>RideAndhra serves solely as a facilitator between you and independent Captains. The fare displayed is an estimate; the final fare is subject to change.</Text>
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
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,

  },

  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  receiptButtonText: {
    marginLeft: 8,
    color: '#ff8e2e',
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});

export default BookingDetailsScreen;
