import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
    card: 'white',
  },
};
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { AuthStackParamList } from './AuthStackParamList';
import useUserStore from '../store/userStore';
import UserNavigator from './UserNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import SplashScreen from '../screens/SplashScreen';
import EnterNameScreen from '../screens/auth/EnterNameScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { getMe } from '../api/authAPI';

const AuthStack = createStackNavigator<AuthStackParamList>();

const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, setUser } = useUserStore();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('accessToken');

        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          console.log('📱 AppNavigator restoring user from storage:', userData.name);
          setUser({ ...userData, accessToken: token });
        } else if (token) {
          try {
            // If we only have a token, fetch the latest profile from backend
            const userData = await getMe();
            console.log('📱 AppNavigator fetched user profile from backend:', userData.name);
            setUser({
              id: userData.id,
              name: userData.name || '',
              phoneNumber: userData.phone_number,
              role: (userData.roles?.[0] || 'rider') as 'rider' | 'driver' | 'admin',
              accessToken: token,
              isNewUser: false, // If they exist in DB, they aren't "newly registered" in this context
            });
          } catch (fetchError) {
            console.error('Failed to fetch user profile, falling back to JWT', fetchError);
            const decoded: any = jwtDecode(token);
            setUser({
              id: decoded.sub,
              name: decoded.name || '',
              phoneNumber: decoded.phoneNumber,
              role: decoded.roles?.[0] as 'rider' | 'driver' | 'admin',
              accessToken: token,
              isNewUser: false,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user from storage', error);
      } finally {
        setIsAuthenticating(false);
      }
    };

    checkToken();
  }, [setUser]);

  console.log('DEBUG: AppNavigator rendering with user:', user ? { id: user.id, name: user.name, isNewUser: user.isNewUser } : 'null');

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticating ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : user && user.accessToken ? (
          (() => {
            const shouldShowNameScreen = user.isNewUser && (!user.name || user.name.trim() === '');
            console.log(`DEBUG: shouldShowNameScreen: ${shouldShowNameScreen} (isNewUser: ${user.isNewUser}, name: "${user.name}")`);

            return shouldShowNameScreen ? (
              <Stack.Screen name="EnterName" component={EnterNameScreen} />
            ) : (
              <Stack.Screen name="UserNavigator" component={UserNavigator} />
            );
          })()
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
