import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

const HelpScreen = () => {
  const navigation = useNavigation();

  const handlePhonePress = () => {
    Linking.openURL('tel:+91 8374277617');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Help & Support</Title>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.description}>
            Find answers to common questions and get assistance with your RideAndhra Driver App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I accept a ride?</Text>
            <Text style={styles.faqAnswer}>
              When a ride request comes in, you will see a notification on your screen. Tap "Accept" to take the ride.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I update my profile information?</Text>
            <Text style={styles.faqAnswer}>
              You can update your profile information by requesting through help support in the app or visiting the nearest service center.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What if I have an issue during a ride?</Text>
            <Text style={styles.faqAnswer}>
              You can contact customer support directly from the app during an active ride, or call our helpline.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.contactText}>
            If you can't find what you're looking for, our support team is here to help.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handlePhonePress}>
            <Text style={styles.contactButtonText}>Call Support</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginBottom: 40,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  faqItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
  },
  contactText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#fe7009',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HelpScreen;
