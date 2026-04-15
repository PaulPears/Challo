import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // Assuming these icon libraries are available
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
const ContactUsScreen = () => {
  const navigation = useNavigation();
  const handleEmailPress = () => {
    Linking.openURL('help.rideandhra@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+91 8374277617');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Contact US </Title>
      </View>

      <ScrollView style={styles.outerContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Ionicons name="mail-outline" size={50} color="#fe7009" style={styles.icon} />
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.description}>
            We're here to help! Choose how you'd like to reach us.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>General Inquiries</Text>
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email Us</Text>
              <Text style={styles.contactDetail}>help.rideandhra@gmail.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
            <MaterialCommunityIcons name="phone-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Call Our Helpline</Text>
              <Text style={styles.contactDetail}>+91 8374277617</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Office Address</Text>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Our Locations</Text>
              <Text style={styles.contactDetail}>RideAndhra HQ, Kadapa, Andhra Pradesh, India</Text>
            </View>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>

              <Text style={styles.contactDetail}>RideAndhra HQ, Kurnool, Andhra Pradesh, India</Text>
            </View>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>

              <Text style={styles.contactDetail}>RideAndhra HQ, Anantapur, Andhra Pradesh, India</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Office Hours</Text>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Monday - Friday</Text>
              <Text style={styles.contactDetail}>9:00 AM - 6:00 PM (IST)</Text>
            </View>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Saturday</Text>
              <Text style={styles.contactDetail}>10:00 AM - 4:00 PM (IST)</Text>
            </View>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={24} color="#333" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Sunday</Text>
              <Text style={styles.contactDetail}>Closed</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light grey background
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light grey background
    marginBottom: 40,
  },
  contentContainer: {
    padding: 15,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    alignSelf: 'flex-start', // Align title to left within card
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  contactTextContainer: {
    marginLeft: 15,
  },
  contactLabel: {
    fontSize: 14,
    color: '#999',
  },
  contactDetail: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginRight: 20,
  },
});

export default ContactUsScreen;