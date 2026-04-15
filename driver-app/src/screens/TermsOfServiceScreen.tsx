import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Agreement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: December 17, 2025</Text>

        <Text style={styles.intro}>
          This Driver Terms & Agreement ("Agreement") governs the access and use of the Ride Andhra mobile application and related technology platform (the "Platform") by drivers ("Driver", "you"). By registering on or using the Platform, you agree to be bound by this Agreement.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Nature of the Platform</Text>
          <Text style={styles.text}>1.1 Ride Andhra is a <Text style={styles.bold}>technology-based marketplace</Text> that facilitates discovery and communication between independent drivers and riders.</Text>
          <Text style={styles.text}>1.2 Ride Andhra <Text style={styles.bold}>does not provide transportation services</Text> and <Text style={styles.bold}>does not operate as a transport aggregator</Text>.</Text>
          <Text style={styles.text}>1.3 All transportation services are provided <Text style={styles.bold}>independently by Drivers</Text> at their own discretion and responsibility.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Independent Contractor Relationship</Text>
          <Text style={styles.text}>2.1 You acknowledge and agree that:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>You are an <Text style={styles.bold}>independent service provider</Text>, not an employee, agent, partner, or representative of Ride Andhra.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>This Agreement does not create any employment, agency, joint venture, or franchise relationship.</Text>
          </View>
          <Text style={[styles.text, { marginTop: 8 }]}>2.2 You are solely responsible for:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Your vehicle</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Licenses, permits, and insurance</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Compliance with applicable local, state, and central laws</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Payments & Ride Fares</Text>
          <Text style={styles.text}>3.1 <Text style={styles.bold}>Ride Andhra does not collect, process, handle, or facilitate ride payments</Text>.</Text>
          <Text style={styles.text}>3.2 All ride payments are settled <Text style={styles.bold}>directly between the Driver and the Rider</Text>, including but not limited to:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Cash</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>UPI or other personal payment methods</Text>
          </View>
          <Text style={styles.text}>3.3 Any fare displayed in the Platform is <Text style={styles.bold}>only an indicative estimate</Text> based on distance and time and is <Text style={styles.bold}>not binding</Text>.</Text>
          <Text style={styles.text}>3.4 The final ride fare is mutually agreed upon between the Driver and the Rider.</Text>
          <Text style={styles.text}>3.5 Ride Andhra:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Does not issue ride invoices</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Does not guarantee fare amounts</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Is not responsible for payment disputes between Driver and Rider</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Platform Fees</Text>
          <Text style={styles.text}>4.1 Ride Andhra may charge Drivers a <Text style={styles.bold}>fixed subscription or access fee</Text> for use of the Platform.</Text>
          <Text style={styles.text}>4.2 Such fees:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Are not linked to individual rides</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Are not calculated as a percentage of ride fare</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Are payable irrespective of ride completion</Text>
          </View>
          <Text style={styles.text}>4.3 Applicable <Text style={styles.bold}>GST or other indirect taxes may be charged</Text> on the subscription or access fee as required by law.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Taxes</Text>
          <Text style={styles.text}>5.1 Ride Andhra is responsible only for taxes applicable to <Text style={styles.bold}>its own platform services</Text>.</Text>
          <Text style={styles.text}>5.2 Drivers are solely responsible for:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Any taxes arising from income earned through rides</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Compliance with personal income tax obligations</Text>
          </View>
          <Text style={styles.text}>5.3 Ride Andhra does not deduct or withhold taxes from ride payments.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Driver Responsibilities</Text>
          <Text style={styles.text}>You agree to:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Provide accurate registration information</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Maintain professional and lawful conduct</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Comply with traffic laws and safety norms</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Use the Platform only for lawful purposes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Prohibited Activities</Text>
          <Text style={styles.text}>Drivers must not:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Misrepresent fares as platform-mandated</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Collect payments on behalf of Ride Andhra</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Use the Platform for illegal or fraudulent activities</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.text}>8.1 Ride Andhra shall not be liable for:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Acts or omissions of Drivers or Riders</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Payment disputes</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Accidents, losses, or damages during rides</Text>
          </View>
          <Text style={styles.text}>8.2 The Platform is provided on an "as-is" basis without warranties of any kind.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Suspension & Termination</Text>
          <Text style={styles.text}>Ride Andhra reserves the right to suspend or terminate access to the Platform in case of:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Violation of this Agreement</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Legal or regulatory requirements</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Misuse of the Platform</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.text}>This Agreement shall be governed by and construed in accordance with the laws of India. Courts having jurisdiction in Andhra Pradesh shall have exclusive jurisdiction.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Acceptance</Text>
          <Text style={styles.text}>By using the Ride Andhra Platform, you confirm that you:</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Have read and understood this Agreement</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Agree to its terms</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Acknowledge that Ride Andhra is a technology platform only</Text>
          </View>
        </View>
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
