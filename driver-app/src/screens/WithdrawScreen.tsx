import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../config/api';

const WithdrawScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
  });
  const [amount, setAmount] = useState('');
  const [isEditingBank, setIsEditingBank] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletResp, bankResp] = await Promise.all([
        api.get('/payments/wallet'),
        api.get('/payments/bank-details'),
      ]);
      setWallet(walletResp.data);
      if (bankResp.data) {
        setBankDetails(bankResp.data);
      } else {
        setIsEditingBank(true);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.bank_name || !bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/payments/bank-details', bankDetails);
      setIsEditingBank(false);
      Alert.alert('Success', 'Bank details updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const totalBalance = (wallet?.balance || 0) + (wallet?.reward_balance || 0);
    if (withdrawAmount > totalBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (withdrawAmount < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is ₹100');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Are you sure you want to withdraw ₹${withdrawAmount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/payments/withdraw', { amount: withdrawAmount });
              Alert.alert('Success', 'Withdrawal request submitted. It will be processed within 5 hours.');
              setAmount('');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to submit withdrawal request');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fe7009" />
      </View>
    );
  }

  const totalBalance = (wallet?.balance || 0) + (wallet?.reward_balance || 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Balance Summary Card */}
          <LinearGradient
            colors={['#4f46e5', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Total Withdrawable Balance</Text>
            <Text style={styles.balanceValue}>₹{totalBalance.toFixed(2)}</Text>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.subBalanceLabel}>Earnings</Text>
                <Text style={styles.subBalanceValue}>₹{(wallet?.balance || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.subBalanceLabel}>Company Coverage</Text>
                <Text style={styles.subBalanceValue}>₹{(wallet?.reward_balance || 0).toFixed(2)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Bank Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
              {!isEditingBank && (
                <TouchableOpacity onPress={() => setIsEditingBank(true)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingBank ? (
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. HDFC Bank"
                    value={bankDetails.bank_name}
                    onChangeText={(text) => setBankDetails({ ...bankDetails, bank_name: text })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="As per bank records"
                    value={bankDetails.account_holder_name}
                    onChangeText={(text) => setBankDetails({ ...bankDetails, account_holder_name: text })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                    value={bankDetails.account_number}
                    onChangeText={(text) => setBankDetails({ ...bankDetails, account_number: text })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IFSC Code</Text>
                  <TextInput
                    style={[styles.input, { textTransform: 'uppercase' }]}
                    placeholder="Enter IFSC code"
                    value={bankDetails.ifsc_code}
                    onChangeText={(text) => setBankDetails({ ...bankDetails, ifsc_code: text.toUpperCase() })}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.saveBtn, submitting && styles.disabledBtn]}
                  onPress={handleSaveBankDetails}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Bank Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <MaterialCommunityIcons name="bank" size={24} color="#4f46e5" />
                  <Text style={styles.bankName}>{bankDetails.bank_name}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Holder:</Text>
                  <Text style={styles.bankDetailValue}>{bankDetails.account_holder_name}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account:</Text>
                  <Text style={styles.bankDetailValue}>****{bankDetails.account_number.slice(-4)}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>IFSC:</Text>
                  <Text style={styles.bankDetailValue}>{bankDetails.ifsc_code}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Withdrawal Request Section */}
          {!isEditingBank && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Withdrawal</Text>
              <View style={styles.withdrawCard}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
                <Text style={styles.hintText}>Minimum ₹100 per request</Text>

                <TouchableOpacity
                  style={[styles.withdrawActionBtn, (submitting || !amount) && styles.disabledBtn]}
                  onPress={handleWithdraw}
                  disabled={submitting || !amount}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.withdrawActionBtnText}>Submit Withdrawal Request</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#666" />
                  <Text style={styles.infoText}>
                    Requests are manually verified and processed within 5 hours.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconBtn: { padding: 8, borderRadius: 12, backgroundColor: '#f0f0f0' },
  scrollContent: { padding: 20 },
  balanceCard: {
    padding: 25,
    borderRadius: 24,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  subBalanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  subBalanceValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', mx: 20, marginHorizontal: 20 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  editBtnText: { color: '#4f46e5', fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 2 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bankCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  bankName: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#1a1a1a' },
  bankDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bankDetailLabel: { color: '#666', fontSize: 14 },
  bankDetailValue: { fontWeight: '600', color: '#333', fontSize: 14 },
  withdrawCard: { backgroundColor: '#fff', padding: 25, borderRadius: 24, elevation: 2 },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currencySymbol: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  amountInput: { flex: 1, padding: 15, fontSize: 32, fontWeight: 'bold', color: '#1a1a1a' },
  hintText: { textAlign: 'center', color: '#666', fontSize: 12, marginTop: 10, marginBottom: 20 },
  withdrawActionBtn: {
    backgroundColor: '#fe7009',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#fe7009',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledBtn: { backgroundColor: '#cbd5e0', shadowOpacity: 0 },
  withdrawActionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: '#64748b', marginLeft: 8 },
});

export default WithdrawScreen;
