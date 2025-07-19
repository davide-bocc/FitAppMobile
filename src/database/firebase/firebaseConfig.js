import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { query, where, collection } from 'firebase/firestore';
import { auth, fetchWithCache } from '../../../database/firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserHomeScreen = ({ navigation }) => {
  const userId = auth.currentUser?.uid;
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setLoading(true);

        // Usa il fetcher con cache
        const workouts = await fetchWithCache(
          'assignments',
          [where('studentId', '==', userId)]
        );

        setAssignedWorkouts(workouts);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load workouts:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (userId) {
      loadWorkouts();
    }
  }, [userId]);

  const startWorkout = (workoutId) => {
    // Log dell'avvio workout
    console.log(`Starting workout ${workoutId} at ${new Date().toISOString()}`);
    navigation.navigate('ExecuteWorkout', { workoutId });
  };

  if (loading) return <Text>Caricamento...</Text>;
  if (error) return <Text>Errore: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>I tuoi Workout assegnati</Text>

      {assignedWorkouts.length === 0 ? (
        <Text>Nessun workout assegnato</Text>
      ) : (
        <FlatList
          data={assignedWorkouts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.workoutItem}>
              <Text style={styles.workoutName}>{item.workout?.name}</Text>
              <Text>Esercizi: {item.workout?.exercises?.length || 0}</Text>
              <Button
                title="Inizia"
                onPress={() => startWorkout(item.workoutId)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  workoutItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5
  },
  workoutName: { fontWeight: 'bold', fontSize: 16 }
});

export default UserHomeScreen;