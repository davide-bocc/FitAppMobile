import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';

const AuthForm = ({ onSubmit, type, extraFields, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      {extraFields?.userType && <Text>User type: {extraFields.userType}</Text>}

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Button
          title={type === 'register' ? 'Register' : 'Login'}
          onPress={() => onSubmit({ email, password })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 5,
    padding: 10,
    borderRadius: 5
  },
  error: { color: 'red', marginBottom: 10 }
});

export default AuthForm;
