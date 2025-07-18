import { db } from '../firebase/firebaseConfig';
import LocalDB from '../local/LocalDB';
import { checkNetworkStatus } from '../../utils/network';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  setDoc
} from 'firebase/firestore';

// Strategie di sincronizzazione specifiche per tipo di dato
const SyncStrategies = {
  /**
   * Sincronizza gli utenti con gestione speciale degli UID
   */
  async syncUsers() {
    const unsyncedUsers = await LocalDB.getUnsynced('users');
    if (unsyncedUsers.length === 0) return;

    const batch = writeBatch(db);
    const localUpdates = [];

    for (const user of unsyncedUsers) {
      const docRef = user.firebase_id
        ? doc(db, 'users', user.firebase_id)
        : doc(collection(db, 'users'));

      // Mantieni l'UID originale per i riferimenti
      const userData = { ...user };
      if (!user.firebase_id && user.id) {
        userData.original_local_id = user.id;
      }

      batch.set(docRef, userData);
      localUpdates.push({
        id: user.id,
        updates: {
          firebase_id: docRef.id,
          last_sync: new Date().toISOString()
        }
      });
    }

    await batch.commit();

    // Aggiorna i riferimenti locali
    await Promise.all(
      localUpdates.map(({ id, updates }) =>
        LocalDB.update('users', id, updates)
      )
    );
  },

  /**
   * Sincronizza gli allenamenti con dipendenze dagli utenti
   */
  async syncWorkouts() {
    const unsyncedWorkouts = await LocalDB.getUnsynced('workouts');
    if (unsyncedWorkouts.length === 0) return;

    const batch = writeBatch(db);
    const localUpdates = [];

    for (const workout of unsyncedWorkouts) {
      // Verifica che il coach esista su Firebase
      const coach = await LocalDB.get('users', workout.coachId);
      if (!coach?.firebase_id) {
        console.warn(`Coach ${workout.coachId} not synced, skipping workout`);
        continue;
      }

      const docRef = workout.firebase_id
        ? doc(db, 'workouts', workout.firebase_id)
        : doc(collection(db, 'workouts'));

      batch.set(docRef, {
        ...workout,
        coachId: coach.firebase_id // Riferimento a Firebase ID
      });

      localUpdates.push({
        id: workout.id,
        updates: {
          firebase_id: docRef.id,
          last_sync: new Date().toISOString()
        }
      });
    }

    await batch.commit();
    await Promise.all(
      localUpdates.map(({ id, updates }) =>
        LocalDB.update('workouts', id, updates)
      )
    );
  },

  /**
   * Sincronizza gli esercizi con validazione delle dipendenze
   */
  async syncExercises() {
    const unsyncedExercises = await LocalDB.getUnsynced('exercises');
    if (unsyncedExercises.length === 0) return;

    const batch = writeBatch(db);
    const localUpdates = [];
    const skipped = [];

    for (const exercise of unsyncedExercises) {
      // Verifica che l'allenamento esista su Firebase
      const workout = await LocalDB.get('workouts', exercise.workoutId);
      if (!workout?.firebase_id) {
        skipped.push(exercise.id);
        continue;
      }

      const docRef = exercise.firebase_id
        ? doc(db, 'exercises', exercise.firebase_id)
        : doc(collection(db, 'exercises'));

      batch.set(docRef, {
        ...exercise,
        workoutId: workout.firebase_id
      });

      localUpdates.push({
        id: exercise.id,
        updates: {
          firebase_id: docRef.id,
          last_sync: new Date().toISOString()
        }
      });
    }

    if (skipped.length > 0) {
      console.warn(`Exercises skipped due to missing workout: ${skipped.join(', ')}`);
    }

    if (localUpdates.length > 0) {
      await batch.commit();
      await Promise.all(
        localUpdates.map(({ id, updates }) =>
          LocalDB.update('exercises', id, updates)
        )
      );
    }
  },

  /**
   * Sincronizzazione bidirezionale per le assegnazioni
   */
  async syncAssignments() {
    // Push delle modifiche locali
    await this._pushLocalAssignments();

    // Pull degli aggiornamenti remoti
    await this._pullRemoteAssignments();
  },

  async _pushLocalAssignments() {
    const unsynced = await LocalDB.getUnsynced('assignments');
    if (unsynced.length === 0) return;

    const batch = writeBatch(db);
    const localUpdates = [];

    for (const assignment of unsynced) {
      // Verifica che coach e studente esistano su Firebase
      const coach = await LocalDB.get('users', assignment.coachId);
      const student = await LocalDB.get('users', assignment.studentId);

      if (!coach?.firebase_id || !student?.firebase_id) {
        console.warn('Missing references for assignment', assignment.id);
        continue;
      }

      const docRef = assignment.firebase_id
        ? doc(db, 'assignments', assignment.firebase_id)
        : doc(collection(db, 'assignments'));

      batch.set(docRef, {
        ...assignment,
        coachId: coach.firebase_id,
        studentId: student.firebase_id
      });

      localUpdates.push({
        id: assignment.id,
        updates: {
          firebase_id: docRef.id,
          last_sync: new Date().toISOString()
        }
      });
    }

    if (localUpdates.length > 0) {
      await batch.commit();
      await Promise.all(
        localUpdates.map(({ id, updates }) =>
          LocalDB.update('assignments', id, updates)
        )
      );
    }
  },

  async _pullRemoteAssignments() {
    if (!await checkNetworkStatus()) return;

    const lastSync = await LocalDB.getSyncMetadata('assignments_last_sync');
    const q = lastSync
      ? query(
          collection(db, 'assignments'),
          where('last_updated', '>', lastSync)
        )
      : collection(db, 'assignments');

    const snapshot = await getDocs(q);
    const updates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      updates.push({
        id: `${data.coachId}_${data.studentId}_${data.workoutId}`,
        ...data,
        firebase_id: doc.id
      });
    }

    if (updates.length > 0) {
      await LocalDB.bulkInsert('assignments', updates);
      await LocalDB.setSyncMetadata(
        'assignments_last_sync',
        new Date().toISOString()
      );
    }
  },

  /**
   * Sincronizzazione completa con strategie di fallback
   */
  async fullSync() {
    if (!await checkNetworkStatus()) {
      throw new Error('Network required for full sync');
    }

    try {
      // Ordine di sincronizzazione importante
      await this.syncUsers();
      await this.syncWorkouts();
      await this.syncExercises();
      await this.syncAssignments();

      return { success: true };
    } catch (error) {
      console.error('Full sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default SyncStrategies;