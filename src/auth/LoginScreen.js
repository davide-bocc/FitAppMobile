import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthService } from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Prova con credenziali Firebase
      const result = await AuthService.login(credentials.email, credentials.password);

      if (result.success) {
        navigation.navigate('Home');
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // UI invariata
  return (
    <View style={styles.container}>
      {/* ... */}
    </View>
  );
};