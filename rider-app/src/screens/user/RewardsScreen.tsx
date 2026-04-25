import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useUserStore from '../../store/userStore';
import { rideAPI } from '../../api/rideAPI';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';

type RewardsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Rewards'>;

const FREE_RIDE_MILESTONE_KM = 100; // e.g., 100km total = 1 free ride

const RewardsScreen = ({ navigation }: { navigation: RewardsScreenNavigationProp }) => {
  const { user, fetchUserProfile } = useUserStore();
  const [totalKm, setTotalKm] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchRidesData();
  }, []);

  const fetchRidesData = async () => {
    try {
      setLoading(true);
      const rides = await rideAPI.getMyBookings();
      
      // Calculate total kilometers from completed rides
      let kmSum = 0;
      if (Array.isArray(rides)) {
        rides.forEach(ride => {
          if (ride.status === 'COMPLETED' || ride.status === 'completed') {
            const distance = parseFloat(ride.actual_distance_km || ride.estimated_distance_km || '0');
            if (!isNaN(distance)) {
              kmSum += distance;
            }
          }
        });
      }
      setTotalKm(kmSum);
    } catch (error) {
      console.error('Failed to fetch rides for rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const freeRidesAvailable = Math.floor(totalKm / FREE_RIDE_MILESTONE_KM);
  const kmTowardsNextMilestone = totalKm % FREE_RIDE_MILESTONE_KM;
  const progressPercentage = (kmTowardsNextMilestone / FREE_RIDE_MILESTONE_KM) * 100;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF5722" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Free Rides</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Super Coins Banner */}
        <LinearGradient
          colors={['#FFD54F', '#FFB300']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardsCard}
        >
          <View style={styles.pointsBadge}>
            <MaterialCommunityIcons name="star-four-points" size={20} color="#FF9800" />
            <Text style={styles.pointsText}>Super Coins</Text>
          </View>
          <Text style={styles.balanceText}>{user?.super_coins_balance || 0}</Text>
          <Text style={styles.balanceSubtext}>Total Available Coins</Text>

          <View style={styles.infoRow}>
            <FontAwesome name="info-circle" size={16} color="white" />
            <Text style={styles.infoText}>Use coins at checkout to reduce fare (1 Coin = ₹1)</Text>
          </View>
        </LinearGradient>

        {/* Milestone Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Milestone Rewards</Text>
        </View>

        <View style={styles.milestoneCard}>
          <View style={styles.milestoneHeader}>
             <MaterialCommunityIcons name="road-variant" size={28} color="#FF5722" />
             <View style={styles.milestoneTextContainer}>
                <Text style={styles.milestoneTitle}>Free Ride Progress</Text>
                <Text style={styles.milestoneSub}>Unlock a free ride every {FREE_RIDE_MILESTONE_KM} km!</Text>
             </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>{kmTowardsNextMilestone.toFixed(1)} km traveled</Text>
              <Text style={styles.progressLabel}>{FREE_RIDE_MILESTONE_KM} km</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressRemaining}>
              {(FREE_RIDE_MILESTONE_KM - kmTowardsNextMilestone).toFixed(1)} km more to your next free ride!
            </Text>
          </View>

          <View style={styles.freeRidesContainer}>
            <MaterialCommunityIcons name="ticket-percent" size={24} color="#4CAF50" />
            <Text style={styles.freeRidesText}>
              Available Free Rides: <Text style={styles.freeRidesCount}>{freeRidesAvailable}</Text>
            </Text>
          </View>
        </View>

        {/* How to earn */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How to earn?</Text>
        </View>

        <View style={styles.rulesCard}>
          <View style={styles.ruleItem}>
            <View style={styles.ruleIconContainer}>
               <FontAwesome name="car" size={16} color="#FF5722" />
            </View>
            <Text style={styles.ruleText}>Complete rides to earn 3% cashback as Super Coins.</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={styles.ruleIconContainer}>
               <MaterialCommunityIcons name="map-marker-distance" size={18} color="#FF5722" />
            </View>
            <Text style={styles.ruleText}>Earn 5% of your trip distance back as Super KM balance!</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={styles.ruleIconContainer}>
               <MaterialCommunityIcons name="road" size={18} color="#FF5722" />
            </View>
            <Text style={styles.ruleText}>Every kilometer traveled counts towards your milestone.</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIconContainer, { borderBottomWidth: 0 }]}>
               <FontAwesome name="gift" size={16} color="#FF5722" />
            </View>
            <Text style={styles.ruleText}>Reach the km milestone to unlock completely free rides!</Text>
          </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  rewardsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  pointsBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsText: {
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  balanceText: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  milestoneCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  milestoneTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  milestoneSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5722',
    borderRadius: 6,
  },
  progressRemaining: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  freeRidesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  freeRidesText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  freeRidesCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rulesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ruleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});

export default RewardsScreen;
