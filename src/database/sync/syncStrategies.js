import LocalDB from '../local/LocalDB';
import { checkNetworkStatus } from '../../utils/network';
import firestore from '@react-native-firebase/firestore';

const SyncStrategies = {

  async syncUsers() {
    const unsyncedUsers = await LocalDB.getUnsynced('users');
    if (!unsyncedUsers.length) return;

    const batch = firestore().batch();
    const updates = [];

    for (const user of unsyncedUsers) {
      const docRef = user.firebase_id
        ? firestore().collection('users').doc(user.firebase_id)
        : firestore().collection('users').doc();

      const userData = { ...user };
      if (!user.firebase_id && user.id) userData.original_local_id = user.id;

      batch.set(docRef, userData);
      updates.push({ id: user.id, firebase_id: docRef.id });
    }

    await batch.commit();

    await Promise.all(
      updates.map(({ id, firebase_id }) =>
        LocalDB.update('users', id, { firebase_id, last_sync: new Date().toISOString() })
      )
    );
  },

  async syncWorkouts() {
    const unsyncedWorkouts = await LocalDB.getUnsynced('workouts');
    if (!unsyncedWorkouts.length) return;

    const batch = firestore().batch();
    const updates = [];

    for (const workout of unsyncedWorkouts) {
      const coach = await LocalDB.get('users', workout.coachId);
      if (!coach?.firebase_id) continue;

      const docRef = workout.firebase_id
        ? firestore().collection('workouts').doc(workout.firebase_id)
        : firestore().collection('workouts').doc();

      batch.set(docRef, { ...workout, coachId: coach.firebase_id });
      updates.push({ id: workout.id, firebase_id: docRef.id });
    }

    if (updates.length) {
      await batch.commit();
      await Promise.all(
        updates.map(({ id, firebase_id }) =>
          LocalDB.update('workouts', id, { firebase_id, last_sync: new Date().toISOString() })
        )
      );
    }
  },

  async syncExercises() {
    const unsyncedExercises = await LocalDB.getUnsynced('exercises');
    if (!unsyncedExercises.length) return;

    const batch = firestore().batch();
    const updates = [];
    const skipped = [];

    for (const exercise of unsyncedExercises) {
      const workout = await LocalDB.get('workouts', exercise.workoutId);
      if (!workout?.firebase_id) {
        skipped.push(exercise.id);
        continue;
      }

      const docRef = exercise.firebase_id
        ? firestore().collection('exercises').doc(exercise.firebase_id)
        : firestore().collection('exercises').doc();

      batch.set(docRef, { ...exercise, workoutId: workout.firebase_id });
      updates.push({ id: exercise.id, firebase_id: docRef.id });
    }

    if (skipped.length) console.warn(`Skipped exercises: ${skipped.join(', ')}`);

    if (updates.length) {
      await batch.commit();
      await Promise.all(
        updates.map(({ id, firebase_id }) =>
          LocalDB.update('exercises', id, { firebase_id, last_sync: new Date().toISOString() })
        )
      );
    }
  },

  async syncAssignments() {
    await this._pushLocalAssignments();
    await this._pullRemoteAssignments();
  },

  async _pushLocalAssignments() {
    const unsynced = await LocalDB.getUnsynced('assignments');
    if (!unsynced.length) return;

    const batch = firestore().batch();
    const updates = [];

    for (const assignment of unsynced) {
      const coach = await LocalDB.get('users', assignment.coachId);
      const student = await LocalDB.get('users', assignment.studentId);
      if (!coach?.firebase_id || !student?.firebase_id) continue;

      const docRef = assignment.firebase_id
        ? firestore().collection('assignments').doc(assignment.firebase_id)
        : firestore().collection('assignments').doc();

      batch.set(docRef, { ...assignment, coachId: coach.firebase_id, studentId: student.firebase_id });
      updates.push({ id: assignment.id, firebase_id: docRef.id });
    }

    if (updates.length) {
      await batch.commit();
      await Promise.all(
        updates.map(({ id, firebase_id }) =>
          LocalDB.update('assignments', id, { firebase_id, last_sync: new Date().toISOString() })
        )
      );
    }
  },

  async _pullRemoteAssignments() {
    if (!await checkNetworkStatus()) return;

    const lastSync = await LocalDB.getSyncMetadata('assignments_last_sync');
    let queryRef = firestore().collection('assignments');

    if (lastSync) {
      queryRef = queryRef.where('last_updated', '>', lastSync);
    }

    const snapshot = await queryRef.get();
    const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), firebase_id: doc.id }));

    if (updates.length) {
      await LocalDB.bulkInsert('assignments', updates);
      await LocalDB.setSyncMetadata('assignments_last_sync', new Date().toISOString());
    }
  },

  async fullSync() {
    if (!await checkNetworkStatus()) throw new Error('Network required for full sync');

    try {
      await this.syncUsers();
      await this.syncWorkouts();
      await this.syncExercises();
      await this.syncAssignments();
      return { success: true };
    } catch (error) {
      console.error('Full sync failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default SyncStrategies;
