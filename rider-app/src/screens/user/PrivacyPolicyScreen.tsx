import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useAppConfig } from '../../context/ConfigContext';

const PrivacyPolicyScreen = ({ navigation }: any) => {
  const { config } = useAppConfig();
  const policyText = config?.privacy_policy_rider || 'Loading privacy policy...';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          {policyText}
        </Text>

        <Text style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>
          © {new Date().getFullYear()} Ride Andhra. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  updateDate: { fontSize: 14, color: '#9ca3af', marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 12, color: '#111827' },
  subSectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#374151' },
  paragraph: { fontSize: 16, lineHeight: 24, color: '#374151', textAlign: 'justify' },
});

export default PrivacyPolicyScreen;
