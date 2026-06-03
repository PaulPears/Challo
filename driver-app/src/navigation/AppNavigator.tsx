import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { DriverRegistrationProvider } from '../context/DriverRegistrationContext';

// Import all screens
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import DriverRegistrationScreen from '../screens/DriverRegistrationScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import SelectVehicleScreen from '../screens/SelectVehicleScreen';
import DrivingLicenseScreen from '../screens/DrivingLicenseScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import AadhaarPanScreen from '../screens/AadhaarPanScreen';
import VerificationPendingScreen from '../screens/VerificationPendingScreen';
import HomeScreen from '../screens/HomeScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import SupportScreen from '../screens/SupportScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import HelpScreen from '../screens/HelpScreen';
import SettleDuesScreen from '../screens/SettleDuesScreen';
import LoadingScreen from '../screens/LoadingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettlementHistoryScreen from '../screens/SettlementHistoryScreen';
import WalletScreen from '../screens/WalletScreen';
import RideDetailsScreen from '../screens/RideDetailsScreen';
import WithdrawScreen from '../screens/WithdrawScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RegistrationStack = createNativeStackNavigator();

const HomeTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'face-man-profile' : 'face-man-profile';
          }
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fe7009',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 10),
          paddingTop: 10,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f1f1',
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={MyRidesScreen} options={{ headerShown: false, title: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const DriverRegistrationStack = () => {
  return (
    <DriverRegistrationProvider>
      <RegistrationStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }}>
        <RegistrationStack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
        <RegistrationStack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <RegistrationStack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
        <RegistrationStack.Screen name="DrivingLicense" component={DrivingLicenseScreen} />
        <RegistrationStack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
        <RegistrationStack.Screen name="AadhaarPan" component={AadhaarPanScreen} />
      </RegistrationStack.Navigator>
    </DriverRegistrationProvider>
  );
};

import { navigationRef, runQueuedNavigations } from '../utils/NavigationService';

const AppNavigator = () => {
  const { driverStatus, user } = useAuth();

  // Initialize Push Notifications
  usePushNotifications(user?.id || null);

  if (driverStatus === 'LOADING') {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        runQueuedNavigations();
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }}>
        {driverStatus === 'UNAUTHENTICATED' ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </>
        ) : driverStatus === 'UNREGISTERED' ? (
          <>
            <Stack.Screen name="DriverRegistrationStack" component={DriverRegistrationStack} />
          </>
        ) : driverStatus === 'PENDING' ? (
          <>
            <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeTabs} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="MyRides" component={MyRidesScreen} />
            <Stack.Screen name="RideDetails" component={RideDetailsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />

            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="SettleDues" component={SettleDuesScreen} />
            <Stack.Screen name="SettlementHistory" component={SettlementHistoryScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
});

export default AppNavigator;