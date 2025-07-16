import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Picker, ActivityIndicator, Alert } from 'react-native';
import { executeQuery } from '../services/database'; // Import modificato
import * as Crypto from 'expo-crypto'; // Per hash della password

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

    // Validazione base
    if (!email || !password || !name) {
      setError('Compila tutti i campi');
      setLoading(false);
      return;
    }

    try {
      // Hash della password (base64 per semplicità)
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      // Inserimento nel database SQLite
      const result = await executeQuery(
        `INSERT INTO users (email, password, name, role, is_logged_in)
         VALUES (?, ?, ?, ?, 1)`,
        [email, passwordHash, name, userType]
      );

      if (result.insertId) {
        Alert.alert(
          'Registrazione completata',
          `Benvenuto ${name}!`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        setError('Email già registrata');
      } else {
        setError('Errore durante la registrazione');
        console.error('Registration error:', err);
      }
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
        placeholder="Password (min. 6 caratteri)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        minLength={6}
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