import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Share, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneIcon from '../components/PhoneIcon';
import HelpCircleIcon from '../components/HelpCircleIcon';
import LockIcon from '../components/LockIcon';
import BriefcaseIcon from '../components/BriefcaseIcon';
import StarIcon from '../components/StarIcon';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';


import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

import api from '../config/api';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { logout } = useAuth();
  const [user, setUser] = React.useState({
    name: 'Loading...',
    avatar: require('../assets/driver_eelcome.png'),
    rating: 0,
    trips: 0,
    memberSince: '...',
    vehicle: '...',
    vehiclePlateNumber: '...',
    vehicleColor: '...',
    phoneNumber: '...',
    location: '...',
  });

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');

      const data = response.data;
      if (data.profile) {
        let avatarSource = require('../assets/driver_eelcome.png');
        if (data.profile.avatar) {
          const avatarString = data.profile.avatar;
          const isAbsolute = avatarString.startsWith('http://') || avatarString.startsWith('https://');
          const avatarUrl = isAbsolute ? avatarString : `${api.defaults.baseURL}${avatarString}`;
          avatarSource = {
            uri: avatarUrl,
            headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` }
          };
        }

        let locationStr = data.profile.currentAddress;
        
        // If backend doesn't have the address string but has coords, or we just want to get real location
        if (!locationStr) {
          try {
            let lat: number | undefined = data.profile.location?.latitude;
            let lon: number | undefined = data.profile.location?.longitude;
            
            if (!lat || !lon) {
              const currentLoc = await Location.getLastKnownPositionAsync();
              if (currentLoc) {
                lat = currentLoc.coords.latitude;
                lon = currentLoc.coords.longitude;
              }
            }

            if (lat && lon) {
              const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
              if (geocode && geocode.length > 0) {
                const g = geocode[0];
                locationStr = [g.name, g.street, g.city, g.region].filter(Boolean).join(', ');
              }
            }
          } catch (e) {
            console.warn('Reverse geocode failed in Profile:', e);
          }
        }

        setUser({
          ...user,
          name: data.profile.name,
          rating: data.profile.rating,
          trips: data.profile.trips,
          memberSince: data.profile.memberSince,
          vehicle: data.profile.vehicleModel,
          vehiclePlateNumber: data.profile.vehiclePlateNumber,
          vehicleColor: data.profile.vehicleColor,
          phoneNumber: data.profile.phoneNumber,
          location: locationStr || 'Not available',
          avatar: avatarSource,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleWhatsAppInvite = async () => {
    const inviteText =
      'Hello! Join Challo Captain and earn more with 0% commission on Auto, Bike, Cab, and Ambulance rides. Be your own boss! Download Challo Captain: https://challo.in/download or https://play.google.com/store/apps/details?id=com.rideandhra.driverapp';
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(inviteText)}`;
    const webFallbackUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webFallbackUrl);
      }
    } catch (error) {
      try {
        await Share.share({
          message: inviteText,
          title: 'Invite Captains to Challo',
        });
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Unable to open WhatsApp.');
      }
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Challo Captain - Drive & Earn',
        message:
          'Join Challo Captain! Drive Auto, Bike, Cab, or Ambulance with 0% commission and get instant daily earnings. Download the Captain app: https://challo.in/download (or on Google Play: https://play.google.com/store/apps/details?id=com.rideandhra.driverapp)',
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Unable to share the app.');
    }
  };

  const menuItems = [
    {
      icon: ({ color, size }: { color?: string; size?: number }) => (
        <Ionicons name="logo-whatsapp" size={size || 24} color={color || '#25D366'} />
      ),
      text: 'Invite Captains on WhatsApp',
      iconColor: '#25D366',
      onPress: handleWhatsAppInvite,
    },
    {
      icon: ({ color, size }: { color?: string; size?: number }) => (
        <Ionicons name="share-social" size={size || 24} color={color || '#E5A915'} />
      ),
      text: 'Share App',
      iconColor: '#E5A915',
      onPress: handleShareApp,
    },
    { icon: PhoneIcon, text: 'Contact Us', onPress: () => navigation.navigate('ContactUs'), iconColor: '#333' },
    { icon: HelpCircleIcon, text: 'Help', onPress: () => navigation.navigate('Help'), iconColor: '#333' },
    { icon: LockIcon, text: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy'), iconColor: '#333' },
    { icon: BriefcaseIcon, text: 'Terms of Service', onPress: () => navigation.navigate('TermsOfService'), iconColor: '#333' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
              <Text style={styles.cardText}>Phone: {user.phoneNumber}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Vehicle Information</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>Model: {user.vehicle}</Text>
              <Text style={styles.cardText}>Number: {user.vehiclePlateNumber}</Text>
              <Text style={styles.cardText}>Color: {user.vehicleColor}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuItemIcon}>
                  <Icon color={item.iconColor || "#333"} size={24} />
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
