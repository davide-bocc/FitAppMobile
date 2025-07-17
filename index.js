//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp();

// Helper: Verifica se l'utente è un coach
const isCoach = async (uid) => {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data().role === 'coach';
};

// [1] Funzione per creare workout
exports.createWorkout = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { athleteId, exercises } = data;

  if (!(await isCoach(context.auth.uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Only coaches can create workouts');
  }

  const workoutRef = await admin.firestore().collection('workouts').add({
    coachId: context.auth.uid,
    athleteId,
    exercises,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });

  return { workoutId: workoutRef.id };
});

// [2] Funzione per completare workout
exports.completeWorkout = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { workoutId, results } = data;

  await admin.firestore().collection('workouts').doc(workoutId).update({
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    results
  });

  return { success: true };
});
