import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Picker, ActivityIndicator } from 'react-native';
import { AuthService } from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await AuthService.register(email, password, userType);

      if (result.success) {
        // Salva il token e i dati utente
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: result.user.id,
          name,
          email,
          userType
        }));

        navigation.navigate('Home');
      } else {
        setError(result.error || 'Registrazione fallita');
      }
    } catch (err) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrazione</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Picker
        selectedValue={userType}
        style={styles.picker}
        onValueChange={setUserType}>
        <Picker.Item label="Allievo" value="student" />
        <Picker.Item label="Coach" value="coach" />
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Registrati" onPress={handleRegister} />
      )}
    </View>
  );
};

// Stili rimangono identici
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10 },
  picker: { height: 50, width: '100%', marginBottom: 20 },
  error: { color: 'red', marginBottom: 10 }
});

export default RegisterScreen;