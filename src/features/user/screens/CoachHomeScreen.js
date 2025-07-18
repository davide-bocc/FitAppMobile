import React from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import useOfflineFirst from '../hooks/useOfflineFirst';
import { db } from '../../../database/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const CoachHomeScreen = ({ navigation }) => {
  const { data: students, loading, error, retry } = useOfflineFirst('users');
  const { data: workouts } = useOfflineFirst('workouts');

  const createNewWorkout = () => {
    navigation.navigate('CreateWorkout');
  };

  const assignWorkout = async (studentId, workoutId) => {
    try {
      await addDoc(collection(db, 'assignments'), {
        studentId,
        workoutId,
        assignedAt: new Date().toISOString()
      });
      Alert.alert('Assegnato con successo');
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  if (loading) return <Text>Caricamento...</Text>;
  if (error) return <Text>Errore: {error}</Text>;

  return (
    <View style={styles.container}>
      <Button title="Crea Nuovo Workout" onPress={createNewWorkout} />

      <Text style={styles.title}>I tuoi Workout</Text>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.workoutItem}>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text>Esercizi: {item.exercises?.length || 0}</Text>
          </View>
        )}
      />

      <Text style={styles.title}>I tuoi Allievi</Text>
      <FlatList
        data={students.filter(s => s.role === 'student')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentItem}>
            <Text>{item.name}</Text>
            <Button
              title="Assegna"
              onPress={() => navigation.navigate('AssignWorkout', { studentId: item.id })}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  workoutItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  workoutName: { fontWeight: 'bold' },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  }
});

export default CoachHomeScreen;