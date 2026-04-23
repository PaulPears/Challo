import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

const { width } = Dimensions.get('window');

const SubscriptionsScreen = () => {
  const navigation = useNavigation<any>();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = (plan: any) => {
    if (!plan || !plan.id) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }
    navigation.navigate('Payment', { plan });
  };

  const dailyPlan = plans.find(p => p.name.toLowerCase().includes('daily') || p.name.toLowerCase().includes('day'));
  const weeklyPlan = plans.find(p => p.name.toLowerCase().includes('weekly') || p.name.toLowerCase().includes('week'));
  const monthlyPlan = plans.find(p => p.name.toLowerCase().includes('monthly') || p.name.toLowerCase().includes('month'));

  const PlanFeature = ({ text, isLight = false }: { text: string, isLight?: boolean }) => (
    <View style={styles.featureRow}>
      <View style={[styles.checkCircle, isLight ? styles.checkCircleLight : styles.checkCircleDark]}>
        <Ionicons name="checkmark" size={12} color={isLight ? '#fe7009' : '#fff'} />
      </View>
      <Text style={[styles.featureText, isLight ? styles.textLight : styles.textDark]}>{text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fe7009" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#1a202c" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTitle}>Zero Commission.</Text>
          <Text style={styles.bannerSubtitle}>Keep 100% of your earnings.</Text>
        </View>

        {plans.map((plan: any) => (
          <Card 
            key={plan.id} 
            style={[
              styles.planCard, 
              plan.is_popular && styles.popularCard
            ]}
          >
            {plan.is_popular ? (
              <LinearGradient
                colors={['#fe7009', '#FF8C42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>

                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, styles.textLight]}>{plan.name}</Text>
                    <Text style={[styles.planDuration, styles.textLightOpacity]}>Valid for {plan.duration_days} {plan.duration_days === 1 ? 'day' : 'days'}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={[styles.currencySymbol, styles.textLight]}>₹</Text>
                    <Text style={[styles.priceAmount, styles.textLight]}>{parseFloat(plan.price).toFixed(0)}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

                <View style={styles.featuresList}>
                  {(plan.features || []).map((feature: string, idx: number) => (
                    <PlanFeature key={idx} text={feature} isLight />
                  ))}
                </View>

                <Text style={[styles.gstText, styles.textLightOpacity]}>*GST applicable</Text>

                <TouchableOpacity
                  style={styles.whiteButton}
                  onPress={() => handleSubscription(plan)}
                >
                  <Text style={styles.whiteButtonText}>Choose {plan.name}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <View style={styles.cardInner}>
                 {plan.id === 'monthly_elite' && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>Valid for {plan.duration_days} {plan.duration_days === 1 ? 'day' : 'days'}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.priceAmount}>{parseFloat(plan.price).toFixed(0)}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.featuresList}>
                  {(plan.features || []).map((feature: string, idx: number) => (
                    <PlanFeature key={idx} text={feature} />
                  ))}
                </View>

                <Text style={styles.gstText}>*GST applicable</Text>

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => handleSubscription(plan)}
                >
                  <Text style={styles.outlineButtonText}>Select {plan.name}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        ))}

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerBanner: {
    marginBottom: 25,
    marginTop: 10,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 34,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 5,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden', // Important for overflow badges
  },
  popularCard: {
    transform: [{ scale: 1.02 }], // Slight pop
    elevation: 8,
  },
  gradientBackground: {
    padding: 24,
    borderRadius: 20,
  },
  cardInner: {
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginTop: 6,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkCircleDark: {
    backgroundColor: '#fe7009',
  },
  checkCircleLight: {
    backgroundColor: '#fff',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  textDark: {
    color: '#4A5568',
  },
  textLight: {
    color: '#fff',
  },
  textLightOpacity: {
    color: 'rgba(255,255,255,0.8)',
  },
  outlineButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fe7009',
    alignItems: 'center',
    marginTop: 5,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fe7009',
  },
  whiteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 5,
  },
  whiteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fe7009',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fe7009',
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#48BB78', // Green
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  gstText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 15,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  footerSpacing: {
    height: 40,
  },
});

export default SubscriptionsScreen;
