import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { AuthService } from '../services/AuthService';
import useOfflineFirst from '../../hooks/useOfflineFirst';

const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { error, loading, handleOperation } = useOfflineFirst();

  const handleLogin = async () => {
    await handleOperation(
      async () => {
        const result = await AuthService.login(
          credentials.email,
          credentials.password
        );

        if (result.success) {
          navigation.navigate('Home');
        }
        return result;
      },
      {
        fallback: () => AuthService.loginOffline(credentials.email)
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* UI rimane uguale ma usa credentials state */}
    </View>
  );
};