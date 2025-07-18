import { executeTransaction } from './database';

const initDB = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      firebase_id TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sync TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      firebase_id TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sync TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      firebase_id TEXT,
      workout_id TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sync TIMESTAMP,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      firebase_id TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sync TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id)`,
    `CREATE INDEX IF NOT EXISTS idx_unsynced ON workouts(last_sync) WHERE last_sync IS NULL`
  ];

  try {
    await executeTransaction(tables.map(query => ({ query, params: [] })));
    await executeQuery(
      `INSERT OR IGNORE INTO sync_metadata (key, value) VALUES ('db_version', '1')`
    );
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export default initDB;