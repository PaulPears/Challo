import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingHeaderProps {
  title: string;
  step?: number;
  totalSteps?: number;
  showBack?: boolean;
}

const OnboardingHeader = ({ title, step, totalSteps, showBack = true }: OnboardingHeaderProps) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {step && totalSteps && (
            <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>
          )}
        </View>

        <View style={styles.rightPlaceholder} />
      </View>
      
      {step && totalSteps && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  rightPlaceholder: {
    width: 40,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fe7009',
  },
});

export default OnboardingHeader;
