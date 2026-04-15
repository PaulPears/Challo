import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDriverRegistration } from '../context/DriverRegistrationContext';
import OnboardingHeader from '../components/OnboardingHeader';

const vehicleOptions = [
  { id: '1', label: 'Bike', description: 'Quick & efficient for single riders', value: 'Bike', icon: 'motorbike' },
  { id: '2', label: 'Auto', description: '3-seater open vehicle for local trips', value: 'Auto', icon: 'rickshaw' },
  { id: '3', label: 'Cab', description: 'Comfortable 4-seater hatchback/sedan', value: 'Car', icon: 'car-hatchback' },
  { id: '4', label: 'Bike Lite', description: 'Electric or small engine bikes', value: 'bike-lite', icon: 'bike-fast' },
];

const { width } = Dimensions.get('window');

const SelectVehicleScreen = ({ navigation }: { navigation: any }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const handleSave = () => {
    if (!registrationData.vehicleType) {
      Alert.alert('Selection Required', 'Please select a vehicle type to proceed.');
      return;
    }
    markStepAsCompleted('2');
    navigation.goBack();
  };

  return (
    <View style={styles.mainContainer}>
      <OnboardingHeader title="Select Vehicle" step={2} totalSteps={5} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instruction}>
          Select the type of vehicle you will use to provide rides on the platform.
        </Text>

        <View style={styles.optionsList}>
          {vehicleOptions.map((option) => {
            const isSelected = registrationData.vehicleType === option.value;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => setRegistrationData({ vehicleType: option.value as any })}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.iconBox,
                  isSelected && styles.selectedIconBox
                ]}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={36}
                    color={isSelected ? '#fff' : '#fe7009'}
                  />
                </View>

                <View style={styles.infoBox}>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    isSelected && styles.selectedDesc
                  ]}>
                    {option.description}
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            !registrationData.vehicleType && styles.buttonDisabled
          ]}
          onPress={handleSave}
          disabled={!registrationData.vehicleType}
        >
          <Text style={styles.buttonText}>Save & Continue</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  instruction: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsList: {
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#fe7009',
    backgroundColor: '#fef5ed',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fef5ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconBox: {
    backgroundColor: '#fe7009',
  },
  infoBox: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedLabel: {
    color: '#fe7009',
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  selectedDesc: {
    color: '#a65e21',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fe7009',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  button: {
    backgroundColor: '#fe7009',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: '#fe7009',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SelectVehicleScreen;