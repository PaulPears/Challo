import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PaymentScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const route = useRoute();
  const { plan }: any = route.params;
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState<string | null>(user?.phoneNumber || null);

  // Constants for calculation
  const GST_RATE = 0.18;
  const COMMISSION_PER_RIDE = 10;
  const RIDES_PER_DAY = 20;

  // Calculate taxes and totals
  const basePrice = parseFloat(plan.price);
  const gstAmount = basePrice * GST_RATE;
  const totalAmount = basePrice + gstAmount;

  // Calculate Savings
  const getSavingsDetails = () => {
    let days = 1;
    if (plan.name.includes('Weekly')) days = 7;
    if (plan.name.includes('Monthly')) days = 30;

    const totalRides = days * RIDES_PER_DAY;
    const potentialCommission = totalRides * COMMISSION_PER_RIDE;
    const savings = potentialCommission - totalAmount;

    return { potentialCommission, savings, totalRides, days };
  };

  const { potentialCommission, savings, totalRides, days } = getSavingsDetails();

  useEffect(() => {
    if (user?.phoneNumber) {
      setMobileNumber(user.phoneNumber);
    } else {
      Alert.alert('Error', 'Mobile number not found. Please log in again.');
      navigation.goBack();
    }
  }, [user]);

  const handleRazorpayPayment = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not available.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order on backend (Use Total Amount)
      const orderResponse = await api.post('/subscriptions/create-order', {
        planId: plan.id,
      });

      const orderData = orderResponse.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        description: `Subscription: ${plan.name}`,
        image: 'https://i.imgur.com/3g7nmJC.jpg',
        currency: 'INR',
        key: orderData.key,
        amount: orderData.amount, // This comes from backend in paise
        name: 'Ride Andhra',
        order_id: orderData.orderId,
        prefill: {
          contact: mobileNumber,
          name: 'Driver',
        },
        theme: { color: '#fe7009' },
      };

      let data: any;
      try {
        data = await RazorpayCheckout.open(options);
      } catch (rzpError: any) {
        console.warn('Razorpay Native Error:', rzpError);
        
        // If native module is not available (e.g. Expo Go), offer simulated success for testing
        return new Promise((resolve) => {
          Alert.alert(
            'Development Mode',
            'Razorpay native module is not available in this environment. Would you like to simulate a successful payment for testing?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); resolve(null); } },
              { text: 'Simulate Success', onPress: async () => {
                const mockData = {
                  razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
                  razorpay_signature: 'mock_signature'
                };
                await verifyPayment(mockData, orderData.orderId);
                resolve(null);
              }}
            ]
          );
        });
      }

      // Step 3: Verify
      await verifyPayment(data, orderData.orderId);

    } catch (error: any) {
      console.error('Payment Error:', error);

      // Axios error handling
      if (error.response) {
        const errorMsg = error.response.data?.message || 'Server error occurred';
        Alert.alert('Payment Error', errorMsg);
      } else if (error.code === 2) {
        Alert.alert('Payment Cancelled', 'You have cancelled the payment.');
      } else {
        Alert.alert('Payment Failed', error.message || 'An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData: any, orderId: string) => {
    try {
      await api.post('/subscriptions/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        planId: plan.id
      });

      Alert.alert(
        'Success!',
        `Your ${plan.name} is now active!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } catch (error: any) {
      console.error('Verification Error:', error);
      const errorMsg = error.response?.data?.message || 'Payment verification failed';
      Alert.alert('Verification Failed', errorMsg + '. Contact support if amount was deducted.');
    }
  };


  if (!mobileNumber) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fe7009" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Savings Banner */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsTitle}>YOU SAVE BIG!</Text>
            <Ionicons name="pricetag" size={20} color="#D35400" style={{ marginLeft: 8 }} />
          </View>
          <Text style={styles.savingsSubtitle}>Save ₹10 commission on every ride!</Text>
          <Text style={styles.savingsCalculation}>
            Calculation: {totalRides} Rides ({days} days) × ₹10 = ₹{potentialCommission}
          </Text>

          <View style={styles.savingsRow}>
            <View>
              <Text style={styles.savingsLabel}>Standard Commission</Text>
              <Text style={styles.strikethroughPrice}>₹{potentialCommission}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
            <View>
              <Text style={styles.savingsLabel}>You Pay Only</Text>
              <Text style={styles.finalPriceSummary}>₹{totalAmount.toFixed(0)}</Text>
            </View>
          </View>
        </View>


        {/* Bill Details */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{plan.name} (Base Price)</Text>
            <Text style={styles.billValue}>₹{basePrice.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST (18%)</Text>
            <Text style={styles.billValue}>₹{gstAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.billRow, { marginBottom: 0 }]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Legal Disclaimer */}
        <Text style={styles.disclaimer}>
          * By proceeding, you agree to our Terms of Service.
          GST of 18% is applicable on all digital services.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handleRazorpayPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{totalAmount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Extra padding for scroll
  },
  savingsCard: {
    backgroundColor: '#FFF0E6', // Light Orange
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD8BE',
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D35400',
    letterSpacing: 0.5,
  },
  discountIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
    tintColor: '#D35400'
  },
  savingsSubtitle: {
    fontSize: 14,
    color: '#E67E22',
    marginBottom: 5,
  },
  savingsCalculation: {
    fontSize: 13,
    color: '#D35400',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Reduced bottom margin since badge is gone
  },
  savingsLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  strikethroughPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    textDecorationLine: 'line-through',
  },
  arrowContainer: {
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    color: '#BDC3C7',
    fontWeight: 'bold',
  },
  finalPriceSummary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  // Removed totalSavingsBadge styles
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  billTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C3E50',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  billValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECF0F1',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  disclaimer: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    marginBottom: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    elevation: 10,
    marginBottom: 20, // Add bottom margin here as requested
  },
  payButton: {
    backgroundColor: '#27AE60', // GREEN color
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  disabledButton: {
    backgroundColor: '#A9DFBF',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
