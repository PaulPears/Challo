import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Avatar, IconButton } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermissions } from '../hooks/usePermissions';
import PermissionRationaleModal from '../components/PermissionRationaleModal';
import RegionalRestrictionModal from '../components/RegionalRestrictionModal';
import { isLocationInAndhraPradesh, calculateDistance } from '../utils/locationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useRideRequest, RideRequest } from '../context/RideRequestContext';
import { useSound } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { showRideAlertNotification, cancelRideAlertNotification } from '../utils/rideAlertNotification';

interface Ride {
  id: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_fare: number;
  fare?: number;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  rider?: {
    name?: string;
    phone_number?: string;
  };
  user?: {
    name?: string;
    phone_number?: string;
  };
  status?: string;
  rider_payable?: number;
  company_payable?: number;
  super_km_discount?: number;
  driver_earnings?: number;
}

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [subStatus, setSubStatus] = useState<{
    label: string,
    timer: string,
    color: string,
    isGrace: boolean,
    isExpired: boolean,
    isWarning: boolean,
    remainingMs: number
  } | null>(null);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [lastModalTime, setLastModalTime] = useState(0);
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(-width * 0.75));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [walletDues, setWalletDues] = useState<number>(0);
  const { rideRequest, setRideRequest } = useRideRequest();
  const { playAlert, stopAlert } = useSound();
  const { logout } = useAuth();
  const { isConnected } = useSocket();

  // Ride States
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const knownRidesRef = useRef<Set<string>>(new Set());
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const pinInputRefs = useRef<any[]>([]);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { clearRideRequest } = useRideRequest();

  // Rating States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rideToRate, setRideToRate] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Summary Modal
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [completedRideDetails, setCompletedRideDetails] = useState<Ride | null>(null);

  // Permission States
  const {
    locationStatus,
    notificationStatus,
    isCriticalGranted,
    requestLocation,
    requestNotifications,
    checkAllPermissions
  } = usePermissions();
  const [rationaleVisible, setRationaleVisible] = useState(false);
  const [rationaleConfig, setRationaleConfig] = useState({ title: '', description: '', icon: '', type: '' });
  const { unreadCount } = usePushNotifications(useAuth().user?.id || null);
  const [isInsideAP, setIsInsideAP] = useState(true);

  const classyRed = '#dc3545';
  const classyGreen = '#28a745';

  const [zones, setZones] = useState<string[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Locating...');
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

  const fetchZones = async (district?: string | null, lat?: number, lng?: number) => {
    try {
      if (!district && (!lat || !lng)) {
        setZones([]);
        return;
      }
      setLoadingZones(true);
      let url = '/rides/high-booking-zones?';
      if (district) url += `district=${encodeURIComponent(district)}&`;
      if (lat && lng) url += `lat=${lat}&lng=${lng}`;
      
      const response = await api.get(url);
      if (response.data && Array.isArray(response.data)) {
        setZones(response.data);
      }
    } catch (error) {
      console.error('Error fetching high booking zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    if (currentDistrict || location?.coords) {
      fetchZones(currentDistrict, location?.coords?.latitude, location?.coords?.longitude);
    }
  }, [currentDistrict, location]);

  useEffect(() => {
    checkAllPermissions();

    // Fetch initial status
    const fetchStatus = async () => {
      try {
        try {
          const walletResp = await api.get('/payments/wallet');
          if (walletResp.data?.pending_gst !== undefined) {
            setWalletDues(Number(walletResp.data.pending_gst));
          }
        } catch (e) {
          console.error('Wallet fetch error:', e);
        }

        const response = await api.get('/profile');
        if (response.data?.profile) {
          setIsOnline(response.data.profile.isOnline);
          if (response.data.profile.subscriptionExpiry) {
            await AsyncStorage.setItem('subscriptionExpiry', response.data.profile.subscriptionExpiry);
            updateSubscriptionStatus(response.data.profile.subscriptionExpiry);
          } else {
            await AsyncStorage.removeItem('subscriptionExpiry');
            setSubStatus(null);
          }
        }
      } catch (error) {
        console.error('Error fetching driver status:', error);
      }
    };
    fetchStatus();

    const interval = setInterval(async () => {
      const expiry = await AsyncStorage.getItem('subscriptionExpiry');
      if (expiry) {
        const status = updateSubscriptionStatus(expiry);

        // Recurring Modal Logic: Every 60s if expired
        if (status.isExpired) {
          const now = Date.now();
          if (now - lastModalTime > 60000) {
            setSubModalVisible(true);
            setLastModalTime(now);
          }
        }
      }
    }, 1000);

    // Fetch location once on mount so header shows it even when offline
    const fetchInitialLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (place) {
          const parts = [place.district || place.subregion, place.city || place.region].filter(Boolean);
          setLocationLabel(parts.join(', ') || 'Unknown location');
          // For the header and backend filtering, we want the City/District, not a specific area.
          setCurrentDistrict(place.city || place.district || place.region);
        }
      } catch (_) { /* GPS not ready yet */ }
    };
    fetchInitialLocation();
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchWallet = async () => {
        try {
          const walletResp = await api.get('/payments/wallet');
          if (walletResp.data?.pending_gst !== undefined) {
            setWalletDues(Number(walletResp.data.pending_gst));
          }
        } catch (e) {
          console.error('Wallet refresh error:', e);
        }
      };
      fetchWallet();
    }, [])
  );

  const updateSubscriptionStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const graceExpiry = new Date(expiry.getTime() + 12 * 60 * 60 * 1000);
    const FIVE_HOURS = 5 * 60 * 60 * 1000;

    let target = expiry;
    let isGrace = false;
    let isExpired = false;

    if (now >= expiry && now < graceExpiry) {
      target = graceExpiry;
      isGrace = true;
    } else if (now >= graceExpiry) {
      isExpired = true;
    }

    const diff = isExpired ? 0 : target.getTime() - now.getTime();
    const isWarning = diff < FIVE_HOURS && !isExpired;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    // For the banner: "2d 4h left"
    const bannerLabel = isExpired ? 'Plan Expired' :
      isGrace ? `Grace: ${hours}h ${mins}m` :
        `${days > 0 ? `${days}d ` : ''}${hours}h remaining`;

    // For the large UI: "02d 14:30:15"
    const timerString = isExpired ? '00:00:00' :
      `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    setSubStatus({
      label: bannerLabel,
      timer: timerString,
      color: (isWarning || isExpired) ? '#dc3545' : '#28a745',
      isGrace,
      isExpired,
      isWarning,
      remainingMs: diff
    });

    return { isExpired, isWarning };
  };

  useEffect(() => {
    if (location) {
      const inAP = isLocationInAndhraPradesh(
        location.coords.latitude,
        location.coords.longitude
      );
      setIsInsideAP(inAP);

      // If user goes online and then moves outside AP, take them offline
      if (isOnline && !inAP) {
        setIsOnline(false);
        Alert.alert(
          "Service Region Left",
          "You have moved outside Andhra Pradesh. Taking you offline as we only operate in AP."
        );
      }
    }
  }, [location, isOnline]);


  const slideIn = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(drawerAnimation, {
      toValue: -width * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  const toggleDrawer = () => {
    if (isDrawerVisible) {
      slideOut();
    } else {
      setDrawerVisible(true);
    }
  };

  useEffect(() => {
    if (isDrawerVisible) {
      slideIn();
    }
  }, [isDrawerVisible]);

  useEffect(() => {
    let locationWatcher: any = null;

    const startWatching = async () => {
      // 1. Start Foreground Watcher for UI Updates
      locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000,   // or every 5 seconds
        },
        async (newLocation) => {
          setLocation(newLocation);
          // Reverse geocode to get readable location label
          try {
            const [place] = await Location.reverseGeocodeAsync({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            if (place) {
              const parts = [place.district || place.subregion, place.city || place.region].filter(Boolean);
              setLocationLabel(parts.join(', ') || 'Unknown location');
              setCurrentDistrict(place.city || place.district || place.region);
            }
          } catch (_) { /* ignore geocode errors */ }
        }
      );

      // 2. Start Background Location Task for API updates
      try {
        const { status } = await Location.getBackgroundPermissionsAsync();
        if (status === 'granted') {
          await Location.startLocationUpdatesAsync('background-location-task', {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'Ride Andhra Online',
              notificationBody: 'You are online and looking for rides.',
              notificationColor: '#fe7009',
            },
          });
        }
      } catch (e) {
        console.error('Error starting background location updates:', e);
      }
    };

    if (isOnline) {
      startWatching();
    } else {
      if (locationWatcher) {
        locationWatcher.remove();
      }
      Location.stopLocationUpdatesAsync('background-location-task').catch(() => {});
    }

    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
      // We do not stop the background task on unmount if they are online!
    };
  }, [isOnline]);

  const openInMaps = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    if (url) Linking.openURL(url);
  };

  const fetchPendingRides = async () => {
    try {
      const response = await api.get('/rides/pending');
      const newRides = response.data;

      let hasTrulyNewRide = false;
      newRides.forEach((nr: any) => {
        if (!knownRidesRef.current.has(nr.id)) {
          hasTrulyNewRide = true;
          knownRidesRef.current.add(nr.id);
        }
      });

      if (isOnline && !currentRide && hasTrulyNewRide && newRides.length > 0) {
        const latestRide = newRides[0];
        console.log('[Rides] Truly new ride detected:', latestRide.id);

        // Trigger the modal from polling if not already set (fallback for missed socket events)
        if (!rideRequest && !currentRide) {
          console.log('[Rides] Triggering modal from polling fallback');
          let d2p: number | undefined = undefined;
          if (location && location.coords) {
            d2p = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              Number(latestRide.pickup_latitude || 0),
              Number(latestRide.pickup_longitude || 0)
            );
          }
          setRideRequest({
            rideId: latestRide.id,
            pickupLocation: latestRide.pickup_address || 'Unknown pickup',
            pickupLatitude: Number(latestRide.pickup_latitude || 0),
            pickupLongitude: Number(latestRide.pickup_longitude || 0),
            dropoffLocation: latestRide.dropoff_address || 'Unknown dropoff',
            dropoffLatitude: Number(latestRide.dropoff_latitude || 0),
            dropoffLongitude: Number(latestRide.dropoff_longitude || 0),
            fare: Number(latestRide.estimated_fare || latestRide.fare || 0),
            distance: latestRide.estimated_distance_km,
            duration: latestRide.estimated_duration_min,
            driverToPickupDistance: d2p,
            riderName: latestRide.rider?.name || latestRide.user?.name || 'Rider',
            riderPhone: latestRide.rider?.phone_number || latestRide.user?.phone_number,
          });
        }

        playAlert('RIDE_REQUEST');
        // Also fire a local notification (uses ring/notification stream — loud regardless of media volume)
        showRideAlertNotification(
          Number(latestRide.estimated_fare || latestRide.fare || 0),
          latestRide.pickup_address || 'Unknown pickup'
        );
      }
      setRides(newRides);
    } catch (error) {
      console.error('Error fetching pending rides:', error);
    }
  };

  const fetchCurrentRide = async () => {
    try {
      setLoadingCurrent(true);
      const response = await api.get('/rides/current');
      if (response.data) {
        setCurrentRide(response.data);
      } else {
        setCurrentRide(null);
      }
    } catch (error) {
      console.error('Error fetching current ride:', error);
    } finally {
      setLoadingCurrent(false);
    }
  };

  // Polling for rides every 2 seconds when online
  useEffect(() => {
    let pollInterval: any = null;

    if (isOnline) {
      fetchPendingRides();
      fetchCurrentRide();

      pollInterval = setInterval(() => {
        fetchPendingRides();
        fetchCurrentRide();
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOnline]);

  useFocusEffect(
    React.useCallback(() => {
      if (isOnline) {
        fetchPendingRides();
        fetchCurrentRide();
      }
    }, [isOnline])
  );

  const handleAccept = async (rideId: string) => {
    const expiryString = await AsyncStorage.getItem('subscriptionExpiry');
    const now = new Date();
    const expiry = expiryString ? new Date(expiryString) : null;

    // Logic: Active if (now < expiry) OR (now < expiry + 12h)
    const graceExpiry = expiry ? new Date(expiry.getTime() + 12 * 60 * 60 * 1000) : null;
    const isWithinValidPeriod = expiry && (now < expiry || (graceExpiry && now < graceExpiry));

    if (!isWithinValidPeriod) {
      Alert.alert(
        'Subscription Required',
        'Your plan has expired and the grace period has ended. Please renew to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Subscribe', onPress: () => navigation.navigate('Subscriptions') }
        ]
      );
      return;
    }

    try {
      await stopAlert(); // Stop sound immediately
      await cancelRideAlertNotification(); // Dismiss the notification alert
      setActionLoading(rideId);
      await api.patch(`/rides/${rideId}/accept`);
      Alert.alert('Ride Accepted!', 'Navigate to the passenger pickup.');
      setRides(rides.filter(r => r.id !== rideId));
      clearRideRequest();
      fetchCurrentRide();
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      const msg = error.response?.data?.message || 'Failed to accept ride. It may no longer be available.';
      Alert.alert('Error', msg);
      fetchPendingRides(); // Refresh in case ride was taken
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (rideId: string) => {
    // Optimistically remove from UI immediately for snappy UX
    setRides(prev => prev.filter(r => r.id !== rideId));
    stopAlert();
    cancelRideAlertNotification(); // Dismiss the notification alert
    try {
      await api.patch(`/rides/${rideId}/reject`);
    } catch (error: any) {
      console.error('Error rejecting ride:', error);
    } finally {
      await stopAlert(); // Final safety stop
      // If rejection fails, re-fetch so the ride may reappear if still pending
      fetchPendingRides();
    }
  };

  const handleStartRide = async () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter 4-digit PIN');
      return;
    }

    try {
      setActionLoading('start');
      await api.patch(`/rides/${currentRide?.id}/start`, { pin: pinValue });
      setPinModalVisible(false);
      setPin(['', '', '', '']);
      Alert.alert('Success', 'Ride Started!');
      fetchCurrentRide();
    } catch (error: any) {
      console.error('Error starting ride:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start ride');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteRide = async () => {
    try {
      setActionLoading('complete');
      const response = await api.patch(`/rides/${currentRide?.id}/complete`);
      const completedRide = response.data;
      
      setRideToRate(completedRide.id);
      setCompletedRideDetails(completedRide);
      setCurrentRide(null);
      setSummaryModalVisible(true);
      fetchPendingRides();
    } catch (error: any) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete ride');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRide = async () => {
    try {
      setActionLoading('cancel');
      await api.patch(`/rides/${currentRide?.id}/cancel`);
      Alert.alert('Ride Cancelled', 'The ride has been cancelled.');
      setCurrentRide(null);
      fetchPendingRides();
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setActionLoading(null);
    }
  };

  const submitRating = async () => {
    if (!rideToRate) return;
    try {
      setIsSubmittingRating(true);
      await api.post('/ratings', {
        ride_id: rideToRate,
        stars: ratingValue,
        comment: ratingComment || 'Good passenger',
        rated_user_role: 'rider',
      });
      setRatingModalVisible(false);
      setRatingComment('');
      setRatingValue(5);
      Alert.alert('Thank You', 'Rating submitted successfully');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handlePinChange = (text: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    if (text && index < 3) {
      pinInputRefs.current[index + 1].focus();
    }
  };

  const calculateDuration = (minutes?: number) => minutes ? `${minutes} min` : '--';
  const calculateDistance = (km?: number) => km ? `${km} km` : '--';

  const renderActiveRide = () => (
    <View style={styles.activeRideCard}>
      {/* Header */}
      <LinearGradient colors={['#fe7009', '#e55a00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeRideHeader}>
        <View style={styles.activeRideBadge}>
          <MaterialCommunityIcons name="car" size={14} color="#fe7009" />
          <Text style={styles.activeRideBadgeText}>{currentRide?.status?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.activeRideFare}>₹{currentRide?.estimated_fare || currentRide?.fare}</Text>
      </LinearGradient>

      {/* Rider Info */}
      <View style={styles.activeRideBody}>
        <View style={styles.riderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.riderAvatar}>
              <MaterialCommunityIcons name="account" size={22} color="#fe7009" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{currentRide?.rider?.name || currentRide?.user?.name || 'Rider'}</Text>
              <Text style={styles.riderPhone}>{currentRide?.rider?.phone_number || currentRide?.user?.phone_number}</Text>
            </View>
          </View>
          {(currentRide?.rider?.phone_number || currentRide?.user?.phone_number) && (
            <TouchableOpacity
              style={styles.properActiveCallBtn}
              onPress={() => Linking.openURL(`tel:${currentRide?.rider?.phone_number || currentRide?.user?.phone_number}`)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.activeCallGradient}
              >
                <MaterialCommunityIcons name="phone" size={16} color="#fff" />
                <Text style={styles.activeCallText} numberOfLines={1} adjustsFontSizeToFit>Call Rider</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={styles.routeDotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeAddress}>{currentRide?.pickup_address || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.routeDotRed} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>DROP OFF</Text>
              <Text style={styles.routeAddress}>{currentRide?.dropoff_address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.rideActionRow}>
          {currentRide?.status === 'accepted' && (
            <>
              <TouchableOpacity style={styles.navBtn} onPress={() => openInMaps(currentRide.pickup_latitude, currentRide.pickup_longitude, 'Pickup')}>
                <MaterialCommunityIcons name="navigation" size={16} color="#3182ce" />
                <Text style={styles.navBtnText} numberOfLines={1} adjustsFontSizeToFit>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startBtn} onPress={() => setPinModalVisible(true)}>
                <MaterialCommunityIcons name="play-circle" size={16} color="#fff" />
                <Text style={styles.startBtnText} numberOfLines={1} adjustsFontSizeToFit>Start Trip</Text>
              </TouchableOpacity>
            </>
          )}
          {currentRide?.status === 'in_progress' && (
            <View style={{ flex: 1 }}>
              <View style={styles.ongoingBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.ongoingBadgeText}>TRIP IN PROGRESS</Text>
              </View>
              <View style={styles.rideActionRow}>
                <TouchableOpacity style={styles.navBtn} onPress={() => openInMaps(currentRide.dropoff_latitude, currentRide.dropoff_longitude, 'Drop-off')}>
                  <MaterialCommunityIcons name="navigation" size={16} color="#3182ce" />
                  <Text style={styles.navBtnText} numberOfLines={1} adjustsFontSizeToFit>Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.startBtn, { backgroundColor: '#28a745', borderColor: '#218838' }]} onPress={() => {
                  Alert.alert(
                    'Complete Ride',
                    'Are you sure you want to complete this ride?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Complete', onPress: handleCompleteRide }
                    ]
                  );
                }}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                  <Text style={styles.startBtnText} numberOfLines={1} adjustsFontSizeToFit>End Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        {currentRide?.status === 'accepted' && (
          <TouchableOpacity style={styles.cancelLink} onPress={() => Alert.alert('Cancel Ride', 'Cancel this ride?', [{ text: 'No' }, { text: 'Yes', onPress: handleCancelRide }])}>
            <Text style={styles.cancelLinkText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const HorizontalDivider = () => <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 15 }} />;

  const toggleOnlineStatus = async () => {
    if (isUpdatingStatus) return;

    if (isOnline && currentRide) {
      Alert.alert(
        "Action Blocked",
        "You cannot go offline while you have an active ride. Please complete or cancel your current trip first.",
        [{ text: "OK" }]
      );
      return;
    }

    // 0. Check Regional Restriction First
    if (!isInsideAP) {
      // Re-check just in case
      if (location) {
        const check = isLocationInAndhraPradesh(location.coords.latitude, location.coords.longitude);
        if (!check) return; // Modal is already shown
      } else {
        return;
      }
    }

    // 1. Check Permissions First
    if (!isCriticalGranted) {
      if (locationStatus !== 'granted') {
        setRationaleConfig({
          title: 'Location Access Required',
          description: 'Ride Andhra needs your location to find rides nearby and track your progress during a trip. Please allow "Always" for the best experience.',
          icon: 'map-marker-radius',
          type: 'location'
        });
        setRationaleVisible(true);
      } else if (notificationStatus !== 'granted') {
        setRationaleConfig({
          title: 'Notifications Required',
          description: 'We need to send you notifications so you never miss a ride request or an important update.',
          icon: 'bell-ring',
          type: 'notification'
        });
        setRationaleVisible(true);
      }
      return;
    }

    if (!location) {
      try {
        const currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc);
      } catch (e) {
        Alert.alert("Location not available", "Could not get your current location. Please ensure GPS is on.");
        return;
      }
    }

    if (walletDues >= 100) {
      Alert.alert(
        "Action Blocked",
        `You have outstanding Service fees(gst) of ₹${walletDues}on your rides. Please clear your dues to go online.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Pay Now", onPress: () => navigation.navigate("SettleDues") }
        ]
      );
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const newStatus = !isOnline;
      const payload: any = { online: newStatus };
      if (newStatus && location) {
        payload.location = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
      }

      await api.put('/profile/driver/status', payload);
      setIsOnline(newStatus);

      ToastAndroid.show(`You are now ${newStatus ? 'Online' : 'Offline'}`, ToastAndroid.SHORT);
      if (newStatus) playAlert('ONLINE_POP');
    } catch (error: any) {
      console.error("Failed to update online status:", error);
      const msg = error.response?.data?.message || "Could not update your online status.";
      Alert.alert("Update Failed", msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRationaleAllow = async () => {
    setRationaleVisible(false);
    if (rationaleConfig.type === 'location') {
      await requestLocation();
    } else if (rationaleConfig.type === 'notification') {
      await requestNotifications();
    }
    // Re-check permissions after request
    checkAllPermissions();
  };

  const renderNavigationBar = () => (
    <View style={styles.headerShadowWrapper}>
      <LinearGradient
        colors={['#ff8c00', '#fe7009', '#e55a00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.headerIconButton}>
            <MaterialCommunityIcons name="menu" size={28} color="rgba(255,255,255,0.95)" />
          </TouchableOpacity>

          <Image source={require('../assets/Dashboard.png')} style={styles.headerImage} />

          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? 'rgba(40,167,69,0.25)' : 'rgba(255,255,255,0.15)', marginRight: 10 }]}>
              {isOnline && <View style={[styles.statusDot, { backgroundColor: '#4cff72', marginRight: 4 }]} />}
              <Text style={styles.statusBadgeText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')} 
              style={styles.headerIconButton}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="rgba(255,255,255,0.95)" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </LinearGradient>
    </View>
  );

  const renderDashboardContent = () => (
    <View style={styles.dashSection}>
      {/* Dues Warning Banner */}
      {walletDues >= 100 && (
        <TouchableOpacity style={styles.duesWarning} onPress={() => navigation.navigate("SettleDues")}>
          <View style={styles.duesIcon}>
            <MaterialCommunityIcons name="alert" size={20} color="#dc3545" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.duesTitle}>Outstanding Fees</Text>
            <Text style={styles.duesSubtitle}>₹{walletDues} pending · Tap to clear dues</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#dc3545" />
        </TouchableOpacity>
      )}

      {/* Permission Error */}
      {errorMsg ? (
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={32} color="#fe7009" />
          <Text style={styles.permErrorText}>{errorMsg}</Text>
          <Button mode="contained" buttonColor="#fe7009" onPress={() => (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') { setErrorMsg(null); setLocation(await Location.getCurrentPositionAsync({})); }
          })()}>Grant Location</Button>
        </View>
      ) : null}

      {/* Status Card */}
      <View style={[styles.statusCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
          <View style={styles.statusCardLeft}>
            <Text style={styles.statusCardLabel}>
              {subStatus?.isGrace ? 'Grace Period' : 'Subscription'}
            </Text>
            <Text style={[
              styles.statusCardTimer,
              (subStatus?.isWarning || subStatus?.isExpired) && { color: '#dc3545' }
            ]}>
              {subStatus?.timer || '--:--'}
            </Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusPillDot, { backgroundColor: isOnline ? '#22c55e' : '#94a3b8' }]} />
              <Text style={[styles.statusPillText, { color: isOnline ? '#15803d' : '#64748b' }]}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.goToggleBtn, { backgroundColor: isOnline ? '#dc3545' : '#22c55e' }]}
            onPress={toggleOnlineStatus}
            disabled={isUpdatingStatus}
            activeOpacity={0.85}
          >
            {isUpdatingStatus
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                <MaterialCommunityIcons name={isOnline ? 'power-off' : 'power'} size={22} color="#fff" />
                <Text style={styles.goToggleBtnText}>{isOnline ? 'Go\nOffline' : 'Go\nOnline'}</Text>
              </>
            }
          </TouchableOpacity>
        </View>

        {/* Date and Location at the bottom of the card */}
        <View style={[styles.headerInfoRow, { backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 0 }]}>
          <View style={styles.headerInfoItem}>
            <Ionicons name="calendar-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={[styles.headerInfoText, { color: '#64748b' }]}>{currentDate}</Text>
          </View>
          <View style={[styles.headerInfoDivider, { backgroundColor: '#e2e8f0' }]} />
          <View style={styles.headerInfoItem}>
            <Ionicons name="location-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={[styles.headerInfoText, { color: '#64748b', flex: 1 }]} numberOfLines={1}>{location ? locationLabel : 'Enable GPS'}</Text>
          </View>
        </View>
      </View>


      {/* Active Ride */}
      {isOnline && currentRide && renderActiveRide()}

    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {[
          { label: 'Wallet', icon: 'wallet', screen: 'Wallet', color: '#ff8c00' },
          { label: 'My Rides', icon: 'history', screen: 'MyRides', color: '#6366f1' },
          { label: 'Plans', icon: 'card-account-details-outline', screen: 'Subscriptions', color: '#10b981' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.actionCard}
            onPress={() => navigation.navigate(item.screen as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={[styles.actionText, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHighBookingZones = () => (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="fire" size={20} color="#fe7009" />
        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 6, marginTop: 0 }]}>
          {currentDistrict ? `Hot Zones in ${currentDistrict}` : 'Hot Zones'}
        </Text>
      </View>
      {loadingZones ? (
        <ActivityIndicator color="#fe7009" style={{ marginTop: 12 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 10 }}>
          {zones.map((zone, index) => (
            <View key={index} style={styles.zoneChip}>
              <MaterialCommunityIcons name="map-marker-radius" size={14} color="#fe7009" style={{ marginRight: 5 }} />
              <Text style={styles.zoneText} numberOfLines={1} ellipsizeMode="tail">{zone}</Text>
            </View>
          ))}
          {zones.length === 0 && (
            <View style={styles.emptyZoneChip}>
              <MaterialCommunityIcons name="radar" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.emptyText}>Monitoring zones...</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnimation }] }]}>
          <TouchableOpacity
            style={styles.closeDrawerButton}
            onPress={toggleDrawer}
          >
            <Ionicons name="close" size={28} color="#4a5568" />
          </TouchableOpacity>

          <View style={[styles.drawerHeader, { paddingTop: 50, paddingBottom: 20 }]}>
            <Image 
              source={require('../../assets/splash-icon.png')} 
              style={{ width: 140, height: 40, resizeMode: 'contain' }} 
            />
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); navigation.navigate('Profile'); }}>
              <Ionicons name="person-outline" size={24} color="#fe7009" />
              <Text style={styles.drawerItemText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); navigation.navigate('MyRides'); }}>
              <Ionicons name="time-outline" size={24} color="#fe7009" />
              <Text style={styles.drawerItemText}>Ride History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); navigation.navigate('Subscriptions'); }}>
              <Ionicons name="card-outline" size={24} color="#fe7009" />
              <Text style={styles.drawerItemText}>Subscriptions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); navigation.navigate('Wallet'); }}>
              <Ionicons name="wallet-outline" size={24} color="#fe7009" />
              <Text style={styles.drawerItemText}>My Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); navigation.navigate('Help'); }}>
              <Ionicons name="help-circle-outline" size={24} color="#fe7009" />
              <Text style={styles.drawerItemText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={async () => {
              toggleDrawer();
              await logout();
            }}>
              <Ionicons name="log-out-outline" size={24} color="#e53e3e" />
              <Text style={[styles.drawerItemText, { color: '#e53e3e' }]}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {renderNavigationBar()}

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {subStatus && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Subscriptions')}
              style={[styles.subTimerBanner, { backgroundColor: subStatus.color }]}
            >
              <View style={styles.subTimerContent}>
                <MaterialCommunityIcons
                  name={subStatus.isGrace ? "clock-alert-outline" : "clock-outline"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.subTimerText}>
                  {subStatus.isGrace ? "Grace Period: " : "Plan: "}{subStatus.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}



          {renderDashboardContent()}
          {renderQuickActions()}
          {renderHighBookingZones()}

          <View style={styles.sectionWrapper}>
            {isOnline && !currentRide && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons name="car-multiple" size={20} color="#1a202c" />
                  <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 6, marginTop: 0 }]}>Nearby Requests</Text>
                </View>
                {rides.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons name="motorbike" size={64} color="#e2e8f0" />
                    <Text style={styles.emptyStateTitle}>All clear!</Text>
                    <Text style={styles.emptyStateSubtitle}>Waiting for ride requests nearby...</Text>
                  </View>
                ) : (
                  rides.map((ride) => (
                    <View key={ride.id} style={styles.rideRequestCard}>
                      {/* Fare badge */}
                      <View style={styles.rideCardTop}>
                        <View style={styles.rideRiderInfo}>
                          <View style={styles.rideAvatarSmall}>
                            <MaterialCommunityIcons name="account" size={20} color="#fe7009" />
                          </View>
                          <Text style={styles.rideRiderName}>{ride.rider?.name || ride.user?.name || 'Rider'}</Text>
                        </View>
                        <View style={styles.rideFareBadge}>
                          <Text style={styles.rideFareText}>₹{ride.estimated_fare || ride.fare}</Text>
                        </View>
                      </View>
                      {/* Route */}
                      <View style={styles.routeContainer}>
                        <View style={styles.routeRow}>
                          <View style={styles.routeDotGreen} />
                          <Text style={styles.routeAddress} numberOfLines={1}>{ride.pickup_address || 'Unknown pickup'}</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routeRow}>
                          <View style={styles.routeDotRed} />
                          <Text style={styles.routeAddress} numberOfLines={1}>{ride.dropoff_address || 'Unknown dropoff'}</Text>
                        </View>
                      </View>
                      {/* Buttons */}
                      <View style={styles.rideActionRow}>
                        <TouchableOpacity
                          style={styles.properActiveCallBtnSmall}
                          onPress={() => Linking.openURL(`tel:${ride.rider?.phone_number || ride.user?.phone_number}`)}
                        >
                          <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            style={styles.activeCallGradientSmall}
                          >
                            <MaterialCommunityIcons name="phone" size={14} color="#fff" />
                            <Text style={styles.activeCallTextSmall}>Call Rider</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(ride.id)}
                          disabled={actionLoading === ride.id}
                        >
                          <Text style={styles.rejectBtnText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(ride.id)}
                          disabled={actionLoading === ride.id}
                        >
                          {actionLoading === ride.id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.acceptBtnText}>Accept Ride</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </ScrollView>


        {/* Rating Modal */}
        <Modal transparent visible={ratingModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate Passenger</Text>
              <Text style={styles.modalSubtitle}>How was your experience with the passenger?</Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                    <Ionicons
                      name={star <= ratingValue ? "star" : "star-outline"}
                      size={40}
                      color={star <= ratingValue ? "#fe7009" : "#cbd5e0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.ratingInput}
                placeholder="Add a comment (optional)"
                multiline
                numberOfLines={3}
                value={ratingComment}
                onChangeText={setRatingComment}
              />

              <Button
                mode="contained"
                onPress={submitRating}
                loading={isSubmittingRating}
                style={styles.submitRatingButton}
              >
                Submit Rating
              </Button>
              <Button
                mode="text"
                onPress={() => setRatingModalVisible(false)}
                disabled={isSubmittingRating}
              >
                Skip
              </Button>
            </View>
          </View>
        </Modal>

        {/* Ride Summary Modal */}
        <Modal transparent visible={summaryModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: 30 }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4', marginBottom: 15 }]}>
                <MaterialCommunityIcons name="check-all" size={36} color="#22c55e" />
              </View>
              <Text style={styles.modalTitle}>Trip Completed!</Text>
              <Text style={styles.modalSubtitle}>Here is the earnings breakdown for this trip.</Text>

              <View style={styles.summaryContainer}>
                {/* NEW: Explicit Payment Source Breakdown */}
                <View style={{ marginTop: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>PAYMENT SOURCES</Text>
                  
                  {/* Source 1: Rider (Cash/Online) */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 12, backgroundColor: '#fff7ed', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#fe7009' }}>
                    <View>
                      <Text style={{ fontSize: 13, color: '#9a3412', fontWeight: '800' }}>COLLECT FROM RIDER</Text>
                      <Text style={{ fontSize: 10, color: '#c2410c' }}>Cash or Online Payment</Text>
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#fe7009' }}>₹{Number(completedRideDetails?.rider_payable || 0).toFixed(2)}</Text>
                  </View>

                  {/* Source 2: Platform (Wallet Credit) */}
                  {Number(completedRideDetails?.company_payable) > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#0ea5e9' }}>
                      <View>
                        <Text style={{ fontSize: 13, color: '#0369a1', fontWeight: '800' }}>PLATFORM REWARD</Text>
                        <Text style={{ fontSize: 10, color: '#0ea5e9' }}>Added to Rewards Wallet</Text>
                      </View>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#0ea5e9' }}>₹{Number(completedRideDetails.company_payable).toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={{ paddingHorizontal: 5, paddingVertical: 10, borderTopWidth: 1, borderTopStyle: 'dashed', borderTopColor: '#cbd5e1', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>Total Trip Value (Tab)</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>₹{Number(completedRideDetails?.final_fare || 0).toFixed(2)}</Text>
                  </View>
                </View>

                <HorizontalDivider />

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Your Net Earnings</Text>
                  <Text style={[styles.summaryValue, { color: '#22c55e' }]}>₹{Number(completedRideDetails?.driver_earnings || 0).toFixed(2)}</Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => {
                  setSummaryModalVisible(false);
                  setRatingModalVisible(true);
                }}
                style={[styles.startTripSubmitBtn, { backgroundColor: '#22c55e', marginTop: 10 }]}
              >
                Done
              </Button>
            </View>
          </View>
        </Modal>

        {/* PIN Modal */}
        <Modal transparent visible={pinModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: 35 }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff5ed', marginBottom: 10 }]}>
                <MaterialCommunityIcons name="shield-key-outline" size={32} color="#fe7009" />
              </View>
              <Text style={styles.modalTitle}>Verification Required</Text>
              <Text style={styles.modalSubtitle}>Please enter the 4-digit PIN provided by the rider to start your trip.</Text>

              <View style={styles.pinContainer}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { pinInputRefs.current[index] = ref; }}
                    style={[styles.pinInput, digit ? { borderColor: '#fe7009', backgroundColor: '#fff' } : null]}
                    maxLength={1}
                    keyboardType="numeric"
                    value={digit}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                        pinInputRefs.current[index - 1].focus();
                      }
                    }}
                    onChangeText={(text) => handlePinChange(text, index)}
                  />
                ))}
              </View>

              <Button
                mode="contained"
                onPress={handleStartRide}
                loading={actionLoading === 'start'}
                style={styles.startTripSubmitBtn}
              >
                Verify & Start Trip
              </Button>
              <TouchableOpacity onPress={() => setPinModalVisible(false)} style={{ marginTop: 20 }}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <PermissionRationaleModal
          isVisible={rationaleVisible}
          title={rationaleConfig.title}
          description={rationaleConfig.description}
          icon={rationaleConfig.icon}
          onAllow={handleRationaleAllow}
          onCancel={() => setRationaleVisible(false)}
        />

        <RegionalRestrictionModal isVisible={!isInsideAP && !!location} />

        {/* Subscription Ended Modal */}
        <Modal transparent visible={subModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderTopWidth: 6, borderTopColor: '#dc3545' }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#fee2e2', width: 60, height: 60, borderRadius: 30, marginBottom: 15 }]}>
                <MaterialCommunityIcons name="alert-decagram" size={32} color="#dc3545" />
              </View>
              <Text style={styles.modalTitle}>Plan Expired!</Text>
              <Text style={styles.modalSubtitle}>
                Your subscription and grace period have ended. You must renew to keep accepting rides.
              </Text>

              <Button
                mode="contained"
                buttonColor="#fe7009"
                onPress={() => {
                  setSubModalVisible(false);
                  navigation.navigate('Subscriptions');
                }}
                style={{ width: '100%', borderRadius: 12, paddingVertical: 4, marginBottom: 12 }}
              >
                Renew Now
              </Button>

              <TouchableOpacity onPress={() => setSubModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ─── Layout ─────────────────────────────────────────────────────────────────
  safeArea: { flex: 1, backgroundColor: '#ff8c00' },
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  sectionWrapper: { paddingHorizontal: 18, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1a202c', marginBottom: 14, letterSpacing: 0.3 },

  // ─── Header ─────────────────────────────────────────────────────────────────
  headerShadowWrapper: {
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    elevation: 14, shadowColor: '#c94d00',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12,
    backgroundColor: '#fe7009', zIndex: 10,
  },
  header: {
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 8 : 24, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', position: 'relative',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerInfoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, marginTop: 2,
  },
  headerInfoItem: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerInfoDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 10 },
  headerInfoText: { color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '600', letterSpacing: 0.2, flexShrink: 1 },
  headerCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -40, left: 50,
  },
  headerIconButton: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  headerLogo: { width: 150, height: 38, resizeMode: 'contain' },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#dc3545',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fe7009',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  headerImage: { width: 140, height: 35, resizeMode: 'contain' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socketDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  // ─── Status Card ─────────────────────────────────────────────────────────────
  dashSection: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  statusCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10,
  },
  statusCardLeft: { flex: 1 },
  statusCardLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statusCardTimer: { fontSize: 28, fontWeight: '900', color: '#1a202c', letterSpacing: -0.5 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusPillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  goToggleBtn: {
    width: 80, height: 80, borderRadius: 40, marginLeft: 16,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  goToggleBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 3 },

  // ─── Active Ride Card ─────────────────────────────────────────────────────────
  activeRideCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20,
    elevation: 8, shadowColor: '#fe7009', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  activeRideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingHorizontal: 18 },
  activeRideBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeRideBadgeText: { fontSize: 11, fontWeight: '800', color: '#fe7009', marginLeft: 4, letterSpacing: 0.5 },
  activeRideFare: { fontSize: 22, fontWeight: '900', color: '#fff' },
  activeRideBody: { padding: 18 },
  riderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  riderAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff5ed', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  riderName: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  riderPhone: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  properActiveCallBtn: {
    borderRadius: 12, overflow: 'hidden',
    marginBottom: 14, minWidth: 130,
    elevation: 3, shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  activeCallGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 14, gap: 8,
  },
  activeCallText: { color: '#fff', fontSize: 13, fontWeight: '800', flexShrink: 1 },

  // ─── Route Display ───────────────────────────────────────────────────────────
  routeContainer: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 10 },
  routeDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 10 },
  routeLine: { width: 2, height: 18, backgroundColor: '#e2e8f0', marginLeft: 4, marginVertical: 3 },
  routeLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  routeAddress: { fontSize: 13, color: '#334155', fontWeight: '500', flex: 1 },

  debugBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  debugBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // ─── Ride Action Buttons ──────────────────────────────────────────────────────
  rideActionRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  properActiveCallBtnSmall: { borderRadius: 10, overflow: 'hidden', flex: 1, elevation: 2 },
  activeCallGradientSmall: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, paddingHorizontal: 8, gap: 5,
  },
  activeCallTextSmall: { color: '#fff', fontSize: 11, fontWeight: '800', flexShrink: 1 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#3182ce', backgroundColor: '#eff6ff',
  },
  navBtnText: { color: '#3182ce', fontWeight: '700', marginLeft: 5, fontSize: 12, flexShrink: 1 },
  startBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#fe7009',
    elevation: 4, shadowColor: '#fe7009', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  startBtnText: { color: '#fff', fontWeight: '800', marginLeft: 5, fontSize: 12, flexShrink: 1 },

  // ─── Quick Actions ────────────────────────────────────────────────────────────
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20,
    alignItems: 'center', elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },

  // ─── Hot Zones ────────────────────────────────────────────────────────────────
  zoneChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#ffe4ca',
  },
  emptyZoneChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f9fa', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  zoneText: { fontSize: 13, color: '#2d3748', fontWeight: '700' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },

  // ─── Ride Request Card ────────────────────────────────────────────────────────
  rideRequestCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, borderLeftWidth: 4, borderLeftColor: '#fe7009',
  },
  rideCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rideRiderInfo: { flexDirection: 'row', alignItems: 'center' },
  rideAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff5ed', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rideRiderName: { fontSize: 15, fontWeight: '700', color: '#1a202c' },
  rideFareBadge: { backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  rideFareText: { fontSize: 15, fontWeight: '900', color: '#15803d' },
  rejectBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#ef4444', alignItems: 'center',
  },
  rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  acceptBtn: {
    flex: 1.8, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#fe7009', alignItems: 'center',
    elevation: 4, shadowColor: '#fe7009', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // ─── Empty State ──────────────────────────────────────────────────────────────
  emptyStateContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyStateTitle: { fontSize: 17, fontWeight: '800', color: '#cbd5e0', marginTop: 12 },
  emptyStateSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },

  // ─── Dues Warning ─────────────────────────────────────────────────────────────
  duesWarning: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5',
    borderRadius: 16, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#fecaca',
    elevation: 3, shadowColor: '#dc3545', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  duesIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  duesTitle: { color: '#dc3545', fontWeight: '800', fontSize: 14 },
  duesSubtitle: { color: '#ef4444', fontSize: 12, marginTop: 2 },

  // ─── Drawer ──────────────────────────────────────────────────────────────────
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#fff', zIndex: 1000, elevation: 10 },
  drawerHeader: { padding: 30, backgroundColor: '#fff9f5', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ffe4ca' },
  drawerName: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: '#1a202c' },
  drawerRating: { fontSize: 14, color: '#fe7009', fontWeight: 'bold' },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  drawerItemText: { marginLeft: 15, fontSize: 16, fontWeight: '500', color: '#4a5568' },
  closeDrawerButton: { position: 'absolute', top: 50, right: 20, zIndex: 1001, padding: 5 },

  // ─── Permission ───────────────────────────────────────────────────────────────
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 },
  errorText: { color: '#fff', textAlign: 'center', marginBottom: 10 },
  permErrorText: { color: '#4a5568', fontSize: 13, textAlign: 'center', marginVertical: 10 },
  permissionContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },

  // ─── Modals ───────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 25, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 6, color: '#1a202c' },
  modalSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  pinContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25, gap: 10 },
  pinInput: { flex: 1, height: 52, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, textAlign: 'center', fontSize: 22, fontWeight: '700', backgroundColor: '#f8fafc' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 10 },
  ratingInput: {
    width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 12, backgroundColor: '#f8fafc', marginBottom: 20,
    minHeight: 80, textAlignVertical: 'top',
  },
  submitRatingButton: { width: '100%', borderRadius: 12, backgroundColor: '#fe7009', marginBottom: 10 },
  startTripSubmitBtn: { width: '100%', borderRadius: 12, paddingVertical: 6, backgroundColor: '#fe7009' },

  // ─── Summary Modal ────────────────────────────────────────────────────────────
  summaryContainer: { width: '100%', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: '#1a202c' },

  // ─── Misc (kept for compatibility) ────────────────────────────────────────────
  rideCard: { borderRadius: 15, elevation: 3, backgroundColor: '#fff', marginBottom: 15 },
  activeLabel: { textAlign: 'center', color: '#fe7009', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fe7009', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1a202c' },
  phoneText: { fontSize: 12, color: '#718096' },
  fareContainer: { alignItems: 'flex-end' },
  fareText: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
  locationContainer: { marginBottom: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 10 },
  greenDot: { backgroundColor: '#28a745' },
  redDot: { backgroundColor: '#dc3545' },
  verticalLine: { width: 2, height: 20, backgroundColor: '#eee', marginLeft: 4, marginVertical: 2 },
  addressContainer: { flex: 1 },
  locationLabel: { fontSize: 10, fontWeight: 'bold', color: '#999', marginBottom: 2 },
  addressText: { fontSize: 14, color: '#4a5568' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  rejectButtonOutline: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#dc3545', alignItems: 'center' },
  rejectButtonText: { color: '#dc3545', fontWeight: 'bold' },
  acceptButtonSmall: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fe7009', alignItems: 'center' },
  acceptButtonText: { color: '#fff', fontWeight: 'bold' },
  navigateButton: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 10, backgroundColor: '#3182ce', alignItems: 'center', justifyContent: 'center' },
  navigateButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  cancelLink: { marginTop: 14, alignItems: 'center' },
  cancelLinkText: { color: '#ef4444', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  content: { padding: 20 },
  rideStatusCard: { borderRadius: 20, elevation: 4, backgroundColor: '#fff' },
  highlightCard: { borderTopWidth: 5, borderTopColor: '#fe7009' },
  timer: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginVertical: 10, color: '#1a202c' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold', color: '#4a5568' },
  toggleButton: { paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 10 },
  toggleButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mainContent: { paddingHorizontal: 20, paddingBottom: 30 },

  // ─── Subscription Timer ───────────────────────────────────────────────────────
  subTimerBanner: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  subTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTimerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#feb2b2',
  },
  ongoingBadgeText: {
    color: '#c53030',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e53e3e',
    marginRight: 8,
  }
});

export default HomeScreen;
