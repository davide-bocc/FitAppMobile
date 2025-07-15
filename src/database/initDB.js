const SQLite = require('react-native-sqlite-storage').default;

async function initDB() {
  const db = await SQLite.openDatabase({
    name: 'fitapp.db',
    location: 'default'
  });

  // Crea tabelle
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('coach', 'student'))
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      coach_id TEXT NOT NULL
    )
  `);

  console.log('✅ Database pronto in fitapp.db');
  return db;
}

module.exports = initDB;