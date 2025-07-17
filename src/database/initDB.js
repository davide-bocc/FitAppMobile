import { executeQuery, executeTransaction } from './database';

// Versione modulare per migrazione a Firebase
const initDB = async () => {
  try {
    // Abilita le foreign keys
    await executeQuery('PRAGMA foreign_keys = ON');

    // Definisci tutte le tabelle in una singola transazione
    const initQueries = [
      {
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            firebase_uid TEXT, // Nuovo campo per riferimento a Firebase
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            role TEXT CHECK(role IN ('coach', 'student')),
            last_sync TIMESTAMP, // Per sincronizzazione con Firebase
            is_local BOOLEAN DEFAULT 1 // Per dati creati offline
          )`,
        params: []
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            coach_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            last_sync TIMESTAMP,
            FOREIGN KEY (coach_id) REFERENCES users(id),
            FOREIGN KEY (student_id) REFERENCES users(id)
          )`,
        params: []
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            coach_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            firebase_id TEXT, // Riferimento a Firestore
            last_sync TIMESTAMP,
            FOREIGN KEY (coach_id) REFERENCES users(id)
          )`,
        params: []
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            sets INTEGER,
            reps INTEGER,
            duration INTEGER,
            last_sync TIMESTAMP
          )`,
        params: []
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS workout_exercises (
            id TEXT PRIMARY KEY,
            workout_id TEXT NOT NULL,
            exercise_id TEXT NOT NULL,
            order_index INTEGER,
            last_sync TIMESTAMP,
            FOREIGN KEY (workout_id) REFERENCES workouts(id),
            FOREIGN KEY (exercise_id) REFERENCES exercises(id)
          )`,
        params: []
      }
    ];

    await executeTransaction(initQueries);
    console.log('✅ Database inizializzato con successo');
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
    throw error;
  }
};

export default initDB;