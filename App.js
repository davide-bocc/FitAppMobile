import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './services/database';
import { onAuthStateChanged } from 'firebase/auth';

import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import CoachHomeScreen from './src/screens/CoachHomeScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ExecuteWorkoutScreen from './src/screens/ExecuteWorkoutScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [userType, setUserType] = React.useState(null);

  React.useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Qui dovresti recuperare il tipo di utente dal database
        // Per semplicità lo impostiamo staticamente
        setUser(user);
        setUserType('coach'); // o 'student' in base all'utente
      } else {
        setUser(null);
        setUserType(null);
      }
      if (initializing) setInitializing(false);
    });
    return subscriber; // Unsubscribe on unmount
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
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