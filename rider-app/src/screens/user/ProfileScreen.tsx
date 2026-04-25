import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface ProfileRowProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
  isLast?: boolean;
}

const ProfileRow = ({ label, icon, onPress, isLast }: ProfileRowProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.profileRow, !isLast && styles.profileRowBorder]}>
    <View style={styles.profileRowLeft}>
      <FontAwesome name={icon} size={20} color="#4b5563" />
      <Text style={styles.profileLabel}>{label}</Text>
    </View>
    <FontAwesome name="chevron-right" size={16} color="#9ca3af" />
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }: { navigation: ProfileScreenNavigationProp }) => {
  const { user, clearUser, fetchUserRating } = useUserStore();
  const nav = useNavigation<any>();

  useEffect(() => {
    fetchUserRating();
  }, [fetchUserRating]);

  const handleLogout = async () => {
    clearUser();
    await AsyncStorage.removeItem('accessToken');
    nav.reset({
      index: 0,
      routes: [{ name: 'AuthStack' as any }],
    });
  };

  const handleBecomeDriver = () => {
    Linking.openURL('https://rideandhra.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <Image source={require('../../../assets/iconUser.png')} style={styles.avatar} />
            <View style={styles.editBadge}>
              <FontAwesome name="camera" size={12} color="white" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phoneNumber ?? '1234567890'}</Text>
          {user?.rating !== undefined && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome
                  key={star}
                  name={star <= (user?.rating || 0) ? 'star' : 'star-o'}
                  size={16}
                  color="#fbbf24"
                  style={styles.starIcon}
                />
              ))}
              <Text style={styles.ratingText}>{user?.rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.optionsCard}>
          <ProfileRow icon="gift" label="Super Rewards" onPress={() => (navigation as any).navigate('Rewards')} />
          <ProfileRow icon="shield" label="Privacy Policy" onPress={() => (navigation as any).navigate('PrivacyPolicy')} />
          <ProfileRow icon="question-circle" label="Help & Support" onPress={() => (navigation as any).navigate('HelpAndSupport')} />
          <ProfileRow icon="file-text" label="Terms & Service" onPress={() => (navigation as any).navigate('TermsAndService')} isLast />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={20} color="white" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.becomeDriverContainer}>
          <Text style={styles.becomeDriverTitle}>Earn with Ride Andhra</Text>
          <Text style={styles.becomeDriverSubtitle}>Join our community of professional drivers and start earning today.</Text>
          <TouchableOpacity style={styles.RiderButton} onPress={handleBecomeDriver}>
            <View style={styles.buttonGradient}>
              <FontAwesome name="car" size={20} color="white" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.riderTextHighlight}>Become a Rider and earn with 0% commission Rides</Text>
                <Text style={styles.riderSubText}>Register at rideandhra.com</Text>
              </View>
              <FontAwesome name="external-link" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Image
            source={require('../../../assets/BecomeRider.png')}
            style={styles.promoImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20, // Add some padding at the bottom of the scroll view
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    width: 65,
    height: 65,
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  userPhone: {
    color: '#6B7280',
    marginVertical: 4,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starIcon: {
    marginHorizontal: 1,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  editButton: {
    marginTop: 16,
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: '#0c4a6e',
    fontWeight: 'bold',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  profileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 16,
    marginLeft: 16,
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  becomeDriverContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  becomeDriverTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  becomeDriverSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  RiderButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden', // Ensure gradient is clipped to border radius
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fe7009', // Fallback color
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  riderTextHighlight: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  riderSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  promoImage: {
    width: '100%',
    height: 180, // Increased height for better visibility
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#fff7ed', // Subtle background color to make image pop
  },
});

export default ProfileScreen;