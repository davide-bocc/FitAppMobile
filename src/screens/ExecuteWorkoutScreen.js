import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { db } from '../services/database';
import { doc, getDoc } from 'firebase/firestore';

const ExecuteWorkoutScreen = ({ route }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchWorkout = async () => {
      const workoutDoc = await getDoc(doc(db, 'workouts', workoutId));
      if (workoutDoc.exists()) {
        setWorkout({
          id: workoutDoc.id,
          ...workoutDoc.data()
        });
      }
    };
    fetchWorkout();
  }, [workoutId]);

  useEffect(() => {
    let timer;
    if (isResting && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isResting && timeLeft === 0) {
      setIsResting(false);
      setCurrentSet(currentSet + 1);
    }
    return () => clearTimeout(timer);
  }, [isResting, timeLeft]);

  const completeRep = () => {
    const currentExercise = workout.exercises[currentExerciseIndex];
    if (currentSet < currentExercise.sets) {
      setIsResting(true);
      setTimeLeft(currentExercise.restTime);
    } else {
      // Passa all'esercizio successivo
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      } else {
        // Allenamento completato
        alert('Allenamento completato!');
      }
    }
  };

  if (!workout) return <Text>Caricamento...</Text>;

  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.workoutName}>{workout.name}</Text>

      <Text style={styles.exerciseName}>
        Esercizio: {currentExercise.name}
      </Text>

      {isResting ? (
        <View style={styles.restContainer}>
          <Text style={styles.restText}>Recupero</Text>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      ) : (
        <View style={styles.setContainer}>
          <Text style={styles.setText}>
            Serie {currentSet} di {currentExercise.sets}
          </Text>
          <Text style={styles.repsText}>
            Ripetizioni: {currentExercise.reps}
          </Text>
          <Button title="Completa Ripetizione" onPress={completeRep} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  workoutName: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  exerciseName: { fontSize: 20, marginBottom: 20 },
  restContainer: { alignItems: 'center', marginVertical: 40 },
  restText: { fontSize: 24, color: 'blue' },
  timerText: { fontSize: 48, fontWeight: 'bold' },
  setContainer: { alignItems: 'center', marginVertical: 40 },
  setText: { fontSize: 20 },
  repsText: { fontSize: 18, marginVertical: 10 }
});

export default ExecuteWorkoutScreen;