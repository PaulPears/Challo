import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import useRideStore from '../store/rideStore';

const { width } = Dimensions.get('window');

const RideStatusBar = () => {
    const { currentRide, isMinimized, setMinimized, activeAlert } = useRideStore();

    if (!activeAlert || !isMinimized || !currentRide) return null;

    const getStatusText = () => {
        switch (currentRide.status) {
            case 'ACCEPTED': return 'Driver is on the way';
            case 'ARRIVED': return 'Driver has arrived';
            case 'STARTED': return 'Trip in progress';
            default: return 'Ride Active';
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => setMinimized(false)}
            activeOpacity={0.9}
        >
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <View style={styles.iconContainer}>
                        <FontAwesome name="car" size={20} color="#FF5722" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.driverName}>{currentRide.driver?.name || 'Your Driver'}</Text>
                        <Text style={styles.statusText}>{getStatusText()}</Text>
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <Ionicons name="chevron-up" size={24} color="#6b7280" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 1001,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statusText: {
        fontSize: 12,
        color: '#FF5722',
        fontWeight: '600',
    },
    rightSection: {
        paddingLeft: 8,
    },
});

export default RideStatusBar;
