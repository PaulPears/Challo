import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDriverRegistration } from '../context/DriverRegistrationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingHeader from '../components/OnboardingHeader';

const steps = [
  { id: '1', title: 'Personal Information', description: 'Name, Email & Profile Photo', screen: 'PersonalInfo', icon: 'account-outline' },
  { id: '2', title: 'Select Vehicle', description: 'Choose your vehicle type', screen: 'SelectVehicle', icon: 'car-outline' },
  { id: '3', title: 'Driving License', description: 'License details & photos', screen: 'DrivingLicense', icon: 'card-account-details-outline' },
  { id: '4', title: 'Vehicle Information', description: 'Model, Year & Plate Number', screen: 'VehicleInfo', icon: 'information-outline' },
  { id: '5', title: 'Aadhaar & PAN Card', description: 'ID Proofs for verification', screen: 'AadhaarPan', icon: 'file-document-outline' },
];

const DriverRegistrationScreen = ({ navigation }: { navigation: any }) => {
  const { completedSteps, setRegistrationData } = useDriverRegistration();

  useEffect(() => {
    const getPhoneNumber = async () => {
      const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
      if (storedPhoneNumber) {
        setRegistrationData({ phoneNumber: storedPhoneNumber });
      }
    };
    getPhoneNumber();
  }, [setRegistrationData]);

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  
  const isStepLocked = (stepId: string) => {
    if (stepId === '1') return false;
    const previousStepId = (parseInt(stepId, 10) - 1).toString();
    return !isStepCompleted(previousStepId);
  };

  const handleStepPress = (step: any) => {
    if (!isStepLocked(step.id)) {
      navigation.navigate(step.screen);
    }
  };

  const completedCount = completedSteps.length;

  return (
    <View style={styles.mainContainer}>
      <OnboardingHeader title="Become a Partner" showBack={false} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome Pilot!</Text>
          <Text style={styles.subtitle}>Complete these 5 simple steps to get your account verified and start earning.</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedCount}/5</Text>
              <Text style={styles.statLabel}>Steps Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round((completedCount / 5) * 100)}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>

        <View style={styles.stepsList}>
          {steps.map((step) => {
            const completed = isStepCompleted(step.id);
            const locked = isStepLocked(step.id);
            const active = !locked && !completed;

            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => handleStepPress(step)}
                disabled={locked}
                activeOpacity={0.7}
                style={[
                  styles.stepCard,
                  active && styles.activeCard,
                  completed && styles.completedCard,
                  locked && styles.lockedCard
                ]}
              >
                <View style={[
                  styles.iconContainer,
                  active && styles.activeIconContainer,
                  completed && styles.completedIconContainer
                ]}>
                  <MaterialCommunityIcons 
                    name={step.icon as any} 
                    size={24} 
                    color={completed ? '#4bb543' : active ? '#fe7009' : '#999'} 
                  />
                </View>

                <View style={styles.stepInfo}>
                  <Text style={[
                    styles.stepTitle,
                    locked && styles.lockedText
                  ]}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>

                <View style={styles.statusIndicator}>
                  {completed ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4bb543" />
                  ) : locked ? (
                    <MaterialCommunityIcons name="lock" size={20} color="#ccc" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#fe7009" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fef5ed',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fe7009',
  },
  statLabel: {
    fontSize: 12,
    color: '#fe7009',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ffd7ba',
  },
  stepsList: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activeCard: {
    borderColor: '#fe7009',
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  completedCard: {
    borderColor: '#e8f5e9',
    backgroundColor: '#f9fdf9',
  },
  lockedCard: {
    opacity: 0.7,
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeIconContainer: {
    backgroundColor: '#fef5ed',
  },
  completedIconContainer: {
    backgroundColor: '#e8f5e9',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#888',
  },
  lockedText: {
    color: '#999',
  },
  statusIndicator: {
    marginLeft: 12,
  },
});

export default DriverRegistrationScreen;