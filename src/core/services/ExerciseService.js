// src/core/services/ExerciseService.js
import { collection, addDoc, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';
import { checkNetworkStatus } from '../../utils/network';

export class ExerciseService {
  /**
   * Aggiunge un esercizio al workout (offline-first)
   * @param {string} workoutId - ID del workout
   * @param {object} exerciseData - Dati dell'esercizio
   * @returns {Promise<string>} - ID dell'esercizio creato
   */
  static async addExercise(workoutId, exerciseData) {
    // Verifica se il workout esiste
    const workout = await LocalDB.get('workouts', workoutId) ||
                   await WorkoutManager.getWorkout(workoutId);

    if (!workout) {
      throw new Error('Workout not found');
    }

    const exercise = {
      ...exerciseData,
      workoutId: workout.firebaseId || workoutId,
      createdAt: new Date().toISOString(),
      isSynced: false
    };

    // 1. Salva localmente
    const localId = await LocalDB.create('exercises', exercise);

    // 2. Sincronizza in background se c'è connessione
    if (await checkNetworkStatus()) {
      try {
        await this.syncExercises(workoutId);
      } catch (error) {
        console.warn('Background sync failed', error);
      }
    }

    return localId;
  }

  /**
   * Recupera gli esercizi di un workout
   * @param {string} workoutId - ID del workout
   * @param {boolean} forceRemote - Forza il caricamento da Firebase
   * @returns {Promise<Array>} - Lista di esercizi
   */
  static async getExercises(workoutId, forceRemote = false) {
    // 1. Controlla prima il database locale se non forzato
    if (!forceRemote) {
      const localExercises = await LocalDB.find('exercises', { workoutId });
      if (localExercises.length > 0) return localExercises;
    }

    // 2. Carica da Firebase se non trovato localmente o forzato
    try {
      const q = query(
        collection(db, 'exercises'),
        where('workoutId', '==', workoutId)
      );
      const snapshot = await getDocs(q);
      const exercises = [];

      snapshot.forEach(doc => {
        exercises.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 3. Salva in cache locale
      await LocalDB.bulkInsert('exercises', exercises);
      return exercises;
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      throw error;
    }
  }

  /**
   * Sincronizza gli esercizi non sincronizzati
   * @param {string} workoutId - ID del workout
   * @returns {Promise<void>}
   */
  static async syncExercises(workoutId) {
    const unsyncedExercises = await LocalDB.find('exercises', {
      workoutId,
      isSynced: false
    });

    if (unsyncedExercises.length === 0) return;

    try {
      const batchWrites = unsyncedExercises.map(async (exercise) => {
        const { id, isSynced, ...exerciseData } = exercise;

        // 1. Carica su Firebase
        const docRef = await addDoc(collection(db, 'exercises'), exerciseData);

        // 2. Aggiorna record locale
        await LocalDB.update('exercises', id, {
          firebaseId: docRef.id,
          isSynced: true
        });
      });

      await Promise.all(batchWrites);
    } catch (error) {
      console.error('Exercise sync failed:', error);
      throw error;
    }
  }

  /**
   * Sottoscrizione agli aggiornamenti in tempo reale
   * @param {string} workoutId - ID del workout
   * @param {function} callback - Funzione di callback
   * @returns {function} - Funzione per annullare la sottoscrizione
   */
  static subscribeToExercises(workoutId, callback) {
    const q = query(
      collection(db, 'exercises'),
      where('workoutId', '==', workoutId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const changes = snapshot.docChanges();
      const exercises = [];

      for (const change of changes) {
        const exercise = {
          id: change.doc.id,
          ...change.doc.data()
        };

        // Aggiorna il database locale
        await LocalDB.upsert('exercises', exercise);

        if (change.type === 'added' || change.type === 'modified') {
          exercises.push(exercise);
        }
      }

      callback(exercises);
    });

    return unsubscribe;
  }
}