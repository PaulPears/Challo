import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from 'react-native-paper';

const SupportScreen = () => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleCallSupport = () => {
    Linking.openURL('tel:+918374277617'); // Replace with actual number
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:help.rideandhra@gmail.com'); // Replace with actual email
  };

  const handleSubmitTicket = () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    // Simulation of backend call
    Alert.alert('Success', 'Your ticket has been raised successfully. We will contact you shortly.');
    setSubject('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>



      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
            <View style={styles.iconContainer}>
              <Ionicons name="call" size={24} color="#fe7009" />
            </View>
            <Text style={styles.contactLabel}>Call Support</Text>
            <Text style={styles.contactValue}>+91 83742 77617</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="email" size={24} color="#fe7009" />
            </View>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>help.rideandhra@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Raise a Ticket</Text>
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Issue regarding..."
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </TouchableOpacity >
          </Card.Content >
        </Card >

      </ScrollView >
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },



  content: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
    marginTop: 10,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 5,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#fe7009',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SupportScreen;
