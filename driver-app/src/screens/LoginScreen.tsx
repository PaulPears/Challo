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

const widgetId = Constants.expoConfig?.extra?.widgetId;
const tokenAuth = Constants.expoConfig?.extra?.tokenAuth;

const { height, width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    OTPWidget.initializeWidget(widgetId, tokenAuth);

    // Smooth entry animation for premium feel
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (phoneNumber === '1234567890') {
      navigation.navigate('OtpVerification', {
        phoneNumber: `91${phoneNumber}`,
        reqId: 'TEST_REQ_ID_GOOGLE_VERIFY'
      });
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
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/Ridenew.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send One-Time Password</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" style={{ marginLeft: 12 }} />
                  </>
                )}
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
    height: height * 0.38, // Stabilized height
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#fe7009',
    height: 60, // Premium tall button
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    // Intense premium shadow
    shadowColor: '#fe7009',
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
    color: '#fff',
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
    color: '#fe7009',
    fontWeight: '800',
  },
});

export default LoginScreen;