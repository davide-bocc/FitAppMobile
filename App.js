import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { executeQuery } from './src/database/local/database';
import { getFunctionsService } from './src/database/firebase/firebaseConfig';

// Firebase static imports
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gesture Handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import CoachHomeScreen from './src/features/user/screens/CoachHomeScreen';
import UserHomeScreen from './src/features/user/screens/UserHomeScreen';
import WorkoutScreen from './src/features/workout/screens/WorkoutScreen';
import ExecuteWorkoutScreen from './src/features/workout/screens/ExecuteWorkoutScreen';

const Stack = createStackNavigator();
let userCache = null;

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // 🔹 Inizializza Firebase e moduli nativi
  useEffect(() => {
    setFirebaseReady(true);
    console.log('Firebase modules ready');
  }, []);

  // 🔹 Test Firebase Functions
  useEffect(() => {
    const initFunctions = async () => {
      try {
        const functionsService = await getFunctionsService();
        if (!functionsService) return;
        const testFunc = functionsService.httpsCallable('testFunction');
        const res = await testFunc({ hello: 'world' });
        console.log('Callable result:', res.data);
      } catch (err) {
        console.error('Callable error:', err.message);
      }
    };
    initFunctions();
  }, []);

  const checkLocalUser = useCallback(async () => {
    if (userCache) return userCache;
    try {
      const result = await executeQuery('SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1');
      userCache = result.rows.length > 0 ? result.rows.item(0) : null;
    } catch (err) {
      console.error('DB error in checkLocalUser:', err);
      userCache = null;
    }
    return userCache;
  }, []);

  const saveUserInStorage = async (data) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('AsyncStorage non pronto:', err);
    }
  };

  const handleAuthStateChange = useCallback(
    async (firebaseUser) => {
      try {
        if (!firebaseReady) return;

        if (firebaseUser) {
          if (userCache?.id === firebaseUser.uid) {
            setUser(userCache);
            setUserType(userCache.role);
            return;
          }

          const userDoc = await firestore
            .collection('users')
            .doc(firebaseUser.uid)
            .get({ source: 'cache' })
            .catch(() => firestore.collection('users').doc(firebaseUser.uid).get());

          if (userDoc.exists) {
            const userData = { id: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() };
            userCache = userData;
            await executeQuery(
              'INSERT OR REPLACE INTO users (id, email, role, is_logged_in, last_sync) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
              [userData.id, userData.email, userData.role]
            );
            setUser(userData);
            setUserType(userData.role);
            await saveUserInStorage(userData);
          }
        } else {
          const localUser = await checkLocalUser();
          if (localUser) {
            setUser(localUser);
            setUserType(localUser.role);
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        const localUser = await checkLocalUser();
        if (localUser) {
          setUser(localUser);
          setUserType(localUser.role);
        }
      } finally {
        setInitializing(false);
      }
    },
    [checkLocalUser, firebaseReady]
  );

  useEffect(() => {
    if (!firebaseReady) return;
    const subscriber = auth().onAuthStateChanged(handleAuthStateChange);
    return () => {
      subscriber();
      userCache = null;
    };
  }, [handleAuthStateChange, firebaseReady]);

  const handleLogin = useCallback(
    async (email, password) => {
      if (!firebaseReady) return { success: false, message: 'Firebase non pronto' };

      try {
        const localResult = await executeQuery(
          'SELECT * FROM users WHERE email = ? AND last_sync > datetime("now", "-1 hour") LIMIT 1',
          [email]
        );

        if (localResult.rows.length > 0) {
          const localUser = localResult.rows.item(0);
          setUser(localUser);
          setUserType(localUser.role);
          await saveUserInStorage(localUser);
          return { success: true };
        }

        const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password);
        const userDoc = await firestore.collection('users').doc(firebaseUser.uid).get({ source: 'server' });

        if (userDoc.exists) {
          const userData = { id: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() };
          await executeQuery(
            'INSERT OR REPLACE INTO users (id, email, role, is_logged_in, last_sync) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [userData.id, userData.email, userData.role]
          );
          setUser(userData);
          setUserType(userData.role);
          await saveUserInStorage(userData);
          return { success: true };
        }

        return { success: false, message: 'Dati utente non trovati' };
      } catch (err) {
        console.error('Login error:', err);
        const localResult = await executeQuery('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (localResult.rows.length > 0) {
          const localUser = localResult.rows.item(0);
          setUser(localUser);
          setUserType(localUser.role);
          await saveUserInStorage(localUser);
          return { success: true };
        }
        return {
          success: false,
          message:
            err.code === 'auth/network-request-failed'
              ? 'Errore di rete. Modalità offline attivata'
              : 'Credenziali non valide',
        };
      }
    },
    [firebaseReady]
  );

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Caricamento...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
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
    </GestureHandlerRootView>
  );
}
