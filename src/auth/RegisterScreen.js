import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { AuthService } from '../services/AuthService';
import AuthForm from '../components/AuthForm';

const RegisterScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('student');

  const handleRegister = async (formData) => {
    const result = await AuthService.register(
      formData.email,
      formData.password,
      { ...formData, role: userType }
    );

    if (result.success) {
      Alert.alert('Registrazione completata');
      navigation.navigate('Home');
    }
  };

  return (
    <AuthForm
      onSubmit={handleRegister}
      type="register"
      extraFields={{ userType, setUserType }}
    />
  );
};