import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format time helper
const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

interface Ride {
  id: string;
  created_at: string;
  final_fare?: number;
  estimated_fare?: number;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  actual_distance_km?: number;
  actual_duration_min?: number;
  super_km_applied?: number;
  company_payable?: number;
}

const RideItem = ({ item }: { item: Ride }) => {
  const navigation = useNavigation<any>();
  const displayDistance = item.actual_distance_km || item.estimated_distance_km;
  const displayDuration = item.actual_duration_min || item.estimated_duration_min;

  return (
    <TouchableOpacity 
      style={styles.rideCard} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RideDetails', { ride: item })}
    >
      {(Number(item.company_payable) > 0 || Number(item.super_km_applied) > 0) && (
         <View style={styles.platformRewardBadge}>
            <Text style={styles.platformRewardText}>Platform Reward Coverage 🚀</Text>
         </View>
      )}
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>{formatDate(item.created_at)}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.fareLabel}>Final Fare</Text>
          <Text style={styles.rideFare}>₹{item.final_fare || item.estimated_fare || 0}</Text>
        </View>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.path}>
          <View style={[styles.pathDot, { backgroundColor: '#fe7009' }]} />
          <View style={styles.pathLine} />
          <View style={[styles.pathDot, { backgroundColor: '#1a202c' }]} />
        </View>
        <View style={styles.locations}>
          <Text style={styles.locationText} numberOfLines={1}>{item.pickup_address}</Text>
          <Text style={styles.locationText} numberOfLines={1}>{item.dropoff_address}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={16} color="#718096" />
          <Text style={styles.statText}>{displayDistance ? `${displayDistance} km` : '--'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#718096" />
          <Text style={styles.statText}>{displayDuration ? `${displayDuration} min` : '--'}</Text>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <Text style={styles.rideTime}>{formatTime(item.created_at)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.rideStatus, {
            color: item.status === 'completed' ? '#28a745' :
              item.status === 'cancelled' ? '#dc3545' : '#4a5568'
          }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e0" style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MyRidesScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('completed');
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await api.get('/rides/driver-history');
      console.log('Fetched rides:', response.data.length);
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedRides = rides.filter(ride => ride.status === 'completed');
  const cancelledRides = rides.filter(ride => ride.status === 'cancelled');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rides</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fe7009" />
        </View>
      ) : (
        <>
          <FlatList
            data={activeTab === 'completed' ? completedRides : cancelledRides}
            renderItem={({ item }) => <RideItem item={item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No {activeTab} rides found.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fe7009',
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    color: '#4a5568',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  platformRewardBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  platformRewardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  rideFare: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f2f5',
  },
  path: {
    alignItems: 'center',
    marginRight: 15,
  },
  pathDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pathLine: {
    height: 20,
    width: 1.5,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  locations: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 15,
    color: '#4a5568',
    marginVertical: 4,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
  },
  rideTime: {
    fontSize: 15,
    fontWeight: '500',
    color: '#718096',
  },
  rideStatus: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a0aec0',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
    paddingHorizontal: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    marginLeft: 6,
    color: '#718096',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MyRidesScreen;
