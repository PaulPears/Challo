import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PaymentResultModal, { PaymentResultState } from '../components/PaymentResultModal';

const SUB_PENDING_VERIFICATION_KEY = 'sub_pending_verification';

const PaymentScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const route = useRoute();
  const { plan }: any = route.params;
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState<string | null>(user?.phoneNumber || null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);

  // Payment result modal state
  const [resultState, setResultState] = useState<PaymentResultState>(null);
  const [resultError, setResultError] = useState<string | undefined>();
  const [pendingPaymentId, setPendingPaymentId] = useState<string | undefined>();
  const [pendingOrderId, setPendingOrderId] = useState<string | undefined>();

  useEffect(() => {
    if (user?.phoneNumber) setMobileNumber(user.phoneNumber);

    const fetchConfig = async () => {
      try {
        const resp = await api.get('/payments/config');
        if (resp.data?.razorpay_key) setRazorpayKey(resp.data.razorpay_key);
      } catch (e) {
        console.error('Config fetch error:', e);
      }
    };
    fetchConfig();
    checkPendingVerification();
  }, [user]);

  const checkPendingVerification = async () => {
    try {
      const stored = await AsyncStorage.getItem(SUB_PENDING_VERIFICATION_KEY);
      if (stored) {
        const { paymentId, orderId } = JSON.parse(stored);
        setPendingPaymentId(paymentId);
        setPendingOrderId(orderId);
        setResultState('verification_pending');
      }
    } catch (_) {}
  };

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

  const handleRazorpayPayment = async () => {
    if (!razorpayKey) { setResultState('config_error'); return; }

    setLoading(true);
    setResultError(undefined);
    let orderData: any = null;

    try {
      // ── Step 1: Create order ────────────────────────────────────────
      try {
        const orderResponse = await api.post('/subscriptions/create-order', { planId: plan.id });
        orderData = orderResponse.data;
      } catch (orderErr: any) {
        setResultState('payment_failed');
        setResultError(orderErr.response?.data?.message || orderErr.message);
        return;
      }

      // ── Step 2: Open Razorpay ───────────────────────────────────────
      const options = {
        description: `Subscription: ${plan.name}`,
        image: 'https://ride-andhra.b-cdn.net/logo.png',
        currency: 'INR',
        key: razorpayKey,
        amount: orderData.amount,
        name: 'Challo Captain',
        order_id: orderData.orderId,
        prefill: {
          contact: mobileNumber || '9999999999',
          name: 'Captain',
          email: 'captain@challo.in',
        },
        theme: { color: '#E5A915' },
      };

      let rzpData: any;
      try {
        rzpData = await RazorpayCheckout.open(options);
      } catch (rzpError: any) {
        if (rzpError.code === 2) { setResultState('cancelled'); return; }
        const desc: string = rzpError?.description || rzpError?.message || '';
        setResultState('payment_failed');
        setResultError(desc || 'Payment could not be completed.');
        return;
      }

      // ── Step 3: Verify ─────────────────────────────────────────────
      await verifyPayment(rzpData, orderData.orderId);

    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData: any, orderId: string) => {
    await AsyncStorage.setItem(
      SUB_PENDING_VERIFICATION_KEY,
      JSON.stringify({ paymentId: paymentData.razorpay_payment_id, orderId, planId: plan.id })
    );
    try {
      await api.post('/subscriptions/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        planId: plan.id,
      });
      await AsyncStorage.removeItem(SUB_PENDING_VERIFICATION_KEY);
      setPendingPaymentId(undefined);
      setPendingOrderId(undefined);
      setResultState('success');
    } catch {
      setPendingPaymentId(paymentData.razorpay_payment_id);
      setPendingOrderId(orderId);
      setResultState('verification_pending');
    }
  };

  const handleRetryVerification = async () => {
    if (!pendingPaymentId || !pendingOrderId) return;
    setResultState(null);
    setLoading(true);
    try {
      await verifyPayment({ razorpay_payment_id: pendingPaymentId, razorpay_signature: '' }, pendingOrderId);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClose = () => {
    if (resultState === 'success') {
      navigation.navigate('Main');
    } else {
      setResultState(null);
    }
  };

  return (
    <View style={styles.container}>
      <PaymentResultModal
        state={resultState}
        amount={totalAmount}
        errorMessage={resultError}
        paymentId={pendingPaymentId}
        orderId={pendingOrderId}
        onClose={handleResultClose}
        onRetry={() => { setResultState(null); handleRazorpayPayment(); }}
        onRetryVerification={handleRetryVerification}
      />
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
