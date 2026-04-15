import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PermissionRationaleModalProps {
    isVisible: boolean;
    title: string;
    description: string;
    icon: string;
    onAllow: () => void;
    onCancel: () => void;
}

const { width } = Dimensions.get('window');

const PermissionRationaleModal: React.FC<PermissionRationaleModalProps> = ({
    isVisible,
    title,
    description,
    icon,
    onAllow,
    onCancel,
}) => {
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name={icon as any} size={48} color="#fe7009" />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>

                    <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
                        <Text style={styles.allowButtonText}>ALLOW ACCESS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>NOT NOW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(254, 112, 9, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#4a4a4a',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    allowButton: {
        width: '100%',
        backgroundColor: '#fe7009',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    allowButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#7a7a7a',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PermissionRationaleModal;
