import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, StatusBar,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../config/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ICON_MAP: Record<string, { name: string; color: string }> = {
  ride_request:  { name: 'motorbike', color: '#fe7009' },
  ride_accepted: { name: 'check-circle-outline', color: '#28a745' },
  ride_completed:{ name: 'flag-checkered', color: '#28a745' },
  payment:       { name: 'wallet-outline', color: '#4a90d9' },
  promotion:     { name: 'gift-outline', color: '#e74c9e' },
  system:        { name: 'cog-outline', color: '#718096' },
};

const NotificationsScreen = ({ navigation }: { navigation: any }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const response = await api.get('/notifications?limit=50');
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.warn('[Notifications] Fetch failed:', err);
      if (!silent) setError(true);
      // Show empty list rather than crashing
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) { /* best-effort */ }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.is_read) return;
    try {
      await api.patch(`/notifications/${item.id}/mark-read`);
      setNotifications(prev =>
        prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    } catch (_) { /* best-effort */ }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (_) { return ''; }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const iconInfo = ICON_MAP[item.type] || ICON_MAP.system;
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBubble, { backgroundColor: iconInfo.color + '15' }]}>
            <MaterialCommunityIcons name={iconInfo.name as any} size={22} color={iconInfo.color} />
          </View>
          <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody}>{item.message}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="bell-outline" size={64} color="#fe7009" />
      </View>
      <Text style={styles.emptyTitle}>No Notifications Yet</Text>
      <Text style={styles.emptySubtitle}>
        We'll notify you about ride requests, earnings, and platform updates right here.
      </Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fe7009" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleMarkAllRead}>
            <Text style={styles.clearText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#fe7009']} tintColor="#fe7009" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 24, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#f1f1f1',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  clearButton: { padding: 8 },
  clearText: { color: '#fe7009', fontWeight: '700', fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  emptyList: { flex: 1 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff5ed', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  notificationCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f1f1',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#fe7009', backgroundColor: '#fffcf9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBubble: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  timestamp: { fontSize: 12, color: '#999', fontWeight: '600' },
  notifTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  notifBody: { fontSize: 13, color: '#666', lineHeight: 19 },
});

export default NotificationsScreen;
