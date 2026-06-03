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

  const handleSendOtp = async () => {
    if (phoneNumber === '1234567890') {
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
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.');
      console.error(error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!reqId) return;
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
      if (phoneNumber === '1234567890' && enteredOtp === '123456') {
        console.log('Test credentials matched. Bypassing MSG91 verification.');
        const response = await loginVerified(phoneNumber, 'TEST_ACCESS_TOKEN');
        console.log('DEBUG: loginVerified (backend) response:', JSON.stringify(response, null, 2));

        const { accessToken, isNewUser, user } = response;
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        await AsyncStorage.setItem('accessToken', accessToken);

        console.log('DEBUG: decodedToken:', JSON.stringify(decodedToken, null, 2));

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
      } else {
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
      }
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
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
              <Text style={{ fontSize: 12, color: 'gray', marginTop: 30, textAlign: 'center' }}>OTP will be sent to your phone number</Text>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 10, textAlign: 'center' }}>By clicking on send OTP, you agree to our terms and conditions</Text>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 5, textAlign: 'center' }}>Thanks for Choosing RideAndhra</Text>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 5, textAlign: 'center' }}>*T&C apply* </Text>
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
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendOtp} style={{ marginTop: 20 }}>
                <Text style={{ color: '#FF5722', fontWeight: 'bold' }}>Resend OTP</Text>
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
    width: 0.90 * width,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF5722',
    textAlign: 'center',
  },
  title1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FF5722',
    textAlign: 'center',
  },
  input: {
    width: width * 0.8,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 15,
    width: width * 0.8,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.8,
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderColor: '#FF5722',
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
  },
});

export default LoginScreen;