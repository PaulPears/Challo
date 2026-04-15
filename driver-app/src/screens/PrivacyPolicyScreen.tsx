import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Title } from 'react-native-paper';
const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Privacy Policy</Title>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: November 9, 2025</Text>

        <Text style={styles.paragraph}>
          Ride Andhra (“we”, “our”, or “us”) operates the Ride Andhra mobile application and website (“App”, “Service”).
          This Privacy Policy explains how we collect, use, and protect your personal information when you use our services as a driver, rider, or partner.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect the following types of information to provide safe and reliable service:
        </Text>

        <Text style={styles.subheading}>1.1. Personal Information</Text>
        <Text style={styles.listItem}>- Name, phone number, email address</Text>
        <Text style={styles.listItem}>- Driver’s licence, Aadhaar or ID proof</Text>
        <Text style={styles.listItem}>- Vehicle registration details</Text>
        <Text style={styles.listItem}>- Bank account or UPI ID for payouts</Text>

        <Text style={styles.subheading}>1.2. Location Data</Text>
        <Text style={styles.listItem}>- Real-time GPS data to match drivers with riders, show routes, and calculate fares</Text>
        <Text style={styles.listItem}>- Location data continues to be collected while you are “Online” in the driver app, even if the app is running in the background</Text>

        <Text style={styles.subheading}>1.3. Device Information</Text>
        <Text style={styles.listItem}>- Device type, model, operating system version</Text>
        <Text style={styles.listItem}>- App usage data and crash logs for performance improvement</Text>

        <Text style={styles.subheading}>1.4. Payment & Transaction Data</Text>
        <Text style={styles.listItem}>- Payment status, fare details, wallet balances, and subscription or commission records</Text>

        <Text style={styles.subheading}>1.5. Communications</Text>
        <Text style={styles.listItem}>- Messages or support requests you send to our team</Text>
        <Text style={styles.listItem}>- Ratings, reviews, or feedback</Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your data to:
        </Text>
        <Text style={styles.listItem}>- Enable ride matching and navigation</Text>
        <Text style={styles.listItem}>- Calculate fares and process payments</Text>
        <Text style={styles.listItem}>- Verify driver and vehicle identity</Text>
        <Text style={styles.listItem}>- Improve app experience, performance, and safety</Text>
        <Text style={styles.listItem}>- Provide customer support</Text>
        <Text style={styles.listItem}>- Send important service updates, ride summaries, and promotional offers</Text>
        <Text style={styles.listItem}>- Comply with legal and regulatory obligations</Text>

        <Text style={styles.heading}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data. We may share limited information only in these cases:
        </Text>
        <Text style={styles.listItem}>- With riders, to show driver name, photo, and vehicle details during a ride</Text>
        <Text style={styles.listItem}>- With payment partners (banks, gateways) for processing transactions</Text>
        <Text style={styles.listItem}>- With government authorities when legally required</Text>
        <Text style={styles.listItem}>- With trusted service providers who assist in app hosting, analytics, or communications (under confidentiality agreements)</Text>

        <Text style={styles.heading}>4. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          All data is stored securely on cloud servers located within India (or as per applicable law).
          We use encryption, access control, and regular audits to protect your information.
          However, no online system is 100% secure — you share information at your own risk.
        </Text>

        <Text style={styles.heading}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You may:
        </Text>
        <Text style={styles.listItem}>- Access or update your personal details within the app</Text>
        <Text style={styles.listItem}>- Request deletion of your account and personal data (subject to legal and tax retention requirements)</Text>
        <Text style={styles.listItem}>- Withdraw consent for marketing or location tracking when offline</Text>
        <Text style={styles.paragraph}>
          To exercise these rights, contact us at: support@rideandhra.in
        </Text>

        <Text style={styles.heading}>6. Cookies and Analytics</Text>
        <Text style={styles.paragraph}>
          We use limited cookies or analytics tools to measure app usage, fix bugs, and improve performance. No sensitive data is stored in cookies.
        </Text>

        <Text style={styles.heading}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain ride and payment records for as long as legally necessary or as required for driver payments and tax audits.
        </Text>

        <Text style={styles.heading}>8. Children’s Privacy</Text>
        <Text style={styles.paragraph}>
          Our app is intended for adults (18+). We do not knowingly collect data from minors.
        </Text>

        <Text style={styles.heading}>9. Updates to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy occasionally. Updates will be posted in the app and on our website. Continued use of our services means you accept the changes.
        </Text>

        <Text style={styles.heading}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions or complaints about this policy, please contactbr
          📩 help.rideandhra@gmail.com
          📍 Ride Andhra Mobility Pvt. Ltd.,  Anantapur district, Kurnool district, Kadapa district,
          Andhra Pradesh, India
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 5,
  },
});

export default PrivacyPolicyScreen;
