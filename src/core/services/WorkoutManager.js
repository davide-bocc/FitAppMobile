import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';

export class WorkoutManager {
  static async createWorkout(workoutData) {
    // 1. Salva localmente
    const localId = await LocalDB.create('workouts', workoutData);

    // 2. Sincronizza con Firebase
    try {
      const docRef = await addDoc(collection(db, 'workouts'), workoutData);
      await LocalDB.update('workouts', localId, {
        firebaseId: docRef.id,
        isSynced: true
      });
      return docRef.id;
    } catch (error) {
      console.warn('Sync failed, keeping local copy', error);
      return localId;
    }
  }

  static async getWorkout(workoutId, isLocalId = false) {
    if (isLocalId) {
      return LocalDB.get('workouts', workoutId);
    }

    // Prima cerca localmente
    const localResult = await LocalDB.find('workouts', { firebaseId: workoutId });
    if (localResult) return localResult;

    // Se non trovato localmente, cerca su Firebase
    const docRef = doc(db, 'workouts', workoutId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      await LocalDB.create('workouts', { ...data, firebaseId: workoutId });
      return data;
    }

    return null;
  }

  static subscribeToWorkouts(callback) {
    // Listener per cambiamenti realtime
    const unsubscribe = onSnapshot(
      collection(db, 'workouts'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            await LocalDB.upsert('workouts', {
              ...change.doc.data(),
              firebaseId: change.doc.id
            });
          }
        });
        callback(snapshot.docs.map(doc => doc.data()));
      }
    );

    return unsubscribe;
  }
}