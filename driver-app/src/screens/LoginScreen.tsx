import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PremiumInput from '../components/PremiumInput';
import Constants from 'expo-constants';
import { COLORS } from '../config/theme';
import { useAuth } from '../context/AuthContext';

const widgetId = Constants.expoConfig?.extra?.widgetId;
const tokenAuth = Constants.expoConfig?.extra?.tokenAuth;

const { height, width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { loginAsDemo } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    OTPWidget.initializeWidget(widgetId, tokenAuth);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await loginAsDemo(phoneNumber || '9876543210');
    } catch (e) {
      console.error('Demo login error:', e);
      Alert.alert('Error', 'Failed to log in as demo captain.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    // Instant login for test/demo numbers
    if (['1234567890', '9876543210', '9999999999'].includes(phoneNumber)) {
      await handleDemoLogin();
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `91${phoneNumber}`;
      const response = await OTPWidget.sendOTP({ identifier: fullPhoneNumber });

      if (response.type === 'success') {
        const reqId = response.res?.reqId || response.message;
        if (reqId) {
          navigation.navigate('OtpVerification', {
            phoneNumber: fullPhoneNumber,
            reqId: reqId
          });
        } else {
          Alert.alert('Error', 'Request ID not found. Please try again.');
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP.');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'An error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        // FIXED: behavior={undefined} on Android ensures Native adjustResize takes over correctly
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          // Handled ensures taps close keyboard but don't steal focus
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header stays static. Removing dynamic resizing to ensure the focus remains stable while the keyboard is up. */}
            <View style={styles.header}>
              <Animated.Image
                source={require('../assets/driver_eelcome.png')}
                style={[styles.bannerImage, { opacity: fadeAnim }]}
                resizeMode="cover"
              />
            </View>

            <Animated.View style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={styles.title}>Welcome, Captain!</Text>
                <Text style={styles.subtitle}>Enter your mobile number to sign in or register</Text>
              </View>


              <PremiumInput
                label="Mobile Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="99XXXXXXXX"
                icon="phone-outline"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <TouchableOpacity
                style={[styles.button, phoneNumber.length !== 10 && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading || phoneNumber.length !== 10}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.dark} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send One-Time Password</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color={COLORS.dark} style={{ marginLeft: 12 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR QUICK ACCESS</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.demoButton}
                onPress={handleDemoLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.demoButtonText}>Explore as Demo Captain</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By continuing, you acknowledge you have read our{' '}
                  <Text style={styles.link} onPress={() => navigation.navigate('TermsOfService')}>Terms</Text>
                  {' & '}
                  <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  header: {
    width: '100%',
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5A915',
    paddingBottom: 25,
  },
  bannerImage: {
    width: 150,
    height: 150,
    borderRadius: 30,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32, // Restored deep premium radius
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    marginTop: -35, // Overlap effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
  },
  logo: {
    width: 220,
    height: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 24,
    paddingHorizontal: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 60, // Premium tall button
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    // Intense premium shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 40,
  },
  footerText: {
    textAlign: 'center',
    color: '#a0a0a0',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  link: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  demoButton: {
    backgroundColor: COLORS.dark,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  demoButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;