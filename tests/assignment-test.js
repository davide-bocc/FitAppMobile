import { AssignmentService } from '../core/AssignmentService';
import { initDB } from '../database/initDB';

(async () => {
  await initDB();
  const service = new AssignmentService();

  // Test assegnazione
  await service.assignWorkout('coach-123', 'student-456', 'workout-789');
  console.log('Assegnazione completata!');

  // Test recupero
  const workouts = await service.getAssignedWorkouts('student-456');
  console.log('Workouts assegnati:', workouts);
})();