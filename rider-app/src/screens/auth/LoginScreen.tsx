import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthStackParamList';
import useUserStore from '../../store/userStore';
import { verifyOtp, loginVerified } from '../../api/authAPI';
import jwtDecode from 'jwt-decode';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Define JwtPayload interface to match backend
interface JwtPayload {
  sub: string;
  phoneNumber: string;
  roles: string[];
  name: string;
}

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { setUser } = useUserStore();
  const { reqId, setReqId } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputs = useRef<Array<TextInput | null>>([]);

  const handleDemoLogin = async () => {
    try {
      const demoUser = {
        id: 'demo-rider-123',
        name: 'Challo Rider',
        phoneNumber: '9876543210',
        role: 'rider' as const,
        accessToken: 'demo_token_' + Date.now(),
        isNewUser: false,
      };
      await AsyncStorage.setItem('accessToken', demoUser.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
    } catch (e) {
      console.error('Demo login error:', e);
      Alert.alert('Error', 'Failed to log in with demo account.');
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber === '1234567890' || phoneNumber === '9999999999' || phoneNumber === '9876543210') {
      setReqId('TEST_REQ_ID');
      setOtpSent(true);
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    try {
      setIsSendingOtp(true);
      const data = {
        identifier: '91' + phoneNumber
      }
      const response = await OTPWidget.sendOTP(data);
      console.log('MSG91 sendOTP response:', response);

      if (response.type === "success") {
        setReqId(response.message); // Assuming reqId is directly in response.message
        setOtpSent(true); // Show OTP input fields
      } else {
        throw new Error(response.message || 'Failed to send OTP.');
      }
    } catch (error: any) {
      // If MSG91 fails (e.g. invalid auth or unconfigured), offer test login
      Alert.alert(
        'SMS Service Notice',
        'Could not send SMS OTP. Would you like to log in using the Instant Demo account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Demo Login', onPress: handleDemoLogin },
        ]
      );
      console.error(error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!reqId) return;
    if (reqId === 'TEST_REQ_ID') {
      Alert.alert('Test Mode', 'In test mode, please enter OTP: 123456');
      return;
    }
    try {
      const body = {
        reqId,
        retryChannel: 11 // SMS
      };
      const response = await OTPWidget.retryOTP(body);
      console.log('MSG91 retryOTP response:', response);
      if (response.type === "success") {
        Alert.alert('Success', 'OTP resent successfully.');
      } else {
        throw new Error(response.message || 'Failed to resend OTP.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP.');
      console.error(error);
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    if (!reqId) {
      Alert.alert('Error', 'Request ID not found. Please try sending the OTP again.');
      return;
    }

    try {
      setIsVerifyingOtp(true);

      const isTestNumber = phoneNumber === '1234567890' || phoneNumber === '9999999999' || phoneNumber === '9876543210' || reqId === 'TEST_REQ_ID';
      const isTestOtp = enteredOtp === '123456' || enteredOtp === '000000';

      if (isTestNumber && isTestOtp) {
        console.log('Test credentials matched. Logging in with test session.');
        try {
          const response = await loginVerified(phoneNumber || '1234567890', 'TEST_ACCESS_TOKEN');
          const { accessToken, isNewUser, user } = response;
          const decodedToken = jwtDecode<JwtPayload>(accessToken);
          await AsyncStorage.setItem('accessToken', accessToken);
          setUser({
            id: decodedToken.sub,
            name: user?.name || 'Challo Rider',
            phoneNumber: decodedToken.phoneNumber,
            role: (decodedToken.roles[0] || 'rider') as 'rider' | 'driver' | 'admin',
            accessToken,
            isNewUser: isNewUser,
          });
        } catch (_) {
          // Graceful fallback if backend is unreachable or test token is rejected
          const fallbackUser = {
            id: 'test-user-id',
            name: 'Challo Rider',
            phoneNumber: phoneNumber || '1234567890',
            role: 'rider' as const,
            accessToken: 'test_token_' + Date.now(),
            isNewUser: false,
          };
          await AsyncStorage.setItem('accessToken', fallbackUser.accessToken);
          await AsyncStorage.setItem('user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
        }
        return;
      }
        // Step 1: Verify OTP with MSG91 Widget to get accessToken
        const widgetBody = { reqId, otp: enteredOtp };
        const widgetResponse = await OTPWidget.verifyOTP(widgetBody);
        console.log('MSG91 verifyOTP response:', widgetResponse);

        if (widgetResponse?.type !== 'success') {
          throw new Error(widgetResponse?.message || 'Invalid OTP reported by MSG91.');
        }

        // Step 2: Pass the Access Token received from the widget to the backend
        // for secure verification using our private AuthKey.
        const accessTokenFromWidget = widgetResponse.message;
        const response = await loginVerified(phoneNumber, accessTokenFromWidget);
        console.log('DEBUG: loginVerified (backend) response:', JSON.stringify(response, null, 2));

        const { accessToken, isNewUser, user } = response;
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        await AsyncStorage.setItem('accessToken', accessToken);

        console.log('DEBUG: decodedToken:', JSON.stringify(decodedToken, null, 2));

        // Use name from backend response, not from JWT (JWT doesn't include name)
        const userName = user?.name || '';
        console.log(`DEBUG: userName: "${userName}", isNewUser: ${isNewUser}`);

        setUser({
          id: decodedToken.sub,
          name: userName,
          phoneNumber: decodedToken.phoneNumber,
          role: decodedToken.roles[0] as 'rider' | 'driver' | 'admin',
          accessToken,
          isNewUser: isNewUser,
        });
    } catch (error: any) {
      console.error('Verify OTP Error Details:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to verify OTP. Please check your OTP and try again.');
      console.error(error);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < otp.length - 1) {
      otpInputs.current[index + 1]?.focus();
    } else if (text.length === 0 && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('../../../assets/loginSCreenlogo.png')} style={styles.logo} />
          <Text style={styles.title1}> Login / Signup to Continue </Text>


          {!otpSent ? (
            <>
              <TextInput
                placeholder="Phone Number"
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!isSendingOtp}
              />
              <TouchableOpacity 
                style={[styles.button, isSendingOtp && { opacity: 0.8 }]} 
                onPress={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              {/* Instant Demo Login Button */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.demoButton} 
                onPress={handleDemoLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.demoButtonText}>⚡ Instant Demo Login (Skip OTP)</Text>
              </TouchableOpacity>

              <View style={styles.testHintCard}>
                <Text style={styles.testHintTitle}>🧪 Test Credentials (No SMS needed):</Text>
                <Text style={styles.testHintText}>Phone: <Text style={{ fontWeight: 'bold', color: '#111827' }}>1234567890</Text>  |  OTP: <Text style={{ fontWeight: 'bold', color: '#111827' }}>123456</Text></Text>
              </View>

              <Text style={{ fontSize: 12, color: 'gray', marginTop: 20, textAlign: 'center' }}>OTP will be sent to your phone number</Text>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 8, textAlign: 'center' }}>By clicking on send OTP, you agree to our terms and conditions</Text>
              <Text style={{ fontSize: 11, color: '#111827', fontWeight: '700', marginTop: 6, textAlign: 'center' }}>Thanks for Choosing Challo</Text>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 4, textAlign: 'center' }}>*T&C apply* </Text>
            </>
          ) : (
            <>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    value={digit}
                    ref={(input) => { otpInputs.current[index] = input; }}
                  />
                ))}
              </View>
              <TouchableOpacity 
                style={[styles.button, isVerifyingOtp && { opacity: 0.8 }]} 
                onPress={handleVerifyOtp}
                disabled={isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendOtp} style={{ marginTop: 20 }}>
                <Text style={{ color: '#B45309', fontWeight: 'bold' }}>Resend OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDemoLogin} style={{ marginTop: 16 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textDecorationLine: 'underline' }}>
                  Skip verification & Enter as Demo Guest →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  logo: {
    width: 0.85 * width,
    height: 180,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  title1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  input: {
    width: width * 0.8,
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1.5,
    borderRadius: 25,
    marginBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E5A915',
    paddingVertical: 15,
    width: width * 0.8,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#E5A915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.8,
    marginBottom: 20,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderColor: '#E5A915',
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    backgroundColor: '#FFFBEB',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.8,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    width: width * 0.8,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
  },
  demoButtonText: {
    color: '#F5B014',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  testHintCard: {
    marginTop: 14,
    width: width * 0.8,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  testHintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  testHintText: {
    fontSize: 11,
    color: '#78350F',
  },
});

export default LoginScreen;