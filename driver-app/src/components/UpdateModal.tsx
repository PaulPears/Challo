import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UpdateModalProps {
  visible: boolean;
  onUpdate: () => void;
  currentVersion: string;
  requiredVersion: string;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, currentVersion, requiredVersion }) => {
  const handleUpdate = () => {
    // Replace with your actual Store URLs
    const url = Platform.OS === 'ios' 
      ? 'itms-apps://itunes.apple.com/app/idYOUR_ID' 
      : 'market://details?id=com.rideandhra.driver';
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback for browser
        Linking.openURL('https://rideandhra.in/download');
      }
    });
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.container}>
          <LinearGradient
            colors={['#fe7009', '#ff8c42']}
            style={styles.header}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download" size={40} color="#fe7009" />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.description}>
              A critical update is available for Ride Andhra. Please update to version {requiredVersion} to continue using the service.
            </Text>

            <View style={styles.versionRow}>
              <View style={styles.versionTag}>
                <Text style={styles.versionLabel}>Current</Text>
                <Text style={styles.versionValue}>v{currentVersion}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#cbd5e1" />
              <View style={[styles.versionTag, styles.requiredTag]}>
                <Text style={[styles.versionLabel, {color: '#fff'}]}>Required</Text>
                <Text style={[styles.versionValue, {color: '#fff'}]}>v{requiredVersion}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fe7009', '#ff8c42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Text style={styles.buttonText}>Update Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Your data and settings will stay safe.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 30,
  },
  versionTag: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  requiredTag: {
    backgroundColor: '#fe7009',
  },
  versionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

export default UpdateModal;
