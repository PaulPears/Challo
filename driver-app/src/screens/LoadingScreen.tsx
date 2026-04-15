import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen = () => {
  return (
    <LinearGradient colors={['white','white']} style={styles.container}>
      <ActivityIndicator size="large" color="#fe7009" />
      <Image
        source={require('../assets/Ridenew.png')}
        style={styles.logo}
        
      />
      <Text style={styles.loadingText}>Loading...</Text>
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
    
    fontSize: 18,
    color: '#fe7009',
  },
  logo: {
    maxWidth: '80%',
    height: 100,
    resizeMode: 'contain',
 
},

});

export default LoadingScreen;
