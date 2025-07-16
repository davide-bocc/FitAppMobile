import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { executeQuery, getDB } from './services/database'; // Import modificato

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

  useEffect(() => {
    const initApp = async () => {
      try {
        // Inizializza il database SQLite
        const db = await getDB();

        // Verifica se esiste un utente loggato localmente
        const result = await executeQuery(
          'SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1'
        );

        if (result.rows.length > 0) {
          const loggedInUser = result.rows.item(0);
          setUser(loggedInUser);
          setUserType(loggedInUser.role); // 'coach' o 'student'
        }

      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setInitializing(false);
      }
    };

    initApp();
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
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
      const result = await executeQuery(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if (result.rows.length > 0) {
        const user = result.rows.item(0);
        // Aggiorna lo stato di login nel database
        await executeQuery(
          'UPDATE users SET is_logged_in = 1 WHERE id = ?',
          [user.id]
        );
        setUser(user);
        setUserType(user.role);
        return { success: true };
      }
      return { success: false, message: 'Credenziali non valide' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Errore durante il login' };
    }
  }
}