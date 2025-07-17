import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validazione
    if (!email || !password || !name) {
      setError('Compila tutti i campi');
      return;
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }

    if (!email.includes('@')) {
      setError('Inserisci un email valida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Registra l'utente con Firebase Auth
      const { user } = await auth().createUserWithEmailAndPassword(email, password);

      // 2. Salva dati aggiuntivi in Firestore
      await firestore().collection('users').doc(user.uid).set({
        name,
        email,
        role: userType,
        createdAt: firestore.FieldValue.serverTimestamp(),
        isActive: true
      });

      // 3. Mostra alert e reindirizza
      Alert.alert(
        'Registrazione completata',
        `Benvenuto ${name}!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );

    } catch (error) {
      // Gestione errori specifici
      let errorMessage = 'Errore durante la registrazione';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email già registrata';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email non valida';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password troppo debole';
          break;
      }

      setError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrazione FitApp</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
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

      <View style={styles.userTypeContainer}>
        <Text style={styles.label}>Tipo utente:</Text>
        <View style={styles.buttonsContainer}>
          <Button
            title="Allievo"
            onPress={() => setUserType('student')}
            color={userType === 'student' ? '#007AFF' : '#CCCCCC'}
          />
          <Button
            title="Coach"
            onPress={() => setUserType('coach')}
            color={userType === 'coach' ? '#007AFF' : '#CCCCCC'}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button
          title="Registrati"
          onPress={handleRegister}
          disabled={loading}
        />
      )}

      <Text
        style={styles.loginText}
        onPress={() => navigation.navigate('Login')}
      >
        Hai già un account? Accedi
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333'
  },
  input: {
    height: 50,
    borderColor: '#DDD',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFF'
  },
  userTypeContainer: {
    marginBottom: 20
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#555'
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center'
  },
  loginText: {
    marginTop: 20,
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline'
  }
});

export default RegisterScreen;