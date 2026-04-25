import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Modal, Dimensions, TextInput, Image, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SvgXml } from 'react-native-svg';
import ProfileDrawer from '../../components/ProfileDrawer';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionRationaleModal from '../../components/PermissionRationaleModal';
import RegionalRestrictionModal from '../../components/RegionalRestrictionModal';
import { isLocationInAndhraPradesh } from '../../utils/locationUtils';
import useRideStore from '../../store/rideStore';
import useUserStore from '../../store/userStore';
import api from '../../api/axiosClient';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { rideAPI } from '../../api/rideAPI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const searchXml = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="100px" height="100px"><path fill="#616161" d="M34.6 28.1H38.6V45.1H34.6z" transform="rotate(-45.001 36.586 36.587)"/><path fill="#616161" d="M20 4A16 16 0 1 0 20 36A16 16 0 1 0 20 4Z"/><path fill="#37474F" d="M36.2 32.1H40.2V44.400000000000006H36.2z" transform="rotate(-45.001 38.24 38.24)"/><path fill="#64B5F6" d="M20 7A13 13 0 1 0 20 33A13 13 0 1 0 20 7Z"/><path fill="#BBDEFB" d="M26.9,14.2c-1.7-2-4.2-3.2-6.9-3.2s-5.2,1.2-6.9,3.2c-0.4,0.4-0.3,1.1,0.1,1.4c0.4,0.4,1.1,0.3,1.4-0.1C16,13.9,17.9,13,20,13s4,0.9,5.4,2.5c0.2,0.2,0.5,0.4,0.8,0.4c0.2,0,0.5-0.1,0.6-0.2C27.2,15.3,27.2,14.6,26.9,14.2z"/></svg>`;


const { height } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { locationStatus, requestLocation, checkAllPermissions } = usePermissions();
  const { unreadCount, fetchUnreadCount } = usePushNotifications(useUserStore((state) => state.user?.id || null));
  const [rationaleVisible, setRationaleVisible] = useState(false);
  const [isInsideAP, setIsInsideAP] = useState(true);
  const { currentRide, driverLocation, clearRide, setRide } = useRideStore();

  // Rating States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);

  // ─── Active Ride Recovery ─────────────────────────────────────────────────
  // On every focus, check if there is an active ride the rider is mid-trip on.
  // This handles app relaunches during an in-progress or accepted trip.
  useFocusEffect(
    React.useCallback(() => {
      const recoverActiveRide = async () => {
        try {
          const response = await api.get('/rides/my-active-ride');
          if (response.data && response.data.id) {
            const ride = response.data;
            setRide({
              id: ride.id,
              pickup_address: ride.pickup_address,
              dropoff_address: ride.dropoff_address,
              estimated_fare: ride.estimated_fare,
              status: ride.status?.toUpperCase() as any,
              otp: ride.otp,
              driver: ride.driver ? {
                name: ride.driver.name,
                phone: ride.driver.phone_number,
                vehicle_number: ride.driver.vehicle_number,
                vehicle_model: ride.driver.vehicle_model,
                rating: ride.driver.rating,
              } : undefined,
            });
          }
        } catch (_) {
          // No active ride or network error — stay on home screen silently
        }
      };
      recoverActiveRide();
    }, [])
  );

  useEffect(() => {
    if (currentRide?.status === 'COMPLETED' && !ratingModalVisible) {
      setRatingModalVisible(true);
    }
  }, [currentRide?.status]);

  const submitRating = async () => {
    if (!currentRide) return;
    try {
      setIsSubmittingRating(true);
      const response = await api.post('/ratings', {
        ride_id: currentRide.id,
        stars: ratingValue,
        comment: ratingComment || 'Excellent ride',
        rated_user_role: 'driver',
      });
      console.log('[Rating] Success:', response.data);
      setRatingModalVisible(false);
      clearRide();
      Alert.alert('Thank You', 'Thank you for your feedback!');
    } catch (error: any) {
      console.error('Rating error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit rating';
      Alert.alert('Rating Failed', errorMsg);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    (async () => {
      try {
        if (locationStatus === 'denied' || locationStatus === 'permanently_denied') {
          setRationaleVisible(true);
          setIsLocationReady(true);
          return;
        }

        if (locationStatus === 'undetermined') {
          // Wait for usePermissions to finish the initial check
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(location);
        setIsLocationReady(true);
      } catch (error) {
        console.log('Location error:', error);
        setIsLocationReady(true);
      }
    })();
  }, [locationStatus]);

  useEffect(() => {
    if (location) {
      const inAP = isLocationInAndhraPradesh(
        location.coords.latitude,
        location.coords.longitude
      );
      setIsInsideAP(inAP);

      // Fetch nearby drivers when location is available
      const fetchNearby = async () => {
        try {
          const drivers = await rideAPI.getNearbyDrivers(
            location.coords.latitude,
            location.coords.longitude
          );
          setNearbyDrivers(drivers);
        } catch (error) {
          console.log('Error fetching nearby drivers:', error);
        }
      };

      fetchNearby();
      const interval = setInterval(fetchNearby, 15000); // Refresh every 15s
      return () => clearInterval(interval);
    }
  }, [location]);

  const handleRationaleAllow = async () => {
    setRationaleVisible(false);
    await requestLocation();
    checkAllPermissions();
  };

  const getInitialRegion = () => {
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    // Default to Anantapur if location not available
    return {
      latitude: 14.6824,
      longitude: 77.6017,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} >
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />

      <Modal
        animationType="none"
        transparent={true}
        visible={isDrawerVisible}
        onRequestClose={() => setIsDrawerVisible(false)}
      >
        <View style={styles.drawerContainer}>
          <ProfileDrawer
            onClose={() => setIsDrawerVisible(false)}
            onReadCountChange={fetchUnreadCount}
          />
        </View>
      </Modal>

      {isLocationReady ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={getInitialRegion()}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          loadingEnabled={true}
          loadingIndicatorColor="#666666"
          loadingBackgroundColor="#eeeeee"
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description="You are here"
            />
          )}

          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              }}
              title="Driver Center"
              description="Your driver is here"
            >
              <Image
                source={require('../../../assets/cab_icon.png')}
                style={{ width: 40, height: 40, resizeMode: 'contain' }}
              />
            </Marker>
          )}

          {nearbyDrivers.map((driver) => (
            <Marker
              key={driver.user_id}
              coordinate={{
                latitude: driver.current_latitude,
                longitude: driver.current_longitude,
              }}
              title={driver.vehicle_model}
              flat={true} // Makes it look better on rotation
            >
              <Image
                source={
                  driver.vehicle_type?.includes('auto') 
                    ? require('../../../assets/auto_icon.png')
                    : driver.vehicle_type?.includes('luxury_bike') || driver.vehicle_type?.includes('premium')
                    ? require('../../../assets/premium_bike.png')
                    : require('../../../assets/bike_icon.png')
                }
                style={{ width: 35, height: 35, resizeMode: 'contain' }}
              />
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <View style={[styles.headerContainer, { top: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.NotificationBell} onPress={() => setIsDrawerVisible(true)}>
          <Image source={require('../../../assets/bell_icon.png')} style={{ width: 24, height: 24 }} />
          {unreadCount > 0 && (
            <View style={styles.unreadDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')}>
          <View style={styles.searchIcon}>
            <SvgXml xml={searchXml} width="24" height="24" />
          </View>
          <Text style={styles.searchInput}>Where are you going ?</Text>
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Floating Bottom Action */}
      <View style={[styles.bottomActionContainer, { bottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={styles.bookRideButton}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Feather name="navigation" size={20} color="white" style={styles.bookRideIcon} />
          <Text style={styles.bookRideButtonText}>Book a Ride Now</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Modal */}
      <Modal transparent visible={ratingModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How was your ride?</Text>
            <Text style={styles.modalSubtitle}>Rate your driver {currentRide?.driver?.name}</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                  <Feather
                    name="star"
                    size={40}
                    color={star <= ratingValue ? "#FF5722" : "#E2E8F0"}
                    style={star <= ratingValue ? styles.starFilled : null}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Leave a comment..."
              multiline
              value={ratingComment}
              onChangeText={setRatingComment}
            />

            <TouchableOpacity
              style={[styles.bookRideButton, { marginTop: 20 }]}
              onPress={submitRating}
              disabled={isSubmittingRating}
            >
              <Text style={styles.bookRideButtonText}>
                {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => { setRatingModalVisible(false); clearRide(); }}
              disabled={isSubmittingRating}
            >
              <Text style={{ color: '#64748B', fontWeight: '500' }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PermissionRationaleModal
        isVisible={rationaleVisible}
        title="Location Access Required"
        description="Ride Andhra uses your location to show available rides and help drivers find you easily."
        icon="map-marker-radius"
        onAllow={handleRationaleAllow}
        onCancel={() => setRationaleVisible(false)}
      />

      <RegionalRestrictionModal isVisible={!isInsideAP && !!location} />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ebedef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
  },
  headerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  NotificationBell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    flex: 1,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
    width: 24,
    height: 24,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  logoContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  bottomActionContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookRideButton: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  bookRideIcon: {
    marginRight: 10,
  },
  bookRideButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 8,
  },
  starFilled: {
    textShadowColor: 'rgba(255, 87, 34, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ratingInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#1E293B',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default HomeScreen;