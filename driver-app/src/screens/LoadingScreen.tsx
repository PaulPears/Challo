import React from 'react';
import { ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../config/theme';

const LoadingScreen = () => {
  return (
    <LinearGradient colors={['#ffffff', '#fffdf5']} style={styles.container}>
      <Image
        source={require('../assets/Ridenew.png')}
        style={styles.logo}
      />
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
      <Text style={styles.loadingText}>Loading Challo Captain...</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  logo: {
    width: 240,
    height: 100,
    resizeMode: 'contain',
  },
});

export default LoadingScreen;
