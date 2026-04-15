import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useUserStore from '../../store/userStore';
import { updateUser } from '../../api/authAPI';
import { AuthStackParamList } from '../../navigation/AuthStackParamList';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

type EnterNameScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'EnterName'
>;

const EnterNameScreen = () => {
  const [name, setName] = useState('');
  const navigation = useNavigation<EnterNameScreenNavigationProp>();
  const { user, setUser } = useUserStore();

  const handleContinue = async () => {
    if (name.trim() && user) {
      try {
        const updatedUser = await updateUser({ id: user.id, name: name.trim() });
        // setUser will update state and AsyncStorage, triggering AppNavigator to switch stacks
        setUser({ ...user, name: name.trim(), isNewUser: false });
        console.log('Name updated successfully:', name.trim());
      } catch (error) {
        console.error('Error updating user name:', error);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>Please enter your full name to continue</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>Welcome to RideAndhra!</Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF5722',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: width * 0.8,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 15,
    width: width * 0.8,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#FFB399',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: 'gray',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EnterNameScreen;