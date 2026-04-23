import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useDriverRegistration } from '../context/DriverRegistrationContext';

const VehicleInfoScreen = ({ navigation }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const luxuryBikes = [
    'KTM 390 Duke',
    'KTM RC 390',
    'Royal Enfield Continental GT 650',
    'Royal Enfield Interceptor 650',
    'Royal Enfield Super Meteor 650',
    'BMW G 310 R',
    'BMW G 310 GS',
    'Kawasaki Ninja 300',
    'Kawasaki Ninja 400',
    'Triumph Speed 400',
    'Triumph Scrambler 400X',
    'Harley-Davidson X440 (Premium)',
    'Hero Mavrick 440 (Premium)'
  ];

  const handleChooseImage = async (imageType: 'rc' | 'insurance') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.5,
    });

    if (pickerResult.canceled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      if (imageType === 'rc') {
        setRegistrationData({ rcPhoto: pickerResult.assets[0].uri });
      } else {
        setRegistrationData({ rcBackPhoto: pickerResult.assets[0].uri });
      }
    }
  };

  const handleSave = () => {
    if (
      registrationData.vehicleModel && 
      registrationData.vehiclePlateNumber && 
      registrationData.vehicleColor &&
      registrationData.rcPhoto &&
      registrationData.rcBackPhoto
    ) {
      markStepAsCompleted('4');
      navigation.goBack();
    } else {
      Alert.alert('Incomplete Information', 'Please fill all fields and upload both RC Front and Back images');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vehicle Information</Text>
        
        <Text style={styles.label}>Vehicle Model</Text>
        {registrationData.vehicleType === 'luxury_bike' ? (
          <View style={styles.luxuryListContainer}>
            <Text style={styles.subLabel}>Eligible Luxury Bikes (₹3L - ₹5L range):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {luxuryBikes.map((model) => (
                <TouchableOpacity 
                  key={model} 
                  style={[
                    styles.chip,
                    registrationData.vehicleModel === model && styles.selectedChip
                  ]}
                  onPress={() => setRegistrationData({ vehicleModel: model })}
                >
                  <Text style={[
                    styles.chipText,
                    registrationData.vehicleModel === model && styles.selectedChipText
                  ]}>{model}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Or enter your luxury bike model manually"
              value={registrationData.vehicleModel || ''}
              onChangeText={(text) => setRegistrationData({ vehicleModel: text })}
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Enter your vehicle name (e.g., Bajaj Pulsar)"
            value={registrationData.vehicleModel || ''}
            onChangeText={(text) => setRegistrationData({ vehicleModel: text })}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Enter your vehicle number (e.g., AP 39 AB 1234)"
          value={registrationData.vehiclePlateNumber || ''}
          onChangeText={(text) => setRegistrationData({ vehiclePlateNumber: text })}
          autoCapitalize="characters"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Enter your vehicle color (e.g., Black)"
          value={registrationData.vehicleColor || ''}
          onChangeText={(text) => setRegistrationData({ vehicleColor: text })}
        />

        <Text style={styles.label}>Vehicle Documents</Text>
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>RC Front/Book</Text>
            <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('rc')}>
              {registrationData.rcPhoto ? (
                <Image source={{ uri: registrationData.rcPhoto }} style={styles.image} />
              ) : (
                <Text style={styles.imageButtonText}>Upload RC</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>RC Back</Text>
            <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('insurance')}>
              {registrationData.rcBackPhoto ? (
                <Image source={{ uri: registrationData.rcBackPhoto }} style={styles.image} />
              ) : (
                <Text style={styles.imageButtonText}>Upload RC Back</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
          Save and Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  imageWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  imageButton: {
    height: 120,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: 12,
  },
  imageButtonText: {
    color: '#fe7009',
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#fe7009',
    borderRadius: 10,
    paddingVertical: 4,
  },
  luxuryListContainer: {
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  chipScroll: {
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#fe7009',
    borderColor: '#fe7009',
  },
  chipText: {
    fontSize: 13,
    color: '#444',
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VehicleInfoScreen;

