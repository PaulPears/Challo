import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const RideDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { ride }: any = route.params;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isCompleted = ride.status === 'completed';
  const isCancelled = ride.status === 'cancelled';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#f0fdf4' : '#fef2f2' }]}>
            <Text style={[styles.statusText, { color: isCompleted ? '#166534' : '#991b1b' }]}>
              {ride.status ? ride.status.toUpperCase() : 'PENDING'}
            </Text>
          </View>
          <Text style={styles.dateTimeText}>{formatDate(ride.created_at)}</Text>
          <Text style={styles.timeText}>{formatTime(ride.created_at)}</Text>

          <View style={styles.divider} />

          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹{ride.final_fare || ride.estimated_fare || 0}</Text>
          <Text style={styles.paymentMethod}>Paid via {ride.payment_method?.toUpperCase() || 'CASH'}</Text>
        </View>

        {/* Route Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route Information</Text>
        </View>
        <View style={styles.routeCard}>
          <View style={styles.routeContainer}>
            <View style={styles.pathContainer}>
              <View style={[styles.dot, { backgroundColor: '#fe7009' }]} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: '#111827' }]} />
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>PICKUP</Text>
                <Text style={styles.addressText}>{ride.pickup_address}</Text>
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>DROP-OFF</Text>
                <Text style={styles.addressText}>{ride.dropoff_address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="resize-outline" size={20} color="#6b7280" />
            <Text style={styles.statValue}>{ride.actual_distance_km || ride.estimated_distance_km || '--'} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <Text style={styles.statValue}>{ride.actual_duration_min || ride.estimated_duration_min || '--'} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="car-speed-limiter" size={20} color="#6b7280" />
            <Text style={styles.statValue}>{ride.vehicle_type?.toUpperCase() || 'CAB'}</Text>
            <Text style={styles.statLabel}>Vehicle Type</Text>
          </View>
        </View>

        {/* Financial Breakdown (Only for completed rides) */}
        {isCompleted && (() => {
          const fare = Number(ride.final_fare || ride.estimated_fare || 0);
          const gst = Number(ride.gst_amount) > 0 ? Number(ride.gst_amount) : (fare * 0.05);
          const netEarnings = Number(ride.driver_earnings) > 0 ? Number(ride.driver_earnings) : (fare - gst);

          return (
            <View key="financial-breakdown">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Breakdown</Text>
              </View>
              <View style={styles.earningsCard}>
                <View style={{ marginTop: 5, marginBottom: 10 }}>
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', letterSpacing: 1 }}>
                     {Number(ride.company_payable) > 0 ? 'PAYMENT SOURCES (COMMISSION FREE) 🚀' : 'TRIP EARNINGS'}
                   </Text>
                </View>

                {/* Source 1: Rider Payment */}
                <View style={[styles.breakdownRow, { padding: 15, backgroundColor: '#fff7ed', borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#fe7009' }]}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 14, color: '#9a3412', fontWeight: '900', textTransform: 'uppercase' }}>
                       {Number(ride.company_payable) > 0 ? 'Collected from Rider' : 'Cash/Online Received'}
                     </Text>
                     <Text style={{ fontSize: 11, color: '#c2410c', marginTop: 2 }}>
                       {Number(ride.company_payable) > 0 ? 'Amount rider paid after discount' : 'Full trip value received'}
                     </Text>
                   </View>
                   <Text style={{ fontSize: 24, fontWeight: '900', color: '#fe7009' }}>₹{Number(ride.rider_payable || ride.final_fare).toFixed(2)}</Text>
                </View>

                {/* Source 2: Platform Bonus */}
                {Number(ride.company_payable) > 0 && (
                  <View style={[styles.breakdownRow, { marginTop: 12, padding: 15, backgroundColor: '#f0f9ff', borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#0ea5e9' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: '#0369a1', fontWeight: '900', textTransform: 'uppercase' }}>Platform Reward</Text>
                      <Text style={{ fontSize: 11, color: '#0ea5e9', marginTop: 2 }}>Added to Rewards Wallet (Bonus)</Text>
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#0ea5e9' }}>₹{Number(ride.company_payable).toFixed(2)}</Text>
                  </View>
                )}

                <View style={[styles.breakdownRow, { marginTop: 20, paddingHorizontal: 10 }]}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Actual Trip Fare (Total Value - Tab)</Text>
                    <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: 'bold' }}>₹{Number(ride.final_fare || ride.estimated_fare || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.earningsDivider} />

                <View style={styles.breakdownRow}>
                  <View>
                    <Text style={styles.breakdownLabel}>Taxes (GST 5%)</Text>
                    <Text style={styles.breakdownSubLabel}>Calculated on full trip value (Tab)</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>- ₹{gst.toFixed(2)}</Text>
                </View>

                <View style={styles.earningsDivider} />

                <View style={styles.totalEarningsRow}>
                  <Text style={styles.totalEarningsLabel}>Your Net Earnings</Text>
                  <Text style={styles.totalEarningsValue}>₹{netEarnings.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Customer Details */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rider Details</Text>
        </View>
        <View style={styles.riderCard}>
          <View style={styles.riderInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.riderName}>{ride.rider?.name || 'Customer'}</Text>
              <Text style={styles.riderRating}>⭐ 4.8 Rider Rating</Text>
            </View>
          </View>
          {ride.rider?.phoneNumber && (
             <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={18} color="#fe7009" />
             </TouchableOpacity>
          )}
        </View>

        {/* Cancellation details (if applicable) */}
        {isCancelled && ride.cancellation_reason && (
           <View style={styles.warningCard}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <View style={styles.warningTextContainer}>
                 <Text style={styles.warningTitle}>Cancellation Reason</Text>
                 <Text style={styles.warningText}>{ride.cancellation_reason}</Text>
              </View>
           </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Static Footer */}
      <View style={styles.footer}>
        <Text style={styles.rideIdText}>Ride ID: {ride.id.substring(0, 13).toUpperCase()}</Text>
        <Text style={styles.disclaimerText}>Help with this ride? Contact Support</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dateTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  fareLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fareAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  pathContainer: {
    alignItems: 'center',
    paddingTop: 6,
    marginRight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    height: 60,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  addressContainer: {
    flex: 1,
  },
  addressBlock: {
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    elevation: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  breakdownSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  totalEarningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalEarningsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalEarningsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fe7009',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    elevation: 2,
    marginBottom: 24,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  riderRating: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5ed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  rideIdText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#fe7009',
    fontWeight: '700',
  },
});

export default RideDetailsScreen;
