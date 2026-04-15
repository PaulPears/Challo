import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import useNotificationStore from '../store/notificationStore';

const { width, height } = Dimensions.get('window');

const ProfileDrawer = ({ onClose }: { onClose: () => void }) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const { notifications, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleClose}>
          <FontAwesome name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllButtonText}>Mark all as read</Text>
        </TouchableOpacity>

        {notifications.length > 0 ? (
          notifications.map(notification => (
            <View key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
              <FontAwesome name={notification.icon as any || 'bell'} size={24} color={notification.read ? "#9ca3af" : "#FF5722"} style={styles.notificationIcon} />
              <View style={styles.notificationTextContainer}>
                <Text style={[styles.notificationTitle, !notification.read && styles.unreadText]}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                {/* <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text> */}
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="bell-slash-o" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No new notifications</Text>
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
    borderRadius: 62,
    backgroundColor: 'transparent',

  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  notificationIcon: {
    marginRight: 16,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationMessage: {
    color: '#6b7280',
    marginVertical: 4,
  },
  notificationTimestamp: {
    color: '#9ca3af',
    fontSize: 12,
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
  unreadCard: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  unreadText: {
    color: '#FF5722',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
    marginLeft: 8,
    alignSelf: 'center',
  },
});

export default ProfileDrawer;
