import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import OlaMapView, { OlaMarker } from '../../components/OlaMapView';
import api from '../../api/axiosClient';
import { rideAPI } from '../../api/rideAPI';
import useRideStore from '../../store/rideStore';
import useUserStore from '../../store/userStore';
import FareBreakdownCard from '../../components/FareBreakdownCard';

interface VehicleOption {
  vehicle: string;
  type: string;
  cost: number;
  estimatedTime: number;
  breakdown?: any;
}

const BookingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { pickup, dropoff } = route.params;
  const { setRide } = useRideStore();
  const { user, fetchUserProfile } = useUserStore();
  React.useEffect(() => { fetchUserProfile(); }, []);
  console.log('Pickup:', pickup);
  console.log('Dropoff:', dropoff);
  const [distance, setDistance] = React.useState(0);
  const [useCoins, setUseCoins] = React.useState(false);
  const [useSuperKm, setUseSuperKm] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [selectedVehicle, setSelectedVehicle] = React.useState('');

  const [vehicleOptions, setVehicleOptions] = React.useState<VehicleOption[]>([]);
  const [cheapestOption, setCheapestOption] = React.useState<VehicleOption | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getVehicleImage = (vehicle: string) => {
    const type = vehicle.toLowerCase();
    if (type.includes('ambulance') || type.includes('hospital') || type.includes('medical')) return require('../../../assets/ambulance_icon.png');
    if (type.includes('cab') || type.includes('car')) return require('../../../assets/cab_icon.png');
    if (type.includes('bike-lite') || type.includes('bike_lite')) return require('../../../assets/bike_lite_icon.png');
    if (type.includes('luxury_bike') || type.includes('luxury bike') || type.includes('premium')) return require('../../../assets/premium_bike.png');
    if (type.includes('bike')) return require('../../../assets/bike_icon.png');
    if (type.includes('auto')) return require('../../../assets/auto_icon.png');
    if (type.includes('parcel')) return require('../../../assets/parcel_icon.png');
    return require('../../../assets/cab_icon.png');
  };

  const calculateDirectDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d * 1.25; // Add 25% for road distance estimate
  };

  // Placeholder for rider's distance from booker (e.g., 3-5km radius)
  const riderDistance = 4; // km
  const averageRiderSpeed = 50; // km/h

  // Fetch road distance/duration from Ola Maps backend
  React.useEffect(() => {
    let isMounted = true;
    const fetchDirections = async () => {
      try {
        const res = await api.get(`/maps/directions?origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}`);
        const route = res.data?.routes?.[0];
        if (route) {
          const distKm = (route.legs?.[0]?.distance?.value || route.distance || 0) / 1000;
          const durMin = (route.legs?.[0]?.duration?.value || route.duration || 0) / 60;
          if (isMounted && distKm > 0) {
            setDistance(distKm);
            setDuration(durMin || distKm * 2);
            return;
          }
        }
      } catch (err) {
        console.log('Ola Maps directions error, using fallback:', err);
      }
      if (isMounted) {
        const directDist = calculateDirectDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        setDistance(directDist);
        setDuration(directDist * 2);
      }
    };
    fetchDirections();
    return () => { isMounted = false; };
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  React.useEffect(() => {
    if (distance > 0 && duration > 0) {
      const getVehicleOptions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Call the fare-estimate endpoint once to get all vehicle fares
          const fareEstimates = await rideAPI.getFare(
            distance * 1000, 
            duration * 60, 
            pickup.lat, 
            pickup.lng,
            dropoff.lat,
            dropoff.lng,
            useSuperKm ? user?.super_km_balance : 0
          );

          // Define the desired order
          const vehicleOrder = ['ambulance', 'auto', 'bike', 'luxury_bike', 'bike_lite', 'cab', 'parcel'];

          // Map and Filter the response
          const options: VehicleOption[] = fareEstimates
            .filter((estimate: any) => vehicleOrder.includes(estimate.vehicleType.toLowerCase()))
            .map((estimate: any) => {
              let estimatedTime = (riderDistance / averageRiderSpeed) * 60; // in minutes
              const vehicleType = estimate.vehicleType.toLowerCase();

              // Add extra time for certain vehicle types
              if (vehicleType === 'cab' || vehicleType === 'car' || vehicleType === 'auto') {
                estimatedTime += 4;
              }

              // Normalize vehicle type for display
              // 'bike_lite' -> 'Bike-lite', 'luxury_bike' -> 'Luxury Bike', etc.
              const displayVehicle = 
                vehicleType === 'ambulance' ? 'Ambulance (Emergency)' :
                vehicleType === 'bike_lite' ? 'Bike-lite' :
                vehicleType === 'luxury_bike' ? 'Premium Bike' :
                vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);

              return {
                vehicle: displayVehicle,
                type: vehicleType,
                cost: estimate.totalFare || estimate.fare || 0,
                estimatedTime: estimatedTime,
                breakdown: estimate
              };
            });

          // Ensure Ambulance Emergency option is available even if backend hasn't seeded it
          if (!options.some(opt => opt.type === 'ambulance')) {
            const ambFare = Math.round(150 + distance * 22);
            options.push({
              vehicle: 'Ambulance (Emergency)',
              type: 'ambulance',
              cost: ambFare,
              estimatedTime: Math.max(3, Math.round((riderDistance / averageRiderSpeed) * 35)),
              breakdown: {
                totalFare: ambFare,
                baseFare: 150,
                vehicleType: 'ambulance',
                isEmergency: true
              }
            });
          }

          options.sort((a: VehicleOption, b: VehicleOption) => {
            const orderA = vehicleOrder.indexOf(a.vehicle.toLowerCase().replace('-', '_'));
            const orderB = vehicleOrder.indexOf(b.vehicle.toLowerCase().replace('-', '_'));
            return orderA - orderB;
          });

          setVehicleOptions(options);

          if (options.length > 0) {
            const cheapest = options.reduce((prev, current) =>
              prev.cost < current.cost ? prev : current
            );
            setCheapestOption(cheapest);
            
            // Pre-select preferred vehicle if chosen from home quick-action strip
            const prefType = route.params?.preferredVehicle?.toLowerCase();
            const matchedPref = prefType ? options.find(o => o.type.toLowerCase().includes(prefType)) : null;
            setSelectedVehicle(matchedPref ? matchedPref.vehicle : cheapest.vehicle);
          } else {
            throw new Error('No options returned from backend');
          }
        } catch (error) {
          console.error('Error fetching fare estimates:', error);
          const safeDist = Math.max(1, Math.min(distance || 5, 25));
          const fallbackOptions: VehicleOption[] = [
            {
              vehicle: 'Ambulance (Emergency)',
              type: 'ambulance',
              cost: Math.round(150 + safeDist * 25),
              estimatedTime: 3,
              breakdown: { totalFare: Math.round(150 + safeDist * 25), isEmergency: true }
            },
            {
              vehicle: 'Auto',
              type: 'auto',
              cost: Math.round(35 + safeDist * 14),
              estimatedTime: 4,
              breakdown: { totalFare: Math.round(35 + safeDist * 14) }
            },
            {
              vehicle: 'Bike',
              type: 'bike',
              cost: Math.round(25 + safeDist * 9),
              estimatedTime: 2,
              breakdown: { totalFare: Math.round(25 + safeDist * 9) }
            },
            {
              vehicle: 'Cab',
              type: 'cab',
              cost: Math.round(75 + safeDist * 20),
              estimatedTime: 6,
              breakdown: { totalFare: Math.round(75 + safeDist * 20) }
            },
          ];
          setVehicleOptions(fallbackOptions);
          const prefType = route.params?.preferredVehicle?.toLowerCase();
          const matchedPref = prefType ? fallbackOptions.find(o => o.type.toLowerCase().includes(prefType)) : null;
          setSelectedVehicle(matchedPref ? matchedPref.vehicle : fallbackOptions[1].vehicle);
          setCheapestOption(fallbackOptions[2]);
        } finally {
          setIsLoading(false);
        }
      };
      getVehicleOptions();

      // Set up auto-refresh every 30 seconds
      const interval = setInterval(getVehicleOptions, 30000);
      return () => clearInterval(interval);
    }
  }, [distance, duration, pickup.lat, pickup.lng, useSuperKm]);

  return (
    <SafeAreaView style={styles.container}>
      <OlaMapView
        style={styles.map}
        center={{ latitude: pickup.lat, longitude: pickup.lng }}
        markers={[
          {
            id: 'pickup',
            latitude: pickup.lat,
            longitude: pickup.lng,
            title: 'Pick-up',
            type: 'pickup' as const,
          },
          {
            id: 'dropoff',
            latitude: dropoff.lat,
            longitude: dropoff.lng,
            title: 'Drop-off',
            type: 'dropoff' as const,
          },
        ]}
        routeCoordinates={[
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ]}
      />
      <View style={[styles.detailsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.distanceText}>Distance: {distance ? distance.toFixed(2) : '0.00'} km</Text>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {user ? (
            <View style={[styles.coinsCard, (!user.super_coins_balance || user.super_coins_balance <= 0) && { opacity: 0.6 }]}>
              <View style={styles.coinsHeader}>
                <Text style={styles.coinIcon}>🪙</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.coinsTitle}>Super Coins Reserve</Text>
                  <Text style={styles.coinsSubtitle}>
                    {(user.super_coins_balance && user.super_coins_balance > 0)
                      ? `You have ${user.super_coins_balance} coins available (₹${user.super_coins_balance} off)`
                      : `Earn coins on completed rides`}
                  </Text>
                </View>
                <Switch
                  value={useCoins}
                  onValueChange={setUseCoins}
                  disabled={!user.super_coins_balance || user.super_coins_balance <= 0}
                  trackColor={{ false: '#767577', true: '#FF9800' }}
                  thumbColor={useCoins ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>
          ) : null}

          {user ? (
            <View style={[styles.coinsCard, { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' }, (!user.super_km_balance || user.super_km_balance <= 0) && { opacity: 0.6 }]}>
              <View style={styles.coinsHeader}>
                <Text style={styles.coinIcon}>🚀</Text>
                <View style={{flex: 1}}>
                  <Text style={[styles.coinsTitle, { color: '#0D47A1' }]}>Super Kilometer Balance</Text>
                  <Text style={[styles.coinsSubtitle, { color: '#1565C0' }]}>
                    {(user.super_km_balance && user.super_km_balance > 0)
                      ? `You have ${user.super_km_balance} KM available`
                      : `Complete rides to earn Super KM`}
                  </Text>
                </View>
                <Switch
                  value={useSuperKm}
                  onValueChange={setUseSuperKm}
                  disabled={!user.super_km_balance || user.super_km_balance <= 0}
                  trackColor={{ false: '#767577', true: '#2196F3' }}
                  thumbColor={useSuperKm ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>
          ) : null}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E5A915" />
              <Text style={styles.loadingText}>Fetching best prices for you...</Text>
            </View>
          )}

          {!isLoading && distance === 0 && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Finding Route...</Text>
              <Text style={styles.errorText}>We are calculating the distance between your locations. Please wait a moment.</Text>
            </View>
          )}

          {!isLoading && vehicleOptions.length === 0 && distance > 0 && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>No Rides Available</Text>
              <Text style={styles.errorText}>Sorry, we couldn't find any available ride types for this route at the moment.</Text>
            </View>
          )}

          {!isLoading && vehicleOptions.map((option) => {
            const isSelected = selectedVehicle === option.vehicle;
            const isCheapest = cheapestOption && option.vehicle === cheapestOption.vehicle && !isSelected;
            const isAmbulance = option.type === 'ambulance';

            return (
              <TouchableOpacity
                key={option.vehicle}
                style={[
                  styles.vehicleContainer,
                  isSelected && styles.selectedVehicleContainer,
                  isCheapest && styles.cheapestVehicleContainer,
                  isAmbulance && (isSelected ? styles.ambulanceSelectedContainer : styles.ambulanceContainer),
                ]}
                onPress={() => setSelectedVehicle(option.vehicle)}
                activeOpacity={0.8}
              >
                <View style={styles.vehicleInfo}>
                  <View style={[styles.vehicleImageWrapper, isSelected && styles.selectedImageWrapper, isAmbulance && styles.ambulanceImageWrapper]}>
                    <Image source={getVehicleImage(option.vehicle)} style={styles.vehicleImage} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.vehicleName, isSelected && styles.selectedVehicleName]}>{option.vehicle}</Text>
                      {isAmbulance && (
                        <View style={styles.emergencyBadge}>
                          <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
                        </View>
                      )}
                      {isCheapest && (
                        <View style={styles.bestPriceBadge}>
                          <Text style={styles.bestPriceText}>BEST VALUE</Text>
                        </View>
                      )}
                      {option.breakdown?.surgeMultiplier > 1 && (
                        <View style={styles.miniSurgeBadge}>
                          <Text style={styles.miniSurgeText}>🔥 {option.breakdown.surgeMultiplier}x</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.arrivalTime}>Arrives in {option.estimatedTime ? option.estimatedTime.toFixed(0) : '2'} mins</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                  {useSuperKm && option.breakdown?.superKmDiscount > 0 ? (
                    <>
                      <Text style={[styles.costText, { textDecorationLine: 'line-through', color: '#94a3b8', fontSize: 13 }]}>₹{option.cost.toFixed(2)}</Text>
                      <Text style={[styles.costText, { color: '#2563eb' }]}>₹{(option.breakdown.riderPayable || 0).toFixed(2)}</Text>
                      <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>-{option.breakdown.superKmApplied} KM used</Text>
                    </>
                  ) : (useCoins && user?.super_coins_balance && user.super_coins_balance > 0) ? (
                    <>
                      <Text style={[styles.costText, { textDecorationLine: 'line-through', color: '#94a3b8', fontSize: 13 }]}>₹{option.cost.toFixed(2)}</Text>
                      <Text style={[styles.costText, { color: '#0f172a' }]}>
                        ₹{Math.max(0, option.cost - user.super_coins_balance).toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.costText, isSelected && { color: '#92400e' }]}>₹{option.cost ? option.cost.toFixed(2) : '0.00'}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[styles.button, (!selectedVehicle || isLoading) && styles.buttonDisabled]}
          disabled={!selectedVehicle || isLoading}
          activeOpacity={0.85}
          onPress={async () => {
          try {
            const rideData: any = {};
            // Use snake_case field names to match backend DTO
            rideData.pickup_latitude = pickup.lat;
            rideData.pickup_longitude = pickup.lng;
            rideData.pickup_address = pickup.address;
            rideData.dropoff_latitude = dropoff.lat;
            rideData.dropoff_longitude = dropoff.lng;
            rideData.dropoff_address = dropoff.address;

            const baseFare = vehicleOptions.find(v => v.vehicle === selectedVehicle)?.cost || 0;
            rideData.fare = baseFare;
            
            if (useCoins && user?.super_coins_balance) {
               rideData.apply_super_coins = Math.min(baseFare, user.super_coins_balance);
            }

            if (useSuperKm) {
              rideData.apply_super_km = true;
            }

            rideData.distance = distance;
            rideData.duration = Math.round(duration);
            rideData.vehicle_type = vehicleOptions.find(v => v.vehicle === selectedVehicle)?.type || 
                                   (selectedVehicle === 'Premium Bike' ? 'luxury_bike' : selectedVehicle.toLowerCase().replace('-', '_').replace(' ', '_'));

            console.log('Sending ride data:', rideData);
            const newRide = await rideAPI.createRide(rideData);

            // Update global store so UserNavigator can subscribe to the correct channel
            // Use backend snake_case field names (pickup_address, dropoff_address, otp)
            setRide({
              id: newRide.id,
              pickup_address: newRide.pickup_address || pickup.address,
              dropoff_address: newRide.dropoff_address || dropoff.address,
              estimated_fare: newRide.estimated_fare || newRide.fare || rideData.fare,
              vehicle_type: newRide.vehicle_type || rideData.vehicle_type,
              status: 'SEARCHING',
              otp: newRide.otp,  // ← store OTP so Trip PIN shows in modal
            });

            navigation.navigate('WaitingForDriver', { ride: newRide });
          } catch (error) {
            console.error('Failed to create ride:', error);
          }
        }}>
          <Text style={styles.buttonText}>
            {selectedVehicle ? `Book ${selectedVehicle}` : 'Select a Vehicle'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#111827" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    height: '35%',
    width: '100%',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20, // Overlap the map slightly for modern look
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  vehicleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedVehicleContainer: {
    backgroundColor: '#FFFDF5',
    borderColor: '#E5A915',
    borderWidth: 2,
    shadowColor: '#E5A915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cheapestVehicleContainer: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  ambulanceContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderWidth: 1.5,
  },
  ambulanceSelectedContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedImageWrapper: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  ambulanceImageWrapper: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  vehicleImage: {
    width: 48,
    height: 48,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedVehicleName: {
    color: '#92400E',
    fontWeight: '800',
  },
  arrivalTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  costText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emergencyBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bestPriceBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 0.5,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestPriceText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  button: {
    backgroundColor: '#E5A915',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#E5A915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  coinsCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    marginTop: 5,
    marginHorizontal: 2,
  },
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  coinIcon: {
    fontSize: 24,
    marginRight: 10
  },
  coinsTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#F57F17'
  },
  coinsSubtitle: {
    fontSize: 12,
    color: '#F57F17',
    marginTop: 2
  },
  miniSurgeBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: '#E5A915'
  },
  miniSurgeText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: 'bold'
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});

export default BookingScreen;