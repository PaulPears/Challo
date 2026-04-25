import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '../../config/constants';
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

  // Standard distance/duration update from MapViewDirections
  React.useEffect(() => {
    // If MapViewDirections fails or takes too long, use a direct estimate
    const timer = setTimeout(() => {
      if (distance === 0) {
        console.log('Directions API timeout, using fallback...');
        const directDist = calculateDirectDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        setDistance(directDist);
        setDuration(directDist * 2); // Simple estimate: 1km = 2 mins
      }
    }, 4000); // Wait 4 seconds for Google Maps

    return () => clearTimeout(timer);
  }, [distance]);

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
          const vehicleOrder = ['auto', 'bike', 'luxury_bike', 'bike_lite', 'cab', 'parcel'];

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
            })
            .sort((a: VehicleOption, b: VehicleOption) => {
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
            // Auto-select the cheapest vehicle if none selected yet or just loaded
            setSelectedVehicle(cheapest.vehicle);
          } else {
            setCheapestOption(null);
          }
        } catch (error) {
          console.error('Error fetching fare estimates:', error);
          setError('Failed to fetch fare estimates. Please try again.');
          setVehicleOptions([]);
          setCheapestOption(null);
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
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: pickup.lat,
          longitude: pickup.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pick-up" />
        <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} title="Drop-off" />
        <MapViewDirections
          origin={{ latitude: pickup.lat, longitude: pickup.lng }}
          destination={{ latitude: dropoff.lat, longitude: dropoff.lng }}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={3}
          strokeColor="hotpink"
          onReady={(result) => {
            console.log('Directions API Ready:', result.distance);
            setDistance(result.distance);
            setDuration(result.duration);
          }}
          onError={(errorMessage) => {
            console.log('Directions API Error:', errorMessage);
            // Fallback is handled by the useEffect timer
          }}
        />
      </MapView>
      <View style={[styles.detailsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.distanceText}>Distance: {distance ? distance.toFixed(2) : '0.00'} km</Text>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {user?.super_coins_balance && user.super_coins_balance > 0 ? (
            <View style={styles.coinsCard}>
              <View style={styles.coinsHeader}>
                <Text style={styles.coinIcon}>🪙</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.coinsTitle}>Super Coins Reserve</Text>
                  <Text style={styles.coinsSubtitle}>You have {user.super_coins_balance} coins available (₹{user.super_coins_balance} off)</Text>
                </View>
                <Switch
                  value={useCoins}
                  onValueChange={setUseCoins}
                  trackColor={{ false: '#767577', true: '#FF9800' }}
                  thumbColor={useCoins ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>
          ) : null}

          {user?.super_km_balance && user.super_km_balance > 0 ? (
            <View style={[styles.coinsCard, { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' }]}>
              <View style={styles.coinsHeader}>
                <Text style={styles.coinIcon}>🚀</Text>
                <View style={{flex: 1}}>
                  <Text style={[styles.coinsTitle, { color: '#0D47A1' }]}>Super Kilometer Balance</Text>
                  <Text style={[styles.coinsSubtitle, { color: '#1565C0' }]}>You have {user.super_km_balance} KM available</Text>
                </View>
                <Switch
                  value={useSuperKm}
                  onValueChange={setUseSuperKm}
                  trackColor={{ false: '#767577', true: '#2196F3' }}
                  thumbColor={useSuperKm ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>
          ) : null}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF5722" />
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

          {!isLoading && vehicleOptions.map((option) => (
            <View key={option.vehicle}>
              <TouchableOpacity
                style={[
                  styles.vehicleContainer,
                  selectedVehicle === option.vehicle && styles.selectedVehicleContainer,
                  cheapestOption && option.vehicle === cheapestOption.vehicle && !(selectedVehicle === option.vehicle) && styles.cheapestVehicleContainer,
                ]}
                onPress={() => setSelectedVehicle(option.vehicle)}
                activeOpacity={0.7}
              >
                <View style={styles.vehicleInfo}>
                  <Image source={getVehicleImage(option.vehicle)} style={{ width: 40, height: 40, marginRight: 10 }} resizeMode="contain" />
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.vehicleName}>{option.vehicle}</Text>
                      {option.breakdown?.surgeMultiplier > 1 && (
                        <View style={styles.miniSurgeBadge}>
                          <Text style={styles.miniSurgeText}>🔥 {option.breakdown.surgeMultiplier}x</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.arrivalTime}>Rider arrives in {option.estimatedTime ? option.estimatedTime.toFixed(0) : '0'} min</Text>
                  </View>
                </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {useSuperKm && option.breakdown?.superKmDiscount > 0 ? (
                      <>
                        <Text style={[styles.costText, { textDecorationLine: 'line-through', color: '#999', fontSize: 13 }]}>₹{option.cost.toFixed(2)}</Text>
                        <Text style={[styles.costText, { color: '#2196F3' }]}>₹{(option.breakdown.riderPayable || 0).toFixed(2)}</Text>
                        <Text style={{ fontSize: 10, color: '#4CAF50' }}>-{option.breakdown.superKmApplied} KM used</Text>
                      </>
                    ) : (useCoins && user?.super_coins_balance && user.super_coins_balance > 0) ? (
                      <>
                        <Text style={[styles.costText, { textDecorationLine: 'line-through', color: '#999', fontSize: 13 }]}>₹{option.cost.toFixed(2)}</Text>
                        <Text style={[styles.costText, { color: '#FF5722' }]}>
                          ₹{Math.max(0, option.cost - user.super_coins_balance).toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.costText}>₹{option.cost ? option.cost.toFixed(2) : '0.00'}</Text>
                    )}
                  </View>
              </TouchableOpacity>
              
              {selectedVehicle === option.vehicle && option.breakdown && (
                <FareBreakdownCard {...option.breakdown} distance={distance} />
              )}
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={async () => {
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
              status: 'SEARCHING',
              otp: newRide.otp,  // ← store OTP so Trip PIN shows in modal
            });

            navigation.navigate('WaitingForDriver', { ride: newRide });
          } catch (error) {
            console.error('Failed to create ride:', error);
          }
        }}>
          <Text style={styles.buttonText}>Send Ride Request</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  selectedVehicleContainer: {
    backgroundColor: '#FFE5E0', // Very light orange/active color
    borderColor: '#FF5722',
    borderWidth: 1,
  },
  cheapestVehicleContainer: {
    backgroundColor: '#FFF3E0', // Light orange background
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrivalTime: {
    fontSize: 12,
    color: '#666',
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#FFEBE6',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: '#FF5722'
  },
  miniSurgeText: {
    fontSize: 10,
    color: '#FF5722',
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