import React from 'react';
import { Modal, View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BRAND } from '../config/theme';

interface RegionalRestrictionModalProps {
    isVisible: boolean;
}

const { width } = Dimensions.get('window');

const RegionalRestrictionModal: React.FC<RegionalRestrictionModalProps> = ({ isVisible }) => {
    return (
        <Modal visible={isVisible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="map-marker-off" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Service Unavailable</Text>
                    <Text style={styles.description}>
                        We're sorry! <Text style={styles.brand}>{BRAND.shortName}</Text> currently operates exclusively within the state of <Text style={styles.highlight}>Andhra Pradesh</Text>.
                    </Text>
                    <Text style={styles.footerNote}>
                        We are expanding to other regions soon. Thank you for your patience!
                    </Text>

                    <View style={styles.locationBadge}>
                        <MaterialCommunityIcons name="state-machine" size={18} color={COLORS.primaryDark} />
                        <Text style={styles.locationBadgeText}>AP Region Only</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 17,
        color: '#444',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 24,
    },
    brand: {
        color: COLORS.primaryDark,
        fontWeight: '700',
    },
    highlight: {
        fontWeight: '800',
        color: '#000',
    },
    footerNote: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 32,
    },
    locationBadge: {
        flexDirection: 'row',
        backgroundColor: COLORS.primarySoft,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primaryMuted,
    },
    locationBadgeText: {
        color: COLORS.primaryDark,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
});

export default RegionalRestrictionModal;
