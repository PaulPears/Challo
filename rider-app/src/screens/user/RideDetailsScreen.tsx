import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RideDetailsScreen = ({ navigation }: any) => {
  const rideOptions = [
    { name: 'Bike', price: 89, icon: '🏍️' },
    { name: 'Auto', price: 120, icon: '🛺' },
    { name: 'Cab', price: 150, icon: '🚗' },
    { name: 'Bike-lite', price: 70, icon: '🛵' },
    { name: 'Parcel', price: 50, icon: '📦' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a ride</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapText}>Route Map</Text>
        <Text style={styles.mapSubtext}>Hitech City → Charminar</Text>
      </View>

      {/* Ride Details & Options */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Locations */}
          <View style={styles.locationsContainer}>
            <View style={styles.locationRow}>
              <Text style={styles.greenPin}>📍</Text>
              <Text style={styles.locationText}>Hitech City, Hyderabad</Text>
            </View>
            <View style={styles.dottedLine} />
            <View style={styles.locationRow}>
              <Text style={styles.redPin}>📍</Text>
              <Text style={styles.locationText}>Charminar, Hyderabad</Text>
            </View>
          </View>

          {/* Ride Options */}
          <Text style={styles.optionsTitle}>Choose a ride</Text>
          {rideOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.rideOption}>
              <View style={styles.rideOptionLeft}>
                <Text style={styles.rideIcon}>{option.icon}</Text>
                <View>
                  <Text style={styles.rideName}>{option.name}</Text>
                  <Text style={styles.rideTime}>2 mins away</Text>
                </View>
              </View>
              <Text style={styles.ridePrice}>₹{option.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  mapContainer: {
    height: 256,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#6b7280',
    fontSize: 18,
  },
  mapSubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  locationsContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenPin: {
    color: '#10b981',
    fontSize: 18,
  },
  redPin: {
    color: '#ef4444',
    fontSize: 18,
  },
  locationText: {
    marginLeft: 8,
  },
  dottedLine: {
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    height: 24,
    marginLeft: 9,
    marginVertical: 4,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  rideOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rideName: {
    fontSize: 18,
    fontWeight: '600',
  },
  rideTime: {
    color: '#6b7280',
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: '600',
    fontSize: 18,
  },
});

export default RideDetailsScreen;