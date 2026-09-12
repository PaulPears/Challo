import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const REFERRAL_CODE = 'CHALLO25';

const ReferAndEarnScreen = ({ navigation }: any) => {

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on Challo! Use my referral code ${REFERRAL_CODE} to get a discount on your first ride. Download the app here: https://challo.app`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const onCopyToClipboard = () => {
    Clipboard.setStringAsync(REFERRAL_CODE);
    Alert.alert('Copied!', 'Referral code has been copied to your clipboard.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        <FontAwesome name="gift" size={80} color="#E5A915" style={styles.icon} />
        <Text style={styles.title}>Invite a Friend</Text>
        <Text style={styles.subtitle}>
          Share your referral code with friends. When they sign up and take their first ride on Challo, you both get exciting discounts!
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR REFERRAL CODE</Text>
          <TouchableOpacity style={styles.codeContainer} onPress={onCopyToClipboard}>
            <Text style={styles.code}>{REFERRAL_CODE}</Text>
            <FontAwesome name="copy" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Now</Text>
          <FontAwesome name="share-square-o" size={20} color="#111827" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5A915',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFBEB',
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 16,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#E5A915',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#E5A915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shareButtonText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
});

export default ReferAndEarnScreen;
