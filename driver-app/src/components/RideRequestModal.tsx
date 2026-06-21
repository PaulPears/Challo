import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, ActivityIndicator, Alert, Easing, Linking, Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRideRequest } from '../context/RideRequestContext';
import { useSound } from '../context/SoundContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelRideAlertNotification, showRideAlertNotification } from '../utils/rideAlertNotification';

const { width, height } = Dimensions.get('window');
const COUNTDOWN_SECONDS = 30;
const CARD_HEIGHT = 460;

interface Props {
  onAccepted: () => void;
}

const RideRequestModal: React.FC<Props> = ({ onAccepted }) => {
  const { rideRequest, clearRideRequest } = useRideRequest();
  const { stopAlert, playAlert } = useSound();

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const slideY = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isVisible = !!rideRequest;

  const startAnimations = useCallback(() => {
    // Slide-in from bottom
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    // Pulsing accept button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();

    // Progress bar
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: CARD_HEIGHT, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(callback);
  }, []);

  useEffect(() => {
    if (isVisible) {
      console.log('[RideRequestModal] Showing modal for ride:', rideRequest?.rideId);
      setCountdown(COUNTDOWN_SECONDS);
      slideY.setValue(CARD_HEIGHT);
      backdropOpacity.setValue(0);
      startAnimations();

      // ── Modal owns the sound ─────────────────────────────────────────────
      // Start looping alert sound + vibration here so it begins reliably
      // regardless of whether the app was in foreground, background, or
      // launched from a notification tap.
      playAlert('RIDE_REQUEST');
      Vibration.vibrate([0, 800, 400, 800, 400, 800], true);
      // Also fire a system notification so the alert appears on the lock screen
      showRideAlertNotification(
        rideRequest?.fare ?? 0,
        rideRequest?.pickupLocation ?? 'Pickup',
        rideRequest?.driverToPickupDistance
      );
      // ────────────────────────────────────────────────────────────────────

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Modal is hidden — stop everything immediately
      stopAlert();
      cancelRideAlertNotification();
      Vibration.cancel();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    }

    return () => {
      // Only clear the countdown interval — DO NOT call stopAlert here.
      // Calling stopAlert in the cleanup fires BEFORE the next effect body,
      // which would kill the sound the moment a new ride request arrives.
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopAlert();
    cancelRideAlertNotification();
    Vibration.cancel();
    animateOut(() => clearRideRequest());
  }, [stopAlert, clearRideRequest, animateOut]);

  const handleAccept = async () => {
    if (!rideRequest) return;

    // Stop alert immediately
    stopAlert();
    cancelRideAlertNotification();
    Vibration.cancel();

    const expiryString = await AsyncStorage.getItem('subscriptionExpiry');
    const now = new Date();
    const expiry = expiryString ? new Date(expiryString) : null;
    const graceExpiry = expiry ? new Date(expiry.getTime() + 12 * 60 * 60 * 1000) : null;
    const isValid = expiry && (now < expiry || (graceExpiry && now < graceExpiry));

    if (!isValid) {
      triggerShake();
      Alert.alert(
        'Subscription Required',
        'Your plan has expired. Please renew to accept rides.',
        [
          { text: 'Cancel', style: 'cancel', onPress: handleDismiss },
          { text: 'Renew', onPress: handleDismiss },
        ]
      );
      return;
    }

    setActionLoading('accept');
    if (countdownRef.current) clearInterval(countdownRef.current);
    try {
      await api.patch(`/rides/${rideRequest.rideId}/accept`);
      
      animateOut(() => {
        clearRideRequest();
        onAccepted();
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        Alert.alert('Ride Unavailable', 'This ride has already been accepted by another driver or was cancelled.');
      } else {
        const msg = err.response?.data?.message || 'Ride may already be taken.';
        Alert.alert('Error', msg);
      }
      handleDismiss();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rideRequest) return;
    
    // Stop alert immediately
    stopAlert();
    cancelRideAlertNotification();
    Vibration.cancel();
    setActionLoading('reject');
    try {
      await api.patch(`/rides/${rideRequest.rideId}/reject`);
    } catch (_) { /* best-effort */ } finally {
      setActionLoading(null);
      handleDismiss();
    }
  };

  if (!isVisible || !rideRequest) return null;

  const countdownColor = countdown <= 10 ? '#ff3b30' : '#fe7009';
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const glowShadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 24] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const countdownPercent = (countdown / COUNTDOWN_SECONDS) * 100;

  return (
    <Modal transparent visible={isVisible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateY: slideY },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: countdownColor,
                },
              ]}
            />
          </View>

          {/* Header with gradient */}
          <LinearGradient
            colors={['#ff8c00', '#fe7009', '#e55a00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBg}>
                <MaterialCommunityIcons name="motorbike" size={22} color="#fe7009" />
              </View>
              <View>
                <Text style={styles.headerTitle}>New Ride Request</Text>
                <Text style={styles.headerSubtitle}>Respond quickly!</Text>
              </View>
            </View>
            <View style={[styles.countdownRing, { borderColor: countdown <= 10 ? '#ff3b30' : 'rgba(255,255,255,0.5)' }]}>
              <Text style={[styles.countdownText, { color: countdown <= 10 ? '#ff3b30' : '#fff' }]}>{countdown}</Text>
              <Text style={[styles.countdownLabel, { color: countdown <= 10 ? '#ff3b30' : 'rgba(255,255,255,0.8)' }]}>sec</Text>
            </View>
          </LinearGradient>

          {/* Fare */}
          <View style={styles.fareSection}>
            <Text style={styles.fareSmallLabel}>ESTIMATED FARE</Text>
            <Text style={styles.fareValue}>₹{rideRequest.fare.toFixed(2)}</Text>
            <View style={styles.fareMeta}>
              <View style={[styles.fareMetaChip, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="location-outline" size={13} color="#0284c7" />
                <Text style={[styles.fareMetaText, { color: '#0284c7' }]}>
                  Pickup {typeof rideRequest.driverToPickupDistance === 'number' ? rideRequest.driverToPickupDistance.toFixed(1) : '--'} km away
                </Text>
              </View>
              {rideRequest.distance != null && (
                <View style={styles.fareMetaChip}>
                  <Ionicons name="navigate-outline" size={13} color="#fe7009" />
                  <Text style={styles.fareMetaText}>
                    Trip: {rideRequest.distance > 10
                      ? `${(rideRequest.distance / 1000).toFixed(1)} km`
                      : `${rideRequest.distance} km`}
                  </Text>
                </View>
              )}
              {rideRequest.duration != null && (
                <View style={styles.fareMetaChip}>
                  <Ionicons name="time-outline" size={13} color="#fe7009" />
                  <Text style={styles.fareMetaText}>
                    {rideRequest.duration > 60
                      ? `${Math.round(rideRequest.duration / 60)} min`
                      : `${rideRequest.duration} min`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Rider info */}
          {rideRequest.riderName && (
            <View style={styles.riderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                <View style={styles.riderAvatar}>
                  <MaterialCommunityIcons name="account" size={20} color="#fe7009" />
                </View>
                <Text style={styles.riderName}>{rideRequest.riderName || 'Rider'}</Text>
              </View>
              <View style={styles.riderBadge}>
                <Ionicons name="star" size={12} color="#fe7009" />
                <Text style={styles.riderBadgeText}>New Rider</Text>
              </View>
            </View>
          )}

          {/* Route */}
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}>
                <View style={[styles.routeDot, { backgroundColor: '#22c55e' }]} />
                <View style={styles.routeLineSegment} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {rideRequest.pickupLocation || 'Unknown pickup location'}
                </Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}>
                <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.routeLabel}>DROP OFF</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {rideRequest.dropoffLocation || 'Unknown dropoff location'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={handleReject}
              disabled={!!actionLoading}
              activeOpacity={0.75}
            >
              {actionLoading === 'reject' ? (
                <ActivityIndicator color="#dc3545" size="small" />
              ) : (
                <>
                  <Ionicons name="close" size={20} color="#dc3545" />
                  <Text style={styles.rejectText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.acceptGlow,
                {
                  shadowRadius: glowShadowRadius,
                  opacity: glowOpacity,
                  flex: 1,
                  marginLeft: 12,
                },
              ]}
            >
              <Animated.View
                style={{
                  flex: 1,
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={handleAccept}
                  disabled={!!actionLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#ff8c00', '#fe7009', '#e55a00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.acceptGradient}
                  >
                    {actionLoading === 'accept' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.acceptText}>Accept Ride</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#f0f0f0',
  },
  progressFill: {
    height: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  countdownRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Fare
  fareSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  fareSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#22c55e', // Green color
    letterSpacing: -1,
  },
  fareMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  fareMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5ed',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  fareMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fe7009',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginBottom: 12,
  },

  // Rider
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  riderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff5ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  riderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5ed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  riderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fe7009',
  },

  // Route
  routeBlock: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  routeIconCol: {
    alignItems: 'center',
    width: 24,
    paddingTop: 4,
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLineSegment: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 3,
    borderRadius: 2,
  },
  routeTextCol: {
    flex: 1,
    paddingBottom: 8,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  routeAddress: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 20,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  rejectBtn: {
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff5f5',
  },
  rejectText: {
    color: '#dc3545',
    fontWeight: '800',
    fontSize: 15,
  },
  acceptGlow: {
    shadowColor: '#fe7009',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  acceptBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

export default RideRequestModal;
