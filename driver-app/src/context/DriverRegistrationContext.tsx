import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the structure of the registration data
interface RegistrationData {
  phoneNumber?: string;
  name?: string;
  email?: string;
  address?: string;
  profilePhoto?: string;
  vehicleType?: 'bike' | 'auto' | 'cab' | 'bike_lite' | 'luxury_bike' | 'parcel';
  drivingLicenseNumber?: string;
  licenseFrontPhoto?: string;
  licenseBackPhoto?: string;
  vehicleManufacturer?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehiclePlateNumber?: string;
  aadhaarNumber?: string;
  aadhaarPhoto?: string;
  panNumber?: string;
  panPhoto?: string;
  rcPhoto?: string;
  rcBackPhoto?: string;
  insurancePhoto?: string;
}

// Define the context type
interface DriverRegistrationContextType {
  registrationData: RegistrationData;
  setRegistrationData: (data: Partial<RegistrationData>) => void;
  completedSteps: string[];
  markStepAsCompleted: (stepId: string) => void;
}

// Create the context
const DriverRegistrationContext = createContext<DriverRegistrationContextType | undefined>(undefined);

// Create the provider component
export const DriverRegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [registrationData, setRegistrationDataState] = useState<RegistrationData>({});
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedData = await AsyncStorage.getItem('driverRegistrationData');
        const savedSteps = await AsyncStorage.getItem('driverCompletedSteps');
        if (savedData) setRegistrationDataState(JSON.parse(savedData));
        if (savedSteps) setCompletedSteps(JSON.parse(savedSteps));
      } catch (error) {
        console.error('Failed to load registration state', error);
      }
    };
    loadState();
  }, []);

  // Function to update registration data, memoized with useCallback
  const setRegistrationData = useCallback((data: Partial<RegistrationData>) => {
    setRegistrationDataState(prevData => {
      const newData = { ...prevData, ...data };
      AsyncStorage.setItem('driverRegistrationData', JSON.stringify(newData)).catch(err => console.error(err));
      return newData;
    });
  }, []);

  // Function to mark a step as completed, memoized with useCallback
  const markStepAsCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prevSteps => {
      if (!prevSteps.includes(stepId)) {
        const newSteps = [...prevSteps, stepId];
        AsyncStorage.setItem('driverCompletedSteps', JSON.stringify(newSteps)).catch(err => console.error(err));
        return newSteps;
      }
      return prevSteps;
    });
  }, []);

  const value = {
    registrationData,
    setRegistrationData,
    completedSteps,
    markStepAsCompleted,
  };

  return (
    <DriverRegistrationContext.Provider value={value}>
      {children}
    </DriverRegistrationContext.Provider>
  );
};

// Custom hook to use the context
export const useDriverRegistration = () => {
  const context = useContext(DriverRegistrationContext);
  if (context === undefined) {
    throw new Error('useDriverRegistration must be used within a DriverRegistrationProvider');
  }
  return context;
};
