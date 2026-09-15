import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentResultModal, { PaymentResultState } from '../components/PaymentResultModal';

// Key used to persist interrupted payments for recovery
const PENDING_VERIFICATION_KEY = 'settle_pending_verification';

const SettleDuesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [walletDues, setWalletDues] = useState<number>(0);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  // Payment result modal state
  const [resultState, setResultState] = useState<PaymentResultState>(null);
  const [resultError, setResultError] = useState<string | undefined>();
  const [pendingPaymentId, setPendingPaymentId] = useState<string | undefined>();
  const [pendingOrderId, setPendingOrderId] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [walletResp, configResp, profileResp] = await Promise.all([
        api.get('/payments/wallet'),
        api.get('/payments/config'),
        api.get('/profile'),
      ]);

      if (walletResp.data?.pending_gst !== undefined) {
        setWalletDues(Number(walletResp.data.pending_gst));
      }
      if (configResp.data?.razorpay_key) {
        setRazorpayKey(configResp.data.razorpay_key);
      }
      if (profileResp.data?.profile?.phoneNumber) {
        setMobileNumber(profileResp.data.profile.phoneNumber);
      } else {
        setMobileNumber('9999999999');
      }
    } catch (e: any) {
      const isNetwork = !e.response; // No response = network issue
      setResultState(isNetwork ? 'network_error' : 'config_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkForPendingVerification();
  }, []);

  // On mount: check if a previous payment was interrupted mid-verification
  const checkForPendingVerification = async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_VERIFICATION_KEY);
      if (stored) {
        const { paymentId, orderId, amount } = JSON.parse(stored);
        setPendingPaymentId(paymentId);
        setPendingOrderId(orderId);
        if (amount) setWalletDues(amount);
        setResultState('verification_pending');
      }
    } catch (_) {}
  };

  const handleRazorpayPayment = async () => {
    // Guard: config not ready
    if (!razorpayKey) {
      setResultState('config_error');
      return;
    }
    if (walletDues <= 0) return;

    setPaying(true);
    setResultError(undefined);

    let orderData: any = null;

    try {
      // ── Step 1: Create order on backend ──────────────────────────────
      try {
        const orderResponse = await api.post('/payments/create-settlement-order', {
          amount: walletDues,
        });
        orderData = orderResponse.data;
      } catch (orderErr: any) {
        setResultState('payment_failed');
        setResultError(orderErr.response?.data?.message || orderErr.message);
        return;
      }

      // ── Step 2: Open Razorpay ─────────────────────────────────────────
      const options = {
        description: 'Settle Service Tax',
        image: 'https://ride-andhra.b-cdn.net/logo.png',
        currency: 'INR',
        key: razorpayKey,
        amount: orderData.amount,
        name: 'Challo Captain',
        order_id: orderData.id,
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
        // code 2 = user pressed back / cancelled deliberately
        if (rzpError.code === 2) {
          setResultState('cancelled');
          return;
        }
        // Network dropped DURING Razorpay, timeout, bank app crash, etc.
        const desc: string = rzpError?.description || rzpError?.message || '';
        setResultState('payment_failed');
        setResultError(desc || 'Payment could not be completed.');
        return;
      }

      // ── Step 3: Verify with backend ───────────────────────────────────
      await verifyPayment(rzpData, orderData.id);

    } finally {
      setPaying(false);
    }
  };

  const verifyPayment = async (paymentData: any, orderId: string, isRetry = false) => {
    // Save to AsyncStorage BEFORE calling backend — if network dies mid-call
    // we can recover this on next app open
    await AsyncStorage.setItem(
      PENDING_VERIFICATION_KEY,
      JSON.stringify({
        paymentId: paymentData.razorpay_payment_id,
        orderId,
        amount: walletDues,
      })
    );

    try {
      await api.post('/payments/verify-settlement', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        amount: walletDues,
      });

      // ✅ Success — clear the recovery record
      await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
      setPendingPaymentId(undefined);
      setPendingOrderId(undefined);
      setResultState('success');

    } catch (verifyErr: any) {
      // ⚠️ CRITICAL: payment went through but verification failed
      // The recovery record is already saved above — do NOT clear it
      console.error('[Settle] Verification failed — recovery data persisted:', paymentData.razorpay_payment_id);
      setPendingPaymentId(paymentData.razorpay_payment_id);
      setPendingOrderId(orderId);
      setResultState('verification_pending');
    }
  };

  const handleRetryVerification = async () => {
    if (!pendingPaymentId || !pendingOrderId) return;
    setResultState(null);
    setPaying(true);
    try {
      await verifyPayment(
        { razorpay_payment_id: pendingPaymentId, razorpay_signature: '' },
        pendingOrderId,
        true
      );
    } finally {
      setPaying(false);
    }
  };

  const handleResultClose = () => {
    if (resultState === 'success') {
      navigation.goBack();
    } else {
      setResultState(null);
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
      <PaymentResultModal
        state={resultState}
        amount={walletDues}
        errorMessage={resultError}
        paymentId={pendingPaymentId}
        orderId={pendingOrderId}
        onClose={handleResultClose}
        onRetry={() => { setResultState(null); handleRazorpayPayment(); }}
        onRetryVerification={handleRetryVerification}
      />

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
        {/* Recovery banner — shown if app was restarted mid-payment */}
        {pendingPaymentId && resultState !== 'verification_pending' && (
          <TouchableOpacity
            style={styles.recoveryBanner}
            onPress={() => setResultState('verification_pending')}
          >
            <Ionicons name="warning" size={18} color="#92400e" />
            <Text style={styles.recoveryText}>Unverified payment detected. Tap to resolve.</Text>
            <Ionicons name="chevron-forward" size={16} color="#92400e" />
          </TouchableOpacity>
        )}

        <View style={styles.warningCard}>
           <View style={styles.iconContainer}>
             <Ionicons name="warning" size={48} color="#fe7009" />
           </View>
           <Text style={styles.warningTitle}>Outstanding Service Tax</Text>
           <Text style={styles.warningSubtitle}>You cannot go online or receive rides if your service tax dues exceed ₹100. Please clear your dues immediately to guarantee continuous service.</Text>
           
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
        {paying && (
          <View style={styles.payingOverlay}>
            <ActivityIndicator color="#fe7009" />
            <Text style={styles.payingText}>Processing payment...</Text>
          </View>
        )}
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
  recoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 8,
  },
  recoveryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  payingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  payingText: {
    fontSize: 13,
    color: '#fe7009',
    fontWeight: '600',
  },
});

export default SettleDuesScreen;
