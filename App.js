import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { executeQuery, getDB } from './services/database';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Import screens
import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import CoachHomeScreen from './src/screens/CoachHomeScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ExecuteWorkoutScreen from './src/screens/ExecuteWorkoutScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  // Gestisce lo stato di autenticazione Firebase
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Ottieni i dati aggiuntivi da Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            setUser({ ...firebaseUser, ...userData });
            setUserType(userData.role);

            // Salva anche in SQLite se necessario
            await executeQuery(
              'INSERT OR REPLACE INTO users (id, email, role, is_logged_in) VALUES (?, ?, ?, 1)',
              [firebaseUser.uid, firebaseUser.email, userData.role]
            );
          }
        } else {
          // Fallback al database locale
          const localUser = await checkLocalUser();
          if (localUser) {
            setUser(localUser);
            setUserType(localUser.role);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setInitializing(false);
      }
    });

    return subscriber; // Unsubscribe on unmount
  }, []);

  const checkLocalUser = async () => {
    const result = await executeQuery(
      'SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1'
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  };

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userType === 'coach' ? (
          <>
            <Stack.Screen name="Home" component={CoachHomeScreen} />
            <Stack.Screen name="CreateWorkout" component={WorkoutScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={UserHomeScreen} />
            <Stack.Screen name="ExecuteWorkout" component={ExecuteWorkoutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

  async function handleLogin(email, password) {
    try {
      // 1. Prova il login con Firebase
      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password);

      // 2. Ottieni i dati aggiuntivi da Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const completeUser = { ...firebaseUser, ...userData };

        // 3. Salva in SQLite per accesso offline
        await executeQuery(
          'INSERT OR REPLACE INTO users (id, email, role, is_logged_in) VALUES (?, ?, ?, 1)',
          [firebaseUser.uid, email, userData.role]
        );

        setUser(completeUser);
        setUserType(userData.role);
        return { success: true };
      }
      return { success: false, message: 'Dati utente non trovati' };
    } catch (error) {
      console.error('Login error:', error);

      // Fallback al database locale se Firebase fallisce
      const localResult = await executeQuery(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if (localResult.rows.length > 0) {
        const localUser = localResult.rows.item(0);
        setUser(localUser);
        setUserType(localUser.role);
        return { success: true };
      }

      return {
        success: false,
        message: error.code === 'auth/user-not-found'
          ? 'Utente non registrato'
          : 'Credenziali non valide'
      };
    }
  }
}