const db = require('./db');

const initSchema = () => {
  // Tabella utenti
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('coach', 'student')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export const DB_SCHEMAS = {
  WORKOUTS: `
    CREATE TABLE IF NOT EXISTS Workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )`,
  EXERCISES: `
    CREATE TABLE IF NOT EXISTS Exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      rest_seconds INTEGER NOT NULL,
      workout_id INTEGER,
      FOREIGN KEY(workout_id) REFERENCES Workouts(id)
    )`
};

module.exports = initSchema;