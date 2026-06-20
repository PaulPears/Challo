import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useDriverRegistration } from '../context/DriverRegistrationContext';

const PersonalInfoScreen = ({ navigation }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const handleChoosePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });
    
    if (pickerResult.canceled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      setRegistrationData({ profilePhoto: pickerResult.assets[0].uri });
    }
  };

  const handleSave = () => {
    if (registrationData.name && registrationData.profilePhoto) {
      markStepAsCompleted('1');
      navigation.goBack();
    } else {
      alert('Please fill all the fields');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={registrationData.name || ''}
          onChangeText={(text) => setRegistrationData({ name: text })}
        />
          <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
            {registrationData.profilePhoto ? (
              <Image source={{ uri: registrationData.profilePhoto }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="account-camera" size={40} color="#fe7009" />
                <Text style={styles.photoButtonText}>Take Selfie</Text>
              </View>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  photoButton: {
    height: 150,
    width: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  photo: {
    height: 150,
    width: 150,
    borderRadius: 75,
  },
  photoButtonText: {
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#fe7009',
  },
});

export default PersonalInfoScreen;
