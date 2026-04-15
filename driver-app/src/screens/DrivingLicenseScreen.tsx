import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useDriverRegistration } from '../context/DriverRegistrationContext';

const DrivingLicenseScreen = ({ navigation }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const handleChooseImage = async (imageType: 'front' | 'back') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (pickerResult.cancelled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      if (imageType === 'front') {
        setRegistrationData({ licenseFrontPhoto: pickerResult.assets[0].uri });
      } else {
        setRegistrationData({ licenseBackPhoto: pickerResult.assets[0].uri });
      }
    }
  };

  const handleSave = () => {
    if (registrationData.drivingLicenseNumber && registrationData.licenseFrontPhoto && registrationData.licenseBackPhoto) {
      markStepAsCompleted('3');
      navigation.goBack();
    } else {
      alert('Please fill all the fields and upload both images');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Driving License</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your driving license number"
          value={registrationData.drivingLicenseNumber || ''}
          onChangeText={(text) => setRegistrationData({ drivingLicenseNumber: text })}
        />
        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('front')}>
            {registrationData.licenseFrontPhoto ? (
              <Image source={{ uri: registrationData.licenseFrontPhoto }} style={styles.image} />
            ) : (
              <Text style={styles.imageButtonText}>Upload Front</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('back')}>
            {registrationData.licenseBackPhoto ? (
              <Image source={{ uri: registrationData.licenseBackPhoto }} style={styles.image} />
            ) : (
              <Text style={styles.imageButtonText}>Upload Back</Text>
            )}
          </TouchableOpacity>
        </View>
        <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
          Save and Continue
        </Button>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageButton: {
    height: 150,
    width: 150,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 150,
    width: 150,
    borderRadius: 10,
  },
  imageButtonText: {
    color: '#666',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#fe7009',
  },
});

export default DrivingLicenseScreen;

