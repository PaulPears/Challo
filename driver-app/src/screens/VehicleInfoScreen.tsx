import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useDriverRegistration } from '../context/DriverRegistrationContext';

const VehicleInfoScreen = ({ navigation }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const handleSave = () => {
    if (registrationData.vehicleModel && registrationData.vehiclePlateNumber && registrationData.vehicleColor) {
      markStepAsCompleted('4');
      navigation.goBack();
    } else {
      alert('Please fill all the fields');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Vehicle Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your vehicle name (e.g., Bajaj Pulsar)"
          value={registrationData.vehicleModel || ''}
          onChangeText={(text) => setRegistrationData({ vehicleModel: text })}
        />
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
  saveButton: {
    marginTop: 20,
    backgroundColor: '#fe7009',
  },
});

export default VehicleInfoScreen;

