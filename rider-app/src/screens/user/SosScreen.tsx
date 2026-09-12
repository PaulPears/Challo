import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Share,
  TextInput,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ChalloColors } from '../../config/theme';
import useRideStore from '../../store/rideStore';
import useUserStore from '../../store/userStore';

interface EmergencyService {
  id: string;
  name: string;
  subtitle: string;
  number: string;
  tollFree: boolean;
  icon: string;
  color: string;
  bgLight: string;
}

const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: 'police_112',
    name: 'Police / Emergency',
    subtitle: 'National Emergency Helpline (All-in-One)',
    number: '112',
    tollFree: true,
    icon: 'shield-alt',
    color: '#1D4ED8',
    bgLight: '#EFF6FF',
  },
  {
    id: 'police_100',
    name: 'Police Control Room',
    subtitle: 'Direct Police Dispatch',
    number: '100',
    tollFree: true,
    icon: 'car-alt',
    color: '#2563EB',
    bgLight: '#DBEAFE',
  },
  {
    id: 'ambulance_108',
    name: 'Medical / Ambulance',
    subtitle: 'Emergency Medical & Trauma Services',
    number: '108',
    tollFree: true,
    icon: 'ambulance',
    color: '#DC2626',
    bgLight: '#FEE2E2',
  },
  {
    id: 'ambulance_102',
    name: 'Maternal & Child Medical',
    subtitle: 'Pregnancy & Child Emergency Support',
    number: '102',
    tollFree: true,
    icon: 'heartbeat',
    color: '#E11D48',
    bgLight: '#FFE4E6',
  },
  {
    id: 'fire_101',
    name: 'Fire & Rescue',
    subtitle: 'Fire Hazards & Accident Rescue',
    number: '101',
    tollFree: true,
    icon: 'fire-extinguisher',
    color: '#EA580C',
    bgLight: '#FFEDD5',
  },
  {
    id: 'women_1091',
    name: 'Women Helpline',
    subtitle: '24x7 Safety & Distress Helpline for Women',
    number: '1091',
    tollFree: true,
    icon: 'female',
    color: '#9333EA',
    bgLight: '#F3E8FF',
  },
  {
    id: 'women_181',
    name: 'Women in Distress (Govt)',
    subtitle: 'National Women Safety Response',
    number: '181',
    tollFree: true,
    icon: 'user-shield',
    color: '#7C3AED',
    bgLight: '#EDE9FE',
  },
  {
    id: 'highway_1033',
    name: 'National Highway Emergency',
    subtitle: 'Road Accidents & Breakdown Assistance',
    number: '1033',
    tollFree: true,
    icon: 'road',
    color: '#059669',
    bgLight: '#D1FAE5',
  },
  {
    id: 'child_1098',
    name: 'Childline',
    subtitle: 'Child Care & Immediate Protection',
    number: '1098',
    tollFree: true,
    icon: 'child',
    color: '#0284C7',
    bgLight: '#E0F2FE',
  },
  {
    id: 'challo_safety',
    name: 'Challo 24x7 Safety Support',
    subtitle: 'Direct Ride Assistance & Incident Response',
    number: '1800-425-5000',
    tollFree: true,
    icon: 'headset',
    color: '#B45309',
    bgLight: '#FEF3C7',
  },
];

const SosScreen = ({ navigation }: any) => {
  const { currentRide } = useRideStore();
  const { user } = useUserStore();

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [savedContact, setSavedContact] = useState<{ name: string; phone: string } | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);

  useEffect(() => {
    loadSavedContact();
  }, []);

  const loadSavedContact = async () => {
    try {
      const stored = await AsyncStorage.getItem('challo_emergency_contact');
      if (stored) {
        setSavedContact(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load emergency contact:', e);
    }
  };

  const handleSaveContact = async () => {
    if (!emergencyContactPhone.trim()) {
      Alert.alert('Phone Number Required', 'Please enter a valid phone number for your trusted contact.');
      return;
    }
    const contact = {
      name: emergencyContactName.trim() || 'Trusted Contact',
      phone: emergencyContactPhone.trim(),
    };
    try {
      await AsyncStorage.setItem('challo_emergency_contact', JSON.stringify(contact));
      setSavedContact(contact);
      setContactModalVisible(false);
      Alert.alert('Success', 'Emergency contact saved successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save contact.');
    }
  };

  const handleCall = (number: string, title: string) => {
    Alert.alert(
      `Call ${title}?`,
      `Dialing ${number}. This will place an emergency phone call immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            const cleanNumber = number.replace(/[^0-9+]/g, '');
            Linking.openURL(`tel:${cleanNumber}`);
          },
        },
      ]
    );
  };

  const handleShareLiveLocation = async () => {
    try {
      setIsSharingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coordsText = '';
      let mapLink = '';

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coordsText = `Lat: ${loc.coords.latitude.toFixed(5)}, Lng: ${loc.coords.longitude.toFixed(5)}`;
        mapLink = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      }

      let message = `🚨 EMERGENCY ALERT FROM CHALLO APP 🚨\n\n`;
      message += `I need immediate assistance!\n`;
      if (user?.name) {
        message += `Rider: ${user.name} (${user.phoneNumber || ''})\n`;
      }
      if (currentRide && currentRide.id) {
        message += `Current Ride: #${currentRide.id.substring(0, 8)}\n`;
        message += `Pickup: ${currentRide.pickup_address || 'N/A'}\n`;
        message += `Dropoff: ${currentRide.dropoff_address || 'N/A'}\n`;
        if (currentRide.driver) {
          message += `Driver: ${currentRide.driver.name || 'Driver'} (${currentRide.driver.phone || ''})\n`;
          message += `Vehicle: ${currentRide.driver.vehicle_model || ''} - ${currentRide.driver.vehicle_number || ''}\n`;
        }
      }
      if (mapLink) {
        message += `\n📍 My Live GPS Location:\n${mapLink}\n(${coordsText})`;
      } else {
        message += `\n(Location services unavailable, please contact me immediately)`;
      }

      await Share.share({
        message,
        title: 'Challo SOS Emergency Alert',
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not share location.');
    } finally {
      setIsSharingLocation(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, sirenActive && styles.containerSiren]}>
      <StatusBar barStyle="light-content" backgroundColor="#B91C1C" />

      {/* Top Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Emergency & Safety (SOS)</Text>
          <Text style={styles.headerSubtitle}>Instant 24x7 Help & Emergency Contacts</Text>
        </View>
        <TouchableOpacity
          style={[styles.sirenToggle, sirenActive && styles.sirenToggleActive]}
          onPress={() => setSirenActive(!sirenActive)}
        >
          <MaterialCommunityIcons
            name={sirenActive ? 'alarm-light' : 'alarm-light-outline'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Instant SOS Action Card */}
        <View style={styles.instantSosCard}>
          <View style={styles.sosCardHeader}>
            <View style={styles.sosPulseIcon}>
              <MaterialCommunityIcons name="shield-alert" size={32} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sosCardTitle}>Are you in immediate danger?</Text>
              <Text style={styles.sosCardSubtitle}>
                Press below to call National Emergency (112) or share your live trip location.
              </Text>
            </View>
          </View>

          <View style={styles.sosActionRow}>
            <TouchableOpacity
              style={styles.call112Button}
              onPress={() => handleCall('112', 'National Emergency (112)')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="phone-in-talk" size={20} color="#FFFFFF" />
              <Text style={styles.call112Text}>CALL 112</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareLocationButton}
              onPress={handleShareLiveLocation}
              disabled={isSharingLocation}
              activeOpacity={0.85}
            >
              <Feather name="navigation" size={18} color="#111827" />
              <Text style={styles.shareLocationText}>
                {isSharingLocation ? 'Locating...' : 'Share Location'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trusted Emergency Contact Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trusted Personal Contact</Text>
          <TouchableOpacity onPress={() => setContactModalVisible(true)}>
            <Text style={styles.editContactText}>{savedContact ? 'Change' : '+ Add Contact'}</Text>
          </TouchableOpacity>
        </View>

        {savedContact ? (
          <View style={styles.savedContactCard}>
            <View style={styles.contactAvatar}>
              <FontAwesome5 name="user-friends" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactName}>{savedContact.name}</Text>
              <Text style={styles.contactPhone}>{savedContact.phone}</Text>
            </View>
            <TouchableOpacity
              style={styles.callContactButton}
              onPress={() => handleCall(savedContact.phone, savedContact.name)}
            >
              <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.callContactText}>Call</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addContactCard}
            onPress={() => setContactModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color="#D97706" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addContactTitle}>Add an Emergency Contact</Text>
              <Text style={styles.addContactSubtitle}>
                Add family or a close friend to alert them with 1 tap during trips.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 24x7 Official Emergency Contacts List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Official Emergency Numbers</Text>
          <Text style={styles.sectionBadge}>Toll-Free 24x7</Text>
        </View>

        {EMERGENCY_SERVICES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.serviceRow}
            onPress={() => handleCall(item.number, item.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: item.bgLight }]}>
              <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.serviceDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.serviceName}>{item.name}</Text>
                {item.tollFree && (
                  <View style={styles.tollFreeBadge}>
                    <Text style={styles.tollFreeBadgeText}>Free</Text>
                  </View>
                )}
              </View>
              <Text style={styles.serviceSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={[styles.dialBadge, { backgroundColor: item.color }]}>
              <Text style={styles.dialBadgeNumber}>{item.number}</Text>
              <MaterialCommunityIcons name="phone" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Safety Notice Footer */}
        <View style={styles.safetyNoticeCard}>
          <Ionicons name="information-circle" size={22} color="#4B5563" />
          <Text style={styles.safetyNoticeText}>
            Calls to 112, 108, 100, and 101 are free of charge from any mobile provider in India, even without SIM card credit.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal to Add/Edit Contact */}
      <Modal visible={contactModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Emergency Contact</Text>
            <Text style={styles.modalSubtitle}>
              Enter the contact details of a family member or friend.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contact Name (e.g. Mom, Brother, Friend)"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="10-Digit Mobile Number"
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
              maxLength={15}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setContactModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveModalButtonText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerSiren: {
    backgroundColor: '#FEF2F2',
  },
  header: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#FEE2E2',
    fontSize: 12,
    marginTop: 2,
  },
  sirenToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  sirenToggleActive: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
  },
  instantSosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 20,
  },
  sosCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sosPulseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  sosCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 16,
  },
  sosActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  call112Button: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  call112Text: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  shareLocationButton: {
    flex: 1,
    backgroundColor: ChalloColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  shareLocationText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  editContactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  savedContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 18,
    elevation: 2,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  callContactButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  callContactText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  addContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  addContactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  addContactSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  serviceSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tollFreeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tollFreeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  dialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dialBadgeNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  safetyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
  },
  safetyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  saveModalButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveModalButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default SosScreen;
