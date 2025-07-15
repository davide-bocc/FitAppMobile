import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { db } from '../services/database';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const CreateWorkoutScreen = () => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [restTime, setRestTime] = useState(60);

  useEffect(() => {
    const fetchExercises = async () => {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableExercises(exList);
      if (exList.length > 0) setSelectedExercise(exList[0].id);
    };
    fetchExercises();
  }, []);

  const addExercise = () => {
    const exercise = availableExercises.find(e => e.id === selectedExercise);
    setExercises([...exercises, {
      id: Date.now().toString(),
      exerciseId: selectedExercise,
      name: exercise.name,
      sets,
      reps,
      restTime
    }]);
  };

  const saveWorkout = async () => {
    try {
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        name: workoutName,
        createdAt: new Date().toISOString(),
        exercises: exercises.map(e => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          restTime: e.restTime
        }))
      });
      alert('Workout salvato con ID: ' + workoutRef.id);
    } catch (e) {
      alert('Errore nel salvataggio: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome Workout"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <Text style={styles.sectionTitle}>Aggiungi Esercizi</Text>

      <Picker
        selectedValue={selectedExercise}
        onValueChange={(itemValue) => setSelectedExercise(itemValue)}>
        {availableExercises.map(ex => (
          <Picker.Item key={ex.id} label={ex.name} value={ex.id} />
        ))}
      </Picker>

      <TextInput
        style={styles.smallInput}
        placeholder="Serie"
        value={sets.toString()}
        onChangeText={t => setSets(parseInt(t) || 0)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.smallInput}
        placeholder="Ripetizioni"
        value={reps.toString()}
        onChangeText={t => setReps(parseInt(t) || 0)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.smallInput}
        placeholder="Recupero (sec)"
        value={restTime.toString()}
        onChangeText={t => setRestTime(parseInt(t) || 0)}
        keyboardType="numeric"
      />

      <Button title="Aggiungi Esercizio" onPress={addExercise} />

      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.exerciseItem}>
            <Text>{item.name}</Text>
            <Text>{item.sets}x{item.reps} - Recupero: {item.restTime}s</Text>
          </View>
        )}
      />

      <Button title="Salva Workout" onPress={saveWorkout} disabled={exercises.length === 0} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10 },
  smallInput: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10, width: '30%' },
  sectionTitle: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  exerciseItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }
});

export default CreateWorkoutScreen;