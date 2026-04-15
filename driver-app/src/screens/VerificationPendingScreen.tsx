import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const VerificationPendingScreen = () => {
  const [checking, setChecking] = useState(false);
  const { checkAuth, logout } = useAuth();

  useEffect(() => {
    const pollStatus = async () => {
      setChecking(true);
      await checkAuth(); // This will update the global driverStatus in AuthContext
      setChecking(false);
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Verification in Progress</Text>
        <Text style={styles.subtitle}>
          Thank you for submitting your application. We are currently reviewing your documents.
        </Text>
        <Text style={styles.subtitle}>
          We will notify you once the verification is complete.
        </Text>

        {checking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="small" color="#fe7009" />
            <Text style={styles.checkingText}>Checking status...</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={logout}
          style={styles.button}
        >
          Logout / Back to Login
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkingText: {
    marginLeft: 10,
    color: '#fe7009',
    fontSize: 14,
  },
  button: {
    marginTop: 30,
  },
});

export default VerificationPendingScreen;
