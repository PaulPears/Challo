import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define the structure of the registration data
interface RegistrationData {
  phoneNumber?: string;
  name?: string;
  email?: string;
  address?: string;
  profilePhoto?: string;
  vehicleType?: 'Bike' | 'Auto' | 'Car' | 'bike-lite';
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

  // Function to update registration data, memoized with useCallback
  const setRegistrationData = useCallback((data: Partial<RegistrationData>) => {
    setRegistrationDataState(prevData => ({ ...prevData, ...data }));
  }, []);

  // Function to mark a step as completed, memoized with useCallback
  const markStepAsCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prevSteps => {
      if (!prevSteps.includes(stepId)) {
        return [...prevSteps, stepId];
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
