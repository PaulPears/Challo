import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/user/HomeScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import ProfileNavigator from './ProfileNavigator';
import ServicesScreen from '../screens/user/ServicesScreen';
import { FontAwesome } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const UserTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: "home" | "history" | "user" | "th-large" = "home";

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          } else if (route.name === 'Services') {
            iconName = 'th-large';
          }

          return <FontAwesome name={iconName} size={size} color={focused ? '#FF5722' : color} />;
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color: focused ? '#FF5722' : color, fontSize: 12 }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={BookingsScreen} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

export default UserTabNavigator;