import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../config/api';

interface Settlement {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  SUCCESS:   { color: '#28a745', bg: '#f0fff4', icon: 'check-circle'      as const, label: 'Success'   },
  PENDING:   { color: '#fe7009', bg: '#fff5ed', icon: 'clock-outline'     as const, label: 'Pending'   },
  FAILED:    { color: '#dc3545', bg: '#fff5f5', icon: 'close-circle'      as const, label: 'Failed'    },
  CANCELLED: { color: '#6c757d', bg: '#f8f9fa', icon: 'cancel'            as const, label: 'Cancelled' },
};

const SettlementHistoryScreen = ({ navigation }: { navigation: any }) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/payments/settlements');
      setSettlements(res.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not load settlement history.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderCard = (item: Settlement) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    return (
      <View key={item.id} style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.amount}>₹{Number(item.amount).toFixed(2)}</Text>
        </View>

        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>

        <View style={styles.idRow}>
          <MaterialCommunityIcons name="identifier" size={14} color="#aaa" />
          <Text style={styles.idText} numberOfLines={1}>Order: {item.razorpay_order_id}</Text>
        </View>
        {item.razorpay_payment_id && (
          <View style={styles.idRow}>
            <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#aaa" />
            <Text style={styles.idText} numberOfLines={1}>Payment: {item.razorpay_payment_id}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#fe7009" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchHistory()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} colors={['#fe7009']} />
          }
        >
          {settlements.length === 0 ? (
            <View style={styles.centeredContainer}>
              <MaterialCommunityIcons name="wallet-outline" size={72} color="#cbd5e0" />
              <Text style={styles.emptyTitle}>No Settlements Yet</Text>
              <Text style={styles.emptySubtitle}>Your Razorpay payment history will appear here once you settle dues.</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{settlements.length} transaction{settlements.length !== 1 ? 's' : ''}</Text>
                <Text style={styles.summaryTotal}>
                  Total Paid: ₹{settlements.filter(s => s.status === 'SUCCESS').reduce((acc, s) => acc + Number(s.amount), 0).toFixed(2)}
                </Text>
              </View>
              {settlements.map(renderCard)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#f8f9fa' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:            { padding: 4 },
  headerTitle:        { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  centeredContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText:        { marginTop: 12, color: '#666', fontSize: 14 },
  errorText:          { color: '#dc3545', fontSize: 15, textAlign: 'center', marginTop: 12 },
  retryBtn:           { marginTop: 20, backgroundColor: '#fe7009', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  retryText:          { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyTitle:         { fontSize: 22, fontWeight: '800', color: '#2d3748', marginTop: 20, textAlign: 'center' },
  emptySubtitle:      { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  list:               { padding: 20, paddingBottom: 40, flexGrow: 1 },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryText:        { color: '#718096', fontSize: 13, fontWeight: '600' },
  summaryTotal:       { color: '#28a745', fontSize: 13, fontWeight: '800' },
  card:               { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, borderLeftWidth: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusLabel:        { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  amount:             { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  dateText:           { fontSize: 12, color: '#a0aec0', fontWeight: '500', marginBottom: 10 },
  idRow:              { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  idText:             { fontSize: 11, color: '#a0aec0', marginLeft: 6, fontFamily: 'monospace', flex: 1 },
});

export default SettlementHistoryScreen;
