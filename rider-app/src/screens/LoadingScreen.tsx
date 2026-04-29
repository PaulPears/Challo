import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',

    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    borderRadius: 20,
  },
});

export default LoadingScreen;
