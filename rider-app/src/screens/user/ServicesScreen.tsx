
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

const services = [
  { image: require('../../../assets/auto_icon.png'), name: 'Auto' },
  { image: require('../../../assets/bike_icon.png'), name: 'Bike' },
  { image: require('../../../assets/bike_lite_icon.png'), name: 'Bike-lite' },
  { image: require('../../../assets/cab_icon.png'), name: 'Cab' },
  { image: require('../../../assets/parcel_icon.png'), name: 'Parcel' },
];


const ServicesScreen = ({ navigation }: any) => {
  const handleServicePress = (serviceName: string) => {
    console.log(`Selected ${serviceName} service`);
    // Navigate to SearchScreen where user can enter pickup/dropoff locations
    navigation.navigate('Search');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Our Services</Text>
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <TouchableOpacity key={index} style={styles.serviceButton} onPress={() => handleServicePress(service.name)}>
            <Image source={service.image} style={styles.vehicleImage} resizeMode="contain" />
            <Text style={styles.serviceText}>{service.name}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#111827',
  },
  servicesContainer: {
    paddingHorizontal: 20,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImage: {
    width: 50,
    height: 50,
    marginRight: 20,
  },
  serviceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});

export default ServicesScreen;
