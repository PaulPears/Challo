import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const REFERRAL_CODE = 'RIDEANDHRA25';

const ReferAndEarnScreen = ({ navigation }: any) => {

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on RideAndhra! Use my referral code ${REFERRAL_CODE} to get a free ride. Download the app here: [App_Link]`,
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
        <FontAwesome name="gift" size={80} color="#FF5722" style={styles.icon} />
        <Text style={styles.title}>Invite a Friend</Text>
        <Text style={styles.subtitle}>
          Share your referral code with friends. When they sign up and take their first ride, you both get a discount!
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR REFERRAL CODE</Text>
          <TouchableOpacity style={styles.codeContainer} onPress={onCopyToClipboard}>
            <Text style={styles.code}>{REFERRAL_CODE}</Text>
            <FontAwesome name="copy" size={20} color="#FF5722" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Now</Text>
          <FontAwesome name="share-square-o" size={20} color="white" />
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
    borderColor: '#FF5722',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginRight: 16,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5722',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
});

export default ReferAndEarnScreen;
