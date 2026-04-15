import React, { memo } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PremiumInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  error?: string;
  maxLength?: number;
}

/**
 * FIXED: Removed internal 'isFocused' state that was changing parent layout dimensions.
 * On Android, changing border/padding of a TextInput parent during focus often triggers a blur.
 * This version uses a fixed, premium style that remains stable during typing.
 */
const PremiumInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  secureTextEntry,
  error,
  maxLength,
}: PremiumInputProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        error ? styles.inputContainerError : null
      ]}>
        {icon && (
          <MaterialCommunityIcons 
            name={icon as any} 
            size={22} 
            color="#fe7009" 
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCorrect={false}
          autoCapitalize="none"
          // Crucial for Android focus stability
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    paddingHorizontal: 16,
    height: 60,
    // Soft shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#ff4d4d',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1a1a1a',
    height: '100%',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default memo(PremiumInput);
