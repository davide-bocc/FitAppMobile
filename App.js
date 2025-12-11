import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { executeQuery } from './src/database/local/database';
import { getFunctionsService } from './src/database/firebase/firebaseConfig';


// Lazy loading delle schermate
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
  const [authModule, setAuthModule] = useState(null);
  const [firestoreModule, setFirestoreModule] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // 🔹 Caricamento dinamico di Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const authImport = await import('@react-native-firebase/auth');
        const firestoreImport = await import('@react-native-firebase/firestore');
        setAuthModule(authImport.default());
        setFirestoreModule(firestoreImport.default());
        setFirebaseReady(true);
        console.log('Firebase modules loaded');
      } catch (err) {
        console.error('Errore caricando Firebase:', err);
      }
    };
    initFirebase();
  }, []);

  // 🔹 Test sicuro di Firebase Functions
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
    const result = await executeQuery('SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1');
    userCache = result.rows.length > 0 ? result.rows.item(0) : null;
    return userCache;
  }, []);

  const saveUserInStorage = async (data) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('AsyncStorage non pronto:', err);
    }
  };

  const handleAuthStateChange = useCallback(async (firebaseUser) => {
    try {
      if (!firebaseReady) return;
      if (firebaseUser) {
        if (userCache?.id === firebaseUser.uid) {
          setUser(userCache);
          setUserType(userCache.role);
          return;
        }

        const userDoc = await firestoreModule
          .collection('users')
          .doc(firebaseUser.uid)
          .get({ source: 'cache' })
          .catch(() => firestoreModule.collection('users').doc(firebaseUser.uid).get());

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
  }, [checkLocalUser, firebaseReady, firestoreModule]);

  useEffect(() => {
    if (!firebaseReady) return;
    const subscriber = authModule.onAuthStateChanged(handleAuthStateChange);
    return () => {
      subscriber();
      userCache = null;
    };
  }, [handleAuthStateChange, firebaseReady, authModule]);

  const handleLogin = useCallback(async (email, password) => {
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

      const { user: firebaseUser } = await authModule.signInWithEmailAndPassword(email, password);
      const userDoc = await firestoreModule.collection('users').doc(firebaseUser.uid).get({ source: 'server' });

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
        message: err.code === 'auth/network-request-failed'
          ? 'Errore di rete. Modalità offline attivata'
          : 'Credenziali non valide'
      };
    }
  }, [firebaseReady, authModule, firestoreModule]);

  if (initializing) return null;

  return (
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
  );
}

