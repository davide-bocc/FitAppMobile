import firestore from '@react-native-firebase/firestore';
import LocalDB from '../../database/local/LocalDB';
import { checkNetworkStatus } from '../../utils/network';
import { WorkoutManager } from './WorkoutManager';

export class ExerciseService {

  static async addExercise(workoutId, exerciseData) {
    const workout =
      await LocalDB.get('workouts', workoutId) ||
      await WorkoutManager.getWorkout(workoutId);

    if (!workout) throw new Error('Workout not found');

    const exercise = {
      ...exerciseData,
      workoutId: workout.firebaseId || workoutId,
      createdAt: new Date().toISOString(),
      isSynced: false
    };

    // 1. Locale
    const localId = await LocalDB.create('exercises', exercise);

    // 2. Sync se online
    if (await checkNetworkStatus()) {
      try {
        await this.syncExercises(workoutId);
      } catch (err) {
        console.warn('Background sync failed', err);
      }
    }

    return localId;
  }

  static async getExercises(workoutId, forceRemote = false) {
    if (!forceRemote) {
      const localExercises = await LocalDB.find('exercises', { workoutId });
      if (localExercises.length > 0) return localExercises;
    }

    // Firebase (React Native Firebase)
    try {
      const snapshot = await firestore()
        .collection('exercises')
        .where('workoutId', '==', workoutId)
        .get();

      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      await LocalDB.bulkInsert('exercises', exercises);
      return exercises;

    } catch (err) {
      console.error('Failed to fetch exercises', err);
      throw err;
    }
  }

  static async syncExercises(workoutId) {
    const unsynced = await LocalDB.find('exercises', {
      workoutId,
      isSynced: false
    });

    if (unsynced.length === 0) return;

    try {
      const batchWrites = unsynced.map(async exercise => {
        const { id, isSynced, ...exerciseData } = exercise;

        const ref = await firestore()
          .collection('exercises')
          .add(exerciseData);

        await LocalDB.update('exercises', id, {
          firebaseId: ref.id,
          isSynced: true
        });
      });

      await Promise.all(batchWrites);

    } catch (err) {
      console.error('Exercise sync failed', err);
      throw err;
    }
  }

  static subscribeToExercises(workoutId, callback) {
    return firestore()
      .collection('exercises')
      .where('workoutId', '==', workoutId)
      .onSnapshot(async snapshot => {
        const exercises = [];

        for (const change of snapshot.docChanges()) {
          const exercise = {
            id: change.doc.id,
            ...change.doc.data()
          };

          await LocalDB.upsert('exercises', exercise);

          if (change.type === 'added' || change.type === 'modified') {
            exercises.push(exercise);
          }
        }

        callback(exercises);
      });
  }
}
