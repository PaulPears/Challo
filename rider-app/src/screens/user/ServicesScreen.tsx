
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

const services = [
  { image: require('../../../assets/ambulance_icon.png'), name: 'Ambulance', isEmergency: true, badge: '24x7 Emergency' },
  { image: require('../../../assets/auto_icon.png'), name: 'Auto' },
  { image: require('../../../assets/bike_icon.png'), name: 'Bike' },
  { image: require('../../../assets/premium_bike.png'), name: 'Premium Bike' },
  { image: require('../../../assets/bike_lite_icon.png'), name: 'Bike-lite' },
  { image: require('../../../assets/cab_icon.png'), name: 'Cab' },
  { image: require('../../../assets/parcel_icon.png'), name: 'Parcel' },
];


const ServicesScreen = ({ navigation }: any) => {
  const handleServicePress = (serviceName: string) => {
    navigation.navigate('Search', { preferredVehicle: serviceName.toLowerCase() });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Challo Services</Text>

      <TouchableOpacity
        style={styles.sosCard}
        onPress={() => navigation.navigate('Sos')}
        activeOpacity={0.8}
      >
        <View style={styles.sosIconContainer}>
          <Text style={{ fontSize: 24 }}>🚨</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.sosCardTitle}>Emergency & Safety (SOS)</Text>
          <Text style={styles.sosCardSubtitle}>24x7 Ambulance, Police, Fire & Helpline</Text>
        </View>
        <Text style={styles.sosBadge}>One-Tap</Text>
      </TouchableOpacity>

      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.serviceButton,
              service.isEmergency && styles.emergencyServiceButton
            ]} 
            onPress={() => handleServicePress(service.name)}
          >
            <View style={[styles.vehicleImageWrapper, service.isEmergency && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Image source={service.image} style={styles.vehicleImage} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceText, service.isEmergency && { color: '#DC2626', fontWeight: '800' }]}>
                {service.name}
              </Text>
              {service.badge && (
                <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '700', marginTop: 2 }}>
                  {service.badge}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: service.isEmergency ? '#DC2626' : '#9CA3AF' }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 18,
    color: '#111827',
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
  },
  sosIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  sosCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  sosBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  servicesContainer: {
    paddingHorizontal: 20,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleImage: {
    width: 50,
    height: 50,
  },
  serviceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emergencyServiceButton: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
});

export default ServicesScreen;
