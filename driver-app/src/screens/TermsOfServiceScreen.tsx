import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAppConfig } from '../context/ConfigContext';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const { config } = useAppConfig();

  const termsText = config?.terms_and_conditions_driver || 'Loading terms...';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Agreement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          {termsText}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  intro: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1a202c',
  },
  bulletPoint: {
    flexDirection: 'row',
    paddingLeft: 10,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 15,
    color: '#4a5568',
    marginRight: 8,
  },
});

export default TermsOfServiceScreen;
