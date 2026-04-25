import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rideAPI } from '../../api/rideAPI';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

const BookingCard = ({ item, navigation }: any) => {
  const getVehicleImage = (vehicleType: string) => {
    const type = (vehicleType || '').toLowerCase();
    if (type.includes('cab') || type.includes('car')) return require('../../../assets/cab_icon.png');
    if (type.includes('bike_lite') || type.includes('bike-lite')) return require('../../../assets/bike_lite_icon.png');
    if (type.includes('luxury_bike') || type.includes('premium')) return require('../../../assets/premium_bike.png');
    if (type.includes('bike')) return require('../../../assets/bike_icon.png');
    if (type.includes('auto')) return require('../../../assets/auto_icon.png');
    if (type.includes('parcel')) return require('../../../assets/parcel_icon.png');
    return require('../../../assets/cab_icon.png');
  };

  const status = (item.status || '').toUpperCase();
  const showOtp = status === 'SEARCHING' || status === 'ACCEPTED' || status === 'ARRIVED' || status === 'PENDING';

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookingDetails', { rideId: item.id })}
      activeOpacity={0.3}
    >
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.rideType}>{(item.vehicle_type || item.vehicleType || 'Ride').replace(/_/g, ' ')}</Text>
            <Text style={styles.rideDate}>{
              new Date(item.created_at || item.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' +
              new Date(item.created_at || item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            }</Text>
          </View>
          <View style={styles.rideStatusContainer}>
            <Image source={getVehicleImage(item.vehicle_type || item.vehicleType)} style={{ width: 40, height: 40, marginBottom: 8 }} resizeMode="contain" />
            <Text style={[styles.statusBadge,
            status === 'COMPLETED' ? styles.completedStatus :
              status === 'CANCELLED' ? styles.cancelledStatus :
                status === 'IN_PROGRESS' || status === 'STARTED' ? styles.inProgressStatus :
                  status === 'ACCEPTED' ? styles.acceptedStatus :
                    styles.pendingStatus
            ]}>
              {status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationPinContainer}>
            <View style={styles.startPin} />
            <View style={styles.dottedLine} />
            <View style={styles.endPin} />
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.address} numberOfLines={1}>{item.pickup_address || item.pickupLocation || 'N/A'}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.dropoff_address || item.dropoffLocation || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.rideFare}>₹{Number(item.rider_payable || item.riderPayable || item.fare || 0).toFixed(2)}</Text>
            {showOtp && item.otp && (
              <View style={styles.otpListBadge}>
                 <Text style={styles.otpListLabel}>TRIP PIN:</Text>
                 <Text style={styles.otpListValue}>{item.otp}</Text>
              </View>
            )}
            {Number(item.super_km_applied) > 0 && (
              <View style={styles.listSavingsBadge}>
                 <Text style={styles.listSavingsText}>Super KM Applied ✨</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.reportButton}>
            <FontAwesome name="flag" size={16} color="#ef4444" />
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const BookingsScreen = ({ navigation }: any) => {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const myBookings = await rideAPI.getMyBookings();
        console.log('DEBUG: Fetched bookings count:', myBookings?.length);
        if (myBookings && myBookings.length > 0) {
          console.log('DEBUG: First booking data structure:', JSON.stringify(myBookings[0], null, 2));
        }
        setBookings(myBookings);
      } catch (error) {
        console.error('DEBUG: Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My History</Text>
        <View style={{ flex: 1 }} />

      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard item={item} navigation={navigation} />}
        contentContainerStyle={styles.listContainer}
      />
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
    marginRight: 16,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'grey',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  rideDate: {
    color: '#6B7280',
    fontSize: 12,
    marginVertical: 4,
  },
  rideStatusContainer: {
    alignItems: 'center',
  },
  vehicleEmojiIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  completedStatus: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  cancelledStatus: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  inProgressStatus: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  acceptedStatus: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
  },
  pendingStatus: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  routeContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  locationPinContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  startPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  dottedLine: {
    width: 1,
    height: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginVertical: 2,
  },
  endPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  addressContainer: {
    flex: 1,
  },
  address: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,

    paddingTop: 16,
    marginTop: 16,
  },
  rideFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  listSavingsBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  listSavingsText: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButtonText: {
    marginLeft: 8,
    color: '#ef4444',
    fontWeight: '600',
  },
  otpListBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  otpListLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369A1',
    marginRight: 6,
  },
  otpListValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0EA5E9',
    letterSpacing: 1,
  },
});

export default BookingsScreen;