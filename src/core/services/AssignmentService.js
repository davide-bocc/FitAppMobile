import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../database/firebase/firebaseConfig';
import LocalDB from '../../database/local/LocalDB';

export class AssignmentService {
  static async assignWorkout(coachId, studentId, workoutId) {
    const assignment = {
      coachId,
      studentId,
      workoutId,
      assignedAt: new Date().toISOString(),
      isSynced: false
    };

    // 1. Salva localmente
    await LocalDB.create('assignments', assignment);

    // 2. Sincronizza in background
    try {
      const docRef = await addDoc(collection(db, 'assignments'), {
        ...assignment,
        isSynced: true
      });
      await LocalDB.update('assignments', assignment.id, {
        firebaseId: docRef.id,
        isSynced: true
      });
    } catch (error) {
      console.warn('Firebase sync failed', error);
    }
  }

  static async getAssignedWorkouts(studentId) {
    // Prima controlla locale
    const localResults = await LocalDB.find('assignments', { studentId });

    if (localResults.length > 0) {
      return localResults;
    }

    // Se non ci sono risultati locali, cerca su Firebase
    const q = query(
      collection(db, 'assignments'),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);
    const results = [];

    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });

    // Cache locale
    await LocalDB.bulkInsert('assignments', results);

    return results;
  }
}