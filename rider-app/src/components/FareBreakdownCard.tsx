import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FareBreakdownProps {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeReason?: string;
  gst: number;
  totalFare: number;
  subtotal: number;
  superKmDiscount?: number;
  riderPayable?: number;
}

const FareBreakdownCard: React.FC<FareBreakdownProps> = ({
  baseFare,
  distanceFare,
  timeFare,
  surgeMultiplier,
  surgeReason,
  gst,
  totalFare,
  subtotal,
  superKmDiscount,
  riderPayable,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fare Breakdown</Text>
        {surgeMultiplier > 1 && (
          <View style={styles.surgeBadge}>
            <Feather name="trending-up" size={12} color="#fff" />
            <Text style={styles.surgeBadgeText}>{surgeMultiplier}x Surge</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Base Fare</Text>
        <Text style={styles.value}>₹{Number(baseFare).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Distance Fare</Text>
        <Text style={styles.value}>₹{Number(distanceFare).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Time Fare</Text>
        <Text style={styles.value}>₹{Number(timeFare).toFixed(2)}</Text>
      </View>

      {surgeMultiplier > 1 && (
        <View style={styles.row}>
          <View>
            <Text style={[styles.label, { color: '#FF5722', fontWeight: 'bold' }]}>Surge Pricing</Text>
            {surgeReason && <Text style={styles.subLabel}>{surgeReason}</Text>}
          </View>
          <Text style={[styles.value, { color: '#FF5722', fontWeight: 'bold' }]}>
            x{surgeMultiplier.toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.separator} />

      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>₹{Number(subtotal).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>GST (5%)</Text>
        <Text style={styles.value}>₹{Number(gst).toFixed(2)}</Text>
      </View>

      <View style={[styles.row, { marginTop: 8 }]}>
        <Text style={styles.totalLabel}>Total Fare</Text>
        <Text style={styles.totalValue}>₹{Number(totalFare).toFixed(2)}</Text>
      </View>

      {superKmDiscount && Number(superKmDiscount) > 0 ? (
        <>
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#2196F3', fontWeight: 'bold' }]}>Super KM Discount</Text>
            <Text style={[styles.value, { color: '#2196F3', fontWeight: 'bold' }]}>-₹{Number(superKmDiscount).toFixed(2)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: '#4CAF50' }]}>Rider Payable</Text>
            <Text style={[styles.totalValue, { color: '#4CAF50' }]}>₹{Number(riderPayable || 0).toFixed(2)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  surgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  surgeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  subLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: -2,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
});

export default FareBreakdownCard;
