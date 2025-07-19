import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LocalDB from '../../../database/local/LocalDB';
import TimerService from '../services/TimerService';
import { doc, getDoc } from 'firebase/firestore';
import { db, fetchWithCache } from '../../../database/firebase/firebaseConfig';

const ExecuteWorkoutScreen = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState(null);
  const [currentExercise, setCurrentExercise] = useState({
    index: 0,
    set: 1,
    isResting: false,
    timeLeft: 0
  });
  const timerRef = useRef(null);

  // Carica il workout con cache avanzata
  const loadWorkout = async () => {
    try {
      // Usa il sistema di cache centralizzato
      const cachedWorkout = await fetchWithCache('workouts', [], workoutId);

      if (cachedWorkout) {
        setWorkout(cachedWorkout);
        return;
      }

      Alert.alert('Errore', 'Workout non trovato');
      navigation.goBack();
    } catch (error) {
      console.error('Load workout error:', error);
      Alert.alert('Errore', 'Connessione assente - usando dati locali');
      const localWorkout = await LocalDB.get('workouts', workoutId);
      if (localWorkout) setWorkout(localWorkout);
    }
  };

  // Cleanup timer
  useFocusEffect(
    React.useCallback(() => {
      loadWorkout();
      return () => TimerService.cleanup();
    }, [workoutId])
  );

  // Timer countdown
  useEffect(() => {
    if (!currentExercise.isResting) return;

    timerRef.current = setInterval(() => {
      setCurrentExercise(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current);
          return { ...prev, isResting: false, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentExercise.isResting]);

  // Calcolo progresso
  useEffect(() => {
    if (!workout) return;

    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const completedSets = workout.exercises
      .slice(0, currentExercise.index)
      .reduce((sum, ex) => sum + ex.sets, 0) + (currentExercise.set - 1);

    setProgress(Math.round((completedSets / totalSets) * 100));
  }, [currentExercise, workout]);

  const handleCompleteSet = () => {
    const exercise = workout.exercises[currentExercise.index];

    if (currentExercise.set < exercise.sets) {
      // Avvia periodo di riposo
      setCurrentExercise(prev => ({
        ...prev,
        isResting: true,
        timeLeft: exercise.restTime
      }));
      TimerService.playSound();
    } else {
      // Passa all'esercizio successivo o completa
      if (currentExercise.index < workout.exercises.length - 1) {
        setCurrentExercise({
          index: currentExercise.index + 1,
          set: 1,
          isResting: false,
          timeLeft: 0
        });
      } else {
        Alert.alert('Completato!', 'Hai finito questo workout!');
        navigation.goBack();
      }
    }
  };

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text>Caricamento workout...</Text>
      </View>
    );
  }

  const exercise = workout.exercises[currentExercise.index];

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.workoutName}>{workout.name}</Text>

      <View style={styles.exerciseCard}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        <View style={styles.setsInfo}>
          <Text style={styles.setsText}>
            Serie: {currentExercise.set}/{exercise.sets}
          </Text>
          <Text style={styles.repsText}>Ripetizioni: {exercise.reps}</Text>
        </View>

        {currentExercise.isResting ? (
          <View style={styles.restContainer}>
            <Text style={styles.restText}>RECUPERO</Text>
            <Text style={styles.timerText}>{currentExercise.timeLeft}s</Text>
          </View>
        ) : (
          <Button
            title="COMPLETA SERIE"
            onPress={handleCompleteSet}
            color="#2ecc71"
          />
        )}
      </View>

      <Text style={styles.nextExercise}>
        Prossimo: {currentExercise.index < workout.exercises.length - 1 ?
          workout.exercises[currentExercise.index + 1].name : 'Fine'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db'
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2c3e50'
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#34495e'
  },
  setsInfo: {
    marginBottom: 25,
    alignItems: 'center'
  },
  setsText: {
    fontSize: 18,
    marginBottom: 5,
    color: '#7f8c8d'
  },
  repsText: {
    fontSize: 16,
    color: '#95a5a6'
  },
  restContainer: {
    alignItems: 'center',
    paddingVertical: 15
  },
  restText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  nextExercise: {
    marginTop: 20,
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic'
  }
});

export default ExecuteWorkoutScreen;