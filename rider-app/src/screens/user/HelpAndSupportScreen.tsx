import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';


const HelpAndSupportScreen = ({ navigation }: any) => {
  const handleContactUs = async () => {
    const email = 'support@challo.app';
    const subject = 'Support Request from Challo App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      alert('Unable to open email app');
    }
  };

  const handleCallUs = async () => {
    const phoneNumber = 'tel:18004255000';

    const canOpen = await Linking.canOpenURL(phoneNumber);
    if (canOpen) {
      await Linking.openURL(phoneNumber);
    } else {
      alert('Unable to open phone app');
    }
  };

  const supportOptions = [
    {
      title: 'Emergency & Safety (SOS)',
      icon: 'shield',
      content: '24x7 Ambulance, Police, Fire, and Women Emergency Helplines.',
      onPress: () => navigation.navigate('Sos'),
      color: '#DC2626',
    },
    {
      title: 'Contact Us',
      icon: 'envelope',
      content: 'For any support, email us at support@challo.app',
      onPress: handleContactUs,
      color: '#E5A915',
    },
    {
      title: 'Call Us (Toll-Free)',
      icon: 'phone',
      content: 'Call our 24x7 Challo support team at 1800-425-5000.',
      onPress: handleCallUs,
      color: '#E5A915',
    },
    {
      title: 'FAQs & Policies',
      icon: 'question-circle',
      content: 'Check out our frequently asked questions for quick answers.',
      onPress: () => navigation.navigate('TermsAndService'),
      color: '#E5A915',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        <View style={styles.content}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.optionCard} onPress={option.onPress}>
              <FontAwesome name={option.icon as any} size={24} color={option.color || '#E5A915'} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionContent}>{option.content}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    alignContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  optionTextContainer: {
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionContent: {
    marginTop: 4,
    color: '#6b7280',
  },
});

export default HelpAndSupportScreen;
