import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../config/api';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  balance_after: number;
}

const WalletScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState({
    todaysEarnings: 0,
    balance: 0,
    reward_balance: 0,
    pending_platform_fees: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scrollY] = useState(new Animated.Value(0));

  const fetchWalletData = useCallback(async () => {
    try {
      const [walletResp, transResp] = await Promise.all([
        api.get('/payments/wallet'),
        api.get('/payments/wallet/transactions?limit=10'),
      ]);
      setWalletData({
        ...walletResp.data,
        pending_platform_fees: walletResp.data.pending_platform_fees || 0,
        reward_balance: walletResp.data.reward_balance || walletResp.data.super_km_balance || 0
      });
      setTransactions(transResp.data);
    } catch (error) {
      console.error('Wallet fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'FEE_DEDUCTION': return { name: 'arrow-down-circle', color: '#dc3545', iconGrp: Ionicons };
      case 'FEE_SETTLEMENT': return { name: 'checkmark-circle', color: '#28a745', iconGrp: Ionicons };
      case 'RIDE_EARNING': return { name: 'cash-outline', color: '#fe7009', iconGrp: Ionicons };
      case 'SUPER_KM_COMPENSATION': return { name: 'gift-outline', color: '#0ea5e9', iconGrp: Ionicons };
      case 'WITHDRAWAL': return { name: 'wallet-outline', color: '#dc3545', iconGrp: Ionicons };
      default: return { name: 'swap-horizontal', color: '#718096', iconGrp: Ionicons };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [240, 180],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fe7009" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient for the whole screen */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#1a1a1a', '#2d3748']}
          style={styles.bgGradient}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('SettlementHistory')}>
            <Ionicons name="time-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Paging Balance Cards */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {/* Card 1: Today's Earnings (Summary) */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['#fe7009', '#f35d07', '#e55a00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.balanceInfo}>
                      <Text style={styles.balanceLabel}>Today's Earnings</Text>
                      <Text style={styles.balanceValue}>₹{walletData.todaysEarnings ? Number(walletData.todaysEarnings).toFixed(2) : '0.00'}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 }}>Total made from all sources today</Text>
                  </View>
                  <MaterialCommunityIcons name="trending-up" size={30} color="rgba(255,255,255,0.4)" />
                </View>

                <View style={styles.cardFooter}>
                   <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>DAILY SUMMARY</Text>
                   </View>
                   <MaterialCommunityIcons name="calendar-clock" size={40} color="rgba(255,255,255,0.2)" />
                </View>
              </LinearGradient>
            </View>

            {/* Card 2: Company Coverage (Super KM Compensation) */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['#6366f1', '#4f46e5', '#3730a3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.balanceInfo}>
                      <Text style={styles.balanceLabel}>Company Coverage</Text>
                      <Text style={styles.balanceValue}>₹{(Number(walletData.reward_balance || 0)).toFixed(2)}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 }}>Earned from Super KM trip discounts</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.withdrawBtn, { backgroundColor: '#fff' }]}
                    onPress={() => navigation.navigate('Withdraw')}
                  >
                      <Text style={[styles.withdrawText, { color: '#4f46e5' }]}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cardFooter}>
                   <View style={[styles.tagBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={styles.tagText}>SUPER KM BONUS</Text>
                   </View>
                   <MaterialCommunityIcons name="shield-check-outline" size={40} color="rgba(255,255,255,0.3)" />
                </View>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Indicators */}
          <View style={styles.indicatorContainer}>
             <View style={[styles.indicator, { width: 20, backgroundColor: '#fe7009' }]} />
             <View style={[styles.indicator, { backgroundColor: '#4a5568' }]} />
          </View>

          {/* Dues Sheet */}
          <View style={styles.duesContainer}>
            <View style={styles.duesHeader}>
              <Text style={styles.sectionTitle}>Service Tax Dues</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{walletData.pending_platform_fees > 100 ? 'Payment Required' : 'Active'}</Text>
              </View>
            </View>

            <View style={styles.duesCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.duesLabel}>Pending Service Tax</Text>
                <Text style={[styles.duesValue, { color: walletData.pending_platform_fees > 100 ? '#dc3545' : '#2d3748' }]}>
                  ₹{Number(walletData.pending_platform_fees).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.payNowBtn, walletData.pending_platform_fees <= 0 && styles.payNowDisabled]}
                onPress={() => navigation.navigate('SettleDues')}
                disabled={walletData.pending_platform_fees <= 0}
              >
                <Text style={styles.payNowText}>Settle Dues</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {walletData.pending_platform_fees > 100 && (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle" size={18} color="#dc3545" />
                <Text style={styles.alertText}>Your account is restricted. Settle dues to go online.</Text>
              </View>
            )}
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsContainer}>
            <View style={styles.duesHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SettlementHistory')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt-text-outline" size={60} color="#cbd5e0" />
                <Text style={styles.emptyText}>No recent transactions</Text>
              </View>
            ) : (
              transactions.map((item) => {
                const icon = getTransactionIcon(item.type);
                return (
                  <View key={item.id} style={styles.transactionItem}>
                    <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
                      <icon.iconGrp name={icon.name as any} size={20} color={icon.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.transDesc}>{item.description}</Text>
                      <Text style={styles.transDate}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.transAmount, { color: ['FEE_SETTLEMENT', 'RIDE_EARNING', 'SUPER_KM_COMPENSATION'].includes(item.type) ? '#28a745' : '#dc3545' }]}>
                        {['FEE_SETTLEMENT', 'RIDE_EARNING', 'SUPER_KM_COMPENSATION'].includes(item.type) ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text style={styles.balanceAfter}>₹{item.balance_after.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  bgGradient: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  scrollContent: { paddingBottom: 40 },
  balanceCardContainer: { padding: 20, paddingTop: 10 },
  cardsScroll: { paddingLeft: 20, paddingRight: 10, paddingVertical: 10 },
  cardWrapper: { width: width - 50, marginRight: 15 },
  balanceCard: {
    borderRadius: 25,
    padding: 25,
    height: 180,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceInfo: { flex: 1 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  withdrawText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagBadge: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  indicator: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginHorizontal: 3 },
  duesContainer: { paddingHorizontal: 20, marginTop: 10 },
  duesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statusPill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  duesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  duesLabel: { color: '#718096', fontSize: 14, fontWeight: '500' },
  duesValue: { fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  payNowBtn: {
    backgroundColor: '#fe7009',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  payNowDisabled: { backgroundColor: '#cbd5e0' },
  payNowText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
  },
  alertText: { color: '#fc8181', fontSize: 12, marginLeft: 8, flex: 1 },
  transactionsContainer: { paddingHorizontal: 20, marginTop: 30 },
  viewAll: { color: '#fe7009', fontWeight: 'bold' },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
  },
  iconBox: { padding: 10, borderRadius: 12 },
  transDesc: { color: '#fff', fontSize: 14, fontWeight: '600' },
  transDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  transAmount: { fontSize: 16, fontWeight: 'bold' },
  balanceAfter: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 10 },
});

export default WalletScreen;
