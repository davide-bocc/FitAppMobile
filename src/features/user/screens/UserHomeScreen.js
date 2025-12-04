import React from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import useOfflineFirst from '../hooks/useOfflineFirst';
import firestore from '@react-native-firebase/firestore';
import { db, auth } from '../../../database/firebase/firebaseConfig';

const UserHomeScreen = ({ navigation }) => {
  const userId = auth.currentUser?.uid;
  const { data: assignedWorkouts, loading, error } = useOfflineFirst('assignments');

  const myWorkouts = assignedWorkouts.filter(aw => aw.studentId === userId);

  const startWorkout = (workoutId) => {
    navigation.navigate('ExecuteWorkout', { workoutId });
  };

  if (loading) return <Text>Caricamento...</Text>;
  if (error) return <Text>Errore: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>I tuoi Workout assegnati</Text>

      {myWorkouts.length === 0 ? (
        <Text>Nessun workout assegnato</Text>
      ) : (
        <FlatList
          data={myWorkouts}
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