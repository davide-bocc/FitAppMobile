import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthService } from './AuthService';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Compila tutti i campi');
      return;
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await AuthService.register(email, password, {
        name,
        role: userType,
        isLoggedIn: true
      });

      if (result.success) {
        Alert.alert(
          'Registrazione completata',
          `Benvenuto ${name}!`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Errore durante la registrazione');
      console.error(err);
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
      />

      <View style={styles.pickerContainer}>
        <Text>Tipo utente:</Text>
        <View style={styles.radioContainer}>
          <Button
            title="Allievo"
            onPress={() => setUserType('student')}
            color={userType === 'student' ? '#007AFF' : 'gray'}
          />
          <Button
            title="Coach"
            onPress={() => setUserType('coach')}
            color={userType === 'coach' ? '#007AFF' : 'gray'}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Registrati" onPress={handleRegister} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10 },
  pickerContainer: { marginBottom: 20 },
  radioContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  error: { color: 'red', marginBottom: 10 }
});

export default RegisterScreen;