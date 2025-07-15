const db = require('../src/database/db');
const initDB = require('../src/database/schemas');

// Test Suite
describe('Database', () => {
  beforeAll(() => {
    initDB();
  });

  test('Crea utente coach', () => {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, role)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run('coach-1', 'coach@fitapp.com', 'coach');
    expect(result.changes).toBe(1);
  });

  afterAll(() => {
    db.close();
  });
});