import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { executeQuery } from './src/database/local/database';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions, { firebase } from '@react-native-firebase/functions';


// Lazy loading delle schermate
import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import CoachHomeScreen from './src/features/user/screens/CoachHomeScreen';
import UserHomeScreen from './src/features/user/screens/UserHomeScreen';
import WorkoutScreen from './src/features/workout/screens/WorkoutScreen';
import ExecuteWorkoutScreen from './src/features/workout/screens/ExecuteWorkoutScreen';

const Stack = createStackNavigator();

// Cache locale per i dati utente
let userCache = null;

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  // 🔹 Test rapido Functions
  useEffect(() => {
    console.log('functions import:', functions);
    console.log('firebase.functions():', firebase.functions());

    if (firebase.functions) {
      const testFunc = firebase.functions().httpsCallable('testFunction');
      testFunc({ hello: 'world' })
        .then(res => console.log('Callable result:', res.data))
        .catch(err => console.error('Callable error:', err));
    }
  }, []);

  const checkLocalUser = useCallback(async () => {
    if (userCache) return userCache;

    const result = await executeQuery(
      'SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1'
    );
    userCache = result.rows.length > 0 ? result.rows.item(0) : null;
    return userCache;
  }, []);

  const handleAuthStateChange = useCallback(async (firebaseUser) => {
    try {
      if (firebaseUser) {
        // Ottimizzazione: Controlla prima la cache locale
        if (userCache?.id === firebaseUser.uid) {
          setUser(userCache);
          setUserType(userCache.role);
          return;
        }

        // Usa get() invece di onSnapshot per ridurre le chiamate
        const userDoc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get({ source: 'cache' })  // Prima prova la cache
          .catch(() => firestore().collection('users').doc(firebaseUser.uid).get());

        if (userDoc.exists) {
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDoc.data()
          };

          userCache = userData;

          // Batch operation per SQLite
          await executeQuery(
            'INSERT OR REPLACE INTO users (id, email, role, is_logged_in, last_sync) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [userData.id, userData.email, userData.role]
          );

          setUser(userData);
          setUserType(userData.role);
        }
      } else {
        const localUser = await checkLocalUser();
        if (localUser) {
          setUser(localUser);
          setUserType(localUser.role);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Fallback completo alla cache locale
      const localUser = await checkLocalUser();
      if (localUser) {
        setUser(localUser);
        setUserType(localUser.role);
      }
    } finally {
      setInitializing(false);
    }
  }, [checkLocalUser]);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(handleAuthStateChange);
    return () => {
      subscriber();
      // Pulizia memoria
      userCache = null;
    };
  }, [handleAuthStateChange]);

  const handleLogin = useCallback(async (email, password) => {
    try {
      // 1. Prova la cache locale prima di Firebase
      const localResult = await executeQuery(
        'SELECT * FROM users WHERE email = ? AND last_sync > datetime("now", "-1 hour") LIMIT 1',
        [email]
      );

      if (localResult.rows.length > 0) {
        const localUser = localResult.rows.item(0);
        setUser(localUser);
        setUserType(localUser.role);
        return { success: true };
      }

      // 2. Solo se necessario, chiama Firebase
      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password);
      const userDoc = await firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .get({ source: 'server' });

      if (userDoc.exists) {
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          ...userDoc.data()
        };

        // Aggiornamento batch
        await Promise.all([
          executeQuery(
            'INSERT OR REPLACE INTO users (id, email, role, is_logged_in, last_sync) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [userData.id, userData.email, userData.role]
          ),
          // Altri aggiornamenti correlati...
        ]);

        setUser(userData);
        setUserType(userData.role);
        return { success: true };
      }
      return { success: false, message: 'Dati utente non trovati' };
    } catch (error) {
      console.error('Login error:', error);
      // Fallback dettagliato
      const localResult = await executeQuery(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (localResult.rows.length > 0) {
        const localUser = localResult.rows.item(0);
        setUser(localUser);
        setUserType(localUser.role);
        return { success: true };
      }

      return {
        success: false,
        message: error.code === 'auth/network-request-failed'
          ? 'Errore di rete. Modalità offline attivata'
          : 'Credenziali non valide'
      };
    }
  }, []);

  if (initializing) {
    return null; // O un componente di loading ottimizzato
  }

  return (
     <NavigationContainer>
       <Stack.Navigator
         screenOptions={{
           headerShown: false,
           animationEnabled: false
         }}
       >
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