import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Linking, ScrollView } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import useRideStore from '../store/rideStore';
import useUserStore from '../store/userStore';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const RideStatusModal = () => {
    const { activeAlert, setAlert, currentRide, setMinimized, isMinimized } = useRideStore();
    const { user } = useUserStore();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const navigation = useNavigation<any>();

    const getVehicleEmoji = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'auto': return '🛺';
            case 'bike': return '🏍️';
            case 'cab': return '🚘';
            case 'bike-lite': return '🛵';
            case 'parcel': return '📦';
            default: return '🚗';
        }
    };

    useEffect(() => {
        // Show modal if we have a ride and it's NOT minimized
        // If it's a cancellation alert, always show it
        const shouldShow = (currentRide || activeAlert) && !isMinimized;
        
        if (shouldShow) {
            // Slide up
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
            }).start();
        } else {
            // Slide down
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [activeAlert, isMinimized, currentRide]);

    const handleClose = () => {
        setMinimized(true);
    };

    const handleDismiss = () => {
        setAlert(null);
    };

    const handleCall = () => {
        if (currentRide?.driver?.phone) {
            Linking.openURL(`tel:${currentRide.driver.phone}`);
        }
    };

    const handleCancelRide = async () => {
        if (!currentRide?.id) return;
        try {
            import('react-native').then(({ Alert }) => {
                Alert.alert(
                    'Cancel Ride',
                    'Are you sure you want to cancel this ride?',
                    [
                        { text: 'No', style: 'cancel' },
                        { 
                            text: 'Yes, Cancel', 
                            style: 'destructive',
                            onPress: async () => {
                                await rideAPI.cancelRide(currentRide.id);
                                useRideStore.getState().clearRide();
                                navigation.navigate('App');
                            }
                        }
                    ]
                );
            });
        } catch (error) {
            console.error('Failed to cancel ride:', error);
        }
    };

    if (!currentRide && !activeAlert) return null;

    const isCancelled = activeAlert?.type === 'RIDE_CANCELLED';
    const title = activeAlert?.title || (currentRide?.status === 'SEARCHING' ? 'Searching for Captain...' : 'Ride Progress');
    const message = activeAlert?.message || (currentRide?.status === 'ACCEPTED' ? 'Driver is on the way' : currentRide?.status === 'ARRIVED' ? 'Driver is at the pickup' : 'Your ride is in progress');

    const handleBookAgain = () => {
        setAlert(null);
        useRideStore.getState().clearRide();
        navigation.navigate('App');
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={handleClose}>
                    <FontAwesome name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {isCancelled ? (
                    <View style={styles.centerContent}>
                        <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                            <Text style={{ fontSize: 40 }}>😢</Text>
                        </View>
                        <Text style={styles.message}>Sorry, your request has been cancelled.</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.addressContainer}>
                            <View style={styles.addressRow}>
                                <FontAwesome name="circle" size={12} color="#22c55e" style={styles.addressIcon} />
                                <View style={styles.addressTextContainer}>
                                    <Text style={styles.addressLabel}>Pickup</Text>
                                    <Text style={styles.addressText} numberOfLines={2}>{currentRide?.pickup_address}</Text>
                                </View>
                            </View>
                            <View style={styles.verticalLineAddress} />
                            <View style={styles.addressRow}>
                                <FontAwesome name="map-marker" size={12} color="#ef4444" style={styles.addressIcon} />
                                <View style={styles.addressTextContainer}>
                                    <Text style={styles.addressLabel}>Drop-off</Text>
                                    <Text style={styles.addressText} numberOfLines={2}>{currentRide?.dropoff_address}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.rideInfoSection}>
                            <View style={styles.iconContainer}>
                                <Text style={{ fontSize: 40 }}>
                                    {getVehicleEmoji(currentRide?.vehicle_type || 'cab')}
                                </Text>
                            </View>

                            <Text style={styles.message}>{message}</Text>
                        </View>

                        {currentRide?.otp && (
                            <View style={styles.pinContainer}>
                                <Text style={styles.pinLabel}>Trip PIN</Text>
                                <Text style={styles.pinValue}>{currentRide.otp}</Text>
                            </View>
                        )}

                        {currentRide?.driver && (
                            <View style={styles.driverInfo}>
                                <View style={styles.driverHeader}>
                                    <Text style={styles.driverName}>{currentRide.driver.name}</Text>
                                    <View style={styles.ratingContainer}>
                                        <FontAwesome name="star" size={14} color="#f59e0b" />
                                        <Text style={styles.ratingText}>{currentRide.driver.rating || '4.8'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.vehicleInfo}>
                                    {currentRide.driver.vehicle_model} • {currentRide.driver.vehicle_number}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {isCancelled ? (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
                            onPress={handleBookAgain}
                        >
                            <Text style={styles.actionButtonText}>Book Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.cancelButton, { marginTop: 0 }]}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                            onPress={handleCall}
                        >
                            <Ionicons name="call" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.actionButtonText}>Call Driver</Text>
                        </TouchableOpacity>

                        {(currentRide?.status === 'SEARCHING' || currentRide?.status === 'ACCEPTED' || currentRide?.status === 'ARRIVED') && (
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: '#fee2e2', borderWidth: 0 }]}
                                onPress={handleCancelRide}
                            >
                                <Text style={[styles.cancelButtonText, { color: '#ef4444' }]}>Cancel Ride</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.cancelButton]}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.75, // Increased height
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 1000,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    rideInfoSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
    },
    driverInfo: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ratingText: {
        marginLeft: 4,
        fontWeight: 'bold',
        color: '#1f2937',
        fontSize: 12,
    },
    pinContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#e0f2fe',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignSelf: 'center',
    },
    pinLabel: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    pinValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0ea5e9',
        letterSpacing: 6,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    vehicleInfo: {
        fontSize: 14,
        color: '#6b7280',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 30, // Safe area padding
        paddingTop: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#FF5722',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#4b5563',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addressContainer: {
        width: '100%',
        marginTop: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Top align for multiline text
    },
    addressIcon: {
        width: 20,
        textAlign: 'center',
        marginRight: 12,
        marginTop: 4, // Align with text top
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    addressText: {
        fontSize: 14,
        color: '#1f2937',
        lineHeight: 20,
        fontWeight: '500',
    },
    verticalLineAddress: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
        marginLeft: 9.5,
        marginVertical: 4,
    },
});

export default RideStatusModal;
