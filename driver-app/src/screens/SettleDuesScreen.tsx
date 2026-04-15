import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettleDuesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [walletDues, setWalletDues] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const init = async () => {
      const number = await AsyncStorage.getItem('phoneNumber');
      if (number) setMobileNumber(number);

      try {
        const walletResp = await api.get('/payments/wallet');
        if (walletResp.data?.pending_platform_fees !== undefined) {
           setWalletDues(Number(walletResp.data.pending_platform_fees));
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not fetch wallet details.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRazorpayPayment = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not available.');
      return;
    }
    if (walletDues <= 0) {
      Alert.alert('No Dues', 'You have no outstanding platform fees.');
      return;
    }

    setPaying(true);
    try {
      // Create order
      const orderResponse = await api.post('/payments/create-settlement-order', {
        amount: walletDues,
      });

      const orderData = orderResponse.data;

      const options = {
        description: 'Settle Platform Fees',
        image: 'https://ride-andhra.b-cdn.net/logo.png', // Assuming logo exists
        currency: 'INR',
        key: orderData.key || 'rzp_test_dummyKey123', // Fallback or from response
        amount: orderData.amount, 
        name: 'Ride Andhra',
        order_id: orderData.id, // Razorpay order ID is usually 'id' in the response object from backend
        prefill: {
          contact: mobileNumber,
          name: 'Driver',
        },
        theme: { color: '#fe7009' },
      };

      const data = await RazorpayCheckout.open(options);
      await verifyPayment(data, orderData.id);

    } catch (error: any) {
      console.error('Payment Error:', error);
      if (error.response) {
        const errorMsg = error.response.data?.message || 'Server error occurred';
        Alert.alert('Payment Error', errorMsg);
      } else if (error.code === 2 || error.description === 'Payment Cancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      } else {
        Alert.alert('Payment Failed', error.message || 'An error occurred.');
      }
    } finally {
      setPaying(false);
    }
  };

  const verifyPayment = async (paymentData: any, orderId: string) => {
    try {
      await api.post('/payments/verify-settlement', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        amount: walletDues,
      });

      Alert.alert(
        'Success!',
        'Your dues have been cleared successfully!',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Verification Error:', error);
      const errorMsg = error.response?.data?.message || 'Verification failed';
      Alert.alert('Verification Failed', errorMsg + '. Please contact support.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fe7009" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settle Dues</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SettlementHistory')}
          style={styles.historyButton}
        >
          <Ionicons name="time-outline" size={22} color="#fe7009" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.warningCard}>
           <View style={styles.iconContainer}>
             <Ionicons name="warning" size={48} color="#fe7009" />
           </View>
           <Text style={styles.warningTitle}>Outstanding Platform Fees</Text>
           <Text style={styles.warningSubtitle}>You cannot go online or receive rides if your dues exceed ₹100. Please clear your dues immediately to guarantee continuous service.</Text>
           
           <View style={styles.duesContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.duesText}>{walletDues.toFixed(2)}</Text>
           </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#28a745" />
          <Text style={styles.infoText}>
            Clearing your dues ensures that your driver profile stays active. We use Razorpay's secure payment gateway.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (paying || walletDues <= 0) && styles.disabledButton]}
          onPress={handleRazorpayPayment}
          disabled={paying || walletDues <= 0}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{walletDues.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#1a202c',
    flex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff5ed',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fe7009',
  },
  historyButtonText: {
    color: '#fe7009',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FED7D7',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
    elevation: 3,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 10,
    textAlign: 'center',
  },
  warningSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  duesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 25,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fe7009',
    marginRight: 4,
  },
  duesText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fe7009',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FFF4',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2f855a',
    marginLeft: 12,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payButton: {
    backgroundColor: '#fe7009', 
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#fe7009',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default SettleDuesScreen;
