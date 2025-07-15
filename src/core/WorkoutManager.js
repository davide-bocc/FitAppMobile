import { openDatabase } from 'react-native-sqlite-storage';
import { DB_SCHEMAS } from '../database/schemas';

const db = openDatabase({ name: 'fitapp.db' });

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

export class WorkoutManager {
  static async initDB(): Promise<void> {
    await db.executeSql(DB_SCHEMAS.WORKOUTS);
    await db.executeSql(DB_SCHEMAS.EXERCISES);
  }

  static async addExercise(
    workoutId: number,
    name: string,
    sets: number,
    reps: number,
    restSeconds: number
  ): Promise<boolean> {
    try {
      await db.executeSql(
        `INSERT INTO Exercises (name, sets, reps, rest_seconds, workout_id)
         VALUES (?, ?, ?, ?, ?)`,
        [name, sets, reps, restSeconds, workoutId]
      );
      return true;
    } catch (error) {
      console.error('Error adding exercise:', error);
      return false;
    }
  }

  static async startWorkout(workoutId: number): Promise<Exercise[]> {
    const [results] = await db.executeSql(
      `SELECT * FROM Exercises WHERE workout_id = ?`,
      [workoutId]
    );
    return results.rows.raw();
  }
}