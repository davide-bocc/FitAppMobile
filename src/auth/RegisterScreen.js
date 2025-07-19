import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { AuthService } from '../services/AuthService';
import AuthForm from '../components/AuthForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineQueue from '../../utils/OfflineQueue';

const RegisterScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.register(
        formData.email,
        formData.password,
        {
          ...formData,
          role: userType,
          signupDate: new Date().toISOString()
        }
      );

      if (result.success) {
        // 1. Salva in coda offline per sincronizzazione differita
        await OfflineQueue.add('pendingRegistrations', {
          email: formData.email,
          userData: formData,
          timestamp: Date.now()
        });

        // 2. Naviga solo dopo aver salvato in locale
        Alert.alert('Registrazione completata', '', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]);

        // 3. Sync in background (senza bloccare l'utente)
        setTimeout(async () => {
          await OfflineQueue.processPending('pendingRegistrations');
        }, 5000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);

      // Fallback offline
      const offlineUser = {
        email: formData.email,
        ...formData,
        role: userType,
        isOffline: true,
        uid: `offline_${Date.now()}`
      };

      await AsyncStorage.setItem('offline_user', JSON.stringify(offlineUser));
      Alert.alert('Registrazione offline', 'Completerai la registrazione quando tornerai online');
      navigation.navigate('Home');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthForm
        onSubmit={handleRegister}
        type="register"
        extraFields={{ userType, setUserType }}
        isLoading={isLoading}
        error={error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  }
});

export default RegisterScreen;