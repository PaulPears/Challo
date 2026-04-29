import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

const ProfileDrawer = ({ onClose, onReadCountChange }: { onClose: () => void; onReadCountChange?: () => void }) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/notifications');
      const filtered = (response.data || []).filter((n: NotificationItem) => {
        const title = (n.title || '').toLowerCase();
        const msg = (n.message || '').toLowerCase();
        return !title.includes('new ride request') && !msg.includes('new ride request');
      });
      setNotifications(filtered);
    } catch (error) {
      console.error('[ProfileDrawer] Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.post('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onReadCountChange?.();
    } catch (error) {
      console.error('[ProfileDrawer] Failed to mark all read:', error);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.is_read) return;
    try {
      await axiosClient.patch(`/notifications/${item.id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      onReadCountChange?.();
    } catch (_) { /* best-effort */ }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose}>
          <FontAwesome name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllButtonText}>Mark all as read</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#FF5722" style={{ marginTop: 40 }} />
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.75}
            >
              <FontAwesome
                name="bell"
                size={22}
                color={notification.is_read ? '#9ca3af' : '#FF5722'}
                style={styles.notificationIcon}
              />
              <View style={styles.notificationTextContainer}>
                <Text style={[styles.notificationTitle, !notification.is_read && styles.unreadText]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="bell-slash-o" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.9,
    height: '100%',
    backgroundColor: '#f3f4f6',
    zIndex: 100,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerBadge: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  markAllButton: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  markAllButtonText: {
    color: '#1e40af',
    fontWeight: 'bold',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  notificationIcon: {
    marginRight: 14,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#374151',
  },
  notificationMessage: {
    color: '#6b7280',
    marginTop: 3,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  unreadText: {
    color: '#FF5722',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF5722',
    marginLeft: 8,
  },
});

export default ProfileDrawer;
