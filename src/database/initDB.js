import { executeQuery, getDB } from './database';

const initDB = async () => {
  try {
    const db = await getDB();

    // Tabella utenti
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('coach', 'student')),
        is_logged_in BOOLEAN DEFAULT 0
      )
    `);

    // Tabella assegnazioni coach-studente
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS assignments (
        coach_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        PRIMARY KEY (coach_id, student_id),
        FOREIGN KEY (coach_id) REFERENCES users(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
      )
    `);

    // Tabella workout
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        coach_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coach_id) REFERENCES users(id)
      )
    `);

    // Tabella esercizi
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sets INTEGER,
        reps INTEGER,
        duration INTEGER
      )
    `);

    // Tabella di relazione workout-esercizi
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS workout_exercises (
        workout_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        order_index INTEGER,
        PRIMARY KEY (workout_id, exercise_id),
        FOREIGN KEY (workout_id) REFERENCES workouts(id),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      )
    `);

    console.log('✅ Database inizializzato con successo');
    return db;
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione del database:', error);
    throw error;
  }
};

export default initDB;
await executeQuery('PRAGMA foreign_keys = ON'); // Abilita i vincoli di chiave esterna