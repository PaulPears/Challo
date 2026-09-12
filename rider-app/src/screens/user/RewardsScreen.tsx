import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useUserStore from '../../store/userStore';
import { rideAPI } from '../../api/rideAPI';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';

const { width } = Dimensions.get('window');

type RewardsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Rewards'>;

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
          const status = (ride.status || '').toUpperCase();
          if (status === 'COMPLETED') {
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

  // Milestone logic (visual only now)
  const NEXT_MILESTONE = totalKm > 500 ? 1000 : totalKm > 100 ? 500 : 100;
  const progressPercentage = Math.min((totalKm / NEXT_MILESTONE) * 100, 100);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E5A915" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Super Rewards</Text>
        <TouchableOpacity onPress={fetchRidesData}>
          <Ionicons name="refresh" size={22} color="#4b5563" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Super Coins Banner */}
        <LinearGradient
          colors={['#FFD54F', '#FF9800']}
          style={styles.rewardCard}
        >
          <View style={styles.cardOverlay}>
            <MaterialCommunityIcons name="star-circle" size={120} color="rgba(255,255,255,0.1)" style={styles.cardBgIcon} />
          </View>
          
          <View style={styles.pointsBadge}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#FF9800" />
            <Text style={styles.pointsText}>Super Coins</Text>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.balanceValue}>{user?.super_coins_balance || 0}</Text>
          </View>
          <Text style={styles.balanceLabel}>Available for instant discount</Text>

          <View style={styles.cardFooter}>
            <Ionicons name="information-circle-outline" size={16} color="white" />
            <Text style={styles.footerText}>1 Super Coin = ₹1 Discount</Text>
          </View>
        </LinearGradient>

        {/* Super Kilometer Meter Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Super Kilometer Meter</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE TRACKING</Text>
          </View>
        </View>

        <LinearGradient
          colors={['#00B4DB', '#0083B0']}
          style={styles.meterCard}
        >
          <View style={styles.meterHeader}>
            <View style={styles.meterIconContainer}>
               <MaterialCommunityIcons name="speedometer" size={32} color="white" />
            </View>
            <View style={styles.meterTitleContainer}>
               <Text style={styles.meterTitle}>Distance Travelled</Text>
               <Text style={styles.meterSubtitle}>Only completed rides count</Text>
            </View>
            <View style={styles.kmBadge}>
               <Text style={styles.kmBadgeText}>TOTAL</Text>
            </View>
          </View>

          <View style={styles.distanceDisplay}>
            <Text style={styles.totalKmValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.totalKmUnit}>KM</Text>
          </View>

          <View style={styles.meterProgressContainer}>
            <View style={styles.meterProgressBackground}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.meterProgressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <View style={styles.meterTicks}>
               <Text style={styles.tickText}>0</Text>
               <Text style={styles.tickText}>{NEXT_MILESTONE / 2}</Text>
               <Text style={styles.tickText}>{NEXT_MILESTONE}</Text>
            </View>
          </View>

          <View style={styles.superKmBalanceCard}>
             <View style={styles.superKmInfo}>
                <Text style={styles.superKmLabel}>Super KM Balance</Text>
                <Text style={styles.superKmValue}>{user?.super_km_balance?.toFixed(2) || '0.00'} KM</Text>
             </View>
             <View style={styles.superKmAction}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
                <Text style={styles.superKmActionText}>VERIFIED</Text>
             </View>
          </View>
        </LinearGradient>

        {/* How to earn? */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earning Rules</Text>
        </View>

        <View style={styles.rulesList}>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIconBox, { backgroundColor: '#FFF8E1' }]}>
               <MaterialCommunityIcons name="cash-plus" size={20} color="#FFA000" />
            </View>
            <View style={styles.ruleContent}>
               <Text style={styles.ruleTitle}>3% Super Coins</Text>
               <Text style={styles.ruleDescription}>Earn 3% of trip fare as Super Coins on every ride.</Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={[styles.ruleIconBox, { backgroundColor: '#E1F5FE' }]}>
               <MaterialCommunityIcons name="map-marker-distance" size={20} color="#0288D1" />
            </View>
            <View style={styles.ruleContent}>
               <Text style={styles.ruleTitle}>5% Super KM</Text>
               <Text style={styles.ruleDescription}>Get 5% of your travelled distance added to Super KM balance.</Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={[styles.ruleIconBox, { backgroundColor: '#E8F5E9' }]}>
               <MaterialCommunityIcons name="ticket-percent" size={20} color="#388E3C" />
            </View>
            <View style={styles.ruleContent}>
               <Text style={styles.ruleTitle}>Direct Discounts</Text>
               <Text style={styles.ruleDescription}>Use Super KM to pay for future rides directly from the wallet.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rewardCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverlay: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  cardBgIcon: {
    opacity: 0.2,
  },
  pointsBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 10,
    borderRadius: 12,
  },
  footerText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  meterCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#0083B0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  meterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meterTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  meterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  meterSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  kmBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kmBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  totalKmValue: {
    fontSize: 64,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -2,
  },
  totalKmUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 8,
  },
  meterProgressContainer: {
    marginBottom: 24,
  },
  meterProgressBackground: {
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  meterProgressFill: {
    height: '100%',
    borderRadius: 7,
  },
  meterTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  tickText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  superKmBalanceCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  superKmInfo: {
    flex: 1,
  },
  superKmLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  superKmValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0083B0',
    marginTop: 2,
  },
  superKmAction: {
    alignItems: 'center',
  },
  superKmActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4CAF50',
    marginTop: 2,
  },
  rulesList: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ruleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ruleDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
});

export default RewardsScreen;
