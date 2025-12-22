import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Firebase
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
  const [dbReady, setDbReady] = useState(false);

  const dbRef = useRef(null);

  // 🔹 Firebase ready
  useEffect(() => {
    setFirebaseReady(true);
  }, []);

  // 🔹 Lazy SQLite init (CRITICO)
  useEffect(() => {
    let mounted = true;

    const initDb = async () => {
      try {
        const dbModule = await import('./src/database/local/database');
        dbRef.current = dbModule;
        if (mounted) setDbReady(true);
        console.log('SQLite ready');
      } catch (err) {
        console.error('SQLite init error:', err);
      }
    };

    initDb();
    return () => {
      mounted = false;
    };
  }, []);

  const checkLocalUser = useCallback(async () => {
    if (!dbReady || !dbRef.current) return null;
    if (userCache) return userCache;

    try {
      const result = await dbRef.current.executeQuery(
        'SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1'
      );
      userCache = result.rows.length > 0 ? result.rows.item(0) : null;
    } catch (err) {
      console.error('DB error:', err);
      userCache = null;
    }
    return userCache;
  }, [dbReady]);

  const saveUserInStorage = async (data) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('AsyncStorage error:', err);
    }
  };

  const handleAuthStateChange = useCallback(
    async (firebaseUser) => {
      try {
        if (!firebaseReady || !dbReady) return;

        if (firebaseUser) {
          const userDoc = await firestore.collection('users').doc(firebaseUser.uid).get();

          if (userDoc.exists) {
            const userData = { id: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() };
            userCache = userData;

            await dbRef.current.executeQuery(
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
      } finally {
        setInitializing(false);
      }
    },
    [firebaseReady, dbReady, checkLocalUser]
  );

  useEffect(() => {
    if (!firebaseReady || !dbReady) return;
    const subscriber = auth().onAuthStateChanged(handleAuthStateChange);
    return () => subscriber();
  }, [handleAuthStateChange, firebaseReady, dbReady]);

  if (initializing || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Caricamento...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} />}
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
