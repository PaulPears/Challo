import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

const TermsAndServiceScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Service</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ride Andhra — Terms and Services</Text>
        <Text style={styles.updateDate}>Effective Date: January 8, 2026</Text>

        <Text style={styles.paragraph}>
          These Terms and Services (“Terms”) govern your access to and use of the Ride Andhra mobile application and related services (“App”, “Service”, “we”, “us”, “our”). By downloading, accessing, or using the Ride Andhra App, you agree to be bound by these Terms. If you do not agree, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>1. Nature of the Service (Very Important)</Text>
        <Text style={styles.paragraph}>
          Ride Andhra is an information and connectivity platform only.{'\n\n'}
          The App provides ride-related information such as:{'\n'}
          • Pickup and drop-off based route details{'\n'}
          • Distance-based estimated fares{'\n'}
          • Availability or contact information of drivers (where applicable){'\n\n'}
          Ride Andhra does not provide transportation services.{'\n'}
          Ride Andhra does not own vehicles, employ drivers, or control drivers.{'\n'}
          Ride Andhra does not process payments, collect fares, hold money, provide wallets, or support in-app transactions.{'\n\n'}
          Any ride, agreement, payment, or dispute is strictly between the user (rider) and the driver, outside the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility to Use the App</Text>
        <Text style={styles.paragraph}>
          To use Ride Andhra:{'\n'}
          • You must be at least 18 years of age{'\n'}
          • You must have the legal capacity to enter into a contract{'\n'}
          • You must comply with all applicable local, state, and national laws
        </Text>

        <Text style={styles.sectionTitle}>3. User Information and Data Usage</Text>
        <Text style={styles.paragraph}>
          We do not collect or store user photos, identity documents, or biometric data.{'\n\n'}
          We collect only:{'\n'}
          • Name (if provided){'\n'}
          • Pickup and drop-off locations selected by the user{'\n'}
          • Basic technical and usage data for app functionality{'\n\n'}
          Location data is used only to calculate routes and estimated fares.{'\n\n'}
          Full details are explained in our Privacy Policy, which forms part of these Terms.
        </Text>

        <Text style={styles.sectionTitle}>4. Estimated Fares Disclaimer</Text>
        <Text style={styles.paragraph}>
          • All fare values shown in the App are estimates only.{'\n'}
          • Estimated fares are calculated based on distance, route data, and internal logic.{'\n'}
          • Final fares may differ due to traffic, route changes, waiting time, negotiation, or driver discretion.{'\n'}
          • Ride Andhra does not guarantee accuracy of estimated fares and is not responsible for fare disputes.
        </Text>

        <Text style={styles.sectionTitle}>5. No Payments, No Wallets, No Referrals</Text>
        <Text style={styles.paragraph}>
          Ride Andhra explicitly states that:{'\n'}
          • No payments are collected through the App{'\n'}
          • No wallets, credits, or balances are maintained{'\n'}
          • No referral rewards, commissions, or cashback systems exist{'\n'}
          • Ride Andhra does not charge riders per trip through the App{'\n\n'}
          If any payment occurs, it happens directly between rider and driver, independent of Ride Andhra.
        </Text>

        <Text style={styles.sectionTitle}>6. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          By using the App, you agree:{'\n'}
          • To provide accurate pickup and drop-off information{'\n'}
          • To communicate respectfully with drivers{'\n'}
          • Not to misuse the App for unlawful, fraudulent, or harmful purposes{'\n'}
          • Not to impersonate another person or provide false information{'\n'}
          • Not to attempt to reverse engineer, hack, or disrupt the App
        </Text>

        <Text style={styles.sectionTitle}>7. Driver Relationship Disclaimer</Text>
        <Text style={styles.paragraph}>
          Drivers listed or contacted via the App are independent third parties.{'\n'}
          Ride Andhra does not supervise, manage, or guarantee driver behavior.{'\n\n'}
          Ride Andhra is not liable for:{'\n'}
          • Driver conduct{'\n'}
          • Ride quality{'\n'}
          • Accidents, delays, cancellations, or disputes{'\n\n'}
          Users are advised to exercise personal judgment and caution.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law:{'\n'}
          • Ride Andhra shall not be liable for any indirect, incidental, consequential, or special damages.{'\n'}
          • Ride Andhra is not responsible for losses arising from:{'\n'}
          • Use or inability to use the App{'\n'}
          • Reliance on estimated fares{'\n'}
          • Interactions with drivers{'\n'}
          • Third-party services or maps{'\n\n'}
          Use of the App is at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>9. Suspension or Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to:{'\n'}
          • Suspend or terminate access to the App without notice if:{'\n'}
          • These Terms are violated{'\n'}
          • The App is misused{'\n'}
          • Required by law or regulatory authorities
        </Text>

        <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          • All content, branding, logos, and software related to Ride Andhra are owned by Ride Andhra or its licensors.{'\n'}
          • Users may not copy, modify, distribute, or exploit any part of the App without written permission.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          • We may update these Terms from time to time.{'\n'}
          • Continued use of the App after changes indicates acceptance of the updated Terms.{'\n'}
          • The effective date will always be shown at the top of this page.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law and Jurisdiction</Text>
        <Text style={styles.paragraph}>
          • These Terms shall be governed by the laws of India.{'\n'}
          • Any disputes shall be subject to the exclusive jurisdiction of the courts located in Andhra Pradesh, India.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        <Text style={styles.paragraph}>
          For support, questions, or complaints:{'\n\n'}
          📧 Email: help.rideandhra@gmail.com{'\n'}
          📞 Customer Care: +91 83749 50475
        </Text>

        <Text style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>
          © {new Date().getFullYear()} Ride Andhra. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// STYLES
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

export default TermsAndServiceScreen;
