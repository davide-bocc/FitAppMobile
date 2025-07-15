const SQLite = require('react-native-sqlite-storage/dist/sqlite.js').default;

async function testDB() {
  try {
    // 1. Crea/Apri database
    const db = await SQLite.openDatabase({
      name: 'fitapp.db',
      location: 'default'
    });

    // 2. Crea tabella di test
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_text TEXT
      )
    `);

    // 3. Inserisci dato di test
    await db.executeSql(
      'INSERT INTO test_table (test_text) VALUES (?)',
      ['funziona!']
    );

    console.log('✅ Database testato con successo! File: fitapp.db');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

testDB();