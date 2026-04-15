import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/user/ProfileScreen';
import MyWalletScreen from '../screens/user/MyWalletScreen';
import ReferAndEarnScreen from '../screens/user/ReferAndEarnScreen';
import TermsAndServiceScreen from '../screens/user/TermsAndServiceScreen';
import PrivacyPolicyScreen from '../screens/user/PrivacyPolicyScreen';
import HelpAndSupportScreen from '../screens/user/HelpAndSupportScreen';
import RewardsScreen from '../screens/user/RewardsScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  MyWallet: undefined;
  ReferAndEarn: undefined;
  TermsAndService: undefined;
  PrivacyPolicy: undefined;
  HelpAndSupport: undefined;
  Rewards: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MyWallet" component={MyWalletScreen} />
      <Stack.Screen name="ReferAndEarn" component={ReferAndEarnScreen} />
      <Stack.Screen name="TermsAndService" component={TermsAndServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
