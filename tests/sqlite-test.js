const Database = require('better-sqlite3');
const db = new Database('fitapp.db');

// Test semplice
db.exec(`
  CREATE TABLE IF NOT EXISTS test_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_text TEXT
  )
`);

const stmt = db.prepare('INSERT INTO test_table (test_text) VALUES (?)');
stmt.run('funziona!');

console.log('✅ Database testato con successo!');
db.close();