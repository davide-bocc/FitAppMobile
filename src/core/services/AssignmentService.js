import firestore from '@react-native-firebase/firestore';
import { db } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';

export class WorkoutManager {

  static async createWorkout(workoutData) {
    const localId = await LocalDB.create('workouts', workoutData);

    try {
      const ref = await firestore()
        .collection('workouts')
        .add(workoutData);

      await LocalDB.update('workouts', localId, {
        firebaseId: ref.id,
        isSynced: true
      });

      return ref.id;
    } catch (err) {
      console.warn('Sync failed, keeping local copy', err);
      return localId;
    }
  }

  static async getWorkout(workoutId, isLocalId = false) {
    if (isLocalId) {
      return LocalDB.get('workouts', workoutId);
    }

    const localResult = await LocalDB.find('workouts', { firebaseId: workoutId });
    if (localResult) return localResult;

    const docSnap = await firestore()
      .collection('workouts')
      .doc(workoutId)
      .get();

    if (docSnap.exists) {
      const data = docSnap.data();
      await LocalDB.create('workouts', { ...data, firebaseId: workoutId });
      return data;
    }

    return null;
  }

  static subscribeToWorkouts(callback) {
    return firestore()
      .collection('workouts')
      .onSnapshot(async snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added' || change.type === 'modified') {
            await LocalDB.upsert('workouts', {
              ...change.doc.data(),
              firebaseId: change.doc.id
            });
          }
        });

        const workouts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        callback(workouts);
      });
  }
}