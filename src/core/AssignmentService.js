import SQLite from 'react-native-sqlite-storage';

export class AssignmentService {
  private db = SQLite.openDatabase({ name: 'fitapp.db' });

  async assignWorkout(coachId: string, studentId: string, workoutId: string): Promise<void> {
    await this.db.executeSql(
      `INSERT INTO assignments (coach_id, student_id, workout_id) VALUES (?, ?, ?)`,
      [coachId, studentId, workoutId]
    );
  }

  async getAssignedWorkouts(studentId: string): Promise<any[]> {
    const [results] = await this.db.executeSql(
      `SELECT * FROM workouts
       JOIN assignments ON workouts.id = assignments.workout_id
       WHERE assignments.student_id = ?`,
      [studentId]
    );
    return results.rows.raw();
  }
}