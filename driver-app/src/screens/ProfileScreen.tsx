import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneIcon from '../components/PhoneIcon';
import HelpCircleIcon from '../components/HelpCircleIcon';
import LockIcon from '../components/LockIcon';
import BriefcaseIcon from '../components/BriefcaseIcon';
import StarIcon from '../components/StarIcon';
import { Ionicons } from '@expo/vector-icons';


import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../config/api';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = React.useState({
    name: 'Loading...',
    avatar: require('../assets/driver_eelcome.png'),
    rating: 0,
    trips: 0,
    memberSince: '...',
    vehicle: '...',
    vehiclePlateNumber: '...',
  });

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');

      const data = response.data;
      if (data.profile) {
        // Construct full avatar URL if relative path is provided
        let avatarSource = require('../assets/driver_eelcome.png');
        if (data.profile.avatar) {
          // If avatar is a relative path, prepend base URL
          // We need to handle auth token for image fetching if the endpoint is protected
          // For now, let's assume we can construct the URL. 
          // Since the image endpoint is protected, we might need to fetch it as a blob or use a component that supports headers.
          // But for simplicity, let's try to use the URL with the token in the header if using a custom Image component, 
          // or just the URL if we make the image endpoint public (not recommended for sensitive docs).
          // Actually, the best way for React Native Image with auth is to use headers.

          avatarSource = {
            uri: `${api.defaults.baseURL}${data.profile.avatar}`,
            headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` }
          };
        }

        setUser({
          ...user,
          name: data.profile.name,
          rating: data.profile.rating,
          trips: data.profile.trips,
          memberSince: data.profile.memberSince,
          vehicle: data.profile.vehicleModel,
          vehiclePlateNumber: data.profile.vehiclePlateNumber,
          avatar: avatarSource,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const menuItems = [
    { icon: PhoneIcon, text: 'Contact Us', onPress: () => navigation.navigate('ContactUs') },
    { icon: HelpCircleIcon, text: 'Help', onPress: () => navigation.navigate('Help') },
    { icon: LockIcon, text: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy') },
    { icon: BriefcaseIcon, text: 'Terms of Service', onPress: () => navigation.navigate('TermsOfService') },
    // Removed "Become a Rider" button as requested
  ];

  const handleLogout = async () => {
    try {
      // Clear all authentication data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('phoneNumber');

      // The AppNavigator will automatically detect the token removal
      // and redirect to the Login screen
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView>
        <View style={styles.profileHeader}>
          <Image source={user.avatar} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <StarIcon color="#FFD700" size={24} />

              <Text style={styles.statText}>{user.rating}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.memberSince}</Text>
              <Text style={styles.statLabel}>Since</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>Name: {user.name}</Text>
              <Text style={styles.cardText}>Location: Hyderabad</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Vehicle Information</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>Vehicle: {user.vehicle}</Text>
              <Text style={styles.cardText}>Vehicle No: {user.vehiclePlateNumber}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuItemIcon}>
                  <Icon color="#333" size={24} />
                </View>
                <Text style={styles.menuItemText}>{item.text}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1a202c',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  cardContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  cardBody: {},
  cardText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  menu: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a202c',
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#718096',
  },
  logoutButton: {
    margin: 24,
    backgroundColor: '#E53E3E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
