import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';


const HelpAndSupportScreen = ({ navigation }: any) => {
  const handleContactUs = async () => {
    const email = 'help.rideandhra@gmail.com';
    const subject = 'Support Request from RideAndhra App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      alert('Unable to open email app');
    }
  };

  const handleCallUs = async () => {
    const phoneNumber = 'tel:8374277617';

    const canOpen = await Linking.canOpenURL(phoneNumber);
    if (canOpen) {
      await Linking.openURL(phoneNumber);
    } else {
      alert('Unable to open phone app');
    }
  };

  const supportOptions = [
    {
      title: 'Contact Us',
      icon: 'envelope',
      content: 'For any support, email us at help.rideandhra@gmail.com',
      onPress: handleContactUs,
    },
    {
      title: 'Call Us',
      icon: 'phone',
      content: 'Call us at +91 8374277617 for immediate assistance.',
      onPress: handleCallUs,
    },
    {
      title: 'FAQs',
      icon: 'question-circle',
      content: 'Check out our frequently asked questions for quick answers.',
      onPress: () => { },
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
              <FontAwesome name={option.icon as any} size={24} color="#FF5722" />
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
