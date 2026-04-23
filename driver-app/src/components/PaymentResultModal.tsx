import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PaymentResultState =
  | 'success'
  | 'cancelled'
  | 'network_error'
  | 'payment_failed'
  | 'verification_pending' // CRITICAL: money may be deducted, verification failed
  | 'config_error'
  | null;

interface PaymentResultModalProps {
  state: PaymentResultState;
  amount?: number;
  errorMessage?: string;
  paymentId?: string; // For verification_pending — driver needs this for support
  orderId?: string;
  onClose: () => void;
  onRetry?: () => void;
  onRetryVerification?: () => void;
}

const STATES = {
  success: {
    icon: 'checkmark-circle' as const,
    iconColor: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    title: 'Payment Successful!',
    subtitle: 'Your dues have been cleared. You are ready to go online.',
  },
  cancelled: {
    icon: 'close-circle' as const,
    iconColor: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    title: 'Payment Cancelled',
    subtitle: 'You cancelled the payment. Your dues remain unpaid.',
  },
  network_error: {
    icon: 'wifi' as const,
    iconColor: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    title: 'Network Error',
    subtitle: 'No internet connection detected. Please check your network and try again.',
  },
  payment_failed: {
    icon: 'alert-circle' as const,
    iconColor: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    title: 'Payment Failed',
    subtitle: 'Payment could not be completed.',
  },
  verification_pending: {
    icon: 'warning' as const,
    iconColor: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    title: 'Verification Pending',
    subtitle:
      'Your payment was received but verification failed due to a network issue. If your bank shows a deduction, contact support with your Payment ID below.',
  },
  config_error: {
    icon: 'settings' as const,
    iconColor: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    title: 'Configuration Error',
    subtitle: 'Payment gateway could not be initialized. Please restart the app and try again.',
  },
};

const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  state,
  amount,
  errorMessage,
  paymentId,
  orderId,
  onClose,
  onRetry,
  onRetryVerification,
}) => {
  if (!state) return null;

  const config = STATES[state];

  const handleCopyPaymentId = () => {
    if (paymentId) {
      Clipboard.setString(paymentId);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Payment Verification Issue - Ride Andhra');
    const body = encodeURIComponent(
      `Hi Support,\n\nI made a payment but verification failed.\n\nPayment ID: ${paymentId || 'N/A'}\nOrder ID: ${orderId || 'N/A'}\nAmount: ₹${amount?.toFixed(2) || 'N/A'}\n\nPlease verify and update my account.\n\nThank you.`
    );
    Linking.openURL(`mailto:support@rideandhra.in?subject=${subject}&body=${body}`);
  };

  return (
    <Modal visible={!!state} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: config.borderColor, backgroundColor: config.bgColor }]}>
          {/* Icon */}
          <View style={[styles.iconRing, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <Ionicons name={config.icon} size={52} color={config.iconColor} />
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: config.iconColor }]}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {/* Amount badge — show for success/cancelled/verification_pending */}
          {amount !== undefined && amount > 0 && (state === 'success' || state === 'verification_pending' || state === 'cancelled') && (
            <View style={styles.amountBadge}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
            </View>
          )}

          {/* Razorpay error detail — REMOVED as per user request to keep UI clean */}


          {/* Payment ID for verification_pending — critical for support */}
          {state === 'verification_pending' && paymentId && (
            <View style={styles.paymentIdBox}>
              <Text style={styles.paymentIdLabel}>Your Payment ID (save this)</Text>
              <TouchableOpacity onPress={handleCopyPaymentId} style={styles.paymentIdRow}>
                <Text style={styles.paymentIdValue} numberOfLines={1} ellipsizeMode="middle">
                  {paymentId}
                </Text>
                <Ionicons name="copy-outline" size={16} color="#f59e0b" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              <Text style={styles.paymentIdHint}>Tap to copy</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Retry Verification — only for verification_pending */}
            {state === 'verification_pending' && onRetryVerification && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={onRetryVerification}
              >
                <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrimaryText}>Retry Verification</Text>
              </TouchableOpacity>
            )}

            {/* Contact Support — for verification_pending */}
            {state === 'verification_pending' && (
              <TouchableOpacity style={[styles.btn, styles.btnOutline, { borderColor: '#f59e0b' }]} onPress={handleContactSupport}>
                <Ionicons name="mail-outline" size={16} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={[styles.btnOutlineText, { color: '#f59e0b' }]}>Email Support</Text>
              </TouchableOpacity>
            )}

            {/* Retry — for network/payment errors */}
            {(state === 'network_error' || state === 'payment_failed' || state === 'config_error') && onRetry && (
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onRetry}>
                <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrimaryText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {/* Close / Done */}
            <TouchableOpacity
              style={[
                styles.btn,
                state === 'success' ? styles.btnSuccess :
                state === 'verification_pending' ? styles.btnOutline :
                styles.btnOutline,
              ]}
              onPress={onClose}
            >
              <Text style={[
                state === 'success' ? styles.btnPrimaryText :
                styles.btnOutlineText,
              ]}>
                {state === 'success' ? 'Done' :
                 state === 'cancelled' ? 'Go Back' :
                 state === 'verification_pending' ? 'Close' :
                 'Dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  amountBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentIdBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    width: '100%',
    alignItems: 'center',
  },
  paymentIdLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paymentIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIdValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    maxWidth: 220,
  },
  paymentIdHint: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#fe7009',
  },
  btnSuccess: {
    backgroundColor: '#22c55e',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnOutlineText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default PaymentResultModal;
