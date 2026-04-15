import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/adaptive-icon.png')} style={styles.logo} />
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});

export default LoadingScreen;
