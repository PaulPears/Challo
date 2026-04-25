import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api from '../config/api';
import { useDriverRegistration } from '../context/DriverRegistrationContext';
import { useAuth } from '../context/AuthContext';

const AadhaarPanScreen = ({ navigation }: { navigation: any }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();
  const { checkAuth, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChooseImage = async (imageType: 'aadhaar' | 'pan') => {
    // 1. Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You must grant gallery access to upload documents.");
      return;
    }

    // 2. Launch image library
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.3,
    });

    if (pickerResult.canceled === true) {
      return;
    }

    // 3. Update state with the new image URI
    if (pickerResult.assets && pickerResult.assets.length > 0) {
      if (imageType === 'aadhaar') {
        setRegistrationData({ aadhaarPhoto: pickerResult.assets[0].uri });
      } else {
        setRegistrationData({ panPhoto: pickerResult.assets[0].uri });
      }
    }
  };

  const handleSubmit = async () => {
    // Attempt to recover phone number from AuthContext if missing in registrationData
    const userPhone = user?.phone_number || user?.phoneNumber;
    const currentPhoneNumber = registrationData.phoneNumber || userPhone;

    const requiredFields: (keyof typeof registrationData)[] = [
      'aadhaarPhoto',
      'panPhoto',
      'name',
      'drivingLicenseNumber',
      'vehicleModel',
      'vehiclePlateNumber',
      'vehicleColor',
      'vehicleType',
      'rcPhoto',
      'rcBackPhoto',
    ];

    for (const field of requiredFields) {
      if (!registrationData[field]) {
        Alert.alert(
          'Incomplete Application',
          `It looks like some information is missing. Please go back and complete all previous steps. Missing: ${field}`
        );
        return;
      }
    }

    if (!currentPhoneNumber) {
      Alert.alert('Incomplete Application', 'Phone number is missing. Please try logging in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // 1. Profile Photo
      if (registrationData.profilePhoto) {
        formData.append('profilePhoto', {
          uri: registrationData.profilePhoto,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // 2. License Photos
      if (registrationData.licenseFrontPhoto) {
        formData.append('licenseFrontPhoto', {
          uri: registrationData.licenseFrontPhoto,
          name: 'license_front.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (registrationData.licenseBackPhoto) {
        formData.append('licenseBackPhoto', {
          uri: registrationData.licenseBackPhoto,
          name: 'license_back.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // 3. Aadhaar & PAN
      if (registrationData.aadhaarPhoto) {
        formData.append('aadhaarPhoto', {
          uri: registrationData.aadhaarPhoto,
          name: 'aadhaar.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (registrationData.panPhoto) {
        formData.append('panPhoto', {
          uri: registrationData.panPhoto,
          name: 'pan.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // 4. Vehicle Documents
      if (registrationData.rcPhoto) {
        formData.append('rcPhoto', {
          uri: registrationData.rcPhoto,
          name: 'rc.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (registrationData.rcBackPhoto) {
        formData.append('rcBackPhoto', {
          uri: registrationData.rcBackPhoto,
          name: 'rc_back.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (registrationData.insurancePhoto) {
        formData.append('insurancePhoto', {
          uri: registrationData.insurancePhoto,
          name: 'insurance.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // Ensure phone number is in E.164 format (+91...)
      const formattedPhoneNumber = currentPhoneNumber.startsWith('+')
        ? currentPhoneNumber
        : `+${currentPhoneNumber}`;

      formData.append('phoneNumber', formattedPhoneNumber);
      formData.append('name', registrationData.name!);
      formData.append('licenseNumber', registrationData.drivingLicenseNumber!);
      formData.append('vehicleModel', registrationData.vehicleModel!);
      formData.append('vehiclePlateNumber', registrationData.vehiclePlateNumber!);
      formData.append('vehicleColor', registrationData.vehicleColor!);
      formData.append('vehicleType', registrationData.vehicleType!);

      markStepAsCompleted('5');

      const response = await api.post('/profile/register-driver', formData, {
        timeout: 120000, // 2-minute timeout for document uploads
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[Drivers] Registration response:', response.data);

      // Instead of manual navigation, trigger a global status update.
      // AppNavigator will now see 'PENDING' status and flip automatically.
      await checkAuth();

    } catch (error: any) {
      console.error('Driver registration failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      if (error.message === 'Network Error' && !error.response) {
        // Special diagnostic for Network Error
        console.warn('[API Debug] Network Error often means CORS, timeout, or connection reset. Since backend says success, it might be a response parsing issue or the connection was closed prematurely.');
      }

      Alert.alert('Registration Failed', `An error occurred during submission: ${error.response?.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Aadhaar & PAN Card</Text>
        <Text style={styles.subtitle}>This is the final step. Please upload your documents and submit your application.</Text>
        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('aadhaar')}>
            {registrationData.aadhaarPhoto ? (
              <Image source={{ uri: registrationData.aadhaarPhoto }} style={styles.image} />
            ) : (
              <Text style={styles.imageButtonText}>Upload Aadhaar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={() => handleChooseImage('pan')}>
            {registrationData.panPhoto ? (
              <Image source={{ uri: registrationData.panPhoto }} style={styles.image} />
            ) : (
              <Text style={styles.imageButtonText}>Upload PAN</Text>
            )}
          </TouchableOpacity>
        </View>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : 'Submit Application'}
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
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  imageButton: {
    height: 150,
    width: 150,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: 10,
  },
  imageButtonText: {
    color: '#666',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: '#fe7009',
  },
});

export default AadhaarPanScreen;