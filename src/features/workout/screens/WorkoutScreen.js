import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import LocalDB from '../../../database/local/LocalDB';
import { collection, addDoc } from 'firebase/firestore';
import { db, fetchWithCache } from '../../../database/firebase/firebaseConfig';

const WorkoutScreen = ({ navigation }) => {
  const [workout, setWorkout] = useState({ name: '', exercises: [] });
  const [availableExercises, setAvailableExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({ id: '', sets: 3, reps: 10, restTime: 60 });
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carica esercizi con cache
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await fetchWithCache('exercises');
        setAvailableExercises(exercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
        const localExercises = await LocalDB.find('exercises');
        setAvailableExercises(localExercises);
      }
    };
    loadExercises();
  }, []);

  const handleAddExercise = () => {
    const selected = availableExercises.find(e => e.id === newExercise.id);
    if (!selected) return;

    setWorkout(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          ...newExercise,
          name: selected.name,
          key: Date.now().toString()
        }
      ]
    }));

    setIsExerciseModalVisible(false);
    setNewExercise({ id: availableExercises[0]?.id || '', sets: 3, reps: 10, restTime: 60 });
  };

  const handleRemoveExercise = (index) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleSaveWorkout = async () => {
    if (!workout.name || workout.exercises.length === 0) {
      Alert.alert('Attenzione', 'Inserisci un nome e almeno un esercizio');
      return;
    }

    setIsSaving(true);

    try {
      const workoutData = {
        name: workout.name,
        exercises: workout.exercises.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Salva in locale immediatamente
      const localId = await LocalDB.create('workouts', workoutData);

      // 2. Sincronizza con Firebase in background
      try {
        const docRef = await addDoc(collection(db, 'workouts'), workoutData);
        await LocalDB.update('workouts', localId, { firebase_id: docRef.id });
      } catch (firebaseError) {
        console.warn('Firebase sync failed, keeping local copy', firebaseError);
      }

      Alert.alert('Successo', 'Workout salvato con successo!');
      setWorkout({ name: '', exercises: [] });
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Errore', 'Salvataggio fallito');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome del Workout"
        value={workout.name}
        onChangeText={text => setWorkout(prev => ({ ...prev, name: text }))}
      />

      <Text style={styles.sectionTitle}>Esercizi</Text>

      <FlatList
        data={workout.exercises}
        keyExtractor={item => item.key}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseItem}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseDetails}>
                {item.sets}x{item.reps} - Recupero: {item.restTime}s
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
              <Icon name="trash" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nessun esercizio aggiunto</Text>}
      />

      <Button title="Aggiungi Esercizio" onPress={() => setIsExerciseModalVisible(true)} />
      <Button
        title="Salva Workout"
        onPress={handleSaveWorkout}
        disabled={isSaving || !workout.name || workout.exercises.length === 0}
        color="#2ecc71"
      />

      <Modal visible={isExerciseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiungi Esercizio</Text>

            <Picker
              selectedValue={newExercise.id}
              onValueChange={value => setNewExercise(prev => ({ ...prev, id: value }))}
            >
              {availableExercises.map(ex => (
                <Picker.Item key={ex.id} label={ex.name} value={ex.id} />
              ))}
            </Picker>

            <View style={styles.inputRow}>
              <Text>Serie:</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={newExercise.sets.toString()}
                onChangeText={text => setNewExercise(prev => ({ ...prev, sets: parseInt(text) || 0 }))}
              />
            </View>

            <View style={styles.inputRow}>
              <Text>Ripetizioni:</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={newExercise.reps.toString()}
                onChangeText={text => setNewExercise(prev => ({ ...prev, reps: parseInt(text) || 0 }))}
              />
            </View>

            <View style={styles.inputRow}>
              <Text>Recupero (sec):</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={newExercise.restTime.toString()}
                onChangeText={text => setNewExercise(prev => ({ ...prev, restTime: parseInt(text) || 0 }))}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button title="Annulla" onPress={() => setIsExerciseModalVisible(false)} color="#e74c3c" />
              <Button title="Aggiungi" onPress={handleAddExercise} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, backgroundColor: 'white' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginBottom: 10, backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontWeight: 'bold', marginBottom: 5 },
  exerciseDetails: { color: '#7f8c8d', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#95a5a6', marginVertical: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  numberInput: { width: 80, height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }
});

export default WorkoutScreen;
